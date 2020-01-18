import { DevHubPackageVersion } from './devhub_package_version';
import { ProjectPackageDirectoryDependency } from './project_package_directory_dependency';

export class ProjectDependencyChange {

    private newVersionAlias: string;
    private newVersionDependency: DevHubPackageVersion;
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

    public getOldVersionDependency(): ProjectPackageDirectoryDependency {
        return this.oldVersionDependency;
    }

    public setOldVersion( oldVersionDependency: ProjectPackageDirectoryDependency, oldVersionAlias: string ): ProjectDependencyChange {
        this.oldVersionAlias = oldVersionAlias;
        this.oldVersionDependency = oldVersionDependency;
        return this;
    }

    public setNewVersion( newVersionDependency: DevHubPackageVersion, newVersionAlias: string ): ProjectDependencyChange {
        this.newVersionAlias = newVersionAlias;
        this.newVersionDependency = newVersionDependency;
        return this;
    }
}
