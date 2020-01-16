import { UX } from '@salesforce/command';
import { Org } from '@salesforce/core';
import * as _ from 'lodash';
import { PackageInstalledListCommand } from 'salesforce-alm/dist/commands/force/package/installed/list';
import { PackageListCommand } from 'salesforce-alm/dist/commands/force/package/list';
import { PackageVersionListCommand } from 'salesforce-alm/dist/commands/force/package/version/list';
import { DevHubPackage } from '../../types/debhub_package';
import { DevHubPackageVersion } from '../../types/devhub_package_version';
import { SubscriberInstalledPackageVersion } from '../../types/subscriber_installed_package_version';

export async function retrievePackagesCurrentlyInstalled( thisOrg: Org, thisUx: UX ) {

    thisUx.startSpinner('Retrieving packages currently installed in org....');

    // execute the force:package:installed:list command
    const args = [];

    // USERNAME argument
    args.push('--targetusername');
    args.push(`${thisOrg.getUsername()}`);

    // have the output returned as JSON
    args.push('--json');

    // up the log level
    args.push('--loglevel');
    args.push('debug');

    const intercept = require('intercept-stdout');

    // tslint:disable-next-line: only-arrow-functions
    const unhookIntercept = intercept(function(text) {
        // logs.push(text);
        return '';
    });

    let installedPackageListJson = await PackageInstalledListCommand.run( args );

    if ( installedPackageListJson === undefined || installedPackageListJson.status !== 0 ) {
        installedPackageListJson = await PackageInstalledListCommand.run( args );
    }

    // Stop capturing stdout.
    unhookIntercept();

    thisUx.stopSpinner();

    return installedPackageListJson as SubscriberInstalledPackageVersion[];
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
