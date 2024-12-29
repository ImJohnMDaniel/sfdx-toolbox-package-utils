import { JsonMap } from '@salesforce/ts-types';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface DevHubPackageVersion extends JsonMap {
  Alias: string;
  Branch: string;
  BuildNumber: number;
  CodeCoverage: string;
  CreatedDate: string;
  Description: string;
  HasPassedCodeCoverageCheck: string;
  Id: string;
  InstallUrl: string;
  IsPasswordProtected: string;
  IsReleased: string;
  LastModifiedDate: string;
  MajorVersion: number;
  MinorVersion: number;
  Name: string;
  NamespacePrefix: string;
  Package2Id: string;
  Package2Name: string;
  PatchVersion: number;
  SubscriberPackageVersionId: string;
  Tag: string;
  Version: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface DevHubPackageVersionMap extends Map<string, DevHubPackageVersion> {}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface DevHubPackageVersions {
  versions: DevHubPackageVersion[];
}
