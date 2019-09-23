+++
title = "JSS Commerce part 6 - Creating a product cluster 🎽"
date = "2019-09-23"
tags = ["XC9", "JSS"]
+++

[Part 5](http://jonnekats.nl/2019/implement-catalog-pages/)) describes how to create a dynamic product page. This is great for navigating the catalog, but does not allow a content editor to select products to display on (e.g.) a landing page. This part presents how to create a product cluster component that enables displaying a configured set of products.
<!--more-->

Let's first create a `ProductCluster` React JSS component;
```
import React from 'react';
import ProductList from '../../shared/components/productlist';

// ProductCluster displays products from the resolved datasource
const ProductCluster = ({fields}) => (
  <div className='productcluster'>
    <h1 className='productcluster__title'>{fields.heading}</h1>
    {<ProductList products={fields.products}/>}
  </div>
);

export default ProductCluster;
```
The component takes a heading text and products as `field` properties, and it re-uses the `ProductList` components that was introduced in [part 5](http://jonnekats.nl/2019/implement-catalog-pages/).

To enable a content editor to select the products to display we will use the Sitecore Query Builder.
In this way one can for example create a query for displaying all action products:

![](/jss_product_cluster_querybuilder.png)

The query can than be used on a page component, e.g. for listing action products on the home page:

![](/jss_product_cluster_selection.png)

Now we only need to create a list of products out of the query. For this we create a content resolver: `ProductsContentResolver`.
The `ProductsContentResolver` takes query selection field from the context item and performs a LinQ contentsearch query.
That's all, the complete code for the `ProductsContentResolver` is:

```
public class ProductsContentResolver : RenderingContentsResolver
{
    public override object ResolveContents(Sitecore.Mvc.Presentation.Rendering rendering, IRenderingConfiguration renderingConfig)
    {
        var contextItem = GetContextItem(rendering, renderingConfig);
        if (contextItem == null)
        {
            return new { };
        }

        var selectionField = (DatasourceField)contextItem.Fields[Templates.Products.Selection];

        var query = selectionField.Value;
        if (String.IsNullOrEmpty(query))
        {
            return new { };
        }

        var searchItems = new List<CommerceSellableItemSearchResultItem>();
        var searchManager = CommerceTypeLoader.CreateInstance<ICommerceSearchManager>();
        using (var context = searchManager.GetIndex().CreateSearchContext())
        {
            var searchStringModels = SearchStringModel.ParseDatasourceString(query);

            searchItems = LinqHelper.CreateQuery<CommerceSellableItemSearchResultItem>(context, searchStringModels)
                .Where(x => x.CommerceSearchItemType == CommerceSearchItemType.SellableItem)
                .Where(x => x.Language == Sitecore.Context.Language.Name)
                .ToList();
        }

        // Distinct products only as the products might exist at multiple places in the catalog
        searchItems = searchItems
            .GroupBy(x => x.ProductId)
            .Select(x => x.First())
            .ToList();

        // Create products from search result
        var products = new List<object>();
        foreach (var searchItem in searchItems)
        {
            var sitecoreItem = searchItem.GetItem();
            
            // Add variants
            if (sitecoreItem.HasChildren)
            {
                foreach (Sitecore.Data.Items.Item child in sitecoreItem.GetChildren())
                {
                    products.Add(GetProduct(searchItem, sitecoreItem, child.Name));
                }
            }
            // No variants add single product
            else
            {
                products.Add(GetProduct(searchItem, sitecoreItem));
            }
        }

        return new
        {
            Heading = ((TextField)contextItem.Fields[Templates.Products.Heading]).Value,
            Products = products.ToArray()
        };
    }

    private object GetProduct(CommerceSellableItemSearchResultItem searchItem, Sitecore.Data.Items.Item sitecoreItem, string variantId = null)
    {
        MultilistField field = sitecoreItem.Fields["Images"];
        var imageId = field.Items?.First();

        return new
        {
            searchItem.Path,
            searchItem.ProductId,
            searchItem.DisplayName,
            Description = sitecoreItem["Description"],
            ImageId = imageId,
            VariantId = variantId
        };
    }
}
```

After configuring the `ProductsContentResolver` as content resolver for the `ProductCluster` component and placing the `ProductCluster` on the home page, the product selection is show on the home page:

![](/jss_product_cluster_querybuilder.png)

Conclusion: the reusability of React components in combination with the configurability of JSS really shines for this use-case!
