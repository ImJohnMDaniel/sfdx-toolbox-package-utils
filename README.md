rstk-sfdx-package-utils
=======================

Utilities to better manage SalesforceDX Packages

# Contents
<!-- toc -->
* [Contents](#contents)
* [Setup](#setup)
* [Commands](#commands)
<!-- tocstop -->

# Setup
### **Install as a SalesforceDX Plugin**

```  
sfdx plugins:install rstk-sfdx-package-utils
```
You will be prompted to confirm that you want to install an unsigned plugin. Choose "yes"
```  
This plugin is not digitally signed and its authenticity cannot be verified. Continue installation y/n?: y
```

To whitelist this plugin, [add an entry for it in $HOME/.config/sfdx/unsignedPluginWhiteList.json](https://developer.salesforce.com/blogs/2017/10/salesforce-dx-cli-plugin-update.html).

### **Install from source**
1. Clone the repository
```  
git clone https://github.com/rootstockmfg/rstk-sfdx-package-utils.git
```
2. Link the plugin:
```
sfdx plugins:link rstk-sfdx-package-utils
```
# Commands
<!-- commands -->
* [`sfdx rstk:package:dependencies:install [-k <string>] [-b <string>] [-w <number>] [-p] [--dryrun] [-s AllUsers|AdminsOnly] [--noprecheck] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-rstkpackagedependenciesinstall--k-string--b-string--w-number--p---dryrun--s-allusersadminsonly---noprecheck--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx rstk:package:dependencies:install [-k <string>] [-b <string>] [-w <number>] [-p] [--dryrun] [-s AllUsers|AdminsOnly] [--noprecheck] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Install dependent packages for a sfdx project

```
USAGE
  $ sfdx rstk:package:dependencies:install [-k <string>] [-b <string>] [-w <number>] [-p] [--dryrun] [-s 
  AllUsers|AdminsOnly] [--noprecheck] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --branch=branch
      For dependencies specified by package/versionNumber combination, you can specify the branch group of builds to work 
      from by entering the branch build name.  If not specified, the builds from NULL branch will be considered.

  -k, --installationkeys=installationkeys
      Installation key for key-protected packages (format is 1:MyPackage1Key 2: 3:MyPackage3Key... to allow some packages 
      without installation key)

  -p, --prompt
      Require approval to allow Remote Site Settings and Content Security Policy websites to send or receive data

  -s, --securitytype=(AllUsers|AdminsOnly)
      [default: AdminsOnly] security access type for the installed package

  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername
      username or alias for the dev hub org; overrides default dev hub org

  -w, --wait=wait
      Number of minutes to wait for installation status (also used for publishwait). Default is 10

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --dryrun
      Allows the command to execute and display result information without actually performing the package installations.  
      Useful if debugging.

  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

  --noprecheck
      Allows the command to bypass the pre-check of the target org and force install all packages even if they are already 
      installed.

EXAMPLE
  $ rstk:package:dependencies:install -u MyScratchOrg -v MyDevHub -k "1:MyPackage1Key 2: 3:MyPackage3Key" -b "DEV"
```

_See code: [src/commands/rstk/package/dependencies/install.ts](https://github.com/RootstockMFG/rstk-sfdx-package-utils/blob/v0.1.12/src/commands/rstk/package/dependencies/install.ts)_
<!-- commandsstop -->
