+++
title = "Automatically save money by removing obsolete images from ACR 💰"
date = "2019-05-22"
tags = ["Docker", "Azure"]
+++
 
Since a while we store Docker images in our Azure Container Registry (ACR). Everytime we tag a commit in git, an amount of 22 Docker images are automatically pushed to our registry (see [this article for details](../build_using_azuredevops)). Very easy indeed, but it also causes a forever growing registry. 
While it's not a lot, it does cost money to store images in ACR: €0.003/GB/day.
<!--more-->
We went looking for a way to save some costs on that and since we are developers, we're not going to delete images manually… It's got to be automatically!
 
We could of course follow a naive approach like deleting all images except the newest ones, but that's not what we wanted. Some people rely on older ones which is perfectly fine. 
 
We decided to keep our images in sync with the GitHub releases. Every GitHub release that is not needed anymore gets deleted, and the corresponding images are deleted from ACR.
 
## How?
These are the ingredients:

- Azure DevOps
- [NUKE](http://www.nuke.build)
- GitHub API
- Azure CLI
 
A NUKE target executes the process, it;

1.	Gets all current GitHub releases from a specific directory
    
    > Using the [GitHub Releases API](https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository).

1.	Gets all current images in the corresponding ACR repositories

    > Using the [az acr repository show-tags](https://docs.microsoft.com/en-us/cli/azure/acr/repository?view=azure-cli-latest#az-acr-repository-show-tags) command

1.	Deletes all images which do not have a corresponding GitHub release (anymore)

    > Using the [az acr repository delete](https://docs.microsoft.com/en-us/cli/azure/acr/repository?view=azure-cli-latest#az-acr-repository-delete) command

The code for above steps can be found in [Build.RetentionPolicy.cs](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/build/Build.RetentionPolicy.cs).

Next a Azure DevOps build pipeline triggers the NUKE target. Using the configured Azure subscription (which automatically provides us with a authentication context) we execute the NUKE `ExecuteRetentionPolicy` target.
The build pipeline can be found [here](https://github.com/avivasolutionsnl/sitecore-docker/blob/master/execute-retention-policy.yml) and is in Azure Pipelines scheduled to run every night.
 
By the way, make sure you choose the `Hosted VS2017` pool, because that's the one which has the Azure CLI already installed.
 
So that's it! No more unnecessary costs 😼.

See the live results [here](https://dev.azure.com/avivasolutions-public/sitecore-docker/_build?definitionId=3)!

## Credits
All credit for code, setup, and documentation goes to [Rob van Uden](https://www.linkedin.com/in/robvanu/) 👏.
