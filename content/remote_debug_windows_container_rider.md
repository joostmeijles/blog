---
title: "Remote debugging Windows containers with Rider 🐎"
date: "2020-06-05"
tags: ["Docker"]
---

For a while I have been wanting to use [Jetbrains Rider](https://www.jetbrains.com/rider/) instead of Visual Studio, but the lack of remote debugging possibilities for Windows container processes stopped me from doing so.
<!--more-->

But Rider has improved and [now](https://www.jetbrains.com/help/rider/SSH_Remote_Debugging.html) supports .NET and .NET Core remote debugging using SSH. SSH is a first class citizen for Linux containers but unfortunately not (yet) for Windows containers.

The usual way of installing OpenSSH for Windows, as described [here](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse), does not work for Windows containers.

Therefore you will need to install SSH manually. To save you from figuring out how to do that, I created the following Powershell script:
```
# Only install when sshd service is not available
if (-Not (Get-Service sshd -ErrorAction SilentlyContinue))
{
    # Install choco
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

    # Install SSH
    choco install openssh --yes

    # Install SSH server
    &"C:\Program Files\OpenSSH-Win64\install-sshd.ps1"

    # Start SSH service
    Set-Service sshd -StartupType Automatic
    Start-Service sshd

    # Enable password authentication
    # For local usage ONLY we enable empty passwords
    $FilePath = "$env:PROGRAMDATA\ssh\sshd_config"
    (Get-Content $FilePath).Replace('#PasswordAuthentication yes','PasswordAuthentication yes').Replace('#PermitEmptyPasswords no', 'PermitEmptyPasswords yes') | Set-Content $FilePath

    Restart-Service sshd

    # Add user
    net user debug /add
    net localgroup administrators debug /add
}

Start-Service sshd
```
Find the Github Gist for it [here](https://gist.github.com/joostmeijles/7ec1cb7e7117bcb19e032fb5377d2e01).
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

Now you can attach the debugger to the remote host using the Rider menu: `Run > Attach To Remote Process`

That's all, enjoy the ride!
