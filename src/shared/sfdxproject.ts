import { core } from '@salesforce/command';
import { PackageDir, PackageDirDependency } from '@salesforce/core/lib/sfdxProject';
import { AnyJson, JsonArray, JsonMap } from '@salesforce/ts-types';
import * as _ from 'lodash';
import { ProjectDependencyChange } from '../types/project_dependency_change';
import { ProjectPackageDirectoryDependency } from '../types/project_package_directory_dependency';

/*
 *  This class wraps the sfdx-project.json file with various convenience functions.
 */
export class SfdxProjects {

    public static async getInstance( sfdxProject: core.SfdxProject ) {
        const sfdxProjectJson = await sfdxProject.retrieveSfdxProjectJson();

        return new SfdxProjects(sfdxProjectJson);
    }

    private sfdxProjectJson: core.SfdxProjectJson;

    private constructor( sfdxProjectJson: core.SfdxProjectJson ) {
        this.sfdxProjectJson = sfdxProjectJson;
    }

    public async changeToPackageVersion( dependencyChange: ProjectDependencyChange, packageDirectoryPath: string ) {

        // console.log('************************************************************************************************');
        // console.log(this.sfdxProjectJson);
        // console.log('************************************************************************************************');
        // console.log('dependencyChange.getOldVersionAlias()' );
        // console.log( dependencyChange.getOldVersionAlias() );
        // console.log('************************************************************************************************');
        // console.log('dependencyChange.getOldVersionDependency()' );
        // console.log( dependencyChange.getOldVersionDependency() );
        // console.log('************************************************************************************************');
        // console.log('dependencyChange.getNewVersionAlias()' );
        // console.log( dependencyChange.getNewVersionAlias() );
        // console.log('************************************************************************************************');
        // console.log('dependencyChange.getNewVersionDependency()' );
        // console.log( dependencyChange.getNewVersionDependency() );
        // console.log('************************************************************************************************');
        // console.log('this.sfdxProjectJson.getContents().packageDirectories');
        // console.log(this.sfdxProjectJson.getContents().packageDirectories);
        // console.log('************************************************************************************************');
        // console.log(this.sfdxProjectJson.getContents().packageDirectories[0].dependencies);
        // console.log('************************************************************************************************');
        // console.log( dependencyChange.getOldVersionAlias() );
        // console.log('************************************************************************************************');
        // console.log('real processing logic begins here');
        // basic pattern
        // 1) get the in memmory object representation of sfdx-project.json from this.sfdxProjectJson.getContents()
        // 2) follow the "packageDirectories" objects and then "dependencies" sub-objects
        // 3) directly edit the "package" and "versionNumber" attributes
        // 4) use the embedded "write()" method from await this.sfdxProjectJson.write();

        // scenarios to account for
        // 1) How to add a new, previously unseen dependency?
        // 2) Need to get confirmation before these changes are written... otherwise just display a dry run and maybe display "new" sfdx-project.json
        // 3) If a dependency is a floating non-pinned and the user does not make a change, the dependency should not be changed.

        // loop through each of the package directories
        this.sfdxProjectJson.getContents().packageDirectories.forEach((packageDirectory: PackageDir) => {
            // console.log('Starting loop on packageDirectory : ' + packageDirectory.path);

            if ( packageDirectory.path === packageDirectoryPath ) {
                if ( packageDirectory.dependencies ) {
                    // then loop through each of the dependencies in that package directory
                    packageDirectory.dependencies.forEach( (aDependency: PackageDirDependency) => {
                        // console.log('Starting loop on dependency : ' + aDependency.package);
                        // check to see if the OldVersionDependency refers to this location
                        // aDependency.package values can be an 0Ho id, 04t id, or an alias of either
                        if (aDependency.package === dependencyChange.getOldVersionDependency().getPackage2Id() // match the 0Ho id
                            || aDependency.package === dependencyChange.getOldVersionDependency().getSubscriberPackageVersionId() ) { // match the 04t id

                            // this is the correct package
                            if ( dependencyChange.isPinned() ) {
                                // console.log('pinned');
                                // this is a pinned, non-snapshot version
                                aDependency.package = dependencyChange.getNewVersionAlias();
                                aDependency.versionNumber = undefined;
                                // add the alias
                                this.sfdxProjectJson.getContents().packageAliases[dependencyChange.getNewVersionAlias()] = dependencyChange.getNewVersionDependency().SubscriberPackageVersionId;

                                console.log('Changing out ' + dependencyChange.getOldVersionAlias() + ' for ' + dependencyChange.getNewVersionAlias() );

                            } else {
                                // this is a non-pinned, snapshot version
                                // console.log('non-pinned');

                                // "package": "0Ho1T000000PAsXSAW",
                                // "versionNumber": "0.1.0.LATEST"
                                aDependency.package = dependencyChange.getNewVersionAlias();
                                aDependency.versionNumber = dependencyChange.getNewPackageNonPinnedDependency().getVersionNumber();
                                this.sfdxProjectJson.getContents().packageAliases[dependencyChange.getNewVersionAlias()] = dependencyChange.getNewPackageNonPinnedDependency().getPackage2Id();

                                console.log('Changing out ' + dependencyChange.getOldVersionAlias() + ' for ' + dependencyChange.getNewVersionAlias() + '@' + dependencyChange.getNewPackageNonPinnedDependency().getVersionNumber() );
                            }

                            // add the alias
                            if (dependencyChange.getOldVersionAlias() !== dependencyChange.getNewVersionAlias()) {
                                this.sfdxProjectJson.getContents().packageAliases[dependencyChange.getOldVersionAlias()] = undefined;
                            }
                        }
                    });
                }
            }
            // else {
                // eventually logic will go here to add a dependency to this particular package
            // }
            // this.devHubPackageInfosBySubscriberPackageMap.set(element.Id, element);
        });

        // this.sfdxProjectJson.getContents().packageDirectories[0].dependencies[0].package = dependencyChange.getNewVersionDependency().SubscriberPackageVersionId;
        // this.sfdxProjectJson.getContents().packageDirectories[0].dependencies[0].versionNumber = undefined;

        await this.sfdxProjectJson.write();
        // console.log('write occurs here');
        // console.log('************************************************************************************************');
        // console.log(this.sfdxProjectJson.getContents().packageDirectories);
        // console.log('************************************************************************************************');
        // console.log(this.sfdxProjectJson.getContents().packageDirectories[0].dependencies);
        // console.log('************************************************************************************************');
    }

