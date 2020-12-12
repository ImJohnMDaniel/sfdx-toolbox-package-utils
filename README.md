@dx-cli-toolbox/sfdx-toolbox-package-utils
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
sfdx plugins:install @dx-cli-toolbox/sfdx-toolbox-package-utils
```
You will be prompted to confirm that you want to install an unsigned plugin. Choose "yes"
```  
This plugin is not digitally signed and its authenticity cannot be verified. Continue installation y/n?: y
```

To whitelist this plugin, [add an entry for it in $HOME/.config/sfdx/unsignedPluginWhiteList.json](https://developer.salesforce.com/blogs/2017/10/salesforce-dx-cli-plugin-update.html).

### **Install from source**
1. Clone the repository
```  
git clone https://github.com/ImJohnMDaniel/sfdx-toolbox-package-utils.git
```
2. Link the plugin:
```
sfdx plugins:link .
```
# Commands
<!-- commands -->
* [`sfdx toolbox:package:dependencies:install [-a all|package] [-b <string>] [--dryrun] [-k <string>] [--noprecheck] [-p] [-s AllUsers|AdminsOnly] [-w <number>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-toolboxpackagedependenciesinstall--a-allpackage--b-string---dryrun--k-string---noprecheck--p--s-allusersadminsonly--w-number--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx toolbox:package:dependencies:manage [-b <string>] [--updatetoreleased | --updatetolatest] [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-toolboxpackagedependenciesmanage--b-string---updatetoreleased----updatetolatest--v-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx toolbox:package:dependencies:install [-a all|package] [-b <string>] [--dryrun] [-k <string>] [--noprecheck] [-p] [-s AllUsers|AdminsOnly] [-w <number>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Install dependent packages for a sfdx project

```
USAGE
  $ sfdx toolbox:package:dependencies:install [-a all|package] [-b <string>] [--dryrun] [-k <string>] [--noprecheck] 
  [-p] [-s AllUsers|AdminsOnly] [-w <number>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --apexcompile=(all|package)
      [default: all] compile all Apex in the org and package, or only Apex in the package

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
  $ toolbox:package:dependencies:install -u MyScratchOrg -v MyDevHub -k "1:MyPackage1Key 2: 3:MyPackage3Key" -b "DEV"
```

_See code: [src/commands/toolbox/package/dependencies/install.ts](https://github.com/ImJohnMDaniel/sfdx-toolbox-package-utils/blob/v0.3.2/src/commands/toolbox/package/dependencies/install.ts)_

## `sfdx toolbox:package:dependencies:manage [-b <string>] [--updatetoreleased | --updatetolatest] [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Manage the sfdx project dependencies

```
USAGE
  $ sfdx toolbox:package:dependencies:manage [-b <string>] [--updatetoreleased | --updatetolatest] [-v <string>] 
  [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --branch=branch                                                               the package version’s branch

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --updatetolatest                                                                  when used, all dependencies that are
                                                                                    owned by the current Dev Hub will be
                                                                                    set to X.Y.Z.LATEST, unless the
                                                                                    X.Y.Z version has been released

  --updatetoreleased                                                                when used, all dependencies will be
                                                                                    updated to latest, released package
                                                                                    version

EXAMPLE
  $ sfdx toolbox:package:dependencies:manage --branch my-feature-branch --targetdevhubusername devhub@org.com
  $ sfdx toolbox:package:dependencies:manage --branch my-feature-branch --updatetolatest --targetdevhubusername 
  devhub@org.com
  $ sfdx toolbox:package:dependencies:manage --branch my-feature-branch --updatetoreleased --targetdevhubusername 
  devhub@org.com
```

_See code: [src/commands/toolbox/package/dependencies/manage.ts](https://github.com/ImJohnMDaniel/sfdx-toolbox-package-utils/blob/v0.3.2/src/commands/toolbox/package/dependencies/manage.ts)_
<!-- commandsstop -->
