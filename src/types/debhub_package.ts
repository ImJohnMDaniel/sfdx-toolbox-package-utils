import { JsonMap } from '@salesforce/ts-types';

export interface DevHubPackage extends JsonMap {
    Alias: string;
    ContainerOptions: string;
    Description: string;
    Id: string;
    Name: string;
    NamespacePrefix: string;
    SubscriberPackageId: string;
}

export interface DevHubPackageMap extends Map<string, DevHubPackage> { }

export interface DevHubPackages {
    versions: DevHubPackage[];
}