    /**
     * Given the alias, the function returns the id value.
     * @param alias
     */
    public resolveAlias( alias: string ): string {
        const packageAliases = this.getAliases();
        const aliasKeys = packageAliases == null ? [] : Object.keys(packageAliases);
        const matched = aliasKeys.find(item => item === alias);
        return matched ? packageAliases[matched] : alias;
    }

    /**
     * Given the id value, the function returns the alias, if known
     * @param idValue the id value of either a package or package version
     */
    public findAlias( idValue: string ): string {
        const packageAliases = this.getAliases();
        const aliasValues = [...Object.entries(packageAliases)].filter(({ 1: v }) => v === idValue).map(([k]) => k);
        return aliasValues && aliasValues[0] ? aliasValues[0] : undefined ;
    }

    public findAliasForProjectDependency(projectDependency: ProjectPackageDirectoryDependency): string {
        let dependencyAlias;
        if ( projectDependency.getSubscriberPackageVersionId() ) {
            dependencyAlias = this.findAlias(projectDependency.getSubscriberPackageVersionId());
        } else if ( projectDependency.getPackage2Id() && projectDependency.getVersionNumber() ) {
            dependencyAlias = this.findAlias(projectDependency.getPackage2Id());
        }
        return dependencyAlias;
    }

    public getDependencyPackageDisplayName( package2Id: string ) {
        const dependencyPackageAlias = this.findAlias( package2Id );

        return dependencyPackageAlias ? dependencyPackageAlias + ' (' + package2Id + ')' : package2Id;
    }

    public getDependencyDisplayName(projectDependency: ProjectPackageDirectoryDependency) {
        const dependencyAlias = this.findAliasForProjectDependency(projectDependency);
        let dependencyDisplayName;

        if ( projectDependency.getSubscriberPackageVersionId() ) {
            dependencyDisplayName = dependencyAlias ? dependencyAlias + ' (' + projectDependency.getSubscriberPackageVersionId() + ')' : projectDependency.getSubscriberPackageVersionId();
        } else if ( projectDependency.getPackage2Id() && projectDependency.getVersionNumber() ) {
            dependencyDisplayName = dependencyAlias ? dependencyAlias + ' (' + projectDependency.getPackage2Id() + ')' : projectDependency.getPackage2Id();
            dependencyDisplayName += ' version ' + projectDependency.getVersionNumber();
        }

        return dependencyDisplayName;
    }

    // TODO: refactor this to return a map of string:ProjectPackageDirectoryDependency[] where the string key is the packageDirectory.path
    //      This will be needed in order to ensure that updates are specific to the correct packageDirectory and not universal
    public getProjectDependenciesByPackageDirectoryPath(): Map<string, ProjectPackageDirectoryDependency[]> {

        const outputMap = new Map<string, ProjectPackageDirectoryDependency[]>();

        for (const packageDirectory of this.getPackageDirectories()) {
            outputMap.set( packageDirectory['path'], [] );

            for (const dependency of this.getDependenciesForPackageDirectory(packageDirectory)) {
                outputMap.get(packageDirectory['path']).push(new ProjectPackageDirectoryDependency( this.resolveDependencyAliases(dependency)));
            }
        }

        return outputMap;
    }

    private resolveDependencyAliases( dependency: AnyJson ): AnyJson {
        if ( Object.keys(dependency).find(item => item === 'package') ) {
            dependency['package'] = this.resolveAlias(dependency['package']);
        }
        return dependency;
    }

    private getAliases(): AnyJson {
        return this.sfdxProjectJson.get('packageAliases');
    }

    private getDependenciesForPackageDirectory( packageDirectory: AnyJson ): JsonArray {
        packageDirectory = packageDirectory as JsonMap;
        return (packageDirectory.dependencies || []) as JsonArray;
    }

    // this version can't be used because it returns AnyJson.  Some of the callers
    // need it to be at least a JsonArray in order to iterate over it.
    // TODO: figure out to properly use this version.
    // private getPackageDirectories(): AnyJson {
    //     return this.sfdxProjectJson.get('packageDirectories');
    // }

    private getPackageDirectories(): JsonArray {
        return _.get(this.sfdxProjectJson['contents'], 'packageDirectories');
        // return this.sfdxProjectJson.get('packageDirectories');
    }
}
