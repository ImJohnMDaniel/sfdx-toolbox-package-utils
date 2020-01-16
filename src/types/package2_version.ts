import { SObject } from './sobject';

export interface Package2Version extends SObject {
    SubscriberPackageVersionId: string;
    IsPasswordProtected: string;
    IsReleased: string;
    Package2Id: string;
    MajorVersion: string;
    MinorVersion: string;
    PatchVersion: string;
    BuildNumber: string;
    Branch: string;
}
