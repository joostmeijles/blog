+++
title = "Speed up Sitecore 9 start"
date = "2018-09-25"
tags = ["Sitecore 9"]
+++

Sitecore 9 can be slow to start, which is especially annoying during development.
Below are some configuration tweaks to speed it up.
<!--more-->
## Scheduling
Put some agents on low rotation:
```
<scheduling>
    <!-- Update this agent so it doesn't run every 10 seconds. Appears to be related to email contact management. -->
    <agent type="Sitecore.ListManagement.Operations.UpdateListOperationsAgent, Sitecore.ListManagement">
        <patch:attribute name="interval">00:30:00</patch:attribute>
    </agent>

    <agent type="Sitecore.ContentSearch.SolrProvider.Agents.IndexingStateSwitcher, Sitecore.ContentSearch.SolrProvider">
        <patch:attribute name="interval">08:00:00</patch:attribute>
    </agent>

    <!-- Never automatically build core or master index -->
    <agent name="Core_Database_Agent">
        <patch:attribute name="interval">00:00:00</patch:attribute>
    </agent>
    <agent name="Master_Database_Agent">
        <patch:attribute name="interval">00:00:00</patch:attribute>
    </agent>
</scheduling>
```

## Processors
Remove some processors that are not needed during development:
```
<pipelines>
    <initialize>
        <processor type="Sitecore.Pipelines.Loader.ShowVersion, Sitecore.Kernel">
        <patch:delete />
        </processor>
        <processor type="Sitecore.Pipelines.Loader.ShowHistory, Sitecore.Kernel">
        <patch:delete />
        </processor>
        <processor type="Sitecore.Analytics.Pipelines.Initialize.ShowXdbInfo, Sitecore.Analytics">
        <patch:delete />
        </processor>
        <processor type="Sitecore.Pipelines.Loader.DumpConfigurationFiles, Sitecore.Kernel">
        <patch:delete />
        </processor>
    </initialize>
</pipelines>
```

## Application settings
Disable EXM in `Web.config` (see [here](https://gary.wenneker.org/performance-tuning-sitecore-ludicrous-speed/) for details):
```
<appSettings>
    <!-- Disable EXM for faster start-up times -->
    <add key="exmEnabled:define" value="no"/>
    ...
</appSettings>
```

Switch optimize compilations on in `Web.config` (see [here](https://herodigital.com/2018/01/11/improving-sitecores-start-up-time/) for details):
```
<compilation ... optimizeCompilations="true">
    ...
</compilation>
```

## Credits
Many optimizations were taken from articles I found. Special thanks go out to the following persons:

- Ethan Schofer:
https://herodigital.com/2018/01/11/improving-sitecores-start-up-time/
- Gary Wenneker: https://gary.wenneker.org/performance-tuning-sitecore-ludicrous-speed/
- Per Bering:
https://gist.github.com/pbering/e3866e452c75e030e710f62d267dbb4e
