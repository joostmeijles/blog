+++
title = "Sitecore XC development using Docker ☄️"
date = "2019-05-06"
tags = ["Docker", "XC9"]
+++

Starting Sitecore XC9 development can be pretty daunting task, especially when you have to configure an environment that does not fully match the pre-defined Sitecore Installation Framework (SIF) values. In this blog we use Docker to smoothen the configuration learning-curve, and show how a simple to run environment can help you during development.

# Prerequisite: Docker images
As prerequisite you need to have the Sitecore XC9 Docker images available, easiest way to achieve is by building it locally using NUKE (see the [README](https://github.com/avivasolutionsnl/sitecore-docker) and/or [my previous post](../build_using_nuke)), when you have Docker for Windows installed and all Sitecore files downloaded it boils down to performing:
```
PS> nuke xc
```

If you plan to build Docker image more often it makes sense to automate your build using Azure Devops as described [here](../build_using_azuredevops).

# Run Docker containers
Now that you have the Docker images available you can run the setup. The Aviva Solutions sitecore-docker repo has example docker-compose files available. We will use the XC example found [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/example/xc/docker-compose.yml).

When you inspect the `docker-compose.yml` file you will see that it contains 5 services:

- commerce
- mssql
- sitecore
- solr
- xconnect

Furthermore the `docker-compose.yml` file contains some variables. The most notable are `IMAGE_PREFIX` and `TAG`. These environment variables are used to easily change the Docker registry and Docker repository version tag value. Environment variables are set using a `.env` file (see [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/example/xc/.env)). If you performed a local build no changes are needed, but if you are using a Docker registry you want to change the `IMAGE_PREFIX`, e.g. to:
```
IMAGE_PREFIX=myregistry.azurecr.io/sitecore-xc-
...
```

Note that all services have `isolation: process` set, meaning that there is no VM overhead (gaining you 10-15% performance!). Pre-condition for using process isolation is that your Host OS version matches the Container OS, see this [compatibility table](https://docs.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/version-compatibility).

## Commerce

## Mssql
## Sitecore
## Solr
## Xconnect

whales-names

mount files

copy database

createdirs

process isolation

# Simple XC project
Use Sitecore SDK that is included in the Sitecore Commerce download.
 
# Deploy


# Start fresh, re-create your environment
```
PS> docker-compose down
```

```
PS> docker-compose up
```