import { DevHubPackageVersion } from './devhub_package_version';
import { ProjectPackageDirectoryDependency } from './project_package_directory_dependency';

export class ProjectDependencyChange {

    private newVersionAlias: string;
    private newVersionDependency: DevHubPackageVersion;
    private newPackageNonPinnedDependency: ProjectPackageDirectoryDependency;
    private oldVersionAlias: string;
    private oldVersionDependency: ProjectPackageDirectoryDependency;

    public getNewVersionAlias(): string {
        return this.newVersionAlias;
    }

    public getOldVersionAlias(): string {
        return this.oldVersionAlias;
    }

    public getNewVersionDependency(): DevHubPackageVersion {
        return this.newVersionDependency;
    }

    public getNewPackageNonPinnedDependency(): ProjectPackageDirectoryDependency {
        return this.newPackageNonPinnedDependency;
    }

    public getOldVersionDependency(): ProjectPackageDirectoryDependency {
        return this.oldVersionDependency;
    }

    public setOldVersion( oldVersionAlias: string, oldVersionDependency: ProjectPackageDirectoryDependency ): ProjectDependencyChange {
        this.oldVersionAlias = oldVersionAlias;
        this.oldVersionDependency = oldVersionDependency;
        return this;
    }

    public setNewVersion( newVersionAlias: string, newVersionDependency?: DevHubPackageVersion, newPackageNonPinnedDependency?: ProjectPackageDirectoryDependency ): ProjectDependencyChange {
        this.newVersionAlias = newVersionAlias;
        this.newVersionDependency = newVersionDependency;
        this.newPackageNonPinnedDependency = newPackageNonPinnedDependency;
        return this;
    }

    public isPinned(): boolean {
        return this.newPackageNonPinnedDependency === undefined;
    }
}
