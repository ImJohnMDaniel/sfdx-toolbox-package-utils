import { UX } from '@salesforce/command';
import { Org } from '@salesforce/core';
import { DevHubPackage } from '../types/devhub_package';
import { DevHubPackageVersion } from '../types/devhub_package_version';
import { InquirerOption } from '../types/inquirer_option';
import { ProjectPackageDirectoryDependency } from '../types/project_package_directory_dependency';
import forcePackageCommand = require('./forceCommands/force_package');
import { Utils } from './utils';
import { readFileSync } from 'fs';

export class DevHubDependencies {

    public static async getInstance(thisDevHubOrg: Org, thisUx: UX, pathToPackageInfosFromDevHubOverride: string, pathToPackageVersionInfosFromDevHubOverride: string) {

        // get all of the package information from the DevHub
        const allPackageInfosFromDevHub = pathToPackageInfosFromDevHubOverride
                                            ? await JSON.parse(readFileSync(pathToPackageInfosFromDevHubOverride, 'utf-8')).result as DevHubPackage[]
                                            : await forcePackageCommand.retrieveAllPackageInfo(thisDevHubOrg, thisUx);
        // const allPackageInfosFromDevHub = await forcePackageCommand.retrieveAllPackageInfo(thisDevHubOrg, thisUx);
        // console.log('-----------------------');
        // console.log('pathToPackageInfosFromDevHubOverride = ' + pathToPackageInfosFromDevHubOverride);
        // console.log('-----------------------');
        // console.log(allPackageInfosFromDevHub);
        // console.log('-----------------------');
        // get all of the package version information from the DevHub
        const allPackageVersionInfosFromDevHub = pathToPackageVersionInfosFromDevHubOverride
                                                    ? await JSON.parse(readFileSync(pathToPackageVersionInfosFromDevHubOverride, 'utf-8')).result as DevHubPackageVersion[]
                                                    : await forcePackageCommand.retrieveAllPackageVersionInfo(thisDevHubOrg, thisUx);
        // const allPackageVersionInfosFromDevHub = await forcePackageCommand.retrieveAllPackageVersionInfo(thisDevHubOrg, thisUx);
        // return a new instance of the DevHubDependencies primed with info that it needs
        return new DevHubDependencies(thisUx, allPackageInfosFromDevHub, allPackageVersionInfosFromDevHub);
    }

    private allPackageInfosFromDevHub: DevHubPackage[];
    private allPackageVersionInfosFromDevHub: DevHubPackageVersion[];
    private ux: UX;
    private currentBranch: string = '';
    private currentPackageDependency: ProjectPackageDirectoryDependency;
    //                                                      PACKAGE2ID  BRANCH      MAJOR       MINOR       PATCH       BUILD
    private devHubPackageVersionInfosByPackageAndBranchMap: Map<string, Map<string, Map<number, Map<number, Map<number, Map<number, DevHubPackageVersion>>>>>>;
    //                                                              PACKAGE2ID  BRANCH      MAJOR       MINOR       PATCH       BUILD
    private devHubPackageVersionInfosReleasedByPackageAndBranchMap: Map<string, Map<string, Map<number, Map<number, Map<number, Map<number, DevHubPackageVersion>>>>>>;
    private devHubPackageVersionInfosBySubscriberPackageVersionMap: Map<string, DevHubPackageVersion>; // SubscriberPackageVersionID is the key
    private devHubPackageInfosBySubscriberPackageMap: Map<string, DevHubPackage>;

    private constructor(thisUx: UX, allPackageInfosFromDevHub: DevHubPackage[], allPackageVersionInfosFromDevHub: DevHubPackageVersion[]) {
        // console.log('DevHubDependencies constructor called');
        this.ux = thisUx;
        this.allPackageInfosFromDevHub = allPackageInfosFromDevHub;
        this.allPackageVersionInfosFromDevHub = allPackageVersionInfosFromDevHub;

        this.initialize();
    }

