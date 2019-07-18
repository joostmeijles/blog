+++
title = "Routing XC 9.1 services using Traefik 🚦"
date = "2019-07-15"
tags = ["Docker", "XC9"]
+++

Recently we upgraded to Sitecore XP 9.1.1 and XC 9.1.0. This is the first version of XC that uses XP 9.1.
Version 9.1 introduces a system wide Identity service which was in 9.0 only used for Commerce. For the Sitecore CMS this change means that for login you will be redirected to the Identity server, and upon successful login redirected back to the request URL. 
<!--more--> 

For development we use a Docker setup which can be found [here](https://github.com/avivasolutionsnl/sitecore-docker). For testing purposes this Docker development setup is deployed to an (IAAS) Azure VM.

The setup roughly looks as follows:

![](/without_traefik.png)

Each Docker container (depicted in the blue circles) runs one or more web services. Containers running more than one web service are;

- Commerce, it has Authoring, Shops, DevOps, Minions (last 3 not depicted for brevity), BizFx UI, and Plumber UI web services
- Sitecore serving request on HTTP and HTTPS

The Azure VM has a DNS name assigned using the basic DNS configuration feature in the Azure portal (i.e. the DNS name ending with `*.cloudapp.azure.com`). For simplicity this is named `my.staging.dev` in above diagram.

Until the introduction of the Identity service each web service was running on a unique port. In such we could simply open the required ports on the Azure VM and bind the ports to the host in Docker compose file, e.g. using a `docker-compose.ci.yml` overlay file:
```
...

sitecore:
  ports:
    - 80:80
    - 443:443

```

With the introduction of the Identity service there are at least 2 web services running on port 443.
This introduces the challenge that HTTPS requests to `https://my.staging.dev/sitecore` should first go to Sitecore and next to the Identity service, which is clearly impossible when these use the same port and DNS name.

Solution is to place a reverse-proxy in between that routes requests to the correct web service. In addition the reverse proxy should route requests based on the container name and automatically configure when Docker containers are started.
All these requirements are something [Traefik](https://traefik.io) is built for.

With [Traefik v2](https://docs.traefik.io/v2.0/) it is even possible to route TLS traffic based on the SNI name. This feature is needed as with the current Sitecore Docker setup, based on the XP0 SIF installation, it is not easy to run without TLS (and e.g. use reverse-proxy TLS offloading).

So the desired situation is shown in below picture:

![](/with_traefik.png)

Each service gets its own DNS name following the `<service>.staging.dev` scheme. To configure this, we first need a Traefik configuration file that specifies the entrypoints where it listens on using Docker as a config provider, e.g. a `traefik.toml` file with the following:

```
[providers.docker]
  endpoint = "npipe:////./pipe/docker_engine"

[entryPoints]
  [entryPoints.https]
    address = ":443"
```

Next configure for each Docker service a number of labels in a `docker-compose.yml` file that configures the routing, e.g. for the Identity service:
```
...

identity:
  command: -commerceHostname commerce.staging.dev -sitecoreHostname www.staging.dev -identityHostname identity.staging.dev
  labels:
      - "traefik.tcp.routers.identity.rule=HostSNI(`identity.staging.dev`)"
      - "traefik.tcp.routers.identity.entrypoints=https" # Name matching entryPoints.https from traefik.toml
      - "traefik.tcp.routers.identity.tls.passthrough=true"
      - "traefik.tcp.routers.identity.service=identity" # Specify service name as used below in load balancer config entry
      - "traefik.tcp.services.identity.loadbalancer.server.port=443"
```

Now configure your DNS in Azure, you will need a domain name as the default `*.cloudapp.azure.com` DNS setting does not support configuring subdomains, and that's all!

## Final note
All of above is not (yet) necessary when you decide to run the Sitecore web service at port 80 (without TLS) and the Identity service at port 443.
In this case you will have no overlapping port numbers. Drawback is of course that it is not so secure (but might be fine for development purposes) and with the introduction of the next new web service you probably have to go with above approach.
