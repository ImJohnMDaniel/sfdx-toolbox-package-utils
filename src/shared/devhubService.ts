import { Org, SfdxError } from '@salesforce/core';
// import { DevHubPackageVersion } from '../types/devhub_package_version';
import { Constants } from './constants';
// import forcePackageCommand = require('./forceCommands/force_package');

export function resolveDevHubOrgInstance(thisOrg: Org): Org {
  if (!thisOrg) {
    throw new SfdxError('Method Parameter Exception: the following parameters must be supplied for resolveDevHubOrgInstance() -- thisOrg');
  }

  let theDevHubOrg: Org;
  if (thisOrg.isDevHubOrg()) {
    theDevHubOrg = thisOrg;
  } else if (thisOrg.getDevHubOrg()) {
    // tslint:disable-next-line: no-floating-promises
    thisOrg.getDevHubOrg()
      .then(res => {
        theDevHubOrg = res;
      });
  }
  return theDevHubOrg;
}

export async function resolvePackageVersionId(name: string, version: string, branch: string, thisOrg: Org) {

  const packageName: string = name;
  // clean up the version string
  if (version) {
    // the version value could be presented wrapped in double quotes.  Those need to be removed.
    version = version.replace('"', '').replace('"', '');
  }

  if (!name || !thisOrg || !name.trim()) { // !version || !version.trim()
    const parameters: string[] = [];

    if (!name || !name.trim()) {
      parameters.push('name');
    }

    if ( packageName.startsWith(Constants.PACKAGE_ID_PREFIX) && (!version || !version.trim())) {
      parameters.push('version');
    }

    if (!thisOrg) {
      parameters.push('thisOrg');
    }

    throw new SfdxError('Method Parameter Exception: the following parameters must be supplied for resolvePackageVersionId() -- ' + parameters.join());
  }

  // Determine if the org supplied is the DevHub or an org that is
  const theDevHubOrg = resolveDevHubOrgInstance(thisOrg);

  //    let packageId = messages.getMessage('invalidPackageName');
  let packageId: string;

  // Keeping original name so that it can be used in error message if needed
  // let packageName = name;

  // // First look if it's an alias
  // if (typeof packageAliasesMap[packageName] !== 'undefined') {
  //   packageName = packageAliasesMap[packageName];
  // }
  // console.log(`packageName: ${packageName}`);
  // console.log(`version: ${version}`);

  if (packageName.startsWith(Constants.PACKAGE_VERSION_ID_PREFIX)) {
    // Package2VersionId is set directly
    packageId = packageName;
  } else if (packageName.startsWith(Constants.PACKAGE_ID_PREFIX)) {
    // Get Package version id from package + versionNumber

    // strip out the "-LATEST" string as it won't be needed in the query.
    const versionWorking = version.toUpperCase().replace('-LATEST', '').replace('.LATEST', '');

    // Split the remaining "Major.Minor.Patch.BuildNumber" version number out to its individual integers.
    const vers = versionWorking.split('.');

    // Assemble the query needed
    let query = 'Select SubscriberPackageVersionId, IsPasswordProtected, IsReleased ';
    query += 'from Package2Version ';
    query += `where Package2Id='${packageName}' and MajorVersion=${vers[0]} and IsDeprecated = false   `;

    // If Minor Version isn't set to LATEST, look for the exact Minor Version
    if (vers[1]) {
      query += `and MinorVersion=${vers[1]} `;
    }

    // If Patch Version isn't set to LATEST, look for the exact Patch Version
    if (vers[2]) {
      query += `and PatchVersion=${vers[2]} `;
    }

    // If Build Number isn't set to LATEST, look for the exact Package Version
    if (vers[3]) {
      query += `and BuildNumber=${vers[3]} `;
    }

    // If Branch is specified, use it to filter
    if (branch) {
      query += `and Branch='${branch.trim()}' `;
    } else {
      query += 'and Branch=NULL ';
    }

    // if the query is looking for a "LATEST", "Non-pinned" version, then we need
    //  to sort the result list in such a manner to that the latest version will
    //  be the first record in the result set.
    query += 'ORDER BY MajorVersion DESC, MinorVersion DESC, PatchVersion DESC, BuildNumber DESC Limit 1';

    // console.log(`Query: ${query}`);

    // Query DevHub to get the expected Package2Version
    const conn = theDevHubOrg.getConnection();

    // tslint:disable-next-line:no-any
    const resultPackageVersionRecord = await conn.tooling.query(query) as any;
    // console.log(resultPackageVersionRecord);

    if (resultPackageVersionRecord.size === 0) {
      // Query returned no result
      const errorMessage = `Unable to find SubscriberPackageVersionId for dependent package ${name}`;
      throw new SfdxError(errorMessage);
    } else {
      packageId = resultPackageVersionRecord.records[0].SubscriberPackageVersionId;
    }
  }

  return packageId;
}

