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

import { SfProject } from '@salesforce/core';

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
        console.log(`error.name is ${error.name}`);

        if (error.name !== 'NoPluginsDefined' && error.name !== 'PluginNotFound') {
          throw err;
        }
      }
    }

    return undefined;
  }
}
