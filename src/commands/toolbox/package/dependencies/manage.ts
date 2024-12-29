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
// import { PackageDirDependency } from '@salesforce/schemas';
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

    const projUtils = await SfdxProjectUtils.getInstance();

    // get the package branch names that are to be considered as "released versions"
    // TODO: Q: Why does this even matter?  If "released versions" is simply where package version is promoted, what the branch attribute is on the DevHub package version listing should not be relevant.
    const branchNamesThatContainReleasedVersions = await projUtils.getBranchNamesThatContainReleasedVersions();

    // get the project dependencies to ignore from the sfdx-project.json
    const dependenciesToIgnore = await projUtils.getProjectDependenciesToIgnore();

    // ******************************************************************************************
    // WORKING DEBUG OUTPUT
    // eslint-disable-next-line no-console
    console.log(targetDevHubConnection.apex || undefined);
    // eslint-disable-next-line no-console
    console.log(packageDependencyChangeMap);
    // eslint-disable-next-line no-console
    console.log(branchNamesThatContainReleasedVersions);
    // eslint-disable-next-line no-console
    console.log(dependenciesToIgnore);
    // ******************************************************************************************

    // setup the inline method "evaluateOptions()"

    const manageResults: ToolboxPackageDependenciesManageResult[] = [];

    manageResults.push({
      PackageName: 'Blue',
      SubscriberPackageVersionId: '04t',
    });

    return manageResults;
  }
}
