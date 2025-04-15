import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Logger } from '@salesforce/core';
import {
  Package,
  PackageSaveResult,
  PackageVersion,
  PackageVersionListOptions,
  PackageVersionOptions,
} from '@salesforce/packaging';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@dx-cli-toolbox/sfdx-toolbox-package-utils', 'toolbox.package.version.cleanup');

// TableOptions<Record<string, unknown>>
export type PackageVersionCleanupResult = {
  Error?: string;
  Success: boolean;
  SubscriberPackageVersionId: string;
};

export default class PackageVersionCleanup extends SfCommand<PackageVersionCleanupResult[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  // This is annoying, but the underlying Salesforce Packaging API expects you to be in a project context
  // https://github.com/forcedotcom/packaging/blob/main/src/package/package.ts#L146C55-L146C55
  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),

    matcher: Flags.string({
      summary: messages.getMessage('flags.matcher.summary'),
      description: messages.getMessage('flags.matcher.description'),
      char: 's',
      required: true,
    }),

    package: Flags.string({
      summary: messages.getMessage('flags.package.summary'),
      description: messages.getMessage('flags.package.description'),
      char: 'p',
      required: true,
    }),

    'target-dev-hub': Flags.requiredHub(),
  };

  public async run(): Promise<PackageVersionCleanupResult[]> {
    const log = await Logger.child(this.ctor.name); // grab an instance to the logger

    const { flags } = await this.parse(PackageVersionCleanup); // setup the flags instance

    // Create a connection to the org
    await flags['target-dev-hub'].refreshAuth();

    const connection = flags['target-dev-hub']?.getConnection(flags['api-version']);

    if (!connection) {
      throw messages.createError('errors.connectionFailed');
    }

    const project = this.project;

    const matcher = flags.matcher;
    const matcherRegex = new RegExp(/^\d+\.\d+\.\d+$/); // this is the regex expression to match the MAJOR.MINOR.PATCH version number
    const matcherValid = matcherRegex.test(matcher);

    if (!matcherValid) {
      throw messages.createError('errors.matcherFormatMismatch');
    }

    const matcherSplit = matcher.split('.');
    const majorMatcher: string = matcherSplit.at(0) as string;
    const minorMatcher: string = matcherSplit.at(1) as string;
    const patchMatcher: string = matcherSplit.at(2) as string;

    log.info(`Major Matcher ${majorMatcher} Minor Matcher ${minorMatcher} Patch Matcher ${patchMatcher}`);

    const packageVersionListOptions: PackageVersionListOptions = {
      concise: false,
      createdLastDays: undefined as unknown as number,
      modifiedLastDays: undefined as unknown as number,
      orderBy: 'MajorVersion, MinorVersion, PatchVersion, BuildNumber',
      packages: [flags.package],
      isReleased: false,
      verbose: true,
    };

    this.spinner.start('Analyzing which package versions to delete...');

    const packageVersions = await Package.listVersions(connection, this.project, packageVersionListOptions);

    const targetVersions = packageVersions.filter(
      (packageVersion) =>
        packageVersion.IsReleased === false &&
        packageVersion.MajorVersion.toString() === majorMatcher &&
        packageVersion.MinorVersion.toString() === minorMatcher &&
        packageVersion.PatchVersion.toString() === patchMatcher
    );

    const packageVersionDeletePromiseRequests: Array<Promise<PackageSaveResult>> = [];

    targetVersions.forEach((targetVersion) => {
      const packageVersionOptions: PackageVersionOptions = {
        connection,
        project,
        idOrAlias: targetVersion.SubscriberPackageVersionId,
      };

      packageVersionDeletePromiseRequests.push(new PackageVersion(packageVersionOptions).delete());
    });

    const results: PackageVersionCleanupResult[] = [];

    this.spinner.stop();

    this.spinner.start('Deleting the package versions...');

    const promiseResults = await Promise.allSettled(packageVersionDeletePromiseRequests);

    promiseResults.forEach((promiseResult, index) => {
      switch (promiseResult.status) {
        case 'fulfilled':
          results.push({
            Success: promiseResult?.value?.success,
            SubscriberPackageVersionId: targetVersions[index].SubscriberPackageVersionId,
          });
          break;
        case 'rejected':
          results.push({
            Success: false,
            Error: promiseResult.reason as string,
            SubscriberPackageVersionId: targetVersions[index].SubscriberPackageVersionId,
          });
          break;
      }
    });

    this.spinner.stop();

    this.displayDeletionResults(results);

    return results;
  }

  private displayDeletionResults(packageCleanupResults: PackageVersionCleanupResult[]): void {
    this.styledHeader('Package Version Cleanup Results');
    // columns: AllColumnProps to Column
    this.table({
      data: packageCleanupResults,
      columns: [
        {
          key: 'SubscriberPackageVersionId',
          name: 'PACKAGE VERSION ID',
        },
        {
          key: 'Success',
          name: 'SUCCESS',
        },
        {
          key: 'Error',
          name: 'ERROR',
        },
      ],
    });
  }
}

// , {
//   SubscriberPackageVersionId: { header: 'PACKAGE VERSION ID' },
//   Success: { header: 'SUCCESS' },
//   Error: { header: 'ERROR' },
// }
