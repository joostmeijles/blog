+++
title = "JSS Commerce part 4 - Tracking Cart events 🛤️"
date = "2019-09-19"
tags = ["XC9", "JSS"]
+++

In [part 3](./jss_cart_actions) of our JSS and Commerce series we have been adding cart actions. It would be great if we could track these using Sitecore Experience Analytics.
This article presents how we achieved tracking a *Lines Added To Cart* event using JSS, and describes the pros and cons of the chosen approach.
<!--more-->

Remember that we decided to use Commerce Engine directly and thus have to add Analytics ourselves instead of the *normal* approach where the Commerce Connect layer handles analytics.

JSS ships with a tracking API that is pretty well described [here](https://jss.sitecore.com/docs/fundamentals/services/tracking).
To get started with JSS tracking, we enabled JSS tracking and [tracking of anonymous contacts](https://doc.sitecore.net/developers/xp/xconnect/xconnect-search-indexer/enable-anonymous-contact-indexing.html).

# Perform a page event tracking test
Next step is to test the out-of-the-box JSS tracking with a test event: 'Download'.
This is well described on the [documentation](https://jss.sitecore.com/docs/fundamentals/services/tracking) page, but currently it is missing the required fetcher and POST method in its description.

Below code snippet will get you started:
```
import { trackingApi } from '@sitecore-jss/sitecore-jss-tracking';
import { sitecoreApiHost, sitecoreApiKey } from '../temp/config';
import fetch from 'node-fetch';

const trackingApiOptions = {
  host: sitecoreApiHost,
  querystringParams: {
    sc_apikey: sitecoreApiKey,
  },
  fetcher: myFetcher
};

// Supply your own fetcher, see https://sitecore.stackexchange.com/questions/20929/jss-tracking-api-fetch-cors-and-mvc-errors/20931
async function myFetcher(url, data) {
    return await fetch(url, {
        method: 'post', 
        headers: {
            'Content-Type' : 'application/json'
        }, 
        body:  JSON.stringify(data)
    });
}

trackingApi
  .trackEvent([{ eventId: 'Download' }], trackingApiOptions)
  .then(() => console.log('Page event pushed'))
  .catch((error) => console.error(error));
```

# Hooking up Commerce events
Now that we have basic event tracking set up, it's time to hook up a Commerce event.
As use-case we want to track a *Lines Added To Cart* event. This event is normally triggered by Commerce Connect using the `TriggerCartLinesPageEvent` processor in the `commerce.carts.addCartLines` pipeline.

There are globally 3 places where we could plug in to track an event:

- IPageContext in Analytics Tracking
- Commerce Connect processor
- Commerce Connect pipeline <a id="option-3"></a>

The first option is to hook in at the Sitecore Analytics Tracking API, this means calling the `Register` on the `IPageContext` interface.
Internally the `TriggerCartLinesPageEvent` processor and JSS track event processors (like `TrackEvent`) use this.

Second option is to run a single Commerce Connect processor e.g. the `TriggerCartLinesPageEvent` processor.

The third option is to run an existing Commerce Connect pipeline e.g. `commerce.carts.addCartLines`. A Commerce Connect pipeline contains all required actions and analytics tracking for adding a cart line. As described in [part 3](./jss_cart_actions.md), we perform actions from the client. In order to make this option work, we would remove all non-analytics processors from the pipeline.

At first we tried hooking into the Analytics Tracking API as this is closest to the JSS implementation. This works, but it meant quite some reverse engineering of the Commerce Connect and Analytics processors.
We had to determine which cart & cart-line properties were used in several Commerce Connect & Analytics processors, this makes it error prone and hard to maintain, so we decided to abandon this approach.

Leaves us with the decision between plugging in at Commerce Connect pipeline or processor.
We decided to go for the processor as its interface is the same as the pipeline, and applying it for one processor would give us a impression of what it takes to implement for the complete pipeline.

## Creating a commerce event
All processors in the JSS `trackEvent` pipeline handle there own events. Events are parsed based on the specified class definition for each processor.
To track commerce events we created a new `CommerceEventInstance` class. This currently contains all properties that are necessary to track an *Lines Added To Cart* event. 

The code for the class looks like:
```
public class CommerceEventInstance
{
    public class CartLine
    {
        public string Product { get; set; }
        public decimal Price { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
    }

    public string CommerceEventId { get; set; }

    public string ShopName { get; set; }

    public List<CartLine> CartLines { get; set; }

    [JsonExtensionData]
    public IDictionary<string, object> AdditionalData { get; set; }
}
```
Note that used property names match Commerce Connect naming.


For the JSS client-side we create a small function that converts a cart line object into the required `CommerceEventInstance` structure:
```
async function trackCartlineEvent(id, line) {
  const lineEvent = {
    Product: line.itemId,
    Price: line.amount,
    ProductName: line.displayName,
    Quantity: line.quantity
  };

  trackingApi.trackEvent([{ commerceEventId: id, ShopName: shopName, CartLines: [lineEvent]}], trackingApiOptions);
}

export async function trackCartlineAdded(line) {
  trackCartlineEvent('Lines Added To Cart', line);
}
```

The `trackCartlineAdded` function can now easily be added to the `addCartLine` function in the `CartProvider` from [part 3](./jss_cart_actions.md):
```
async function addCartLine(token, line) {
    await commerceRequest.put('api/carts/me/addline', token, JSON.stringify(line));
    trackCartlineAdded(line);
}
```
At this point we have a JSS client-side application that can trigger Commerce *Lines Added To Cart* events. 
Now lets add a processor to the `trackEvent` pipeline that handles events with an `commerceEventId` property.

To implement a custom event tracker sub-class the abstract `MarketingDefinitionBasedEventProcessor` class, and implement the required methods:
```
public class TrackCommerceEvent : MarketingDefinitionBasedEventProcessor<CommerceEventInstance, IPageEventDefinition>
{
    protected override bool IsValidEvent(CommerceEventInstance eventInstance)
    {
        return !string.IsNullOrWhiteSpace(eventInstance.CommerceEventId);
    }

    protected override IPageEventDefinition ResolveDefinition(CommerceEventInstance eventInstance, TrackEventPipelineArgs args)
    {
        return this.GetDefinition(Sitecore.Analytics.Tracker.MarketingDefinitions.PageEvents, eventInstance.CommerceEventId);
    }

    protected override void DoTrack(IPageContext pageContext, IPageEventDefinition eventDefinition, CommerceEventInstance eventInstance)
    {
        var request = CreateCartLinesRequest(eventInstance);
        var result = new CartResult { Cart = request.Cart }; // Connect requires result cart to be filled.
        var args = new ServicePipelineArgs(request, result);

        // Trigger Commerce Connect Analytics processor
        var trigger = new TriggerCartLinesPageEvent()
        {
            Name = eventInstance.CommerceEventId,
            Text = eventInstance.CommerceEventId //Text equals id in practice, so for simplicity reuse it
        };
        trigger.Process(args);
    }
}
```
As you can see in above code, the only real logic is present in the `DoTrack` method. This is where we:

- parse the `eventInstance` into a `CartRequest`
- execute the `TriggerCartLinesPageEvent` processor

That's all! We have setup everything for tracking *Lines Added To Cart* events.
After adding two lines to the cart and visiting `/sitecore/api/jss/track/flush` we have all cart line events registered and visible at the xProfile page:

![](/jss_track_cartline_event.png)

# Conclusion
With limited effort we have implemented JSS based tracking for a single Commerce event.
This works pretty well from a JSS point of view. The challenge lies in connecting all line add/remove/update events but also all *Abandon Cart*, *Added To Cart Stock Status*, etc. events. We basically have to replicate the Commerce Connect pipelines in track event processors. This implies that for a full fledged implementation we probably best go for option #3 (from [here](#option-3)): re-using and calling a Commerce Connect pipeline.
