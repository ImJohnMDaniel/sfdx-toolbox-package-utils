import { SObject } from './sobject';

export interface PackageInstallRequest extends SObject {
    IsDeleted: boolean;
    CreatedDate: string;
    CreatedById: string;
    LastModifiedDate: string;
    LastModifiedById: string;
    SystemModstamp: string;
    SubscriberPackageVersionKey: string;
    NameConflictResolution: string;
    SecurityType: string;
    PackageInstallSource: string;
    ProfileMappings: string;
    Password: string;
    EnableRss: boolean;
    UpgradeType: string;
    ApexCompileType: string;
    Status: string;
    Errors: string;
}
