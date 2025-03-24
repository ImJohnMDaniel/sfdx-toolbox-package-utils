// import * as _ from 'lodash';
// import {
//     // AuthInfo,
//     // Connection,
//     // Messages,
//     SfProject,
//     // Lifecycle,
//     // SfError,
//     // SfProject
//   } from '@salesforce/core';
// import { JsonMap } from '@salesforce/ts-types';
// import { AnyJson } from '@salesforce/ts-types';

import {
  SfProject,
  // , NamedPackageDir
} from '@salesforce/core';
import { NamedPackagingDir } from '@salesforce/core/project';
import { PackageDirDependency } from '@salesforce/schemas';
import { ProjectPackageDirectoryDependency } from './project_package_directory_dependency.js';

export type ToolboxPackageUtilsPluginConfig = {
  package: {
    brancheswithreleasedversions: string[];
    dependencies: {
      ignore: string[];
    };
  };
};

export class SfdxProjectUtils {
  private sfProject: SfProject;

  private constructor(sfProject: SfProject) {
    this.sfProject = sfProject;
  }

  public static async getInstance(): Promise<SfdxProjectUtils> {
    return new SfdxProjectUtils(await SfProject.resolve());
  }

  public async getBranchNamesThatContainReleasedVersions(): Promise<string[]> {
    const toolboxPluginConfig = await this.getToolboxPluginConfig();
    // eslint-disable-next-line no-console
    // console.log(toolboxPluginConfig);

    const theresult = toolboxPluginConfig ? toolboxPluginConfig.package?.brancheswithreleasedversions : [];

    return theresult || [];
  }

  public async getProjectDependenciesToIgnore(): Promise<string[]> {
    const toolboxPluginConfig = await this.getToolboxPluginConfig();
    // eslint-disable-next-line no-console
    // console.log(toolboxPluginConfig);

    const theresult = toolboxPluginConfig ? toolboxPluginConfig.package?.dependencies?.ignore : [];

    return theresult || [];
  }

  // public getProjectDependenciesByPackageDirectoryPath(): NamedPackageDir[] {
  public getPackageDirectoriesWithDependencies(): NamedPackagingDir[] {
    const packageDirectoriesAsUnknown = this.sfProject.getPackageDirectories() as unknown;

    // return this.sfProject.getPackageDirectories();
    return packageDirectoriesAsUnknown as NamedPackagingDir[];
  }

  public findAlias(idValue: string): string | undefined {
    const packageAliases = this.sfProject.getPackageAliases();
    if (packageAliases) {
      const aliasValues = [...Object.entries(packageAliases)].filter(({ 1: v }) => v === idValue).map(([k]) => k);
      return aliasValues?.[0] ? aliasValues[0] : undefined;
    }
    return undefined;
  }

  public findAliasForProjectDependency(projectDependency: ProjectPackageDirectoryDependency): string | undefined {
    let dependencyAlias;
    if (projectDependency.getSubscriberPackageVersionId()) {
      // dependencyAlias = this.findAlias(projectDependency.getSubscriberPackageVersionId());
      dependencyAlias = this.sfProject.getAliasesFromPackageId(projectDependency.getSubscriberPackageVersionId());
    } else if (projectDependency.getPackage2Id() && projectDependency.getVersionNumber()) {
      // dependencyAlias = this.findAlias(projectDependency.getPackage2Id());
      dependencyAlias = this.sfProject.getAliasesFromPackageId(projectDependency.getPackage2Id());
    }
    return dependencyAlias?.[0];
  }

  public getDependencyDisplayName(projectDependency: PackageDirDependency): string {
    // the PackageDirDependency has three parts
    // package
    // versionNumber
    // branch
    // if the

    const projectPackageDirDependency = new ProjectPackageDirectoryDependency(projectDependency);

    const dependencyAlias = this.findAliasForProjectDependency(projectPackageDirDependency);

    let dependencyDisplayName;

    if (projectPackageDirDependency.getSubscriberPackageVersionId()) {
      dependencyDisplayName = dependencyAlias
        ? dependencyAlias + ' (' + projectPackageDirDependency.getSubscriberPackageVersionId() + ')'
        : projectPackageDirDependency.getSubscriberPackageVersionId();
    } else if (projectPackageDirDependency.getPackage2Id() && projectPackageDirDependency.getVersionNumber()) {
      dependencyDisplayName = dependencyAlias
        ? dependencyAlias + ' (' + projectPackageDirDependency.getPackage2Id() + ')'
        : projectPackageDirDependency.getPackage2Id();
      dependencyDisplayName += ' version ' + projectPackageDirDependency.getVersionNumber();
    }

    return dependencyDisplayName ?? '';
  }

  private async getToolboxPluginConfig(): Promise<ToolboxPackageUtilsPluginConfig | undefined> {
    let toolboxPluginConfig: ToolboxPackageUtilsPluginConfig;

    try {
      const pluginConfigAsUnknown = (await this.sfProject.getPluginConfiguration('toolbox')) as unknown;

      // Promise<Readonly<Record<string, unknown>>>
      toolboxPluginConfig = pluginConfigAsUnknown as ToolboxPackageUtilsPluginConfig;

      return toolboxPluginConfig;
    } catch (err) {
      if (err instanceof Error) {
        const error = err;
        // eslint-disable-next-line no-console
        // console.log(`error.name is ${error.name}`);

        if (error.name !== 'NoPluginsDefined' && error.name !== 'PluginNotFound') {
          throw err;
        }
      }
    }

    return undefined;
  }
}
