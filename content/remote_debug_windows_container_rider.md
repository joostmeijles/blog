---
title: "Remote debugging Windows containers with Rider 🐎"
date: "2020-06-05"
tags: ["Docker"]
---

For a while I have been wanting to use [Jetbrains Rider](https://www.jetbrains.com/rider/) instead of Visual Studio, but the lack of remote debugging possibilities for Windows container processes stopped me from doing so.
<!--more-->

But Rider has improved and [now](https://www.jetbrains.com/help/rider/SSH_Remote_Debugging.html) supports .NET and .NET Core remote debugging using SSH. SSH is a first class citizen for Linux containers but unfortunately not (yet) for Windows containers.

The usual way of installing OpenSSH for Windows, as described [here](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse), does not work for Windows containers.

Therefore you will need to install SSH manually. To save you from figuring that out how to do that, I created the following Powershell script:
<script src="https://gist.github.com/joostmeijles/7ec1cb7e7117bcb19e032fb5377d2e01"></script>

Download the script and save it to your working directory.

Now mount the `run-ssh.ps1` script into your container and modify the entrypoint for your Windows container in your `docker-compose.yml` file, e.g:
```
...

services:
  my-container:
    entrypoint: powershell.exe -Command "& C:\\ssh\\run-ssh.ps1; <the default entrypoint script>"
    volumes:
      - .:C:\ssh # Mount the run-ssh.ps1 script

...
```

After you have started the container, SSH will now be automatically started and you can now add a remote host in Rider:

![](/rider_remote_host.png)

> Username is `debug` and leave the `password` empty (this is only safe for development purposes of course!).

Now you can attach to the Remote Host using the Rider menu: `Run > Attach To Remote Process`

That's all, enjoy the ride!
