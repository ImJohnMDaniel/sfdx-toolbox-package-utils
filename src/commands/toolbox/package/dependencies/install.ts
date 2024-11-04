/* eslint-disable complexity */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unsafe-finally */
import {
  SfCommand,
  Flags,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  optionalHubFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { AuthInfo, Connection, Messages, Lifecycle, SfError } from '@salesforce/core';
import { isPackagingDirectory } from '@salesforce/core/project';
import { Duration } from '@salesforce/kit';
import {
  InstalledPackages,
  PackageEvents,
  PackageInstallCreateRequest,
  PackageInstallOptions,
  SubscriberPackageVersion,
  PackagingSObjects,
} from '@salesforce/packaging';
import { PackageDirDependency } from '@salesforce/schemas';
import { Optional } from '@salesforce/ts-types';
import {
  isPackage2Id,
  isSubscriberPackageVersionId,
  isSubscriberPackageVersionInstalled,
  reducePackageInstallRequestErrors,
} from '../../../../shared/packageUtils.js';

type PackageInstallRequest = PackagingSObjects.PackageInstallRequest;

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages(
  '@dx-cli-toolbox/sfdx-toolbox-package-utils',
  'toolbox.package.dependencies.install'
);

export type PackageToInstall = {
  Status: string;
  PackageName: string;
  SubscriberPackageVersionId: string;
};

const installType = { All: 'all', Delta: 'delta' };
const securityType = { AllUsers: 'full', AdminsOnly: 'none' };
const upgradeType = { Delete: 'delete-only', DeprecateOnly: 'deprecate-only', Mixed: 'mixed-mode' };

const installationKeyRegex = new RegExp(/^(\w+:\w+)(,\s*\w+:\w+)*/);

export default class PackageDependenciesInstall extends SfCommand<PackageToInstall[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;

  public static readonly flags = {
    ...SfCommand.baseFlags,
    'apex-compile': Flags.custom<PackageInstallCreateRequest['ApexCompileType']>({
      options: ['all', 'package'],
    })({
      summary: messages.getMessage('flags.apex-compile.summary'),
      description: messages.getMessage('flags.apex-compile.description'),
      char: 'a',
    }),
    // 'api-version': Flags.orgApiVersion(),
    'api-version': orgApiVersionFlagWithDeprecations,
    branch: Flags.string({
      summary: messages.getMessage('flags.branch.summary'),
      description: messages.getMessage('flags.branch.description'),
      char: 'z',
      default: '',
    }),
    'install-type': Flags.custom<'All' | 'Delta'>({
      options: ['All', 'Delta'],
    })({
      char: 'i',
      summary: messages.getMessage('flags.install-type.summary'),
      description: messages.getMessage('flags.install-type.description'),
      default: 'Delta',
    }),
    'installation-key': Flags.string({
      summary: messages.getMessage('flags.installation-key.summary'),
      description: messages.getMessage('flags.installation-key.description'),
      char: 'k',
      multiple: true,
    }),
    'no-prompt': Flags.boolean({
      summary: messages.getMessage('flags.no-prompt.summary'),
      description: messages.getMessage('flags.no-prompt.description'),
      char: 'r',
      default: false,
      required: false,
    }),
    'publish-wait': Flags.duration({
      unit: 'minutes',
      summary: messages.getMessage('flags.publish-wait.summary'),
      char: 'b',
      default: Duration.minutes(0),
    }),
    'security-type': Flags.custom<'AllUsers' | 'AdminsOnly'>({
      options: ['AllUsers', 'AdminsOnly'],
    })({
      char: 's',
      summary: messages.getMessage('flags.security-type.summary'),
      default: 'AdminsOnly',
    }),
    'skip-handlers': Flags.string({
      multiple: true,
      options: ['FeatureEnforcement'],
      char: 'l',
      summary: messages.getMessage('flags.skip-handlers.summary'),
      description: messages.getMessage('flags.skip-handlers.description'),
      hidden: true,
    }),
    // 'target-dev-hub': Flags.string({
    //   summary: messages.getMessage('flags.target-dev-hub.summary'),
    //   char: 'v',
    // }),
    'target-dev-hub': optionalHubFlagWithDeprecations
    // 'target-org': Flags.requiredOrg({
    //   summary: messages.getMessage('flags.target-dev-hub.summary'),
    //   charAliases: ['b'],
    // }),
    'target-org': requiredOrgFlagWithDeprecations,
    'upgrade-type': Flags.custom<'DeprecateOnly' | 'Mixed' | 'Delete'>({
      options: ['DeprecateOnly', 'Mixed', 'Delete'],
    })({
      char: 't',
      summary: messages.getMessage('flags.upgrade-type.summary'),
      description: messages.getMessage('flags.upgrade-type.description'),
      default: 'Mixed',
    }),
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
      default: Duration.minutes(30),
    }),
  };

  public async run(): Promise<PackageToInstall[]> {
    const { flags } = await this.parse(PackageDependenciesInstall);

    // Create connection to the target org
    await flags['target-org'].refreshAuth();
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    // Validate minimum api version
    const apiVersion = parseInt(targetOrgConnection.getApiVersion(), 10);
    if (apiVersion < 36) {
      throw messages.createError('error.apiVersionTooLow');
    }

    let packagesToInstall: PackageToInstall[] = [];
    const packageInstallRequests: PackageInstallRequest[] = [];
    const devHubDependencies: PackageDirDependency[] = [];

    this.spinner.start('Analyzing project to determine packages to install', '\n', { stdout: true });

    const packageDirectories = this.project
      ?.getPackageDirectories()
      .filter((packageDirectory) => isPackagingDirectory(packageDirectory));

    for (const packageDirectory of packageDirectories ?? []) {
      for (const dependency of packageDirectory?.dependencies ?? []) {
        if (dependency.package && dependency.versionNumber) {
          // This must be resolved by a dev hub
          devHubDependencies.push(dependency);
          continue;
        }

        const packageVersionId = this.project!.getPackageIdFromAlias(dependency.package) ?? dependency.package;

        if (!isSubscriberPackageVersionId(packageVersionId)) {
          throw messages.createError('error.invalidSubscriberPackageVersionId', [dependency.package]);
        }

        packagesToInstall.push({
          Status: '',
          PackageName: dependency.package,
          SubscriberPackageVersionId: packageVersionId,
        } as PackageToInstall);
      }
    }

    this.spinner.stop();

    if (devHubDependencies.length > 0) {
      this.spinner.start('Resolving package versions from dev hub', '\n', { stdout: true });

      if (!flags['target-dev-hub']) {
        throw messages.createError('error.targetDevHubMissing');
      }

      // Create a connection to the dev hub
      await flags['target-dev-hub'].refreshAuth();
      const targetDevHubConnection = flags['target-dev-hub']?.getConnection(flags['api-version']);

      if (!targetDevHubConnection) {
        throw messages.createError('error.targetDevHubConnectionFailed');
      }

      for (const devHubDependency of devHubDependencies) {
        if (!devHubDependency.package || !devHubDependency.versionNumber) {
          continue;
        }

        const packageId = this.project!.getPackageIdFromAlias(devHubDependency.package) ?? devHubDependency.package;

        if (!isPackage2Id(packageId)) {
          throw messages.createError('error.invalidPackage2Id', [devHubDependency.package]);
        }

        const packageVersionId = await SubscriberPackageVersion.resolveId(targetDevHubConnection, {
          branch: flags.branch,
          packageId,
          versionNumber: devHubDependency.versionNumber,
        });

        if (!isSubscriberPackageVersionId(packageVersionId)) {
          throw messages.createError('error.invalidSubscriberPackageVersionId', [devHubDependency.package]);
        }

        packagesToInstall.push({
          PackageName: devHubDependency.package,
          Status: '',
          SubscriberPackageVersionId: packageVersionId,
        } as PackageToInstall);
      }

      this.spinner.stop();
    }

    // Filter out duplicate packages before we start the install process
    this.spinner.start('Checking for duplicate package dependencies', '\n', { stdout: true });
    packagesToInstall = packagesToInstall.filter(
      (packageToInstall, index, self) =>
        index === self.findIndex((t) => t.SubscriberPackageVersionId === packageToInstall?.SubscriberPackageVersionId)
    );
    this.spinner.stop();

    if (packagesToInstall?.length === 0) {
      this.log('No packages were found to install');
      return packagesToInstall;
    }

    // Process any installation keys for the packages
    const installationKeyMap = new Map<string, string>();

    if (flags['installation-key']) {
      this.spinner.start('Processing package installation keys', '\n', { stdout: true });
      for (let installationKey of flags['installation-key']) {
        installationKey = installationKey.trim();

        const isKeyValid = installationKeyRegex.test(installationKey);

        if (!isKeyValid) {
          throw messages.createError('error.installationKeyFormat');
        }

        const installationKeyPair = installationKey.split(':');
        const packageVersionId = this.project!.getPackageIdFromAlias(installationKeyPair[0]) ?? installationKeyPair[0];
        const packageInstallationKey = installationKeyPair[1];

        if (!isSubscriberPackageVersionId(packageVersionId)) {
          throw messages.createError('error.invalidSubscriberPackageVersionId', [packageVersionId]);
        }

        installationKeyMap.set(packageVersionId, packageInstallationKey);
      }
      this.spinner.stop();
    }

    let installedPackages: InstalledPackages[] = [];

    // If precheck is enabled, get the currently installed packages
    if (installType[flags['install-type']] === installType.Delta) {
      this.spinner.start('Analyzing which packages to install', '\n', { stdout: true });
      installedPackages = await SubscriberPackageVersion.installedList(targetOrgConnection);
      this.spinner.stop();
    }

    this.spinner.start('Installing dependent packages', '\n', { stdout: true });

    for (const packageToInstall of packagesToInstall) {
      if (installType[flags['install-type']] === installType.Delta) {
        if (isSubscriberPackageVersionInstalled(installedPackages, packageToInstall?.SubscriberPackageVersionId)) {
          packageToInstall.Status = 'Skipped';

          this.log(
            `Package ${packageToInstall?.PackageName} (${packageToInstall?.SubscriberPackageVersionId}) is already installed and will be skipped`
          );

          continue;
        }
      }

      let installationKey = '';
      // Check if we have an installation key for this package
      if (installationKeyMap.has(packageToInstall?.SubscriberPackageVersionId)) {
        // If we do, set the installation key value
        installationKey = installationKeyMap.get(packageToInstall?.SubscriberPackageVersionId) ?? '';
      }

      this.spinner.start(`Preparing package ${packageToInstall.PackageName}`, '\n', { stdout: true });

      const subscriberPackageVersion = new SubscriberPackageVersion({
        aliasOrId: packageToInstall?.SubscriberPackageVersionId,
        connection: targetOrgConnection,
        password: installationKey,
      });

      const request: PackageInstallCreateRequest = {
        ApexCompileType: flags['apex-compile'],
        EnableRss: true,
        Password: installationKey,
        SecurityType: securityType[flags['security-type']] as PackageInstallCreateRequest['SecurityType'],
        SkipHandlers: flags['skip-handlers']?.join(','),
        SubscriberPackageVersionKey: await subscriberPackageVersion.getId(),
        UpgradeType: upgradeType[flags['upgrade-type']] as PackageInstallCreateRequest['UpgradeType'],
      };

      // eslint-disable-next-line @typescript-eslint/require-await
      Lifecycle.getInstance().on(PackageEvents.install.warning, async (warningMsg: string) => {
        this.warn(warningMsg);
      });

      this.spinner.stop();

      if (flags['publish-wait']?.milliseconds > 0) {
        let timeThen = Date.now();
        // waiting for publish to finish
        let remainingTime = flags['publish-wait'];

        Lifecycle.getInstance().on(
          PackageEvents.install['subscriber-status'],
          // eslint-disable-next-line @typescript-eslint/require-await
          async (publishStatus: PackagingSObjects.InstallValidationStatus) => {
            const elapsedTime = Duration.milliseconds(Date.now() - timeThen);
            timeThen = Date.now();
            remainingTime = Duration.milliseconds(remainingTime.milliseconds - elapsedTime.milliseconds);
            const status =
              publishStatus === 'NO_ERRORS_DETECTED' ? 'Available for installation' : 'Unavailable for installation';
            this.spinner.status = `${remainingTime.minutes} minutes remaining until timeout. Publish status: ${status}\n`;
          }
        );

        this.spinner.start(
          `${remainingTime.minutes} minutes remaining until timeout. Publish status: 'Querying Status'`,
          '\n',
          { stdout: true }
        );

        await subscriberPackageVersion.waitForPublish({
          publishTimeout: flags['publish-wait'],
          publishFrequency: Duration.seconds(10),
          installationKey,
        });

        // need to stop the spinner to avoid weird behavior with the prompts below
        this.spinner.stop();
      }

      // If the user has not specified --no-prompt, process prompts
      if (!flags['no-prompt']) {
        // If the user has specified --upgradetype Delete, then prompt for confirmation for Unlocked Packages
        if (flags['upgrade-type'] === 'Delete' && (await subscriberPackageVersion.getPackageType()) === 'Unlocked') {
          const promptMsg = messages.getMessage('prompt.upgradeType');
          if (!(await this.confirm({ message: promptMsg }))) {
            throw messages.createError('info.canceledPackageInstall');
          }
        }

        // If the package has external sites, ask the user for permission to enable them
        const externalSites = await subscriberPackageVersion.getExternalSites();
        if (externalSites) {
          const promptMsg = messages.getMessage('prompt.enableRss', [externalSites.join('\n')]);
          request.EnableRss = await this.confirm({ message: promptMsg });
        }
      }

      let installOptions: Optional<PackageInstallOptions>;
      if (flags.wait) {
        installOptions = {
          pollingTimeout: flags.wait,
          pollingFrequency: Duration.seconds(2),
        };
        let remainingTime = flags.wait;
        let timeThen = Date.now();

        // waiting for package install to finish
        Lifecycle.getInstance().on(
          PackageEvents.install.status,
          // eslint-disable-next-line @typescript-eslint/require-await
          async (piRequest: PackageInstallRequest) => {
            const elapsedTime = Duration.milliseconds(Date.now() - timeThen);
            timeThen = Date.now();
            remainingTime = Duration.milliseconds(remainingTime.milliseconds - elapsedTime.milliseconds);
            this.spinner.status = `${remainingTime.minutes} minutes remaining until timeout. Install status: ${piRequest.Status}\n`;
          }
        );
      }

      let pkgInstallRequest: Optional<PackageInstallRequest>;
      try {
        this.spinner.start(`Installing package ${packageToInstall.PackageName}`, '\n', { stdout: true });
        pkgInstallRequest = await subscriberPackageVersion.install(request, installOptions);
        this.spinner.stop();
      } catch (error: unknown) {
        if (error instanceof SfError && error.data) {
          pkgInstallRequest = error.data as PackageInstallRequest;
          this.spinner.stop(messages.getMessage('error.packageInstallPollingTimeout'));
        } else {
          throw error;
        }
      } finally {
        if (pkgInstallRequest) {
          if (pkgInstallRequest.Status === 'SUCCESS') {
            packageToInstall.Status = 'Installed';
            packageInstallRequests.push(pkgInstallRequest);
          } else if (['IN_PROGRESS', 'UNKNOWN'].includes(pkgInstallRequest.Status)) {
            packageToInstall.Status = 'Installing';
            throw messages.createError('error.packageInstallInProgress', [
              this.config.bin,
              pkgInstallRequest.Id,
              targetOrgConnection.getUsername() as string,
            ]);
          } else {
            packageToInstall.Status = 'Failed';
            throw messages.createError('error.packageInstall', [reducePackageInstallRequestErrors(pkgInstallRequest)]);
          }
        }
      }
    }

    return packagesToInstall;
  }
}
