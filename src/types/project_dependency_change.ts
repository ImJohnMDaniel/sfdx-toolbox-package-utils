import { Utils } from '../shared/utils';
import { DevHubPackageVersion } from './devhub_package_version';
import { ProjectPackageDirectoryDependency } from './project_package_directory_dependency';

export class ProjectDependencyChange {

    private newVersionAlias: string;
    private newVersionDependency: DevHubPackageVersion;
    private newPackageNonPinnedDependency: ProjectPackageDirectoryDependency;
    private oldVersionAlias: string;
    private oldVersionDependency: ProjectPackageDirectoryDependency;
    private isNewVersionClonedFromOldVersion: boolean;
    private isOldVersionSet: boolean;
    private isNewVersionSet: boolean;

    public getNewVersionAlias(): string {
        this.setupNewVersionWithOldVersionInfo();
        return this.newVersionAlias;
    }

    public getOldVersionAlias(): string {
        return this.oldVersionAlias;
    }

    public getNewVersionDependency(): DevHubPackageVersion {
        this.setupNewVersionWithOldVersionInfo();
        return this.newVersionDependency;
    }

    public getNewPackageNonPinnedDependency(): ProjectPackageDirectoryDependency {
        this.setupNewVersionWithOldVersionInfo();
        return this.newPackageNonPinnedDependency;
    }

    public getOldVersionDependency(): ProjectPackageDirectoryDependency {
        return this.oldVersionDependency;
    }

    public setOldVersion( oldVersionAlias: string, oldVersionDependency: ProjectPackageDirectoryDependency ): ProjectDependencyChange {
        this.oldVersionAlias = oldVersionAlias;
        this.oldVersionDependency = oldVersionDependency;
        this.isOldVersionSet = true;
        return this;
    }

    public setNewVersion( newVersionAlias: string, newVersionDependency?: DevHubPackageVersion, newPackageNonPinnedDependency?: ProjectPackageDirectoryDependency ): ProjectDependencyChange {
        this.newVersionAlias = newVersionAlias;
        this.newVersionDependency = newVersionDependency;
        this.newPackageNonPinnedDependency = newPackageNonPinnedDependency;
        this.isNewVersionSet = true;
        return this;
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

    private setupNewVersionWithOldVersionInfo(): void {
        if ( this.isNewVersionClonedFromOldVersion 
                && this.isOldVersionSet 
                && ! this.isNewVersionSet ) {
            
            this.newVersionAlias = this.oldVersionAlias;
            this.newVersionDependency = Utils.convertProjectPackageDirectoryDependencyToDevHubPackageVersion(this.oldVersionDependency, this.oldVersionAlias);
            this.isNewVersionSet = true;
            this.isNewVersionClonedFromOldVersion = true;
        }
    }
}
