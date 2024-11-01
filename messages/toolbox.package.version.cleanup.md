# summary

Cleanup package versions.

# description

Delete package versions for a given package provided a MAJOR.MINOR.PATCH matcher. Does not delete released pacakge versions.

# flags.package.summary

Package Id

# flags.package.description

The 0Ht Package Id that you wish to cleanup versions for.

# flags.matcher.summary

MAJOR.MINOR.PATCH

# flags.matcher.description

The MAJOR.MINOR.PATCH matcher that should be used to find package versions to delete.

# examples

- <%= config.bin %> <%= command.id %> --package 0Hoxx00000000CqCAI --matcher 2.10.0 --target-dev-hub myDevHub

# errors.connectionFailed

Unable to establish connection to the org.

# errors.matcherFormatMismatch

The matcher must be in the format of MAJOR.MINOR.PATCH.

# errors.deletionJob

There was an unexpected error performing the deletion job.
