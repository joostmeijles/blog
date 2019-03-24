+++
title = "Programmatically adding Entity Composer templates"
date = "2018-08-29"
tags = ["XC9"]
canonical = "https://mercury-ecommerce.com/resources/how-to-import-entity-composer-templates"
+++

The XC9 Entity Composer functionality is introduced in update-2, and this [article](https://community.sitecore.net/technical_blogs/b/technical-marketing/posts/experience-commerce-entity-composer) describes the concept and explains how to add Entity Composer templates using the Business Tools.

In this article we describe how to programmatically add Entity Composer templates.
This is for example useful when writing your own catalog importer.
<!--more-->

Creating a template, adding it to a sellable item, and filling a property value requires the following steps:

* Create an Entity Composer template
* Add an item definition to the catalog
* Link template to an item definition
* Link sellable item to item definition
* Set a property value for a sellable item
* Link the entity view to the Entity Composer template

The next sections describe each step in detail.

## Create an Entity Composer template
First step is to create a template, named "My example template", and make it visible in the Business Tools by adding it to the proper list.
The template has one property named "My example property".
```
var templateEntityViewComponent = new EntityViewComponent();

// Create compose template
var template = new ComposerTemplate(CommerceEntity.IdPrefix<ComposerTemplate>() + name)
{
    Name = "MyTemplate",
    DisplayName = "My example template",
    Components =
    {
        // List membership is used to show to templates in the Business Tools overview
        new ListMembershipsComponent
        {
            Memberships =
            {
                string.Format("{0}", CommerceEntity.ListName<ComposerTemplate>())
            }
        },

        templateEntityViewComponent
    }
};

// Create an Entity View that holds the properties
var entityView = new EntityView
{
    Name = name, // This name should be different than the ComposerTemplate name. See Sitecore bug #276414.
    DisplayName = name,
    DisplayRank = 0,
    Icon = "piece"
};
entityView.SetItemIdForComposerView(); // This is the ItemId you will need to link in the sellable item

templateEntityViewComponent.View.ChildViews.Add(entityView);

// Add a property
var viewProperty = new ViewProperty
{
    Name = "MyPropertyName",
    DisplayName = "My example property",
    OriginalType = "System.String",
    IsRequired = false, // By default a property is not required
    RawValue = "" // This is necesary to please the CatalogTemplateGenerator (present in XC9 update-3)
};

// The CatalogTemplateGenerator requires a DateTimeOffset to be filled with a compatible value (present in XC9 update-3)
if (viewProperty.OriginalType == "System.DateTimeOffset")
{
    viewProperty.RawValue = System.DateTimeOffset.Now;
}

entityView.Properties.Add(viewProperty);

// Persist the template
await persistEntityPipeline.Run(new PersistEntityArgument(template), context);
```
Note that Entity Composer templates are stored in the `CommerceEntities` table (of the `SharedEnvironments` database).
Above code was largely reverse-engineered from the `Sitecore.Commerce.Plugin.Composer.ComposerCommander` class.

## Add an item definition to the catalog
To link the template to a sellable item we will use the item definition approach.
For this we first need to indicate on the catalog which item definitions are allowed.
```
var catalog = new Catalog(); 

var itemDefinitionsComponent = new ItemDefinitionsComponent() 
{
    Definitions = new List<string>{ "MyDefinition" }
}

catalog.SetComponent(itemDefinitionsComponent);
```

## Link template to item definition
Now link the template to the newly created Item Definition.
```
template.SetComponent(
    new ItemDefinitionsComponent
    {
        Definitions = new List<string> { "MyDefinition" }
    }
);
```

## Link sellable item to item definition
To link the sellable item to the item definition;
```
sellableItem.Components.Add(new CatalogsComponent {
    ChildComponents =
    {
        new CatalogComponent
        {
            Name = "MyCatalog",
            ItemDefinition = "MyDefinition"
        }
    }
});
```

## Set a property value for a sellable item
To add a property value for the linked template we need to;
- create an entity view with the same name as the template, 
- add a property with matching name, 
- and add it to the sellable item.
```
// Create an EntityView that holds the properties
var propertyEntityView = new EntityView
{
    Name = "MyDefinition",
    DisplayRank = 0,
    Icon = "piece" // Same as Business Tools adds by default
};
propertyEntityView.ItemId = entityView.ItemId; // Use the item id of the composer template entity view

var viewProperty = new ViewProperty
{
    IsRequired = false,
    Name = "MyPropertyName",
    OriginalType = "System.String",
    RawValue = "My test value"
};

propertyEntityView.Properties.Add(viewProperty);

// Link the EntityView to the Sellable Item
propertyEntityView.EntityId = sellableItem.Id;

sellableItem.Components.Add(new EntityViewComponent
{
    View = 
    {
        ChildViews =
        {
            propertyEntityView
        }
    }
});
```

## Link the entity view to the Entity Composer template
The final step is to track which entity view belongs to which composer template.
```
var composerTemplateViewsComponent = new ComposerTemplateViewsComponent();
composerTemplateViewsComponent.TrackComposerTemplateView(propertyEntityView.ItemId, CommerceEntity.IdPrefix<ComposerTemplate>() + "MyDefinition");

sellableItem.Components.Add(composerTemplateViewsComponent);
```

# Remarks
The Entity Composer functionality is brand new, and while reverse engineering how to programmatically do it, we bumped against some (to be solved) unclearities and bugs:

- Property values cannot be set for product variants. The `CatalogDataProvider` however generates templates for variants, and somehow some values get filled. This is a limitation of the current implementation in XC9 update-2.

- The `CatalogDataProvider` throws an error when properties do not have `RawValue` set (in JSON). As a result you will not see any values in the Sitecore Content Editor. Workaround is either always filling a value, or patching `CatalogDataProvider.GetItemFields` with following code (see [this](https://sitecore.stackexchange.com/questions/13498/xc9-entity-composer-error-when-rawvalue-is-not-present/13499#13499) post):
    ```
    var val = property[(object)"Value"].Value<string>() ?? String.Empty;
    fieldList1.Add(templateField.ID, val);
    ```

- Circular template inheritance error; the generated template inherits from its self. This occurs when the `ComposerTemplate` has a `EntityView` with the same name, and is registered as bug #276414 by Sitecore.
