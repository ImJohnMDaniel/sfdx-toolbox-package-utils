import { SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { Package, PackageSaveResult, PackageVersion, PackageVersionListResult } from '@salesforce/packaging';
import { expect } from 'chai';
import { PackageVersionCleanupResult } from '../../../../../src/commands/toolbox/package/version/cleanup.js';
import PackageVersionCleanup from '../../../../../src/commands/toolbox/package/version/cleanup.js';

const myPackage0Hot = '0Hot0000000YzlxBAB';
const packageVersion0101SubscriberId = '04t6A000002zgKSQAW';
const packageVersion0102SubscriberId = '04t6A000002zgKSQAX';
const packageVersion0201SubscriberId = '04t6A000002zgKSQAY';
const packageVersion0202SubscriberId = '04t6A000002zgKSQAZ';

const packageVersion0101ListResult: PackageVersionListResult = {
  Id: '',
  Package2Id: '',
  SubscriberPackageVersionId: packageVersion0101SubscriberId,
  Name: '',
  // @ts-expect-error: Package2 can be undefined
  Package2: undefined,
  Description: '',
  Tag: '',
  Branch: '',
  MajorVersion: '0',
  MinorVersion: '1',
  PatchVersion: '0',
  BuildNumber: '1',
  IsReleased: false,
  CreatedDate: '1900-01-01',
  LastModifiedDate: '1900-01-01',
  IsPasswordProtected: false,
  AncestorId: '',
  ValidationSkipped: false,
  CreatedById: '',
  // maybe unused @ts-expect-error: CodeCoverage can be undefined
  CodeCoverage: undefined,
  HasPassedCodeCoverageCheck: true,
  ConvertedFromVersionId: '',
  ReleaseVersion: '',
  BuildDurationInSeconds: 60,
  HasMetadataRemoved: false,
  Language: '',
};

const packageVersion0102ListResult: PackageVersionListResult = {
  Id: '',
  Package2Id: '',
  SubscriberPackageVersionId: packageVersion0102SubscriberId,
  Name: '',
  // @ts-expect-error: Package2 can be undefined
  Package2: undefined,
  Description: '',
  Tag: '',
  Branch: '',
  MajorVersion: '0',
  MinorVersion: '1',
  PatchVersion: '0',
  BuildNumber: '2',
  IsReleased: true,
  CreatedDate: '1900-01-01',
  LastModifiedDate: '1900-01-01',
  IsPasswordProtected: false,
  AncestorId: '',
  ValidationSkipped: false,
  CreatedById: '',
  // maybe unused @ts-expect-error: CodeCoverage can be undefined
  CodeCoverage: undefined,
  HasPassedCodeCoverageCheck: true,
  ConvertedFromVersionId: '',
  ReleaseVersion: '',
  BuildDurationInSeconds: 60,
  HasMetadataRemoved: false,
  Language: '',
};

const packageVersion0201ListResult: PackageVersionListResult = {
  Id: '',
  Package2Id: '',
  SubscriberPackageVersionId: packageVersion0201SubscriberId,
  Name: '',
  // @ts-expect-error: Package2 can be undefined
  Package2: undefined,
  Description: '',
  Tag: '',
  Branch: '',
  MajorVersion: '0',
  MinorVersion: '2',
  PatchVersion: '0',
  BuildNumber: '1',
  IsReleased: false,
  CreatedDate: '1900-01-01',
  LastModifiedDate: '1900-01-01',
  IsPasswordProtected: false,
  AncestorId: '',
  ValidationSkipped: false,
  CreatedById: '',
  // maybe unused @ts-expect-error: CodeCoverage can be undefined
  CodeCoverage: undefined,
  HasPassedCodeCoverageCheck: true,
  ConvertedFromVersionId: '',
  ReleaseVersion: '',
  BuildDurationInSeconds: 60,
  HasMetadataRemoved: false,
  Language: '',
};

const packageVersion0202ListResult: PackageVersionListResult = {
  Id: '',
  Package2Id: '',
  SubscriberPackageVersionId: packageVersion0202SubscriberId,
  Name: '',
  // @ts-expect-error: Package2 can be undefined
  Package2: undefined,
  Description: '',
  Tag: '',
  Branch: '',
  MajorVersion: '0',
  MinorVersion: '2',
  PatchVersion: '0',
  BuildNumber: '2',
  IsReleased: true,
  CreatedDate: '1900-01-01',
  LastModifiedDate: '1900-01-01',
  IsPasswordProtected: false,
  AncestorId: '',
  ValidationSkipped: false,
  CreatedById: '',
  // maybe @ ts-expect-error: CodeCoverage can be undefined
  CodeCoverage: undefined,
  HasPassedCodeCoverageCheck: true,
  ConvertedFromVersionId: '',
  ReleaseVersion: '',
  BuildDurationInSeconds: 60,
  HasMetadataRemoved: false,
  Language: '',
};

describe('toolbox package version cleanup', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  before(async () => {
    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should error without required --target-dev-hub flag', async () => {
    try {
      await PackageVersionCleanup.run();
      expect.fail('should have thrown NoDefaultDevHubError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultDevHubError');
      expect(error.message).to.include('No default dev hub found.');
    }
  });

  it('should error without required flags', async () => {
    try {
      await PackageVersionCleanup.run(['--target-dev-hub', 'devHub']);
      expect.fail('should have thrown Error');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('Error');
      expect(error.message).to.include('Missing required flag package');
      expect(error.message).to.include('Missing required flag matcher');
    }
  });

  it('should select the correct versions for deletion', async () => {
    $$.SANDBOX.stub(Package, 'listVersions').resolves([
      packageVersion0101ListResult,
      packageVersion0102ListResult,
      packageVersion0201ListResult,
      packageVersion0202ListResult,
    ]);

    $$.SANDBOX.stub(PackageVersion.prototype, 'delete').resolves({
      errors: [],
      id: 'testId',
      success: true,
    } as PackageSaveResult);

    const results = await PackageVersionCleanup.run([
      '--matcher',
      '0.2.0',
      '--package',
      myPackage0Hot,
      '--target-dev-hub',
      'foor@bar.org',
    ]);

    const expectedResults: PackageVersionCleanupResult[] = [
      { Success: true, SubscriberPackageVersionId: packageVersion0201SubscriberId },
    ];

    expect(results).to.deep.equal(expectedResults);
  });
});
