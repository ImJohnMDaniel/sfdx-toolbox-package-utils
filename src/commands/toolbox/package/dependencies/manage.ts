/* eslint-disable complexity */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unsafe-finally */
import {
  SfCommand,
  Flags,
  requiredHubFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import {
  // AuthInfo,
  // Connection,
  Messages,
  // SfProject,
  // Lifecycle,
  // SfError,
  // SfProject
} from '@salesforce/core';
// import {
//     InstalledPackages,
//     PackageEvents,
//     PackageInstallCreateRequest,
//     PackageInstallOptions,
//     SubscriberPackageVersion,
//     PackagingSObjects,
//   } from '@salesforce/packaging';
import { PackageDirDependency } from '@salesforce/schemas';
import { basePackageDependencyRelatedFlags } from '../../../../shared/flags.js';
import { ProjectDependencyChange } from '../../../../shared/project_dependency_change.js';
import { SfdxProjectUtils } from '../../../../shared/sfdx_project_utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages(
  '@dx-cli-toolbox/sfdx-toolbox-package-utils',
  'toolbox.package.dependencies.manage'
);

export type ToolboxPackageDependenciesManageResult = {
  PackageName: string;
  SubscriberPackageVersionId: string;
};

export default class ToolboxPackageDependenciesManage extends SfCommand<ToolboxPackageDependenciesManageResult[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;

  public static readonly flags = {
    ...SfCommand.baseFlags,
    'target-dev-hub': requiredHubFlagWithDeprecations,
    ...basePackageDependencyRelatedFlags,
    'update-to-released': Flags.boolean({
      summary: messages.getMessage('flags.update-to-released.summary'),
      description: messages.getMessage('flags.update-to-released.description'),
      default: false,
      exclusive: ['update-to-latest'],
      aliases: ['updatetoreleased'],
    }),
    'update-to-latest': Flags.boolean({
      summary: messages.getMessage('flags.update-to-latest.summary'),
      description: messages.getMessage('flags.update-to-latest.description'),
      default: false,
      exclusive: ['update-to-released'],
      aliases: ['updatetolatest'],
    }),
    'api-version': orgApiVersionFlagWithDeprecations,
  };

  public async run(): Promise<ToolboxPackageDependenciesManageResult[]> {
    const { flags } = await this.parse(ToolboxPackageDependenciesManage);

    // const basePath: string = await SfProject.resolveProjectPath();

    await flags['target-dev-hub'].refreshAuth();
    const targetDevHubConnection = flags['target-dev-hub']?.getConnection(flags['api-version']);

    // establish reference to DevHubDependencies instance (theDevHubDependencies)
    // DevHubDependencies offers the following
    // This is probably not needed since the connection will use the requiredHubFlagWithDeprecations

    // initialize packageDependencyChangeMap
    // Should this be the manageResults output object??
    const packageDependencyChangeMap: Map<string, ProjectDependencyChange[]> = new Map<
      string,
      ProjectDependencyChange[]
    >();

    // const project = await SfProject.resolve();
    // const projectJson = await project.resolveProjectConfig();
    // const namespace = projectJson.get('namespace');

    const theSfdxProject = await SfdxProjectUtils.getInstance();

    // get the package branch names that are to be considered as "released versions"
    // Q: Why does this even matter?  If "released versions" is simply where package version is promoted, what the branch attribute is on the DevHub package version listing should not be relevant.
    // TODO: Commenting out this command for now as I really am starting to believe that there is no need for it.
    // const branchNamesThatContainReleasedVersions = await projUtils.getBranchNamesThatContainReleasedVersions();

    // get the project dependencies to ignore from the sfdx-project.json
    const dependenciesToIgnore = await theSfdxProject.getProjectDependenciesToIgnore();

    // Setup the evaluateOptions function
    // const evaluateOptions = async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const evaluateOptions = async () => {
      // let aProjectDependencyChange: ProjectDependencyChange;
      // ref evaluateOptions-A
      // for (const [packageDirectoryPath, dependenciesForPackageDirectoryPath] of theSfdxProject.getProjectDependenciesByPackageDirectoryPath()) {
      for (const npd of theSfdxProject.getPackageDirectoriesWithDependencies()) {
        // eslint-disable-next-line no-console
        // console.log(npd);
        packageDependencyChangeMap.set(npd.path, []);

        // eslint-disable-next-line no-console
        console.log('blue here');

        const dependenciesAsPackageDirDependency = npd.dependencies ?? [];
        // }
        // eslint-disable-next-line @typescript-eslint/require-await
        await this.asyncForEach(dependenciesAsPackageDirDependency, async (element: PackageDirDependency) => {
          // eslint-disable-next-line no-console
          console.log(element);
          // ref evaluateOptions-B
          // get the display name for the element
          const dependencyDisplayName = theSfdxProject.getDependencyDisplayName(element);

          // eslint-disable-next-line no-console
          console.log('dependencyDisplayName == ' + dependencyDisplayName);

          // ref evaluateOptions-B2
        });
        // eslint-disable-next-line no-console
        console.log('blue stops here\n\n');
      }
    };
    // ref evaluateOptions-C
    await evaluateOptions();
    // evaluateOptions();

    // ******************************************************************************************
    // WORKING DEBUG OUTPUT
    // eslint-disable-next-line no-console
    console.log('\n\n*************************** WORKING DEBUG OUTPUT ***************************\n\n');
    // eslint-disable-next-line no-console
    console.log(packageDependencyChangeMap);
    // eslint-disable-next-line no-console
    console.log(dependenciesToIgnore);
    // eslint-disable-next-line no-console, no-underscore-dangle
    console.log(targetDevHubConnection.apex._conn.instanceUrl || undefined);
    // ************************* ITEMS VERIFIED *************************************************
    // // eslint-disable-next-line no-console
    // console.log(branchNamesThatContainReleasedVersions);
    // ******************************************************************************************

    const manageResults: ToolboxPackageDependenciesManageResult[] = [];

    manageResults.push({
      PackageName: 'Blue',
      SubscriberPackageVersionId: '04t',
    });

    return manageResults;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, class-methods-use-this, @typescript-eslint/no-explicit-any
  private async asyncForEach(array: unknown[], callback: any) {
    for (let index = 0; index < array.length; index++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await callback(array[index], index, array);
    }
  }
}
