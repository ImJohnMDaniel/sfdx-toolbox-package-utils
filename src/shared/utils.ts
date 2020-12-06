import { DevHubPackage } from "../types/devhub_package";
import { DevHubPackageVersion } from "../types/devhub_package_version";
import { ProjectPackageDirectoryDependency } from "../types/project_package_directory_dependency";

export class Utils {

    public static createAliasForPackageFromDevHubPackage(aPackage: DevHubPackage): string {
        return (aPackage.NamespacePrefix ? (aPackage.NamespacePrefix + '.') : '')
                    + aPackage.Name;
    }

    public static createAliasForPackageVersionFromDevHubPackageVersion(packageVersion: DevHubPackageVersion ): string {
        return (packageVersion.NamespacePrefix ? (packageVersion.NamespacePrefix + '.') : '')
                    + packageVersion.Package2Name + '@'
                    + Utils.createVersionAliasSegment(packageVersion);
    }

    public static createVersionAliasSegment(packageVersion: DevHubPackageVersion ): string {
        return Utils.createVersionAliasSegmentString( packageVersion.Version, packageVersion.Branch );
    }

    public static createVersionAliasSegmentString(version: string, branch?: string) {
        const versionNumbers = version.split('.');
        return versionNumbers[0] + '.' + versionNumbers[1] + '.' + versionNumbers[2] + '-' + versionNumbers[3] + (branch ? '-' + branch : '');
    }

    public static convertProjectPackageDirectoryDependencyToDevHubPackageVersion(packageDirectoryDependency: ProjectPackageDirectoryDependency, alias?: string): DevHubPackageVersion {
        let newDevHubPackageVersion = { } as DevHubPackageVersion;

        newDevHubPackageVersion.Alias = alias;
        newDevHubPackageVersion.MajorVersion = packageDirectoryDependency.getMajorVersionNumber();
        newDevHubPackageVersion.MinorVersion = packageDirectoryDependency.getMinorVersionNumber();
        newDevHubPackageVersion.PatchVersion = packageDirectoryDependency.getPatchVersionNumber();
        newDevHubPackageVersion.BuildNumber = packageDirectoryDependency.getBuildVersionNumber();
        newDevHubPackageVersion.Version = packageDirectoryDependency.getVersionNumber();
        newDevHubPackageVersion.Package2Id = packageDirectoryDependency.getPackage2Id();
        newDevHubPackageVersion.SubscriberPackageVersionId = packageDirectoryDependency.getSubscriberPackageVersionId();

        return newDevHubPackageVersion;
    }
}
