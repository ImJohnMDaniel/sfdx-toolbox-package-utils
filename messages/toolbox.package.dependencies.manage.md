# summary

Manage package dependencies for a Salesforce project.

# description

Manage package dependencies for a Salesforce project specified in the sfdx-project.json file.

# flags.branch.summary

Package branch to consider when specifiyng a Package/VersionNumber combination

# flags.branch.description

For dependencies specified by Package/VersionNumber combination, you can specify the branch group of builds to work from by entering the branch build name. If not specified, the builds from NULL branch will be considered.

# flags.update-to-released.summary

Update all dependencies to latest, released package version

# flags.update-to-released.description

When used, all dependencies will be updated to latest, released package version

# flags.update-to-latest.summary

Update all dependencies to latest package version on branch specified

# flags.update-to-latest.description

When used, all dependencies will be updated to latest package version on branch specified

# flags.target-dev-hub.summary

Username or alias of the Dev Hub org.

# examples

- <%= config.bin %> <%= command.id %> --target-dev-hub myTargetDevHub --branch my-feature-branch

- <%= config.bin %> <%= command.id %> --target-dev-hub myTargetDevHub --update-to-released

- <%= config.bin %> <%= command.id %> --target-dev-hub myTargetDevHub --update-to-latest

- <%= config.bin %> <%= command.id %> --target-dev-hub myTargetDevHub --update-to-latest --branch my-feature-branch

# error.invalidPackage2Id

Unable to determine a valid Package2Id for %s.

# error.targetDevHubConnectionFailed

Unable to establish connection to the DevHub org.

# error.targetDevHubMissing

This command requires a DevHub to be specified

# prompt.upgradeType

The Delete upgrade type permanently deletes metadata types that have been removed from the package. Deleted metadata can’t be recovered. We don't delete custom objects and custom fields. Instead, we deprecate them.

Do you want to continue? (y/n)

# info.package-dependencies-found 

Package dependencies found for package directory %s.

# info.package-dependency-not-managed-by-devhub

The dependency '%s' is not managed by this Dev Hub.  Moving on to next dependency.

# info.reviewing-options-for-package-dependency

Preparing options from Dev Hub for dependency '%s'

# prompt.which-version-of-package

Which version of package '%s' should be used?

# info.command-spinner

Managing the dependencies...