+++
title = "Build Docker images using Azure Pipelines 🚀"
date = "2019-04-15"
tags = ["Docker", "Azure"]
+++

Looking to automate your Sitecore Docker image build? 

We decided to leverage the free (❣), for open source software, Azure Pipelines offering from Microsoft for this. This article describes how we achieved a fully automated Sitecore Docker image build using Azure Pipelines.
<!--more-->

Being able to build Docker images on your local machine (using [NUKE](http://www.nuke.build), see my [previous post](../build_using_nuke)) is nice, but still has some challenges. For example;

- input files need to be collected by every developer, which is error prone e.g. version differences might occur,
- with Docker for Windows the version of Docker that you use really matters, e.g. stability issues tend to come and go,
- a build consumes lots of CPU and memory, basically making your PC unusable during a build (and Sitecore XP & XC builds take around 90 minutes)
- automatically verifying that changes in a commit work

All of above challenges can be solved by having an automated build.

[Azure Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/) offer unlimited minutes and 10 free parallel jobs for open source. As the [sitecore-docker](https://github.com/avivasolutionsnl/sitecore-docker) repo is open source and uses Microsoft Docker image, Azure Pipelines seems to be a good fit. 

Another nice feature of Azure Pipelines is that it offers configuration as code by using YAML files to specify your build. This is of great value as you can have your build fully scripted (and thus self-documenting), version controlled, and your changes reviewed in a PR.


# Build Sitecore XP
A Sitecore XP) build consists of the following steps (see in [code](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/azure-build-image.yml)):

1. prepare input files
1. perform NUKE build target
1. push Docker images to a registry

## Prepare input files
A build requires the Sitecore installation files which need to be downloaded manually. The best option for this is to download these once and put them on a file share which is then used in the automated build. We chose [Azure Files](https://docs.microsoft.com/en-us/azure/storage/files/storage-files-introduction) as it easy to mount (it's basically a SMB file share) on your host PC and in Azure Pipelines.

Besides the installation files, a Sitecore license file is required. We place this on the file share as well.

The Sitecore XP and XC topologies requires SSL between the services, for this we need self signed certificates for e.g. the XConnect and Solr roles. You can either let the build generate the certificates for you or generate these once and place them on the file share and have the same used for each build. See [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/601f158cdbc69622b4c11ae5125ab19cdfdf4326/azure-build-image.yml#L46) how that is implemented.

## Perform NUKE build target
The nice thing about NUKE is that you can simply perform the same target on the build server as you do locally. So for example, to execute a Sitecore Xp build use the following code in the Azure Pipelines YAML file:
```
- task: PowerShell@2
    displayName: Build images
    inputs:
      targetType: 'filePath'
      filePath: build.ps1
      arguments: Xp
```
Note that it uses the `build.ps1` convenience script that NUKE provides out-of-the-box.

## Push Docker images to a registry
When you create a release you want to make the resulting Docker images externally available, i.e. in a Docker Image registry. The corresponding Azure service for this is Azure Container Registry (ACR). Once you have your ACR create in Azure, you can login and push your Docker images to it.

To login to ACR we add the following to our pipeline:
```
  - task: Docker@1
    displayName: Container registry login
    inputs:
      command: login
      azureSubscriptionEndpoint: $(azureSubscriptionEndpoint)
      azureContainerRegistry: $(azureContainerRegistry)
```

To push the images we use the same NUKE target in the Azure Pipelines build that we would do locally:
```
  - task: PowerShell@2
    displayName: (Optionally) Push images
    inputs:
      targetType: 'filePath'
      filePath: build.ps1
      arguments: PushXp --RepoImagePrefix $(dockerId)
```

NB. the push *only* performs an actual push when a Git tag exists on the current commit. This check is added by  is written in NUKE:
```
Target PushXp => _ => _
        .Requires(() => !string.IsNullOrEmpty(RepoImagePrefix))
        .OnlyWhenDynamic(() => HasGitTag() || ForcePush)
        .Executes(() => {
            PushXpImage("mssql");
            PushXpImage("sitecore");
            PushXpImage("solr");
            PushXpImage("xconnect");
        });
```

We commonly create a Github Release, which results in a Git tag, to trigger (and administer) a release build that pushes Docker images to ACR.

# Build Sitecore XP, XC, and variants
Now that we can build one Sitecore topology, i.e. XP, lets extend the build pipeline with all topologies and its variants:

- XP
- XP + SXA
- XP + JSS
- XC
- XC + SXA
- XC + JSS

This poses some challenges as a [Microsoft-hosted agent](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/hosted?view=azure-devops) has around 10 GB of diskspace which is not enough to build all topologies. There are two options to tackle this problem:

1. Use a self-hosted agent
1. Use multiple Microsoft-hosted agents

## Self-hosted agent
A self-hosted agent is basically a VM that you configure yourself and install a Azure Devops agent on. Easiest way to get one is by using the same process as Microsoft uses, a full description of how to setup a self-hosted agent for a Sitecore Docker build can be found [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/SELF-HOSTED-AGENT.md). 
Once you have your own agent you can scale it to your needs, e.g. adding more diskspace and CPU.
Big drawback is that you have to fully manage (e.g. setup, clean) the VM yourself.

## Multiple Microsoft-hosted agents
A nice feature of Microsoft-hosted agents is that they are pre-configured by Microsoft and automatically cleaned after a build job, something that you would have to do yourself when using a self-hosted agent. In other words, you can just use them out-of-the-box as service. Unfortunately scaling a Microsoft-hosted agent is not available at the time of writing.

We solved the diskspace problem of Microsoft-hosted agents by distributing the build over 5 agents. Each agent builds a set of images (from which some are build multiple times on different agents, but as only the resulting images are pushed this is not an issue). Using multiple build agents, we ended up with the following 5 jobs:

- XP, XC
- XP + SXA
- XC + SXA
- XP + JSS
- XC + JSS

Above distribution basically means that we have one agent for a *basic* XP/XC setup, and an additional agent for each variant (SXA, JSS).

In order to re-use a build in Azure Pipelines we use a [template](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/templates?view=azure-devops) named `azure-build-image.yml` in our case. This allows us to specify the same job but with different parameters, e.g:
```
jobs:
- template: azure-build-image.yml
  parameters:
    name: BaseXpXc
    buildTargets: Xc
    pushTargets: PushBase PushXp PushXc

- template: azure-build-image.yml
  parameters:
    name: XpSxa
    buildTargets: XpSxa
    pushTargets: PushXpSxa
```

The complete Azure Pipelines configuration, reusable to build your own Sitecore Docker images, can be found [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/azure-pipelines.yml).

The live Azure Pipelines build for [sitecore-docker](https://github.com/avivasolutionsnl/sitecore-docker) can be viewed [here](https://dev.azure.com/avivasolutions-public/sitecore-docker/_build/results?buildId=115).

To summarize, to automatically build Sitecore Docker images using Azure Pipelines;

- fork https://github.com/avivasolutionsnl/sitecore-docker,
- create an Azure File share, download and add the Sitecore installation files to it,
- create an Azure Container Registry,
- create an Azure Pipeline based on the definition in the repo,

...and relax & enjoy automated builds!
