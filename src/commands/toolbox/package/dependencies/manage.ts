/* eslint-disable complexity */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unsafe-finally */
import { SfCommand, Flags, requiredHubFlagWithDeprecations } from '@salesforce/sf-plugins-core';
import { AuthInfo, Connection, Messages, Lifecycle, SfError, SfProject } from '@salesforce/core';
import {
    InstalledPackages,
    PackageEvents,
    PackageInstallCreateRequest,
    PackageInstallOptions,
    SubscriberPackageVersion,
    PackagingSObjects,
  } from '@salesforce/packaging';
import { PackageDirDependency } from '@salesforce/schemas';
import { basePackageDependencyRelatedFlags } from '../../../../shared/flags.js';

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
            exactlyOne: ['update-to-released', 'update-to-latest'],
            aliases: ['updatetoreleased']
          }),
        'update-to-latest': Flags.boolean({
            summary: messages.getMessage('flags.update-to-latest.summary'),
            description: messages.getMessage('flags.update-to-latest.description'),
            default: false,
            exactlyOne: ['update-to-released', 'update-to-latest'],
            aliases: ['updatetolatest']
          }),
    }

    public async run(): Promise<ToolboxPackageDependenciesManageResult[]> {
        const { flags } = await this.parse(ToolboxPackageDependenciesManage);

        const basePath: string = await SfProject.resolveProjectPath();

        await flags['target-dev-hub'].refreshAuth();

        let manageResults: ToolboxPackageDependenciesManageResult[] = [];

        return manageResults;
    }
}    