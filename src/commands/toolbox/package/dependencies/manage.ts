import { core, flags, SfdxCommand } from '@salesforce/command';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import { Constants } from '../../../../shared/constants';
import { DevHubDependencies } from '../../../../shared/devHub';
import { SfdxProjects } from '../../../../shared/sfdxproject';
import { ProjectDependencyChange } from '../../../../types/project_dependency_change';
import { ProjectPackageDirectoryDependency } from '../../../../types/project_package_directory_dependency';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('@dx-cli-toolbox/sfdx-toolbox-package-utils', 'toolbox-package-dependencies-manage');

export default class Manage extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [messages.getMessage('examplesDescription')];

  protected static flagsConfig = {
    branch: flags.string({ char: 'b', required: false, description: messages.getMessage('flagBranchDescription') }),
    updatetoreleased: flags.boolean({ default: false, required: false, description: messages.getMessage('flagUpdateToReleasedDescription') }),
    updatetononpinned: flags.boolean({ default: false, required: false, description: messages.getMessage('flagUpdateToNonPinnedDescription') })
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Comment this out if your command does not require a hub org username
  protected static requiresDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any

    // this.ux.startSpinner(messages.getMessage('commandSpinner')); // Spinners don't help in interactive mode
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    // const conn = this.org.getConnection();

    const theSfdxProject = await SfdxProjects.getInstance(this.project);

    const theDevHubDependencies = await DevHubDependencies.getInstance(this.hubOrg, this.ux);

    // const packageDependencyChangeSet = [];
    const packageDependencyChangeMap: Map<string, ProjectDependencyChange[]> = new Map<string, ProjectDependencyChange[]>();

    // Step 1D: for each dependency, prep choices
    // theSfdxProject.getProjectDependencies().forEach(async (element: ProjectPackageDirectoryDependency) => {
    const evaluateOptions = async () => {
      // console.log('Hello');
      // console.log(theSfdxProject.getProjectDependenciesByPackageDirectoryPath().keys());
      // // await this.asyncForEach( theSfdxProject.getProjectDependenciesByPackageDirectoryPath().keys(), (packageDirectoryPath: string) => {
      //   console.log(packageDirectoryPath);
      // });

      // for (const [key, value] of theSfdxProject.getProjectDependenciesByPackageDirectoryPath()) {
      //   console.log(key, value);
      // }

      let aProjectDependencyChange: ProjectDependencyChange;

      // await this.asyncForEach( theSfdxProject.getProjectDependenciesByPackageDirectoryPath().keys(), async (packageDirectoryPath: string) => {
      for (const [packageDirectoryPath, dependenciesForPackageDirectoryPath] of theSfdxProject.getProjectDependenciesByPackageDirectoryPath()) {
        // console.log('Hello Again.... ' + packageDirectoryPath);
        packageDependencyChangeMap.set( packageDirectoryPath, []);

        // const dependenciesForPackageDirectoryPath = theSfdxProject.getProjectDependenciesByPackageDirectoryPath().get(packageDirectoryPath);

        // console.log(packageDirectoryPath);
        await this.asyncForEach(dependenciesForPackageDirectoryPath, async (element: ProjectPackageDirectoryDependency) => {
          this.ux.log('');
          // console.log(packageDirectoryPath);
          // console.log(element);
          const dependencyDisplayName = theSfdxProject.getDependencyDisplayName(element);
          // if packageVersionId is not part of the devHubPackageVersionInfosBySubscriberPackageVersionMap
          //  then this packageDependency is not owned by this DevHub
          // so only take action if the packageVersionId is found or the package2Id is found
          if (theDevHubDependencies.for(element).onBranch(this.flags.branch).knowsAboutThisDependency()) {
            // What do I want to do with this dependency now?
            // console.log('DevHub knows about dependency');
            // console.log('theSfdxProject.findAlias(element.getSubscriberPackageVersionId()) == ' + theSfdxProject.findAlias(element.getSubscriberPackageVersionId()));
            this.ux.log(messages.getMessage('messageReviewingOptionsForPackageDependency', [dependencyDisplayName]));
            // console.log('mark 1');
            const dependencyPackageDisplayName = theSfdxProject.getDependencyPackageDisplayName(theDevHubDependencies.getPackage2IDForCurrentDependency());
            // console.log('mark 2');
            const dependencyPackageChoices = theDevHubDependencies.prepareRelatedDependencyOptionsForCurrentDependency();
            // console.log('mark 3');
            this.ux.log('');
            if (dependencyPackageChoices.length > 0) {
              // tslint:disable-next-line: no-any
              const packageVersionSelectionResponses: any = await inquirer.prompt([{
                name: 'version',
                message: messages.getMessage('messageWhichVersionOfPackage', [dependencyPackageDisplayName]),
                type: 'list',
                choices: dependencyPackageChoices,
                pageSize: 8
              }]);
              // console.log(packageVersionSelectionResponses);
              this.ux.log('');
              this.ux.log(`${dependencyPackageDisplayName} version selected: ${packageVersionSelectionResponses.version}`);

              let theOriginalVersionAlias = theDevHubDependencies.getAlias() ;

              if ( !theOriginalVersionAlias ) {
                theOriginalVersionAlias = theSfdxProject.findAliasForProjectDependency(element);
              }

              // TODO: Need to change the transport object here. Instead of a custom mapping, it should be a custom mapping object with the following setup:
              //    * the original {element:ProjectPackageDirectoryDependency}
              //    * the new version {newVersion:ProjectPackageDirectoryDependency}
              //    * the original version alias
              //    * new version alias
              //    The custom mapping object will have two key value pairs and the structure will be
              //    *   originalVersion => custom object contains alias and ProjectPackageDirectoryDependency
              //    *   newVersion => custom object contains alias and ProjectPackageDirectoryDependency
              //  Need to setup a ProjectPackageDirectoryDependency from the element
              //    The selection tool will find the originalVersion and replace it with newVersion

              // console.log('***************************************************************************************************');
              // console.log('element - theOriginalVersionDependency');
              // console.log(element);
              // console.log('***************************************************************************************************');
              // console.log('theOriginalVersionAlias');
              // console.log(theOriginalVersionAlias);
              // console.log('***************************************************************************************************');
              // console.log('packageVersionSelectionResponses.version');
              // console.log(packageVersionSelectionResponses.version);
              // console.log('***************************************************************************************************');
              // console.log('findDependencyBySubscriberPackageVersionId');
              // console.log(theDevHubDependencies.findDependencyBySubscriberPackageVersionId(packageVersionSelectionResponses.version));
              // console.log('***************************************************************************************************');
              // console.log('findAliasForSubscriberPackageVersionId');
              // console.log(theDevHubDependencies.findAliasForSubscriberPackageVersionId(packageVersionSelectionResponses.version));
              // console.log('***************************************************************************************************');

              if ( packageVersionSelectionResponses.version
                  && (packageVersionSelectionResponses.version as string).startsWith(Constants.PACKAGE_VERSION_ID_PREFIX) ) {
                // console.log('pinned route');
                aProjectDependencyChange = new ProjectDependencyChange()
                    .setOldVersion( theOriginalVersionAlias, element )
                    .setNewVersion( theDevHubDependencies.findAliasForSubscriberPackageVersionId(packageVersionSelectionResponses.version)
                                  , theDevHubDependencies.findDependencyBySubscriberPackageVersionId(packageVersionSelectionResponses.version));
              } else {
                // console.log('non-pinned route');
                const packageNonPinnedDependency: ProjectPackageDirectoryDependency = new ProjectPackageDirectoryDependency();
                packageNonPinnedDependency.setPackageAndVersionNumber( (packageVersionSelectionResponses.version as string).split('|')[0], (packageVersionSelectionResponses.version as string).split('|')[1]);
                aProjectDependencyChange = new ProjectDependencyChange()
                    .setOldVersion( theOriginalVersionAlias, element )
                    .setNewVersion( theDevHubDependencies.findAliasForPackage2Id((packageVersionSelectionResponses.version as string).split('|')[0])
                                  , undefined
                                  , packageNonPinnedDependency);
              }
              // console.log('aProjectDependencyChange');
              // console.log(aProjectDependencyChange);
              // console.log('***************************************************************************************************');

              packageDependencyChangeMap.get(packageDirectoryPath).push(aProjectDependencyChange);
            } else {
              this.ux.log('No alternate choices found for ' + dependencyDisplayName);
            }
          } else {
            // state that this dependency is not managed by the DevHub and will be by-passed.
            this.ux.log(messages.getMessage('messagePackageDependencyNotManagedByDevHub', [dependencyDisplayName]));
          }
          // if (devHubPackageVersionInfosBySubscriberPackageVersionMap.has(element.packageVersionId)) {
          // console.log('taking action');
          // The objective at this point is to organize appropriate options for this particular dependency
          // Terms "currentPackageVersionBlock" == "Major.Minor.Patch" but not the "Build"
          // Questions to be asked
          // What is the currentPackageVersionBlock for this packagesDependency?
          // const currentPackageVersion = devHubPackageVersionInfosBySubscriberPackageVersionMap.get(element.packageVersionId);
          // const currentPackageVersionBlock = devHubPackageVersionsByPackageAndBranchMap.get(currentPackageVersion.)
          // Is there a released version that is available on the main branch?
          // Is there a newer version that is available on this currentPackageVersionBlock?
          // Is there a newer Major.Minor version availble?
          // Is there a newer Major version available?
          // There is a distinction between "next available version" and "next avaialble released version"
          // There is a distinction between "the base/null branch" verses the "feature branch" that is coming from Branch flag
          // }
          this.ux.log('');
          this.ux.log('');
        });
      }

      // theSfdxProject.getProjectDependenciesByPackageDirectoryPath().forEach( async (dependenciesForPackageDirectoryPath: ProjectPackageDirectoryDependency[], packageDirectoryPath: string) => {

      // }); // end of evaluateOptions
    };

    // END OF Step 1D /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // await cli.prompt('What is your name?');

    // // mask input after enter is pressed
    // await cli.prompt('What is your two-factor token?', { type: 'mask' });

    // // mask input on keypress (before enter is pressed)
    // await cli.prompt('What is your password?', { type: 'hide' });

    // let stage = this.flags.stage;
    // if (!stage) {
    //   // tslint:disable-next-line: no-any
    //   const responses: any = await inquirer.prompt([{
    //     name: 'stage',
    //     message: 'select a stage',
    //     type: 'list',
    //     choices: [{ name: 'development' }, { name: 'staging' }, { name: 'production' }],
    //     pageSize: 3
    //   }]);
    //   stage = responses.stage;
    //   this.log(`the stage is: ${stage}`);
    // }

    // // tslint:disable-next-line: no-any
    // let packageVersionSelectionResponses: any = await inquirer.prompt([{
    //   name: 'version',
    //   message: 'which released version of apex-mocks should be used',
    //   type: 'list',
    //   choices: [{ name: '1.0.0.0' }, { name: '1.1.0.5' }, { name: '1.2.0.7' }, { name: '1.3.0.1' }, { name: '1.4.1.2' }, { name: '1.5.0.3' }, { name: '1.6.0.1' }],
    //   pageSize: 3
    // }]);

    // this.log(`apex-mocks version selected: ${packageVersionSelectionResponses.version}`);

    // // yes/no confirmation
    // await cli.confirm('Continue?');

    // "press any key to continue"
    // await cli.anykey();

    // this.ux.stopSpinner();

    // this.ux.log( messages.getMessage('commandSuccess', [this.org.getOrgId()]) );

    await evaluateOptions();

    // console.log('************************************************************************************************');
    // console.log('packageDependencyChangeMap');
    // console.log('************************************************************************************************');
    const updatePackageDependencyList = async () => {
      packageDependencyChangeMap.forEach( async (packageDependencyChanges: ProjectDependencyChange[], packageDirectoryPath: string) => {
        await this.asyncForEach(packageDependencyChanges, async (element: ProjectDependencyChange) => {
          await theSfdxProject.changeToPackageVersion( element, packageDirectoryPath );
        });
      });
    };

    await updatePackageDependencyList();

    return;
  }

  // TODO: Can this function be replaced by core.SfdxProjectJson.awaitEach() method?
  private async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

}