// export async function retrievePackageVersionInfosBySubscriberPackageVersionMap( thisDevHubOrg: Org, thisUx: UX ) {
//   const devHubPacdkageVersionInfosBySubscriberPackageVersionMap = new Map();

//   const allPackageVersionInfosFromDevHub = await forcePackageCommand.retrieveAllPackageVersionInfo(thisDevHubOrg, thisUx);
//   allPackageVersionInfosFromDevHub.forEach((element: DevHubPackageVersion) => {
//     devHubPacdkageVersionInfosBySubscriberPackageVersionMap.set(element.SubscriberPackageVersionId, element);
//   });

//   return devHubPacdkageVersionInfosBySubscriberPackageVersionMap;
// }
// export async function retrievePackageVersionInfosByPackageAndBranchMap( thisDevHubOrg: Org, thisUx: UX ) {

//   const devHubPackageVersionInfosByPackageAndBranchMap = new Map();

//   const allPackageVersionInfosFromDevHub = await forcePackageCommand.retrieveAllPackageVersionInfo(thisDevHubOrg, thisUx);

//   // need to loop through all of the packageVersions and construct a map that sorts by package, branch, and versionNumber

//   allPackageVersionInfosFromDevHub.forEach((element: DevHubPackageVersion) => {
//     // add entry for Package2Id
//     console.log('element.Package2Id == ' + element.Package2Id);
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.has(element.Package2Id) ) {
//       devHubPackageVersionInfosByPackageAndBranchMap.set(element.Package2Id, new Map());
//     }
//     // add entry for Branch
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).has(element.Branch) ) {
//       devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).set(element.Branch, new Map());
//     }
//     // add entry for MajorVersion
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).has(element.MajorVersion) ) {
//       devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).set(element.MajorVersion, new Map());
//     }
//     // add entry for MinorVersion
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).has(element.MinorVersion) ) {
//       devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).set(element.MinorVersion, new Map());
//     }
//     // add entry for PatchVersion
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).get(element.MinorVersion).has(element.PatchVersion) ) {
//       devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).get(element.MinorVersion).set(element.PatchVersion, new Map());
//     }
//     // add entry for BuildNumber
//     if ( ! devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).get(element.MinorVersion).get(element.PatchVersion).has(element.BuildNumber) ) {
//       // add the DevHubPackageVersion to that spot
//       devHubPackageVersionInfosByPackageAndBranchMap.get(element.Package2Id).get(element.Branch).get(element.MajorVersion).get(element.MinorVersion).get(element.PatchVersion).set(element.BuildNumber, element);
//     }
//   });
//   // console.log(devHubPackageVersionInfosByPackageVersionMap.size);
//   // tslint:disable-next-line: no-any
//   // devHubPackageVersionInfosByPackageVersionMap.forEach((value: any, key: string) => { console.log(key); } );

//   return devHubPackageVersionInfosByPackageAndBranchMap;
// }
