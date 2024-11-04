import { Messages } from '@salesforce/core';
import { Flags } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@dx-cli-toolbox/sfdx-toolbox-package-utils', 'toolbox.package.flagrelated');

export const targetOrg = Flags.requiredOrg({
  char: 'o',
  description: messages.getMessage('flags.target-org.description'),
  required: true,
  summary: messages.getMessage('flags.target-org.summary'),
});

export const apiVersion = Flags.orgApiVersion({
  char: 'a',
  description: messages.getMessage('flags.api-version.description'),
  summary: messages.getMessage('flags.api-version.summary'),
});

export const branch = Flags.string({
  char: 'b',
  description: messages.getMessage('flags.branch.description'),
  summary: messages.getMessage('flags.branch.summary'),
});

// flags that go with all commands in the package dependency topic
export const basePackageDependencyRelatedFlags = {
  branch
};

// flags that go with command requiring an org
export const orgRelatedFlags = {
  'target-org': targetOrg,
};
