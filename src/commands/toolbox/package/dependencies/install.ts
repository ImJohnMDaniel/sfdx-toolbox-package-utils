import { core, flags, SfdxCommand } from '@salesforce/command';
import { JsonArray, JsonMap } from '@salesforce/ts-types';
import * as _ from 'lodash';
import { PackageInstallCommand } from 'salesforce-alm/dist/commands/force/package/install';
import { Constants } from '../../../../shared/constants';
import devHubService = require('../../../../shared/devhubService');
import forcePackageCommand = require('../../../../shared/forceCommands/force_package');
import { PackageInstallRequest } from '../../../../types/package_install_request_result';
import { SObjectBasedAPICallResult } from '../../../../types/sobject';

const defaultWait = 10;

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('@dx-cli-toolbox/sfdx-toolbox-package-utils', 'toolbox-package-dependencies-install');

export default class Install extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [messages.getMessage('examplesDescription')];

  protected static flagsConfig = {
    apexcompile: flags.enum({ char: 'a', default: 'all', required: false, description: messages.getMessage('flagApexCompileDescription'), options: ['all', 'package'] }),
    branch: flags.string({ char: 'b', required: false, description: messages.getMessage('flagBranchDescription') }),
    dryrun: flags.boolean({ required: false, description: messages.getMessage('flagDryrunDescription') }),
    installationkeys: flags.string({ char: 'k', required: false, description: messages.getMessage('flagInstallationKeysDescription') }),
    noprecheck: flags.boolean({ required: false, default: false, description: messages.getMessage('flagNoPrecheckDescription') }),
    prompt: flags.boolean({ char: 'p', default: false, required: false, description: messages.getMessage('flagPromptDescription') }),
    securitytype: flags.enum({ char: 's', default: 'AdminsOnly', required: false, description: messages.getMessage('flagSecuritytypeDescription'), options: ['AllUsers', 'AdminsOnly']}),
    wait: flags.number({ char: 'w', required: false, description: messages.getMessage('flagWaitDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not require a hub org username
  protected static requiresDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  private processMessage( debugMessage: any): void {
    if ( debugMessage !== undefined ) {
      this.debug( 'DEBUG ' + debugMessage);
    }    
  }
  private processMessages( debugMessages: any[]): void {
    if ( debugMessages !== undefined ) {
      for( let aMessage of debugMessages ){
        this.processMessage(aMessage);
      }
    }
  }

  public async run(): Promise<any> { // tslint:disable-line:no-any

    const packagesInstalled = {};
    const packagesNotInstalled = {};

    this.processMessage('install.run method -- before call to forcePackageCommand.retrievePackagesCurrentlyInstalled');
    const debugMessages = [];
    const packageVersionsAlreadyInstalled = this.flags.noprecheck ? undefined : await forcePackageCommand.retrievePackagesCurrentlyInstalled(this.org, this.ux, debugMessages);
    this.processMessages(debugMessages);
    this.processMessage('install.run method -- after call to forcePackageCommand.retrievePackagesCurrentlyInstalled');

    // Getting Project config
    this.ux.startSpinner('Processing sfdx-project.json file');
    this.processMessage('before call to this.project.retrieveSfdxProjectJson()');
    const projectJson = await this.project.retrieveSfdxProjectJson();
    this.processMessage('after call to this.project.retrieveSfdxProjectJson()');

    // Getting a list of alias
    const packageAliases = _.get(projectJson['contents'], 'packageAliases');
    const aliasKeys = packageAliases == null ? [] : Object.keys(packageAliases);

    const packagesToInstall = [];

    const packageDirectories = _.get(projectJson['contents'], 'packageDirectories');
    this.ux.stopSpinner();

    this.ux.startSpinner('Analyzing dependencies to determine what needs to be installed.');
    for (let packageDirectory of packageDirectories) {
      packageDirectory = packageDirectory as JsonMap;

      const dependencies = (packageDirectory.dependencies || []) as JsonArray;

      if (dependencies && dependencies[0] !== undefined) {
        this.ux.log('\n' + messages.getMessage('messagePackageDependenciesFound', [packageDirectory.path.toString()]));

        for (const dependency of dependencies) {
          const packageInfo = {} as JsonMap;

          const { package: dependentPackage, versionNumber } = dependency as JsonMap;
          this.ux.log('');
          this.ux.log( 'dependentPackage == ' + JSON.stringify(dependentPackage) );
          packageInfo.dependentPackage = dependentPackage;
          packageInfo.versionNumber = versionNumber;

          //  if versionNumber is undefined and dependentPackage is a packageAlias, then the alias should return the package version 04t id
          //  if that is the case, then there is no need to get the devHubServier to resolve the package version id
          // is the dependentPackage an alias?
          const matched = aliasKeys.find(item => item === dependentPackage);
          if (matched) {
            // the dependentPackage value is a packageAlias
            if (packageAliases[matched].startsWith(Constants.PACKAGE_VERSION_ID_PREFIX)) {
              // the dependentPackage is a packageAlias
              packageInfo.packageVersionId = packageAliases[matched];
            } else if (packageAliases[matched].startsWith(Constants.PACKAGE_ID_PREFIX)) {
              this.ux.log(`    looking for ${dependentPackage} in DevHub`);
              packageInfo.packageVersionId = await devHubService.resolvePackageVersionId(packageAliases[matched], JSON.stringify(versionNumber), this.flags.branch, this.hubOrg);
            }
          } else {
            // the dependentPackage value is an id
            // find the packageVersionId from the DevHub
            if (JSON.stringify(dependentPackage).startsWith(Constants.PACKAGE_VERSION_ID_PREFIX)) {
              packageInfo.packageVersionId = JSON.stringify(dependentPackage);
            } else if (JSON.stringify(dependentPackage).startsWith(Constants.PACKAGE_VERSION_ID_PREFIX)) {
              this.ux.log(`    looking for ${dependentPackage} in DevHub`);
              packageInfo.packageVersionId = await devHubService.resolvePackageVersionId(JSON.stringify(dependentPackage), JSON.stringify(versionNumber), this.flags.branch, this.hubOrg);
            }
          }
          packagesToInstall.push(packageInfo);

          this.ux.log(`    ${packageInfo.packageVersionId} : ${packageInfo.dependentPackage}${packageInfo.versionNumber === undefined ? '' : ' ' + packageInfo.versionNumber}`);
        }
      } else {
        this.ux.log('\n' + messages.getMessage('messageNoDependenciesFound', [packageDirectory.path.toString()]));
      }
    }
    this.ux.stopSpinner();

    this.ux.log('\n');

    if (packagesToInstall.length > 0) { // Installing Packages
      this.ux.startSpinner('Installing packages....');
      // Getting Installation Key(s)
      let installationKeys = this.flags.installationkeys;
      if (installationKeys) {
        installationKeys = installationKeys.trim();
        installationKeys = installationKeys.split(' ');

        // Format is 1: 2: 3: ... need to remove these
        for (let keyIndex = 0; keyIndex < installationKeys.length; keyIndex++) {

          const key = installationKeys[keyIndex].trim();
          if (key.startsWith(`${keyIndex + 1}:`)) {
            installationKeys[keyIndex] = key.substring(2);
          } else {
            // Format is not correct, throw an error
            throw new core.SfdxError(messages.getMessage('errorInstallationKeyFormat'));
          }
        }
      }

      this.ux.log('Beginning installs of packages...');

      let i = 0;
      for (let packageInfo of packagesToInstall) {
        packageInfo = packageInfo as JsonMap;

        // Check to see if this package version has already been installed in the org.
        const matchedAlreadyInstalled = packageVersionsAlreadyInstalled === undefined ? false : packageVersionsAlreadyInstalled.find(item => item.SubscriberPackageVersionId === packageInfo.packageVersionId);

        if (matchedAlreadyInstalled) {
          let alreadyInstalledMessage = 'Package {0}{1} is already present in the org and will be ignored.';
          if (packageInfo.versionNumber !== undefined) {
            alreadyInstalledMessage = alreadyInstalledMessage.replace('{1}', ' v' + packageInfo.versionNumber);
          } else {
            alreadyInstalledMessage = alreadyInstalledMessage.replace('{1}', '');
          }
          this.ux.log(alreadyInstalledMessage.replace('{0}', packageInfo.dependentPackage));
          packagesNotInstalled[packageInfo.packageVersionId] = packageInfo;
          continue;
        }

        // Check to see if  this package version been installed as part of this installation event?  probably from one of the package directories in the sfdx-project.json
        const matchedJustInstalled = Object.keys(packagesInstalled).find(item => item === packageInfo.packageVersionId);
        if (matchedJustInstalled) {
          // This was just installed
          this.ux.log(`bypassing additional request to install ${packageInfo.packageVersionId}`);
          continue;
        }

        // Split arguments to be used by the OCLIF command -- PackageInstallCommand
        const args = [];

        // USERNAME
        args.push('--targetusername');
        args.push(`${this.org.getUsername()}`);

        // PACKAGE ID
        args.push('--package');
        args.push(`${packageInfo.packageVersionId}`);

        // INSTALLATION KEY
        if (installationKeys && installationKeys[i]) {
          args.push('--installationkey');
          args.push(`${installationKeys[i]}`);
        }

        // WAIT
        const wait = this.flags.wait ? this.flags.wait : defaultWait;
        args.push('--wait');
        args.push(`${wait}`);
        args.push('--publishwait');
        args.push(`${wait}`);

        // SECURITYTYPE
        if (this.flags.securitytype) {
          args.push('--securitytype');
          args.push(`${this.flags.securitytype}`);
        }

        // PROMPT
        if (!this.flags.prompt) {
          // add the "--noprompt" flag by default as long as this command's "prompt" flag is false.
          args.push('--noprompt');
        }

        // APEXCOMPILE
        if (this.flags.apexcompile) {
          args.push('--apexcompile');
          args.push(`${this.flags.apexcompile}`);
        }

        // JSON
        if (this.flags.json) {
          args.push('--json');
        }

        // INSTALL PACKAGE
        // TODO: How to add a debug flag or write to sfdx.log with --loglevel ?
        this.ux.log(`\nInstalling package ${packageInfo.packageVersionId} : ${packageInfo.dependentPackage}${packageInfo.versionNumber === undefined ? '' : ' ' + packageInfo.versionNumber}`);

        if (!this.flags.dryrun) {

          let installationResultJson;

          if (this.flags.json) {
            // let capturedText = {} as AnyJson;
            const intercept = require('intercept-stdout');

            // setup the intercept function to silence the output of PackageInstallCommand call
            // tslint:disable-next-line: only-arrow-functions
            const unhookIntercept = intercept(function(text) {
              // In a "--json" scenario, the output does not need to be captured.  It just needs to be silenced.
              // capturedText = text;
              return '';
            });

            installationResultJson = await PackageInstallCommand.run(args);

            // reactivate the output to console.
            unhookIntercept();

            if (installationResultJson === undefined || installationResultJson.Status !== 'SUCCESS') {
              throw Error('Problems installing the package ' + packageInfo.packageVersionId);
            }

            if (installationResultJson !== undefined && this.flags.json) {
              packageInfo.installationResult = installationResultJson;
            }
          } else {
            // non JSON route
            installationResultJson = await PackageInstallCommand.run(args) as SObjectBasedAPICallResult<PackageInstallRequest>;

            if (installationResultJson === undefined || installationResultJson.Status !== 'SUCCESS') {
              throw Error('Problems installing the package ' + packageInfo.packageVersionId);
            }
            this.ux.log('\n');
          }

          packagesInstalled[packageInfo.packageVersionId] = packageInfo;
        }
        i++;
      } // end of For Loop
      this.ux.stopSpinner();
    } // end of If condition to check if packagesToInstall.length > 0

    return { packagesInstalled, packagesNotInstalled };
  }
}
