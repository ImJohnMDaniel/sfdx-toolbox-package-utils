import { core } from '@salesforce/command';
import { ConfigContents } from '@salesforce/core';
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
    // private hubOrg: Org;
    // private ux: UX;

    private constructor( sfdxProjectJson: core.SfdxProjectJson ) {
        this.sfdxProjectJson = sfdxProjectJson;
        // this.hubOrg = thisDevHubOrg;
        // this.ux = thisUx;
        // console.log(this.sfdxProjectJson.values());
        // console.log(this.sfdxProjectJson.getContents());
    }

    public async write() {
        const newContents: ConfigContents = await this.sfdxProjectJson.read();
        // newContents.
        await this.sfdxProjectJson.write( newContents );

    }

    public async changeToPackageVersion( dependencyChange: ProjectDependencyChange ) {

        // console.log('************************************************************************************************');
        // console.log(this.sfdxProjectJson);
        console.log('************************************************************************************************');
        console.log('dependencyChange.getOldVersionAlias()' );
        console.log( dependencyChange.getOldVersionAlias() );
        console.log('************************************************************************************************');
        console.log('dependencyChange.getOldVersionDependency()' );
        console.log( dependencyChange.getOldVersionDependency() );
        console.log('************************************************************************************************');
        console.log(this.sfdxProjectJson.getContents().packageDirectories);
        console.log('************************************************************************************************');
        console.log(this.sfdxProjectJson.getContents().packageDirectories[0].dependencies);
        console.log('************************************************************************************************');
        console.log( dependencyChange.getOldVersionAlias() );
        console.log('************************************************************************************************');

        // basic pattern
        // 1) get the in memmory object representation of sfdx-project.json from this.sfdxProjectJson.getContents()
        // 2) follow the "packageDirectories" objects and then "dependencies" sub-objects
        // 3) directly edit the "package" and "versionNumber" attributes
        // 4) use the embedded "write()" method from await this.sfdxProjectJson.write();

        // scenarios to account for
        // How to add a new, previously unseen dependency?
        // Need to get confirmation before these changes are written... otherwise just display a dry run and maybe display "new" sfdx-project.json

        this.sfdxProjectJson.getContents().packageDirectories[0].dependencies[0].package = dependencyChange.getNewVersionDependency().SubscriberPackageVersionId;
        this.sfdxProjectJson.getContents().packageDirectories[0].dependencies[0].versionNumber = undefined;

        await this.sfdxProjectJson.write();
        console.log('************************************************************************************************');
        console.log(this.sfdxProjectJson.getContents().packageDirectories);
        console.log('************************************************************************************************');
        console.log(this.sfdxProjectJson.getContents().packageDirectories[0].dependencies);
        console.log('************************************************************************************************');
        console.log('Changing out ' + dependencyChange.getOldVersionAlias() + ' for ' + dependencyChange.getNewVersionAlias() );
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
        // console.log('getDependencyDisplayName starts');
        // console.log(projectDependency);

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

    public getProjectDependencies(): ProjectPackageDirectoryDependency[] {
        const projectDependencies: ProjectPackageDirectoryDependency[] = [];

        for (const packageDirectory of this.getPackageDirectories()) {
            for (const dependency of this.getDependenciesForPackageDirectory(packageDirectory)) {
                // console.log(dependency);
                projectDependencies.push(new ProjectPackageDirectoryDependency( this.resolveDependencyAliases(dependency)));
            }
        }

        return projectDependencies;
    }

    private resolveDependencyAliases( dependency: AnyJson ): AnyJson {
        // console.log('dependency starts as === ');
        // console.log(dependency);
        if ( Object.keys(dependency).find(item => item === 'package') ) {
            dependency['package'] = this.resolveAlias(dependency['package']);
        }
        // console.log('dependency is now === ');
        // console.log(dependency);

        return dependency;
    }

    private getAliases(): AnyJson {
        // return _.get(this.sfdxProjectJson['contents'], 'packageAliases');
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
