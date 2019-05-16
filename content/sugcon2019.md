+++
title = "SUGCON Europe 2019 - London 💂"
date = "2019-04-08"
tags = ["Sitecore"]
canonical = "https://www.avivasolutions.nl/onze-verhalen/sugcon-2019-in-londen"
+++

Beginning of april it was time for the yearly Sitecore Usergroup meeting in Europe: SUGCON 2019. The venue location was this time the City of London.
<!--more-->
The conference started with a keynote by Donovan Brown, Principal Azure Devops manager at Microsoft.
Donovan presented the possibilities and advantages of using DevOps by using a nice anology between DevOps and Formula One with respect to pitstop optimizations: http://donovanbrown.com/post/DevOps-before-and-after-F1-style
DevOps is an interesting and applicable subject as Sitecore, especially since version 9.0, is more and more becoming a micro-service oriented architecture. A very interesting SUGCON kick-off!

## Sitecore Commerce & JSS – Pramila Soni & Saurabh Sachdeva
An introduction in the use of Sitecore Javascript Services (JSS) and Commerce was presented by Pramila Soni and Saurabe Sachdeva. 
Using practical examples Pramila and Saurabh showed how you can use a current XC9 installation with JSS. There is no official support (yet) from Sitecore for this scenario, e.g. in the form of official Commerce JSS components, but using it is already quite well possible.
In short, a very interesting session as start for a future investigation of Sitecore Commerce and JSS.

[slides](https://www.sugcon.eu/wp-content/uploads/2019/04/SUGCON-Europe-2019-Pramila-Soni-Saurabh-Sachdeva-Sitecore-Commerce-and-JSS.pdf)

## I struggled with Sitecore on Docker so you don’t have to – Sean Holmesby
Sean Holmesby gave a fun presentation about how as a Docker newby, but experienced Sitecore developer, you can improve your workflow using Docker.
Main roadblocks Sean found were;

- Docker for Windows and understanding new concepts to get started, e.g. what is a Docker registry and how does that compare to a Docker repository?
- How to build Docker images (Sitecore does not ship Docker images)?

It was great to see that Sean his session attracted a room full op people. A good indication that there is large interest within the Sitecore community for Docker.
Something that I, and Aviva Solutions, have been investing quite some effort in and is publicly available on Github: https://github.com/avivasolutionsnl/sitecore-docker

## How to extend the Sitecore Commerce business tools - Erwin Werkman
Erwin Werkman presented a detailed overview of how to modify and extend the Sitecore XC9 Business Tools (aka BizFx).
Adding new properties to the Business Tools is quite straightforward, but only if you exactly know what to do! Exactly this aspect is really important when working with Sitecore XC9 and something that Erwin clearly explained.

It gets more complicated when you want to extend the Business Tools, with e.g. custom buttons, and changes are needed in the BixFx AngularJS application. For this Erwin showed an approach which is documented in this Github repo: https://github.com/ewerkman/bizfx-extension
To conclude, customizing the BizFx tools is possible, but when you need more customization it gets more complicated and less developer friendly.

[slides](https://www.sugcon.eu/wp-content/uploads/2019/04/SUGCON-Europe-2019-Erwin-Werkman-Extending-the-Sitecore-Commerce-Business-Tools.pdf)
