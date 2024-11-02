# summary

Install package dependencies for a Salesforce project.

# description

Installs all specified package dependencies in a Salesforce DX project using the sfdx-project.json definition.

# flags.branch.summary

Package branch to consider when specifiyng a Package/VersionNumber combination

# flags.branch.description

For dependencies specified by Package/VersionNumber combination, you can specify the branch group of builds to work from by entering the branch build name. If not specified, the builds from NULL branch will be considered.

# flags.apex-compile.summary

Compile all Apex in the org and package, or only Apex in the package; unlocked packages only.

# flags.apex-compile.description

Applies to unlocked packages only. Specifies whether to compile all Apex in the org and package, or only the Apex in the package.

For package installs into production orgs, or any org that has Apex Compile on Deploy enabled, the platform compiles all Apex in the org after the package install or upgrade operation completes.

This approach assures that package installs and upgrades don’t impact the performance of an org, and is done even if --apex-compile package is specified.

# flags.install-type.summary

Install all packages or only deltas.

# flags.install-type.description

If 'All' is specified, then all packages specified in package dependencies are installed, regardless of if the version already is installed in the org. If 'Delta' is specified, then only packages that differ from what is installed in the org will be installed.

# flags.installation-key.summary

Installation key for key-protected packages

# flags.installation-key.description

Installation key for key-protected packages in the key:value format of SubscriberPackageVersionId:Key

# flags.no-prompt.summary

Don't prompt for confirmation.

# flags.no-prompt.description

Allows the following without an explicit confirmation response: 1) Remote Site Settings and Content Security Policy websites to send or receive data, and 2) --upgrade-type Delete to proceed.

# flags.publish-wait.summary

Maximum number of minutes to wait for the Subscriber Package Version ID to become available in the target org before canceling the install request.

# flags.security-type.summary

Security access type for the installed package. (deprecation notice: The default --security-type value will change from AllUsers to AdminsOnly in v47.0 or later.)

# flags.skip-handlers.summary

Skip install handlers (available handlers: FeatureEnforcement).

# flags.skip-handlers.description

Allows the installer of a package to optionally skip install handlers in order to decrease overall installation time (available handlers: FeatureEnforcement).

# flags.target-dev-hub.summary

Username or alias of the Dev Hub org.

# flags.upgrade-type.summary

Upgrade type for the package installation; available only for unlocked packages.

# flags.upgrade-type.description

For package upgrades, specifies whether to mark all removed components as deprecated (DeprecateOnly), to delete removed components that can be safely deleted and deprecate the others (Mixed), or to delete all removed components, except for custom objects and custom fields, that don't have dependencies (Delete). The default is Mixed. Can specify DeprecateOnly or Delete only for unlocked package upgrades.

# flags.wait.summary

Number of minutes to wait for installation status.

# examples

- <%= config.bin %> <%= command.id %> --target-org myTargetOrg --target-dev-hub myTargetDevHub

- <%= config.bin %> <%= command.id %> --target-org myTargetOrg --target-dev-hub myTargetDevHub --installation-key "MyPackage1Alias:MyPackage1Key"

- <%= config.bin %> <%= command.id %> --target-org myTargetOrg --target-dev-hub myTargetDevHub --installation-key "MyPackage1Alias:MyPackage1Key" --installation-key "MyPackage2Alias:MyPackage2Key"

# error.apiVersionTooLow

This command is supported only on API versions 36.0 and higher.

# error.installationKeyFormat

Installation Key should have the key:value format of SubscriberPackageVersionId:Key.

You can use an alias in place of the SubscriberPackageVersionId.

# error.invalidPackage2Id

Unable to determine a valid Package2Id for %s.

# error.invalidSubscriberPackageVersionId

Unable to determine a valid SubscriberPackageVersionId for %s.

# error.packageInstall

Encountered errors installing the package! %s

# error.packageInstallInProgress

The package install is still In-Progress, so subsuequent dependencies cannot be installed yet. You can query the status using %s package install report -i %s -o %s.

# error.packageInstallPollingTimeout

Polling timeout exceeded

# error.targetDevHubConnectionFailed

Unable to establish connection to the org.

# error.targetDevHubMissing

This command requires a DevHub to be specified if providing a Package2Id and VersionNumber instead of a SubscriberPackageVersionId.

# error.targetOrgConnectionFailed

Unable to establish connection to the org.

# info.canceledPackageInstall

We canceled this package installation per your request.

# prompt.enableRss

This package might send or receive data from these third-party websites:

[%s]

Grant access (y/n)?

# prompt.upgradeType

The Delete upgrade type permanently deletes metadata types that have been removed from the package. Deleted metadata can’t be recovered. We don't delete custom objects and custom fields. Instead, we deprecate them.

Do you want to continue? (y/n)
