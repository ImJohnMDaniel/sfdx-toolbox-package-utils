# @dx-cli-toolbox/sfdx-toolbox-package-utils

Utilities to better manage SalesforceDX Packages

# Contents

<!-- toc -->

- [@dx-cli-toolbox/sfdx-toolbox-package-utils](#dx-cli-toolboxsfdx-toolbox-package-utils)
- [Contents](#contents)
- [Setup](#setup)
- [Commands](#commands)
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

- [`sf toolbox package version cleanup`](#sf-toolbox-package-version-cleanup)

## `sf toolbox package version cleanup`

Cleanup package versions.

```
USAGE
  $ sf toolbox package version cleanup -s <value> -p <value> -v <value> [--json] [--flags-dir <value>] [--api-version
  <value>]

FLAGS
  -p, --package=<value>         (required) Package Id
  -s, --matcher=<value>         (required) MAJOR.MINOR.PATCH
  -v, --target-dev-hub=<value>  (required) Username or alias of the Dev Hub org. Not required if the `target-dev-hub`
                                configuration variable is already set.
      --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Cleanup package versions.

  Delete package versions for a given package provided a MAJOR.MINOR.PATCH matcher. Does not delete released pacakge
  versions.

EXAMPLES
  $ sf toolbox package version cleanup --package 0Hoxx00000000CqCAI --matcher 2.10.0 --target-dev-hub myDevHub

FLAG DESCRIPTIONS
  -p, --package=<value>  Package Id

    The 0Ht Package Id that you wish to cleanup versions for.

  -s, --matcher=<value>  MAJOR.MINOR.PATCH

    The MAJOR.MINOR.PATCH matcher that should be used to find package versions to delete.
```

_See code: [src/commands/toolbox/package/version/cleanup.ts](https://github.com/ImJohnMDaniel/sfdx-toolbox-package-utils/blob/1.0.0-alpha5/src/commands/toolbox/package/version/cleanup.ts)_

<!-- commandsstop -->
