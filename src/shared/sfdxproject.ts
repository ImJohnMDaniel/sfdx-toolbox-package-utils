import { core } from '@salesforce/command';
import { AnyJson, JsonArray, JsonMap } from '@salesforce/ts-types';
import * as _ from 'lodash';
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
    private currentPackageDependency: ProjectPackageDirectoryDependency;

    private constructor( sfdxProjectJson: core.SfdxProjectJson ) {
        this.sfdxProjectJson = sfdxProjectJson;
        // this.hubOrg = thisDevHubOrg;
        // this.ux = thisUx;
        // console.log(this.sfdxProjectJson.values());
        // console.log(this.sfdxProjectJson.getContents());
    }

    // public async mywrite() {
    //     const newContents: ConfigContents = await this.sfdxProjectJson.read();
    //     newContents.
    //     await this.sfdxProjectJson.write( newContents );

    // }

    public forPackageDependency(packageDependency: ProjectPackageDirectoryDependency): SfdxProjects {
        this.currentPackageDependency = packageDependency;
        return this;
    }

    public changeToPackageVersion() {
        // console.log(this.sfdxProjectJson.getContents());
        this.sfdxProjectJson.unset('stuff');
        // const packageDirectories = this.sfdxProjectJson.get('packageDirectories');
        // const packageAliases = this.sfdxProjectJson.get('packageAliases');
        // console.log(this.sfdxProjectJson.getContents());
        console.log('************************************************************************************************');
        // console.log(packageDirectories);
        // console.log(packageAliases);
        // console.log(this.getAliases());
        // console.log(this.sfdxProjectJson.);
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
