+++
title = "JSS Commerce part 3 - Cart actions 🤸"
date = "2019-09-18"
tags = ["XC9", "JSS"]
+++

Now that we have a catalog available (see [part 2](http://jonnekats.nl/2019/navigating-the-catalog/)) the next step is to add some cart actions: e.g. add and remove sellable items to/from a cart.
All cart actions follow the same design pattern. For simplicity this article presents only how to *add* a sellable item to a cart.
<!--more-->

The steps to create a add cart line component are:

- Extend the API Gateway
- Create a Javascript client API
- Create a React Cart provider
- Create an Add to Cart button
- Use it

# Extend the Gateway
As we are using an API Gateway, see [part 1](http://jonnekats.nl/2019/exposing-the-commerce-engine/) for details, the first step is to expose an `addline` endpoint.
This new endpoint will expose the Commerce Engine `api/AddCartLine()` functionality. In order to add a cart line we need to provide a Cart identifier. This identifier is packed in the JWT.
So in the custom endpoint the Cart identifier is unpacked from the JWT and placed in the `api/AddCartLine()` request body.

The code snippet to add an `addline` endpoint to the API Gateway is:
```
config.ReRoute("/carts/me/addline")
    .Method(HttpMethod.Put)
    .To("https://commerce:5000/api/AddCartLine()")
    .TransformBody((_, httpContext, bytes) => SetCartIdInBody(httpContext, bytes)) // Simple method that gets Cart Id from JWT and adds it to the body
    .Method(HttpMethod.Put)
    .AuthenticateWith("<authenticationScheme>"); // JWT bearer authentication
```


# Create a Javascript client API
Next we want to create a Javascript client API that conveniently, e.g. handling some config, exposes a function call to add a sellable item to a cart.

## Request functions
To make the creation of a client API Gateway function call easier we created a small request module that abstracts HTTP requests. 
It injects some configuration variables, i.e. url and JWT token, and handles errors. Handling errors includes Commerce Engine errors which are special as the HTTP response code is 200, but the `ResponseCode` property may contain `Error` and the `Messages` property will contain descriptive error messages.

```
import fetch from 'node-fetch';
import { gatewayUrl } from '../../temp/config';

export async function put(uri, token, body) {
    let res = await fetch(`${gatewayUrl}/${uri}`, {
        method: 'put', 
        headers: {
            'Authorization' : `Bearer ${token}`, 
            'Content-Type' : 'application/json'
        }, 
        body: body
    });

    return handleErrors(res);
}

async function handleErrors(response) {
    if (!response.ok) { // Handle HTTP errors
        throw new Error(response.statusText);
    }

    const json = await response.json();
    if (json.ResponseCode === "Error") { // Handle Commerce Engine errors
        throw new CommerceError(json.Messages); // Maps Commerce Engine text errors to error messages
    }

    return json;
}

...
```

## Create add cart line function
We can now leverage the `request` module and create an *add cart line* call in one basically one line:
```
import commerceRequest from './request';

async function addCartLine(token, line) {
    await commerceRequest.put('api/carts/me/addline', token, JSON.stringify(line));
}
```

# Create a React Cart provider
In the above code you probably noticed that in addition to a cart line a token needs to be provided.
We want to retrieve this JWT token once and keep it in React state. Since React 16.8 there is a new way of handling state: using [React Hooks](https://reactjs.org/docs/hooks-reference.html).
In short, React Hooks allows us to use state in functional components by providing a Context, `useState`, and `useEffect` API.

## Authentication token provider
Let's have a look at how this works for storing our JWT token. First we will create an token context:
```
import React from 'react';

export const AuthContext = React.createContext();
```
> See [createContext](https://reactjs.org/docs/context.html#reactcreatecontext) for a full explanation on it.

Next we will use this context in our own `AuthProvider` component. Inside this component we use an effect (which is called once upon mount) to retrieve the token from the API Gateway, and use state to store the retrieved token. To make the token available in context of child components we use a Context Provider that sets the token value.

The code for the `AuthProvider` looks like:
```
async function getToken() {
    ... // Obtain token from API Gateway
}

export function AuthProvider({children}) {
    const [token, setToken] = useState(null);

    useEffect(() => {
        async function retrieveToken() {
            const token = await getToken();
            setToken(token);
        }

        retrieveToken();
    }, []);

    return (
        <AuthContext.Provider value={token}>
            {children}
        </AuthContext.Provider>
    );
}
```
> See [useState](https://reactjs.org/docs/hooks-state.html) and [useEffect](https://reactjs.org/docs/hooks-effect.html) for a more detailed explanation.


In order to make the token context available to all JSS components we add `AuthProvider` as wrapper in to the `AppRoot`.

## Cart provider
Now that we have the token available in context, we can use it to retrieve a cart and/or add lines to a cart.
To make the add to cart line function easy to use we decided to make a `CartProvider`. This provider will provide all cart data and actions, and will for example automatically refresh the cart after an mutation.

The code for the `CartProvider` looks very similar to the `AuthProvider`:
```
import { AuthContext } from './AuthProvider';

export const CartContext = React.createContext();

async function getCart(token) {
    return commerceRequest.get('api/carts/me', token);
}

async function addCartLine(token, line) {
    await commerceRequest.put('api/carts/me/addline', token, JSON.stringify(line));
}

async function refreshCart(token, onUpdateCart) {
    const cart = await getCart(token);
    onUpdateCart(cart);
    return cart;
}

export default function CartProvider({children}) {
    const token = useContext(AuthContext);
    const [cart, setCart] = useState(null);

    const actions = {
        addCartLine: async (line) => {
            await addCartLine(token, line);
            refreshCart(token, setCart);
        }
        ...
    };

    useEffect(() => {
        refreshCart(token, setCart);
    }, [token]);

    const cartContext = {
        data: cart,
        actions: actions
    };

    return (
        <CartContext.Provider value={cartContext}>
            {children}
        </CartContext.Provider>
    );
}
```
The only notable changes are:
- an Javascript Object that holds all Cart actions, and contains actions that e.g. refresh the cart after an update
- a token condition supplied to the `useEffect` which triggers a cart update when the `token` is refreshed


# Create an Add To Cart button
We can now create an *add to cart* button React component that uses the Cart context.

```
import React, {useContext} from 'react';
import { CartContext } from './CartProvider';
import { productCatalog } from '../../temp/config';

const AddToCartButton = ({productId, variantId, ...other}) => {
    const cart = useContext(CartContext);

    const sellableItem = {
        itemId: `${productCatalog}|${productId}|${variantId}`,
        quantity: 1,
        ...other
    };

    return (
        <button className='addtocart' onClick={() => cart.actions.addCartLine(sellableItem)}>
            Add to cart
        </button>
    );
}
```

# Use it
Last step is to actually use the button, for example by placing it on the `ProductSummary` React component which is used for displaying products on a product cluster.
As all required information is readily available on the `ProductSummary` component, adding the button is easy:
```
...

const ProductSummary = ({path, displayName, description, imageId, productId, variantId}) => {
    return <article className='productsummary'>
      <Title path={path} displayName={displayName} />
      <Description description={description} />
      <ProductImage imageId={imageId}/>
      <ProductPrice productId={productId} /> 
      <AddToCartButton productId={productId} variantId={variantId} displayName={displayName} /> 
    </article>
}
```

Finally this results in having a button on the page, for example:

![](/jss_product_summary.png)

Having a button that performs actions against the API Gateway and Commerce Engine obviously means that running in JSS disconnected is working, *but* only performs meaningful cart actions when the Gateway API and Commerce Engine are running. As the Commerce Engine requires a running Sitecore instance for its settings, this means that we actually need a fully running Sitecore XC setup for development. Which basically brings us to using JSS in integrated mode in practice.

# Conclusion
Creating a cart action component is, once the infrastructure components `request`, `AuthProvider` and `CartProvider` are in place, quick and easy!
By directly connecting to the Commerce Engine we can use the Commerce Engine domain models in Javascript and do not have an additional Commerce Connect Entity layer to understand and maintain.
For cart actions the only drawback is that we need to handle the Commerce Engine errors, which are not always user friendly, ourselves. 
For this POC we did not bother with transforming Commerce Engine errors, but for production usage this will be necessary. Last but not least, we need a running Sitecore XC setup for developing cart actions although JSS disconnected mode remains useful for client-side only development.
