import { AnyJson, JsonMap } from '@salesforce/ts-types';
import { isSubscriberPackageId, isSubscriberPackageVersionId } from '../shared/packageUtils.js';
// import { Constants } from '../shared/constants';
// import { packagePrefixes } from '@salesforce/packaging';

/**
 * A project package dependency is valid in a couple of ways:
 * -- first, it should not have aliases as those are unique to the sfdx project json file and not releveant to the DevHub
 * -- all references to package and version number should be explicit and removed of aliases
 *
 * pinned version
 * -- SubscriberPackageVersionId == 04t record id of the package version
 *
 * non-pinned version
 * -- Package2Id == 0Ho record id of the package
 * -- VersionNumber representing the Major.Minor.Patch.Build.
 *
 */
export class ProjectPackageDirectoryDependency {
  private subscriberPackageVersionId: string; // 04t package version id
  private package2Id: string; // 0Ho package id
  private versionNumber: string;
  private majorVersion: number;
  private minorVersion: number;
  private patchVersion: number;
  private buildVersion: number;
  private isLATESTSpecified: boolean = false;

  public constructor(projectPackageDirectoryDependency?: AnyJson) {
    this.subscriberPackageVersionId = '';
    this.package2Id = '';
    this.versionNumber = '';
    this.majorVersion = 0;
    this.minorVersion = 0;
    this.patchVersion = 0;
    this.buildVersion = 0;
    if (projectPackageDirectoryDependency !== undefined) {
      this.processProjectPackageDirectoryDependencyJson(projectPackageDirectoryDependency);
    }
  }

  public getSubscriberPackageVersionId(): string {
    return this.subscriberPackageVersionId;
  }

  /*
   * Is this project package dependency a "pinned" dependency?  Does it reference a specific Subscriber Package Version Id -- aka "04t"?
   */
  public isPinned(): boolean {
    // return (this.subscriberPackageVersionId && this.subscriberPackageVersionId.startsWith(Constants.PACKAGE_VERSION_ID_PREFIX))
    //     || (!this.subscriberPackageVersionId && !this.isLATESTSpecified);
    return (
      isSubscriberPackageVersionId(this.subscriberPackageVersionId) ||
      (!this.subscriberPackageVersionId && !this.isLATESTSpecified)
    );
  }

  public isLatest(): boolean {
    return this.isLATESTSpecified;
  }

  public getPackage2Id(): string {
    return this.package2Id;
  }

  public getVersionNumber(): string {
    return this.versionNumber;
  }

  public getMajorVersionNumber(): number {
    return this.majorVersion;
  }

  public getMinorVersionNumber(): number {
    return this.minorVersion;
  }

  public getPatchVersionNumber(): number {
    return this.patchVersion;
  }

  public getBuildVersionNumber(): number {
    return this.buildVersion;
  }

  public setPackageAndVersionNumber(package2Id: string, versionNumber: string): void {
    this.package2Id = package2Id;
    this.versionNumber = versionNumber;
    const vers = versionNumber.split('.');
    if (vers[0]) {
      this.majorVersion = +vers[0];
    }
    if (vers[1]) {
      this.minorVersion = +vers[1];
    }
    if (vers[2]) {
      this.patchVersion = +vers[2];
    }
    if (vers[3]) {
      this.buildVersion = +vers[3];
    }
  }

  public setSubscriberPackageVersionId(subscriberPackageVersionId: string): void {
    this.subscriberPackageVersionId = subscriberPackageVersionId;
  }

  private processProjectPackageDirectoryDependencyJson(projectPackageDependency: AnyJson): void {
    // check the arguments
    // if ( !projectPackageDependency || !projectPackageDependency.trim() ) {

    // }
    // console.log('processProjectPackageDirectoryDependencyJson start');
    // console.log(projectPackageDependency);

    const { package: dependentPackageAnyJson, versionNumber: versionNumberAnyJson } =
      projectPackageDependency as JsonMap;
    const dependentPackageStr: string = JSON.stringify(dependentPackageAnyJson)
      ? JSON.stringify(dependentPackageAnyJson).replace('"', '').replace('"', '')
      : '';
    const versionNumberStr: string = JSON.stringify(versionNumberAnyJson)
      ? JSON.stringify(versionNumberAnyJson).replace('"', '').replace('"', '')
      : '';

    // console.log('dependentPackageStr == ' + dependentPackageStr);
    // console.log('versionNumberStr == ' + versionNumberStr);

    // if (dependentPackageStr.startsWith(Constants.PACKAGE_VERSION_ID_PREFIX)) {
    if (isSubscriberPackageVersionId(dependentPackageStr)) {
      this.subscriberPackageVersionId = dependentPackageStr;
    } else if (isSubscriberPackageId(dependentPackageStr)) {
      this.package2Id = dependentPackageStr;
      this.versionNumber = versionNumberStr;
      const versionWorking = versionNumberStr.toUpperCase().replace('-LATEST', '').replace('.LATEST', '');
      const vers = versionWorking.split('.');
      if (vers[0]) {
        this.majorVersion = +vers[0];
      }
      if (vers[1]) {
        this.minorVersion = +vers[1];
      }
      if (vers[2]) {
        this.patchVersion = +vers[2];
      }
      if (vers[3]) {
        this.buildVersion = +vers[3];
      }
      if (versionNumberStr.toUpperCase().endsWith('LATEST')) {
        this.isLATESTSpecified = true;
      }
    }
  }
}
