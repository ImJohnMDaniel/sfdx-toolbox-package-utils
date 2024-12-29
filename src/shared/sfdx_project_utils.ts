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

  // public static async getBranchNamesThatContainReleasedVersions(): Promise<string[]> {
  public async getBranchNamesThatContainReleasedVersions(): Promise<string[]> {
    let branchNames: string[] = [];

    try {
      // const pluginConfig = await project.getPluginConfiguration('toolbox') as ToolboxPackageUtilsPluginConfig;
      const pluginConfigAsUnknown = (await this.sfProject.getPluginConfiguration('toolbox')) as unknown;

      // Promise<Readonly<Record<string, unknown>>>
      const pluginConfig = pluginConfigAsUnknown as ToolboxPackageUtilsPluginConfig;

      // // eslint-disable-next-line no-console
      // console.log('pluginConfig......');
      // // eslint-disable-next-line no-console
      // console.log(pluginConfig);
      // // eslint-disable-next-line no-console
      // console.log('..................');

      branchNames = pluginConfig.package.brancheswithreleasedversions || [];
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
    return branchNames;
  }
}

//         const project = await SfProject.resolve();
//         const pluginConfig = await project.getPluginConfiguration('toolbox') as ToolboxPackageUtilsPluginConfig;
//         // return _.get(this.sfdxProjectJson['contents'], 'plugins.toolbox.package.brancheswithreleasedversions', false) as string[];
//         // return _.get(pluginConfig, 'package.brancheswithreleasedversions', false) as string[];

//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
//         // const bluefish = _.get(pluginConfig, 'package.brancheswithreleasedversions', []) as string[];
//         // const bluefish = pluginConfig?.package?.brancheswithreleasedversions;

//         // const pluginConfigAlt = {
//         //     "package": {
//         //       "brancheswithreleasedversions": ["bluefish"]
//         //     }
//         //   };

//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         // const bluefish = pluginConfigAlt.package.brancheswithreleasedversions;

//         // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//         // const bluefish = JSON.parse(pluginConfig)?.package.brancheswithreleasedversions;

//         // eslint-disable-next-line @typescript-eslint/no-unused-vars, , @typescript-eslint/no-unsafe-assignment
//         // const firstElement = pluginConfig.package.brancheswithreleasedversions;

//         return pluginConfig.package.brancheswithreleasedversions;
//     }
// }
