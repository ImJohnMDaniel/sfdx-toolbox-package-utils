import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import { Constants } from '../../../../shared/constants';
import { DevHubDependencies } from '../../../../shared/devHub';
import { SfdxProjects } from '../../../../shared/sfdxproject';
import { Utils } from '../../../../shared/utils';
import { InquirerOption } from '../../../../types/inquirer_option';
import { ProjectDependencyChange } from '../../../../types/project_dependency_change';
import { ProjectPackageDirectoryDependency } from '../../../../types/project_package_directory_dependency';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@dx-cli-toolbox/sfdx-toolbox-package-utils', 'toolbox-package-dependencies-manage');

export default class Manage extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [messages.getMessage('examplesDescription')];

  public static flagsConfig = {
    branch: flags.string({ char: 'b', required: false, description: messages.getMessage('flagBranchDescription') }),
    updatetoreleased: flags.boolean({ default: false, required: false, description: messages.getMessage('flagUpdateToReleasedDescription'), exclusive: ['updatetolatest'] }),
    updatetolatest: flags.boolean({ default: false, required: false, description: messages.getMessage('flagUpdateToLatestDescription'), exclusive: ['updatetoreleased']})
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

    const isInteractiveMode = !this.flags.updatetoreleased && !this.flags.updatetolatest;

    const theSfdxProject = await SfdxProjects.getInstance(this.project, this.ux);

    const theDevHubDependencies = await DevHubDependencies.getInstance(this.hubOrg, this.ux);

    const packageDependencyChangeMap: Map<string, ProjectDependencyChange[]> = new Map<string, ProjectDependencyChange[]>();

    const projectJson = await this.project.retrieveSfdxProjectJson();
    let dependenciesToIgnore = _.get(projectJson['contents'], 'plugins.toolbox.dependencies.ignore', false) as string[];

    const evaluateOptions = async () => {
      let aProjectDependencyChange: ProjectDependencyChange;

      for (const [packageDirectoryPath, dependenciesForPackageDirectoryPath] of theSfdxProject.getProjectDependenciesByPackageDirectoryPath()) {
        
        packageDependencyChangeMap.set( packageDirectoryPath, []);

        await this.asyncForEach(dependenciesForPackageDirectoryPath, async (element: ProjectPackageDirectoryDependency) => {
          this.ux.log('');

          const dependencyDisplayName = theSfdxProject.getDependencyDisplayName(element);
          // if packageVersionId is not part of the devHubPackageVersionInfosBySubscriberPackageVersionMap
          //  then this packageDependency is not owned by this DevHub
          // so only take action if the packageVersionId is found or the package2Id is found
          if (theDevHubDependencies.for(element).onBranch(this.flags.branch).knowsAboutThisDependency()) {
            // What do I want to do with this dependency now?
            this.ux.log(messages.getMessage('messageReviewingOptionsForPackageDependency', [dependencyDisplayName]));

            let theOriginalVersionAlias = theDevHubDependencies.getAlias() ;

            if ( !theOriginalVersionAlias ) {
              theOriginalVersionAlias = theSfdxProject.findAliasForProjectDependency(element);
            }

            const package2Id = theDevHubDependencies.getPackage2IDForCurrentDependency();
            let dependencyPackageDisplayName: string;
            dependencyPackageDisplayName = theSfdxProject.getDependencyPackageDisplayName(package2Id);
            if ( dependencyPackageDisplayName === package2Id) {
              // the package2 alias was not found in the sfdx-project.json file.
              // Use the DevHub to get the package alias instead.
              dependencyPackageDisplayName = Utils.createDependencyPackageDisplayName(package2Id, theDevHubDependencies.findAliasForPackage2Id(package2Id));
            }

            // should this dependency be skipped?
            const isDependencyIgnored = ( dependenciesToIgnore
                                          && (dependenciesToIgnore.includes(theDevHubDependencies.getPackage2IDForCurrentDependency())
                                              || dependenciesToIgnore.includes(theDevHubDependencies.findAliasForPackage2Id(theDevHubDependencies.getPackage2IDForCurrentDependency()))
                                             )
                                        );

            let dependencyPackageChoices = [] as InquirerOption[];

            if ( isDependencyIgnored ) {
              dependencyPackageChoices = theDevHubDependencies.prepareSameDependencyOptionForCurrentDependency();
            } else if (isInteractiveMode) {
              dependencyPackageChoices = theDevHubDependencies.prepareRelatedDependencyOptionsForCurrentDependency();
            } else {
              if ( this.flags.updatetoreleased ) {
                dependencyPackageChoices = theDevHubDependencies.prepareRelatedReleasedDependencyOptionsForCurrentDependency();
              } else if (this.flags.updatetolatest) {
                dependencyPackageChoices = theDevHubDependencies.prepareRelatedNonPinnedDependencyOptionsForCurrentDependency();
              }
            }

            this.ux.log('');
            if (dependencyPackageChoices.length > 0) {

              let newDependencyAlias: string;

              if ( isInteractiveMode && !isDependencyIgnored ) {
                // tslint:disable-next-line: no-any
                const packageVersionSelectionResponses: any = await inquirer.prompt([{
                  name: 'version',
                  message: messages.getMessage('messageWhichVersionOfPackage', [dependencyPackageDisplayName]),
                  type: 'list',
                  choices: dependencyPackageChoices,
                  pageSize: 8
                }]);

                if ( packageVersionSelectionResponses.version
                  && (packageVersionSelectionResponses.version as string).startsWith(Constants.PACKAGE_VERSION_ID_PREFIX) ) {
                  newDependencyAlias = theDevHubDependencies.findAliasForSubscriberPackageVersionId(packageVersionSelectionResponses.version);
                  aProjectDependencyChange = new ProjectDependencyChange()
                      .setOldVersion( theOriginalVersionAlias, element )
                      .setNewVersion( newDependencyAlias
                                  , theDevHubDependencies.findDependencyBySubscriberPackageVersionId(packageVersionSelectionResponses.version));
                } else {
                  const packageNonPinnedDependency: ProjectPackageDirectoryDependency = new ProjectPackageDirectoryDependency();
                  packageNonPinnedDependency.setPackageAndVersionNumber( (packageVersionSelectionResponses.version as string).split('|')[0], (packageVersionSelectionResponses.version as string).split('|')[1]);

                  newDependencyAlias = theDevHubDependencies.findAliasForPackage2Id((packageVersionSelectionResponses.version as string).split('|')[0]) + '@' + (packageVersionSelectionResponses.version as string).split('|')[1];

                  aProjectDependencyChange = new ProjectDependencyChange()
                      .setOldVersion( theOriginalVersionAlias, element )
                      .setNewVersion( theDevHubDependencies.findAliasForPackage2Id((packageVersionSelectionResponses.version as string).split('|')[0])
                                  , undefined
                                  , packageNonPinnedDependency);
                }
              } else {
                // not in interactive mode
                const dependencyPackageChoice = dependencyPackageChoices[0];

                if ( dependencyPackageChoice.value
                  && (dependencyPackageChoice.value as string).startsWith(Constants.PACKAGE_VERSION_ID_PREFIX) ) {

                  newDependencyAlias = theDevHubDependencies.findAliasForSubscriberPackageVersionId(dependencyPackageChoice.value);
                  aProjectDependencyChange = new ProjectDependencyChange()
                        .setOldVersion( theOriginalVersionAlias, element )
                        .setNewVersion( newDependencyAlias
                                    , theDevHubDependencies.findDependencyBySubscriberPackageVersionId(dependencyPackageChoice.value));

                } else {
                  const packageNonPinnedDependency: ProjectPackageDirectoryDependency = new ProjectPackageDirectoryDependency();
                  packageNonPinnedDependency.setPackageAndVersionNumber( (dependencyPackageChoice.value as string).split('|')[0], (dependencyPackageChoice.value as string).split('|')[1]);

                  newDependencyAlias = theDevHubDependencies.findAliasForPackage2Id((dependencyPackageChoice.value as string).split('|')[0]) + '@' + (dependencyPackageChoice.value as string).split('|')[1];

                  aProjectDependencyChange = new ProjectDependencyChange()
                      .setOldVersion( theOriginalVersionAlias, element )
                      .setNewVersion( theDevHubDependencies.findAliasForPackage2Id((dependencyPackageChoice.value as string).split('|')[0])
                                  , undefined
                                  , packageNonPinnedDependency);

                }
              }

              this.ux.log('');

              if ( isDependencyIgnored ) {
                this.ux.log(`${dependencyPackageDisplayName} version is ignored`);
              } else {
                this.ux.log(`${dependencyPackageDisplayName} version selected: ${newDependencyAlias}`);
              }

              packageDependencyChangeMap.get(packageDirectoryPath).push(aProjectDependencyChange);
            } else {
              this.ux.log('No alternate choices found for ' + dependencyDisplayName);
            }
          } else {
            // state that this dependency is not managed by the DevHub and will be by-passed.
            this.ux.log(messages.getMessage('messagePackageDependencyNotManagedByDevHub', [dependencyDisplayName]));

            aProjectDependencyChange = new ProjectDependencyChange()
                                                .setOldVersion( theSfdxProject.findAliasForProjectDependency(element), element )
                                                .setNewVersionToOldVersion();
            packageDependencyChangeMap.get(packageDirectoryPath).push(aProjectDependencyChange);

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
          this.ux.log('****************************************************************************************');
          this.ux.log('');
        });
      }
    };

    await evaluateOptions();

    const updatePackageDependencyList = async () => {
      packageDependencyChangeMap.forEach( async (packageDependencyChanges: ProjectDependencyChange[], packageDirectoryPath: string) => {
        await this.asyncForEach(packageDependencyChanges, async (element: ProjectDependencyChange) => {
          // console.log(element);
          await theSfdxProject.changeToPackageVersion( element, packageDirectoryPath, theDevHubDependencies );
        });
      });
    };

    await updatePackageDependencyList();

    return this.convertPackageDependencyChangeMapToJson(packageDependencyChangeMap);
  }

  // TODO: Can this function be replaced by core.SfdxProjectJson.awaitEach() method?
  private async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  private convertPackageDependencyChangeMapToJson(packageDependencyChangeMap: Map<string, ProjectDependencyChange[]>): string {
    let jsonRepresentation = {} as string;

    packageDependencyChangeMap.forEach((values, key) => {
      // let valueAsProjectDependencyChange: ProjectDependencyChange;
      // valueAsProjectDependencyChange = value;
      jsonRepresentation[key] = [];

      values.forEach( (projDepChng: ProjectDependencyChange) => {
        jsonRepresentation[key].push( projDepChng.toJson() );
      });
    });

    return jsonRepresentation;
  }

}
