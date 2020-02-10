---
title: "Speed up the Catalog Import process"
date: "2018-09-24"
tags: ["XC9"]
---

The performance of the current Catalog import in XC9 update-2 is not so good. This article gives a few tips on how to speed up the import process.
After applying these optimizations, importing a sellable item costs about 15 msec.
<!--more-->
## Do not use the ICreateRelationshipPipeline and limit IPersistEntityPipeline usage
The `ICreateRelationshipPipeline` is expensive; do not use it. Instead create the relations yourself. At the same time limit the number of writes (ie. `IPersistEntityPipeline` calls) by keeping objects as much as possible in memory.

For example to import a sellable item with a category relation:

1. Create the category (and keep it in memory):
    ```
    var category = new Category
    {
        Id = id,
        ...
    };

    Task<PersistEntityArgument> task = persistEntityPipeline.Run(new PersistEntityArgument(category), context);
    await task;

    category = task.Result.Entity as Category;
    ```

2. Create sellable item and relate it to the category:
    ```
    // 2. Create sellable item
    var sellableItem = new SellableItem
    {
        ...
        ParentCatalogList = arg.Catalog.SitecoreId,
        ParentCategoryList = parentCategory.SitecoreId,
        ...
    };

    Task<PersistEntityArgument> task = persistEntityPipeline.Run(new PersistEntityArgument(sellableItem), context);
    ```

3. Update the category once after all sellable items are added to it:
    ```
    persistEntityPipeline.Run(new PersistEntityArgument(category), context);
    ```

## Patch IPersistEntityPipeline
Remove indexing related blocks as these dramatically decrease performance:
```
.ConfigurePipeline<IPersistEntityPipeline>(c =>
{
        c.Remove<Sitecore.Commerce.Plugin.Search.AddEntityToIndexListBlock>()
        .Remove<Sitecore.Commerce.Plugin.Catalog.IndexUpdatedSitecoreItemBlock>();
})
```
Manually trigger a full catalog index rebuild.

## Clean up context to keep memory usage under control
By default XC9 caches all processed entities. This makes it use more and more memory. As we only write entities, we can clear the context cache after each async import batch (e.g. after each batch of 100 sellable items):
```
context.CommerceContext.ClearEntities();
context.CommerceContext.ClearModels();
context.CommerceContext.ClearObjects();
```

## Do not re-index during an import
By default the Minion task triggers a catalog re-index every 5 minutes, this obviously bad for performance (especially while importing).
Currently the best way to prevent re-indexes during import is either:

- Do not start the Minion

- Change the `WakeupInterval` for the Minion:
    ```
    {
            "$type": "Sitecore.Commerce.Core.MinionPolicy, Sitecore.Commerce.Core",
            "WakeupInterval": "08:00:00",
            ...
    }
    ```
