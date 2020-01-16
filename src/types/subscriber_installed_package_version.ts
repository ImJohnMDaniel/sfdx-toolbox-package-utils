import { JsonMap } from '@salesforce/ts-types';

export interface SubscriberInstalledPackageVersion extends JsonMap {
    Id: string;
    SubscriberPackageId: string;
    SubscriberPackageName: string;
    SubscriberPackageNamespace: string;
    SubscriberPackageVersionId: string;
    SubscriberPackageVersionName: string;
    SubscriberPackageVersionNumber: string;
}

export interface SubscriberInstalledPackageVersionMap extends Map<string, SubscriberInstalledPackageVersion> { }

export interface SubscriberInstalledPackageVersions {
    versions: SubscriberInstalledPackageVersion[];
}
