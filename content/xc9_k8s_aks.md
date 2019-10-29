+++
title = "XC9 + K8S + AKS = Bingo?! 🌟"
date = "2019-11-06"
tags = ["Docker", "Azure", "XC9"]
+++

Sitecore 9 has a micro-service architecture and is designed with the cloud in mind. The community has picked this up by creating Docker images for Sitecore. This works great for local development, but it still has some challenges when deploying to the cloud. This changed with the recent introduction of Windows support for Kubernetes (K8S) and Azure Kubernetes Service (AKS) support for Windows containers. 

<!--more-->
This article introduces a Kubernetes setup, using Sitecore XC 9.1 as showcase, that allows you to deploy to AKS.

# Sitecore XC 9.1 topology
Let's first have a look at the Sitecore XC 9.1 topology. 
The below diagram gives an overview of all the services and databases for a basic XC 9.1 setup.

![](/sitecore_xc91_topology.png)

These services are mapped to several Docker images, this mapping is as follows;

- Content Management & Content Delivery are combined in a **Sitecore** Docker image
- Business Tools and the Commerce Engine roles are grouped in a **Commerce** Docker image
- The Identity Server has its own Docker image, named **Identity**
- XConnect and its Processing part are placed in a **XConnect** Docker image
- All SQL database are present in a **Mssql** image
- All Solr cores are placed in a **Solr** image

These 6 Docker images form the basis for running the containerized Sitecore XC system.

# Azure Kubernetes Service
Now that we have a basic overview of the containerized setup, lets look at Azure Kubernetes Service (AKS).
We run two types of nodes; a Linux and Windows node. The Linux node is used to run the Kubernetes services, and the Windows node is used for running the Sitecore Windows containers.
A basic AKS cluster and its infrastructure is depicted below.

![](/docker_deployment_variants.png)

At the bottom we have the infrastructure for our cluster. It consists of a Linux and Windows VM, connected to eachother using a virtual network.

On top of the infrastructure the Kubernetes cluster is created.
The cluster consists of a master Linux node and a (slave) Windows node. Inside each node run a number of default services;

- *kubelet*, which is the primary node agent
- *k-proxy*, the network proxy that e.g. handles communication between nodes
- *Docker* Moby as container runtime

On the master node some additional services are running;

- *api*, which is the Kubernetes server
- *etcd*, this is the Kubernetes configuration store
- *scheduler*, the service in charge of placing Pods in the cluster

# Setup AKS cluster
With this understanding of an AKS cluster its time to get hands-on and setup an empty hybrid (Linux & Windows nodes) Kubernetes cluster. 
The movie below shows how to set it up. All performed steps are also described in detail [here](https://github.com/joostmeijles/xc9-k8s/blob/master/k8s/README.md).

{{< youtube tZUqtDLOSs8 >}}

# Deploy Solr in AKS
Now that we have an empty AKS cluster up and running, lets see what is required to deploy a single service.
We choose Solr as use-case as its a backend service with no dependent services, does not require any special configuration (e.g. runs HTTP out-of-the-box), and it requires some persistent storage (which is later required by more services).

Movie below shows what it takes to get Solr up and running:

{{< youtube 6oRDk36usRw >}}

# Deploy Sitecore XC 9.1 in AKS
Next step is to deploy the full Sitecore XC 9.1 setup. This involves basically the same steps as shown for Solr, plus some configuration for;

- *Sitecore*, configure the site settings
- *Identity*, configure CORS settings, apply a small patch to enable reverse-proxy support see [here](https://github.com/joostmeijles/Sitecore.Identity.ProxySupport)
- *Commerce*, configure CORS settings

Besides this we will need to supply a Sitecore license file. We will use a Kubernetes secret, which is a special type of config, to mount the license file in the containers.

A fully detailed description of what to configure can be found [here](https://github.com/joostmeijles/xc9-k8s/blob/master/xc9/README.md).

Lets deploy XC 9.1 in AKS:

{{< youtube YBYQvZKGqEo >}}

# Scale
At this point the power of Kubernetes should be getting clear to you.
But the real power of Kubernetes is best shown by its scaling features. Kubernetes allows you to horizontally scale the number of Nodes or Pods.
In this example we will look at how to use the Horizontal Pod Autoscaler (hpa) to scale the number of Commerce Pods.
We plan to scale the number of Commerce Pods from 1 to 3 depending on the CPU load.

To apply load to the system we will perform a simple load-test. Finally we need an actual webshop to apply the load to.
We will use the [Mercury demo webshop](https://github.com/avivasolutionsnl/mercury-demo) for this, as this is the easiest since its offers a Dockerized Sitecore XC 9.1 webshop.

> [Mercury](https://mercury-ecommerce.com/) is a Sitecore Commerce accelerator.

All detailed steps are described in [this README](https://github.com/joostmeijles/xc9-k8s/blob/master/scale/README.md).

{{< youtube HxroMFxF3p0 >}}

# Conclusion
Azure Kubernetes Service is the easiest way to deploy your Sitecore Docker containers to the cloud. 
Other options like Docker Swarm and Docker Desktop using VMs have less features, e.g. no automatic storage provisioning, and require more set up work and maintenance.

Creating service deployment specs and an AKS cluster can be done in under one hour, which is a good indication of the convenience AKS brings you.

The shown Sitecore XC 9.1 AKS setup is meant for development, until:

- it has centralized logging, e.g. Azure App Insights configured
- uses an Azure SQL managed database; its no good idea to run your own database containers in production
- AKS for Windows out of preview and thus generally available.

Try it for yourself: https://github.com/joostmeijles/xc9-k8s