    public for(currentPackageDependencyToUse: ProjectPackageDirectoryDependency) {
        // fill in the gaps if the DevHub knows them
        if ( currentPackageDependencyToUse.getPackage2Id() === undefined
            && this.devHubPackageVersionInfosBySubscriberPackageVersionMap.has(currentPackageDependencyToUse.getSubscriberPackageVersionId())  ) {
            // console.log('currentPackageDependencyToUse.getSubscriberPackageVersionId() : ' + currentPackageDependencyToUse.getSubscriberPackageVersionId());
            // console.log('this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get( currentPackageDependencyToUse.getSubscriberPackageVersionId() ).Version : ' + this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get( currentPackageDependencyToUse.getSubscriberPackageVersionId() ).Version);
            currentPackageDependencyToUse.setPackageAndVersionNumber( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get( currentPackageDependencyToUse.getSubscriberPackageVersionId() ).Package2Id, this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get( currentPackageDependencyToUse.getSubscriberPackageVersionId() ).Version);
        }

        this.currentPackageDependency = currentPackageDependencyToUse;
        return this;
    }

    public onBranch(branch: string) {
        this.currentBranch = branch;
        return this;
    }

    public getPackage2IDForCurrentDependency(): string {
        return this.currentPackageDependency.getPackage2Id() ? this.currentPackageDependency.getPackage2Id()
            : this.currentPackageDependency.getSubscriberPackageVersionId() ? this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId()).Package2Id
                : undefined;
    }

    public prepareRelatedNonPinnedDependencyOptionsForCurrentDependency(): InquirerOption[] {
        const options: InquirerOption[] = [];
        this.createNonPinnedSameMajorMinorPatchVersion(options);
        return options;
    }

    public prepareRelatedReleasedDependencyOptionsForCurrentDependency(branchNamesThatContainReleasedVersions?: string[]): InquirerOption[] {
        const options: InquirerOption[] = [];
        this.findLatestBuildsReleased(options, branchNamesThatContainReleasedVersions, true);
        return options;
    }

    public prepareSameDependencyOptionForCurrentDependency(): InquirerOption[] {
        const options: InquirerOption[] = [];
        this.createSameOptionAsCurrent(options);
        return options;
    }

    public prepareRelatedDependencyOptionsForCurrentDependency(branchNamesThatContainReleasedVersions?: string[]): InquirerOption[] {
        // TODO: implement "Is there a newer Major version available?"
        // There is a distinction between "next available version" and "next avaialble released version"
        // There is a distinction between "the base/null branch" verses the "feature branch" that is coming from Branch flag
        const options: InquirerOption[] = [];

        const onlyLatestBuildReleasedOptions: InquirerOption[] = [];

        const versionsFound: Set<String> = new Set<String>();

        this.logger('mark 2A');
        // Is there a released version that is available on the main branch?
        //  if there is a release version then we will hold adding that to the options array until later 
        //  but the other find requests will 
        // Is there a released version that is available on the main branch?
        this.findLatestBuildsReleased(onlyLatestBuildReleasedOptions, branchNamesThatContainReleasedVersions, true, versionsFound);
        this.logger(onlyLatestBuildReleasedOptions.length);
        this.logger('mark 2B');
        this.logger(options.length);
        // What is the latest build version on the branch regardless of Major.Minor.Patch numbers?
        this.findLatestCurrentBranchBuilderVersion(options, versionsFound);
        this.logger('mark 2C');
        this.logger(options.length);
        // Is there a newer Major.Minor.Patch version availble?
        this.findLatestMainBranchBuildSameMajorMinorPatchVersion(options, branchNamesThatContainReleasedVersions, versionsFound);
        this.logger('mark 2D');
        this.logger(options.length);
        // Is there a newer Major.Minor version availble?
        this.findLatestMainBranchBuildSameMajorMinorVersion(options, branchNamesThatContainReleasedVersions, versionsFound);
        this.logger('mark 2E');
        this.logger(options.length);
        // Is there a newer Major version availble?
        this.findLatestMainBranchBuildVersion(options, branchNamesThatContainReleasedVersions, versionsFound);
        this.logger('mark 2F');
        this.logger(options.length);
        // add the onlyLatestBuildReleasedOptions, if available
        if ( onlyLatestBuildReleasedOptions.length > 0 ) {
            // options.push(onlyLatestBuildReleasedOptions[0]);
            onlyLatestBuildReleasedOptions.forEach((onlyLatestBuildReleasedOption: InquirerOption) => {
                options.push(onlyLatestBuildReleasedOption);
            });
            this.logger('mark 2.5A');
            this.logger(options.length);
        }
        
        // Create "package@CurrentMajor.CurrentMinor.CurrentPatch-LATEST" version entry
        this.createNonPinnedSameMajorMinorPatchVersion(options);
        this.logger('mark 2G');
        this.logger(options.length);

        // Create an option to keep the current version specified in the sfdx-project.json
        this.createSameOptionAsCurrent(options);
        this.logger('mark 2H');
        this.logger(options.length);

        return options;
    }

    public getAlias(): string {
        return this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId()) 
                        // ? this.createAliasForPackageVersion( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId()) ) 
                        ? Utils.createAliasForPackageVersionFromDevHubPackageVersion( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId()) ) 
                        : undefined;
    }

    /**
     * The DevHub knows about a dependency if...
     * -- the PackageVersionId (04t) is owned by the DevHub
     * -- the Package2Id (0Ho) is owned by the DevHub
     */
    public knowsAboutThisDependency(): boolean {
        // console.log('knowsAboutThisDependency starts');
        // console.log(this.currentPackageDependency);
        // console.log('_________________________');
        const subscriberPackageVersionId = this.currentPackageDependency.getSubscriberPackageVersionId()
                                                ? this.currentPackageDependency.getSubscriberPackageVersionId()
                                                : this.resolvePackageVersionId(this.currentPackageDependency).getSubscriberPackageVersionId();
        return this.devHubPackageVersionInfosBySubscriberPackageVersionMap.has(subscriberPackageVersionId)
            || this.devHubPackageInfosBySubscriberPackageMap.has(this.currentPackageDependency.getPackage2Id());
    }

    public findAliasForSubscriberPackageVersionId(subscriberPackageVersionId: string): string {
        return this.devHubPackageVersionInfosBySubscriberPackageVersionMap.has(subscriberPackageVersionId)
                        // ? this.createAliasForPackageVersion( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(subscriberPackageVersionId) )
                        ? Utils.createAliasForPackageVersionFromDevHubPackageVersion( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(subscriberPackageVersionId) )
                        : undefined;
    }

    public findAliasForPackage2Id(package2Id: string): string {
        return this.devHubPackageInfosBySubscriberPackageMap.has(package2Id)
                        // ? this.createAliasForPackage( this.devHubPackageInfosBySubscriberPackageMap.get(package2Id) )
                        ? Utils.createAliasForPackageFromDevHubPackage( this.devHubPackageInfosBySubscriberPackageMap.get(package2Id) )
                        : undefined;
    }

    public findDependencyBySubscriberPackageVersionId(subscriberPackageVersionId: string): DevHubPackageVersion {
        return this.devHubPackageVersionInfosBySubscriberPackageVersionMap.has(subscriberPackageVersionId)
                        ? this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(subscriberPackageVersionId)
                        : undefined;
    }

    private createOptionBySubscriberPackageVersionId(packageVersion: DevHubPackageVersion, extraNameText: string, branchText: string): InquirerOption {
        const option = new InquirerOption();
        option.value = packageVersion.SubscriberPackageVersionId;
        // option.short = this.createVersionAliasSegmentString( packageVersion.Version, branchText );
        // option.name = extraNameText + ': ' + this.createVersionAliasSegment(packageVersion);
        option.short = Utils.createVersionAliasSegmentString(packageVersion.Version, branchText );
        option.name = extraNameText + ': ' + Utils.createVersionAliasSegment(packageVersion);
        return option;
    }

    private createOptionByPackage2Id(packageVersion: DevHubPackageVersion, extraNameText: string): InquirerOption {
        const aliasSegment: string = packageVersion.MajorVersion + '.' + packageVersion.MinorVersion + '.' + packageVersion.PatchVersion + '.LATEST';

        const option = new InquirerOption();
        option.value = packageVersion.Package2Id + '|' + aliasSegment;
        option.short = aliasSegment;
        option.name = extraNameText;

        return option;
    }

    private createSameOptionAsCurrent(options: InquirerOption[]) {
        this.logger('devHub.createSameOptionAsCurrent method called');
        // add the current version to allow for no change
        if ( this.currentPackageDependency.getSubscriberPackageVersionId() ) {
            options.push(this.createOptionBySubscriberPackageVersionId( this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId())
                                                                        , 'Current version specified'
                                                                        , this.devHubPackageVersionInfosBySubscriberPackageVersionMap.get(this.currentPackageDependency.getSubscriberPackageVersionId()).Branch));
        }
    }

    /*
     *  when used, all dependencies that are owned by the current Dev Hub will be set to X.Y.Z.LATEST, unless the X.Y.Z version has been released
     *  How does this method ensure that the version requested doesn't have a released version
     *      from a later version.
     *      If you ask for 0.1.0.LATEST but there is a version 0.2.0.x that is released, then what should be returned?
     *          0.1.0.LATEST --- no
     *          0.2.0.LATEST --- no, the 0.2.0 is already released
     *          0.3.0.LATEST --- probably
     */
    private createNonPinnedSameMajorMinorPatchVersion(options: InquirerOption[]) {
        this.logger('devHub.createNonPinnedSameMajorMinorPatchVersion method called');
        // console.log('createNonPinnedSameMajorMinorPatchVersion starts');

        // ?????: I am commenting this section out for now as, upon review, I am not certain why it is here.  
        // // find the latest released version
        // const latestReleaseOptions = [] as InquirerOption[];
        // this.findLatestBuildReleased(latestReleaseOptions, false);

        // assemble the version number
        let versionNumber = this.currentPackageDependency.getMajorVersionNumber() + '.' + this.currentPackageDependency.getMinorVersionNumber() + '.' + this.currentPackageDependency.getPatchVersionNumber();

        // the findBlock command works through the supplied devHubPackageVersionInfosByPackageAndBranchMap 
        // this.currentPackageDependency.getMajorVersionNumber()

        // In this case, the branch really doesn't matter.  Just either supply the currentBranch or empty space
        let currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosByPackageAndBranchMap, CHUNK_LEVEL.PATCH, this.currentBranch);
        // console.log('currentBuildBlock 2');
        // console.log(currentBuildBlock);
        if (currentBuildBlock === undefined) {
            currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosByPackageAndBranchMap, CHUNK_LEVEL.PATCH, '');
            // console.log('currentBuildBlock 3');
            // console.log(currentBuildBlock);
        }
        if (currentBuildBlock === undefined) {
            currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosByPackageAndBranchMap, CHUNK_LEVEL.MINOR, '');
            versionNumber = this.currentPackageDependency.getMajorVersionNumber() + '.' + this.currentPackageDependency.getMinorVersionNumber();
            // console.log('currentBuildBlock 4');
            // console.log(currentBuildBlock);
        }
        if (currentBuildBlock) {
            options.push(this.createOptionByPackage2Id(this.findLatestBuildFromBlock(currentBuildBlock), 'Non-pinned latest ' + versionNumber + ' build'));
        } else {
            this.ux.log('    -- No option found for latest build on same major and minor version of branch : ' + this.currentBranch);
        }
        // console.log('createNonPinnedSameMajorMinorPatchVersion finishes');
    }

    private findVersion(options: InquirerOption[], versionsFound: Set<String>, chunkLevel: CHUNK_LEVEL, branchName: string) {
        const currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosByPackageAndBranchMap, chunkLevel, branchName);
        const branchNameFullSnippet = branchName ? 'build branch - ' + branchName : 'main build branch';
        let versionTypeSnippet = 'major';
        if ( chunkLevel >= CHUNK_LEVEL.MINOR ) {
            if ( chunkLevel == CHUNK_LEVEL.MINOR ) {
                versionTypeSnippet += ' and minor';
            } else {
                versionTypeSnippet += ', minor';
            }
        }
        if ( chunkLevel >= CHUNK_LEVEL.PATCH ) {
            versionTypeSnippet += ', and patch';
        }
        versionTypeSnippet += ' version';

        let versionNumberSnippet = 'Latest ';
        if ( chunkLevel > CHUNK_LEVEL.MAJOR ) {
            versionNumberSnippet += this.currentPackageDependency.getMajorVersionNumber();
        }
        if ( chunkLevel >= CHUNK_LEVEL.MINOR ) {
            versionNumberSnippet += '.' + this.currentPackageDependency.getMinorVersionNumber();
        }
        if ( chunkLevel >= CHUNK_LEVEL.PATCH ) {
            versionNumberSnippet += '.' + this.currentPackageDependency.getPatchVersionNumber();
        }

        if (currentBuildBlock) {
            const devhubPackageVersion = this.findLatestBuildFromBlock(currentBuildBlock);
            if ( ! versionsFound.has(devhubPackageVersion.SubscriberPackageVersionId) ) {
                versionsFound.add(devhubPackageVersion.SubscriberPackageVersionId);
                options.push(this.createOptionBySubscriberPackageVersionId(devhubPackageVersion
                            , versionNumberSnippet
                                + ' version on ' + branchNameFullSnippet
                            , branchName));
            } else {
                this.ux.log('    -- Latest build on same ' + versionTypeSnippet + ' on the '
                                + branchNameFullSnippet + ' included in options already');
            }
        } else {
            this.ux.log('    -- No option found for latest build on same ' + versionTypeSnippet + ' on the ' 
                                + branchNameFullSnippet);
        }
    }

    private findLatestMainBranchBuildSameMajorMinorVersion(options: InquirerOption[], branchNamesThatContainReleasedVersions: string[], versionsFound: Set<String>) {
        this.logger('devHub.findLatestMainBranchBuildSameMajorMinorVersion method called');
        this.findVersion( options, versionsFound, CHUNK_LEVEL.MINOR, undefined);
        if ( branchNamesThatContainReleasedVersions ) {
            branchNamesThatContainReleasedVersions.forEach((branchName: string) => {
                this.findVersion( options, versionsFound, CHUNK_LEVEL.MINOR, branchName);
            });
        }

    }

    private findLatestMainBranchBuildSameMajorMinorPatchVersion(options: InquirerOption[], branchNamesThatContainReleasedVersions: string[], versionsFound: Set<String>) {
        this.logger('devHub.findLatestMainBranchBuildSameMajorMinorPatchVersion method called');
        this.findVersion( options, versionsFound, CHUNK_LEVEL.PATCH, undefined);
        if ( branchNamesThatContainReleasedVersions ) {
            branchNamesThatContainReleasedVersions.forEach((branchName: string) => {
                this.findVersion( options, versionsFound, CHUNK_LEVEL.PATCH, branchName);
            });
        }
    }

    private findLatestMainBranchBuildVersion(options: InquirerOption[], branchNamesThatContainReleasedVersions: string[], versionsFound: Set<String>) {
        this.logger('devHub.findLatestMainBranchBuildVersion method called');
        this.findVersion( options, versionsFound, CHUNK_LEVEL.MAJOR, undefined);
        if ( branchNamesThatContainReleasedVersions ) {
            branchNamesThatContainReleasedVersions.forEach((branchName: string) => {
                this.findVersion( options, versionsFound, CHUNK_LEVEL.MAJOR, branchName);
            });
        }
    }
    
    private findLatestCurrentBranchBuilderVersion(options: InquirerOption[], versionsFound: Set<String>) {
        this.logger('devHub.findLatestCurrentBranchBuilderVersion method called');
        if ( this.currentBranch ) {
            const currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosByPackageAndBranchMap, CHUNK_LEVEL.PATCH, this.currentBranch);

            if (currentBuildBlock) {
                const devhubPackageVersion = this.findLatestBuildFromBlock(currentBuildBlock);
                if ( ! versionsFound.has(devhubPackageVersion.SubscriberPackageVersionId) ) {
                    versionsFound.add(devhubPackageVersion.SubscriberPackageVersionId);
                    options.push(this.createOptionBySubscriberPackageVersionId(devhubPackageVersion, 'Latest version on \'' + this.currentBranch + '\' branch', this.currentBranch));
                } else {
                    this.ux.log('    -- Latest build on \'' + this.currentBranch + '\' branch included in options already');
                }
            } else {
                this.ux.log('    -- No option found for latest build on branch : ' + this.currentBranch);
            }
        }
    }

    private findLatestBuildsReleased(options: InquirerOption[], branchNamesThatContainReleasedVersions: string[], isLoggingToUX?: boolean, versionsFound?: Set<String>) {
        this.logger('devHub.findLatestBuildsReleased method called');
        // find the latest build released on branch null
        this.findLatestBuildReleasedForBranch(options, '', isLoggingToUX, versionsFound);
        // find the latest build released on each of the branchNamesThatContainReleasedVersions
        if ( branchNamesThatContainReleasedVersions ) {
            branchNamesThatContainReleasedVersions.forEach((branchName: string) => {
                this.findLatestBuildReleasedForBranch(options, branchName, isLoggingToUX, versionsFound);
            });
        }
    }

    private findLatestBuildReleasedForBranch(options: InquirerOption[], branchName: string, isLoggingToUX?: boolean, versionsFound?: Set<String>) {
        const currentBuildBlock = this.findBlock(this.devHubPackageVersionInfosReleasedByPackageAndBranchMap, CHUNK_LEVEL.MAJOR, branchName);

        const optionMessage = branchName ? 'Latest released version on build branch - ' + branchName
                                        : 'Latest released version on main build branch';
        const noOptionMessage = branchName ? '    -- No option found for released version build on build branch - ' + branchName
                                        :  '    -- No option found for released version build on main build branch';
        
        if (currentBuildBlock) {
            const devhubPackageVersion = this.findLatestBuildFromBlock(currentBuildBlock);
            if ( versionsFound ) {
                versionsFound.add(devhubPackageVersion.SubscriberPackageVersionId);
            }
            options.push(this.createOptionBySubscriberPackageVersionId(devhubPackageVersion, optionMessage, branchName));
        } else {
            if ( isLoggingToUX ) {
                this.ux.log(noOptionMessage);
            }
        }
    }

    private resolvePackageVersionId(packageDependency: ProjectPackageDirectoryDependency): ProjectPackageDirectoryDependency {
        // console.log('************************************************************************************************************************');
        // console.log(packageDependency);
        // console.log('packageDependency.isLatest() == ' + packageDependency.isLatest());
        // console.log('packageDependency.isPinned() == ' + packageDependency.isPinned());
        // console.log('A');
        if (!packageDependency.getSubscriberPackageVersionId()) {
            // console.log('B');
            if (this.devHubPackageVersionInfosByPackageAndBranchMap.has(packageDependency.getPackage2Id())) {
                // console.log('C');
                // console.log('this.currentBranch == ' + this.currentBranch);
                if (this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).has(this.currentBranch)) {
                    // console.log('D');
                    if (this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).has(packageDependency.getMajorVersionNumber())) {
                        // console.log('E');
                        if (this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).has(packageDependency.getMinorVersionNumber())) {
                            // console.log('F');
                            if (this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).get(packageDependency.getMinorVersionNumber()).has(packageDependency.getPatchVersionNumber())) {
                                // console.log('G');
                                if (this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).get(packageDependency.getMinorVersionNumber()).get(packageDependency.getPatchVersionNumber()).has(packageDependency.getBuildVersionNumber())) {
                                    // console.log('H');
                                    // console.log('BUILD OVER HERE ************************************************************************');
                                    packageDependency.setSubscriberPackageVersionId(this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).get(packageDependency.getMinorVersionNumber()).get(packageDependency.getPatchVersionNumber()).get(packageDependency.getBuildVersionNumber()).SubscriberPackageVersionId);
                                } else if (packageDependency.getBuildVersionNumber() === undefined && !packageDependency.isPinned()) { // Build version is null
                                    // find the latest version for this build version block
                                    // Map<number, DevHubPackageVersion>
                                    // console.log('BUILD HERE ************************************************************************');
                                    const currentMajorBuildBlock = this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).get(packageDependency.getMinorVersionNumber()).get(packageDependency.getPatchVersionNumber());
                                    packageDependency.setSubscriberPackageVersionId(this.findLatestBuildFromBlock(currentMajorBuildBlock).SubscriberPackageVersionId);
                                }
                            } else if (packageDependency.getPatchVersionNumber() === undefined && !packageDependency.isPinned()) { // patch version is null
                                // find the latest version for this patch version block
                                // Map<number, Map<number, DevHubPackageVersion>>
                                // console.log('PATCH HERE ************************************************************************');
                                const currentMajorBuildBlock = this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber()).get(packageDependency.getMinorVersionNumber());
                                packageDependency.setSubscriberPackageVersionId(this.findLatestBuildFromBlock(currentMajorBuildBlock).SubscriberPackageVersionId);
                            }
                        } else if (packageDependency.getMinorVersionNumber() === undefined && !packageDependency.isPinned()) { // minor version is null
                            // find the latest version for this major version block
                            // Map<number, Map<number, Map<number, DevHubPackageVersion>>>
                            // console.log('MINOR HERE ************************************************************************');
                            const currentMajorBuildBlock = this.devHubPackageVersionInfosByPackageAndBranchMap.get(packageDependency.getPackage2Id()).get(this.currentBranch).get(packageDependency.getMajorVersionNumber());
                            packageDependency.setSubscriberPackageVersionId(this.findLatestBuildFromBlock(currentMajorBuildBlock).SubscriberPackageVersionId);
                        }
                    }
                }
            }
        }
        // console.log('Z');
        return packageDependency;
    }

    // tslint:disable-next-line: no-any
    private findLatestBuildFromBlock(versionBlock: Map<number, any>): DevHubPackageVersion {
        // This needs to work from any level versionBlock - i.e. Major, Minor, Patch, or Build.
        // Once it finds the tip of the current block, the value of the map will either be a Map<number, any> or a DevHubPackageVersion.
        // If it is Map<number, any>, then the method needs to be recursively called until it reaches the DevHubPackageVersion.
        // console.log('________________________________________________________________________');
        // console.log(versionBlock);
        // console.log('________________________________________________________________________');

        const versionKeys = versionBlock == null ? [] : [...versionBlock.keys()];
        const maxVersionNumber = versionKeys.reduce((max, p) => p > max ? p : max, versionKeys[0]);

        return versionBlock.get(maxVersionNumber) instanceof Map ? this.findLatestBuildFromBlock(versionBlock.get(maxVersionNumber)) : versionBlock.get(maxVersionNumber);
    }

    // tslint:disable-next-line: no-any
    private findBlock(packageVersionMapToInspect: Map<string, Map<string, Map<number, Map<number, Map<number, Map<number, DevHubPackageVersion>>>>>>, chunkLevel: CHUNK_LEVEL, branchToEvalute: string): Map<number, any> {
        // packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(this.currentBranch).get(this.currentPackageDependency.getMajorVersionNumber()).get(this.currentPackageDependency.getMinorVersionNumber());
        // console.log('mark find 1');
        // console.log(this.currentPackageDependency);
        // console.log(this.currentPackageDependency.getPackage2Id());
        // console.log(branchToEvalute);
        // console.log(packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()));

        let output;
        if ( packageVersionMapToInspect.has(this.currentPackageDependency.getPackage2Id()) ) {
            // console.log('mark find 1.5');
            // console.log('packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute)');
            // console.log(packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute));
            // console.log('branchToEvalute');
            // console.log(branchToEvalute);

            // If the branchToEvalute is undefined, treat it as an empty string
            branchToEvalute = branchToEvalute === undefined ? '' : branchToEvalute;
            if (chunkLevel >= CHUNK_LEVEL.MAJOR
                && packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute) !== undefined) {
                // console.log('mark find 2');
                // console.log(branchToEvalute);
                // console.log(this.currentPackageDependency.getMajorVersionNumber());
                // console.log(packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute));

                if (chunkLevel >= CHUNK_LEVEL.MINOR
                    && packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute).get(this.currentPackageDependency.getMajorVersionNumber()) !== undefined) {
                    // console.log('mark find 3');
                    if (chunkLevel >= CHUNK_LEVEL.PATCH
                        && packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute).get(this.currentPackageDependency.getMajorVersionNumber()).get(this.currentPackageDependency.getMinorVersionNumber()) !== undefined) {
                            // console.log('mark find 4');
                            output = packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute).get(this.currentPackageDependency.getMajorVersionNumber()).get(this.currentPackageDependency.getMinorVersionNumber()).get(this.currentPackageDependency.getPatchVersionNumber());
                    } else {
                        // console.log('mark find 7');
                        output = packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute).get(this.currentPackageDependency.getMajorVersionNumber()).get(this.currentPackageDependency.getMinorVersionNumber());
                    }
                } else {
                    // console.log('mark find 8');
                    output = packageVersionMapToInspect.get(this.currentPackageDependency.getPackage2Id()).get(branchToEvalute).get(this.currentPackageDependency.getMajorVersionNumber());
                }
                // console.log('mark find 9');
            }
        }
        // console.log('mark find last');
        // console.log(output);
        return output;
    }

    private initialize() {
        // console.log('initialize method called');
        this.initializeDevHubPackageVersionInfosByPackageAndBranchMap();
        this.initializeDevHubPackageVersionInfosBySubscriberPackageVersionMap();
        this.initializeDevHubPackageInfosBySubscriberPackageMap();
        // console.log('initialize method completed');
    }

    private initializeDevHubPackageVersionInfosBySubscriberPackageVersionMap() {
        // console.log('initializeDevHubPackageVersionInfosBySubscriberPackageVersionMap method called');
        this.devHubPackageVersionInfosBySubscriberPackageVersionMap = new Map();

        this.allPackageVersionInfosFromDevHub.forEach((element: DevHubPackageVersion) => {
            this.devHubPackageVersionInfosBySubscriberPackageVersionMap.set(element.SubscriberPackageVersionId, element);
        });
        // console.log('initializeDevHubPackageVersionInfosBySubscriberPackageVersionMap method completed');
    }

    private initializeDevHubPackageInfosBySubscriberPackageMap() {
        // console.log('initializeDevHubPackageInfosBySubscriberPackageMap method called');
        this.devHubPackageInfosBySubscriberPackageMap = new Map();

        this.allPackageInfosFromDevHub.forEach((element: DevHubPackage) => {
            // console.log('adding following package to map');
            // console.log(element);
            this.devHubPackageInfosBySubscriberPackageMap.set(element.Id, element);
        });
        // console.log('initializeDevHubPackageInfosBySubscriberPackageMap method completed');
    }

    private initializeDevHubPackageVersionInfosByPackageAndBranchMap() {
        // console.log('initializeDevHubPackageVersionInfosByPackageAndBranchMap method called');
        this.devHubPackageVersionInfosByPackageAndBranchMap = new Map();
        this.devHubPackageVersionInfosReleasedByPackageAndBranchMap = new Map();

        this.allPackageVersionInfosFromDevHub.forEach((element: DevHubPackageVersion) => {
            // add entry for Package2Id
            this.sortElementInMap(this.devHubPackageVersionInfosByPackageAndBranchMap, element);
            if ( element.IsReleased ) {
                this.sortElementInMap(this.devHubPackageVersionInfosReleasedByPackageAndBranchMap, element);
            }
        });
        // console.log('initializeDevHubPackageVersionInfosByPackageAndBranchMap method completed');
    }

    private sortElementInMap( theMap: Map<string, Map<string, Map<number, Map<number, Map<number, Map<number, DevHubPackageVersion>>>>>>, element: DevHubPackageVersion ) {
        // console.log('element.Package2Id == ' + element.Package2Id);
        if (!theMap.has(element.Package2Id)) {
            theMap.set(element.Package2Id, new Map());
        }

        const currentBranch = element.Branch ? element.Branch : '';

        // add entry for Branch
        if (!theMap.get(element.Package2Id).has(currentBranch)) {
            // console.log('Adding branch == `' + currentBranch + '`');
            theMap.get(element.Package2Id).set(currentBranch, new Map());
        }
        // add entry for MajorVersion
        if (!theMap.get(element.Package2Id).get(currentBranch).has(element.MajorVersion)) {
            theMap.get(element.Package2Id).get(currentBranch).set(element.MajorVersion, new Map());
        }
        // add entry for MinorVersion
        if (!theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).has(element.MinorVersion)) {
            theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).set(element.MinorVersion, new Map());
        }
        // add entry for PatchVersion
        if (!theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).get(element.MinorVersion).has(element.PatchVersion)) {
            theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).get(element.MinorVersion).set(element.PatchVersion, new Map());
        }
        // add entry for BuildNumber
        if (!theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).get(element.MinorVersion).get(element.PatchVersion).has(element.BuildNumber)) {
            // add the DevHubPackageVersion to that spot
            theMap.get(element.Package2Id).get(currentBranch).get(element.MajorVersion).get(element.MinorVersion).get(element.PatchVersion).set(element.BuildNumber, element);
        }
    }

    // tslint:disable-next-line: no-any
    private logger(value: any) {
        // console.log(value);
    }

}

enum CHUNK_LEVEL {
    MAJOR = 1,
    MINOR,
    PATCH,
    BUILD
}
