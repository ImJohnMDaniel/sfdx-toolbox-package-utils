// import { Utils } from '../shared/utils';
import { DevHubPackageVersion } from './devhub_package_version.js';
import { ProjectPackageDirectoryDependency } from './project_package_directory_dependency.js';

export class ProjectDependencyChange {
  private newVersionAlias: string = '';
  private newVersionDependency: DevHubPackageVersion | undefined;
  private newPackageNonPinnedDependency: ProjectPackageDirectoryDependency | undefined;
  private oldVersionAlias: string = '';
  private oldVersionDependency: ProjectPackageDirectoryDependency | undefined;
  private isNewVersionClonedFromOldVersion: boolean = false;
  private isOldVersionSet: boolean = false;
  private isNewVersionSet: boolean = false;

  public getNewVersionAlias(): string {
    this.setupNewVersionWithOldVersionInfo();
    return this.newVersionAlias;
  }

  public getOldVersionAlias(): string {
    return this.oldVersionAlias;
  }

  public getNewVersionDependency(): DevHubPackageVersion | undefined {
    this.setupNewVersionWithOldVersionInfo();
    return this.newVersionDependency ? this.newVersionDependency : undefined;
  }

  public getNewPackageNonPinnedDependency(): ProjectPackageDirectoryDependency | undefined {
    this.setupNewVersionWithOldVersionInfo();
    return this.newPackageNonPinnedDependency;
  }

  public getOldVersionDependency(): ProjectPackageDirectoryDependency | undefined {
    return this.oldVersionDependency;
  }

  public setOldVersion(
    oldVersionAlias: string,
    oldVersionDependency: ProjectPackageDirectoryDependency
  ): ProjectDependencyChange {
    this.oldVersionAlias = oldVersionAlias;
    this.oldVersionDependency = oldVersionDependency;
    this.isOldVersionSet = true;
    return this;
  }

  public setNewVersion(
    newVersionAlias: string,
    newVersionDependency?: DevHubPackageVersion,
    newPackageNonPinnedDependency?: ProjectPackageDirectoryDependency
  ): ProjectDependencyChange {
    this.newVersionAlias = newVersionAlias;
    this.newVersionDependency = newVersionDependency;
    this.newPackageNonPinnedDependency = newPackageNonPinnedDependency;
    this.isNewVersionSet = true;
    return this;
  }

  public newVersionIsTheSameAsTheOldVersion(): void {
    this.isNewVersionClonedFromOldVersion = true;
  }

  public isPinned(): boolean {
    return this.newPackageNonPinnedDependency === undefined;
  }

  public isNewVersionTheSameAsTheOldVersion(): boolean {
    return this.isNewVersionClonedFromOldVersion;
  }

  public setNewVersionToOldVersion(): ProjectDependencyChange {
    this.isNewVersionClonedFromOldVersion = true;
    this.setupNewVersionWithOldVersionInfo();
    return this;
  }

  // public toJson(): string {
  //     const jsonRepresentation = {} as string;

  //     jsonRepresentation['newVersionAlias'] = this.newVersionAlias;
  //     jsonRepresentation['newVersionDependency'] = this.newVersionDependency;
  //     jsonRepresentation['newPackageNonPinnedDependency'] = this.newPackageNonPinnedDependency;
  //     jsonRepresentation['oldVersionAlias'] = this.oldVersionAlias;
  //     jsonRepresentation['oldVersionDependency'] = this.oldVersionDependency;
  //     jsonRepresentation['isNewVersionClonedFromOldVersion'] = this.isNewVersionClonedFromOldVersion || false;

  //     return jsonRepresentation;
  // }

  private setupNewVersionWithOldVersionInfo(): void {
    if (this.isNewVersionClonedFromOldVersion && this.isOldVersionSet && !this.isNewVersionSet) {
      this.newVersionAlias = this.oldVersionAlias;
      // this.newVersionDependency = Utils.convertProjectPackageDirectoryDependencyToDevHubPackageVersion(this.oldVersionDependency, this.oldVersionAlias);
      this.isNewVersionSet = true;
      this.isNewVersionClonedFromOldVersion = true;
    }
  }
}
