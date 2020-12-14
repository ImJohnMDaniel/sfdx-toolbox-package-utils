import { UX } from '@salesforce/command';
import { Org } from '@salesforce/core';
import * as _ from 'lodash';
// import { PackageInstalledListCommand } from 'salesforce-alm/dist/commands/force/package/installed/list';
import { PackageListCommand } from 'salesforce-alm/dist/commands/force/package/list';
import { PackageVersionListCommand } from 'salesforce-alm/dist/commands/force/package/version/list';
import { DevHubPackage } from '../../types/devhub_package';
import { DevHubPackageVersion } from '../../types/devhub_package_version';
import { SubscriberInstalledPackageVersion } from '../../types/subscriber_installed_package_version';

export async function retrievePackagesCurrentlyInstalled( thisOrg: Org, thisUx: UX, thisDebugMessages: any[] ) {

    

    thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- starts');
    thisUx.startSpinner('Retrieving packages currently installed in org....');

    // // execute the force:package:installed:list command
    // const args = [];

    // // USERNAME argument
    // args.push('--targetusername');
    // args.push(`${thisOrg.getUsername()}`);

    // // have the output returned as JSON
    // args.push('--json');

    // // up the log level
    // args.push('--loglevel');
    // args.push('debug');

    // thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- prior to creation of intercept');
    // const intercept = require('intercept-stdout');

    // thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- prior to execution of intercept');
    // // tslint:disable-next-line: only-arrow-functions
    // const unhookIntercept = intercept(function(text) {
    //     // logs.push(text);
    //     return '';
    // });

    // thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- prior to first execution of PackageInstalledListCommand.run');

    // let installedPackageListJson = undefined

    // try {
    //     installedPackageListJson = await PackageInstalledListCommand.run( args );
    //     thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- after first execution of PackageInstalledListCommand.run');
    // } catch (e) {
    //     if(e instanceof Error) {
    //         let theError = (e as Error);
    //         thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- name: ' + theError.name);
    //         thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- message: ' + theError.message);
    //         thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- stack: ' + theError.stack);
    //     }
    //     else {
    //         thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- unknown error : ' + e);
    //         throw e;
    //     }
    // }
    
    // thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- installedPackageListJson is undefined? -- ' + (installedPackageListJson === undefined));

    // if ( installedPackageListJson === undefined || installedPackageListJson.status !== 0 ) {
    //     thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- prior to second execution of PackageInstalledListCommand.run');
    //     try {
    //         installedPackageListJson = await PackageInstalledListCommand.run( args );
    //         thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- after second execution of PackageInstalledListCommand.run');            
    //     } catch (e) {
    //         if(e instanceof Error) {
    //             let theError = (e as Error);
    //             thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- name: ' + theError.name);
    //             thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- message: ' + theError.message);
    //             thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- stack: ' + theError.stack);
    //         }
    //         else {
    //             thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- EXCEPTION THROWN -- unknown error : ' + e);
    //             throw e;
    //         }                
    //     }
    // }

    // thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- prior to execution of unhookIntercept');
    // // Stop capturing stdout.
    // unhookIntercept();

    const query = 'SELECT Id, SubscriberPackageId, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name, ' +
        'SubscriberPackageVersion.Id, SubscriberPackageVersion.Name, SubscriberPackageVersion.MajorVersion, SubscriberPackageVersion.MinorVersion, ' +
        'SubscriberPackageVersion.PatchVersion, SubscriberPackageVersion.BuildNumber FROM InstalledSubscriberPackage ' +
        'ORDER BY SubscriberPackageId';

    thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- getting thisOrg.getConnection()');
    // console.log('force_package.retrievePackagesCurrentlyInstalled method -- getting thisOrg.getConnection()');
    const conn = thisOrg.getConnection();
    // console.log('force_package.retrievePackagesCurrentlyInstalled method -- conn == undefined' + (conn === undefined));
    thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- executing query');
    const resultInstalledSubscriberPackageRecords = await conn.tooling.query(query) as any;
    thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- after query execution');
    // console.log('force_package.retrievePackagesCurrentlyInstalled method -- after query execution');
    const records = resultInstalledSubscriberPackageRecords.records;
    // console.log('records == ' + records);
    const results = [] as SubscriberInstalledPackageVersion[];

    if ( records && records.length > 0 ) {
        records.forEach(record => {
            results.push({
                Id: record.Id,
                SubscriberPackageId: record.SubscriberPackageId,
                SubscriberPackageName: record.SubscriberPackage.Name,
                SubscriberPackageNamespace: record.SubscriberPackage.NamespacePrefix,
                SubscriberPackageVersionId: record.SubscriberPackageVersion.Id,
                SubscriberPackageVersionName: record.SubscriberPackageVersion.Name,
                SubscriberPackageVersionNumber: `${record.SubscriberPackageVersion.MajorVersion}.${record.SubscriberPackageVersion.MinorVersion}.${record.SubscriberPackageVersion.PatchVersion}.${record.SubscriberPackageVersion.BuildNumber}`
            } as SubscriberInstalledPackageVersion)
        });
    }

    thisUx.stopSpinner();

    thisDebugMessages.push('force_package.retrievePackagesCurrentlyInstalled method -- ends');
    // return installedPackageListJson as SubscriberInstalledPackageVersion[];
    return results;
}

export async function retrieveAllPackageVersionInfo( thisDevHubOrg: Org, thisUx: UX ) {

    thisUx.startSpinner('Retrieving all package version information from Dev Hub....');

    // execute the force:package:version:list command
    const args = [];

    // USERNAME argument
    args.push('--targetdevhubusername');
    args.push(`${thisDevHubOrg.getUsername()}`);

    // have the output returned as JSON
    args.push('--json');

    // up the log level
    args.push('--loglevel');
    args.push('debug');

    const intercept = require('intercept-stdout');

    // tslint:disable-next-line: only-arrow-functions
    const unhookIntercept = intercept(function(text) {
        return '';
    });

    let packageVersionListJson = await PackageVersionListCommand.run( args );

    if ( packageVersionListJson === undefined || packageVersionListJson.status !== 0 ) {
        packageVersionListJson = await PackageVersionListCommand.run( args );
    }

    // Stop capturing stdout.
    unhookIntercept();

    thisUx.stopSpinner();

    return packageVersionListJson as DevHubPackageVersion[];
}

export async function retrieveAllPackageInfo( thisDevHubOrg: Org, thisUx: UX ) {

    thisUx.startSpinner('Retrieving all package information from Dev Hub....');

    // execute the force:package:version:list command
    const args = [];

    // USERNAME argument
    args.push('--targetdevhubusername');
    args.push(`${thisDevHubOrg.getUsername()}`);

    // have the output returned as JSON
    args.push('--json');

    // up the log level
    args.push('--loglevel');
    args.push('debug');

    const intercept = require('intercept-stdout');

    // tslint:disable-next-line: only-arrow-functions
    const unhookIntercept = intercept(function(text) {
        return '';
    });

    let packageListJson = await PackageListCommand.run( args );

    if ( packageListJson === undefined || packageListJson.status !== 0 ) {
        packageListJson = await PackageListCommand.run( args );
    }

    // Stop capturing stdout.
    unhookIntercept();

    thisUx.stopSpinner();

    return packageListJson as DevHubPackage[];
}
