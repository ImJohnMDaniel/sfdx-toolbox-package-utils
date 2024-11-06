import { InstalledPackages, PackagingSObjects } from '@salesforce/packaging';
import {
  PackageDir,
  // PackageDirDependency
} from '@salesforce/schemas';
import { BasePackageDirWithDependencies } from '../schemas/packageDirs.js';

type PackageInstallRequest = PackagingSObjects.PackageInstallRequest;

export const PACKAGE_PREFIX_PACKAGE2 = '0Ho';
export const PACKAGE_PREFIX_PACKAGE2_VERSION = '05i';
export const PACKAGE_PREFIX_SUBSCRIBER_PACKAGE = '033';
export const PACKAGE_PREFIX_SUBSCRIBER_PACKAGE_VERSION = '04t';

export const isPackage2Id = (inputToEvaluate: string): boolean =>
  inputToEvaluate ? inputToEvaluate.startsWith(PACKAGE_PREFIX_PACKAGE2) : false;

export const isPackage2VersionId = (inputToEvaluate: string): boolean =>
  inputToEvaluate ? inputToEvaluate.startsWith(PACKAGE_PREFIX_PACKAGE2_VERSION) : false;

export const isSubscriberPackageId = (inputToEvaluate: string): boolean =>
  inputToEvaluate ? inputToEvaluate.startsWith(PACKAGE_PREFIX_SUBSCRIBER_PACKAGE) : false;

export const isSubscriberPackageVersionId = (inputToEvaluate: string): boolean =>
  inputToEvaluate ? inputToEvaluate.startsWith(PACKAGE_PREFIX_SUBSCRIBER_PACKAGE_VERSION) : false;

export const isSubscriberPackageVersionInstalled = (
  installedPackages: InstalledPackages[],
  subscriberPackageVersionId: string
): boolean =>
  installedPackages.some(
    (installedPackage) => installedPackage?.SubscriberPackageVersion?.Id === subscriberPackageVersionId
  );

export const reducePackageInstallRequestErrors = (request: PackageInstallRequest): string => {
  let errorMessage = '<empty>';
  const errors = request?.Errors?.errors;
  if (errors?.length) {
    errorMessage = 'Installation errors: ';
    for (let i = 0; i < errors.length; i++) {
      errorMessage += `\n${i + 1}) ${errors[i].message}`;
    }
  }

  return errorMessage;
};

// export const isPackagingDirectory: (packageDir: PackageDir) => packageDir is PackagePackageDir => isPackagingDir(packageDir);
// export const isPackagingDirectory = (packageDir: PackageDir): packageDir is PackagePackageDir => isPackagingDir(packageDir);

// export declare const isDependenciesPackagingDirectory: (packageDir: PackageDir) => packageDir is BasePackageDirWithDependencies;
// export const isDependenciesPackagingDirectory = (packageDir: PackageDir): boolean => return packageDir instanceof BasePackageDirWithDependencies;
// export const isDependenciesPackagingDirectory = (packageDir: PackageDir): boolean => packageDir instanceof BasePackageDirWithDependencies;
// export const isDependenciesPackagingDirectory = (packageDir: PackageDir): boolean => packageDir typeof BasePackageDirWithDependencies;
// export declare const isDependenciesPackagingDirectory: (packageDir: PackageDir) => packageDir is BasePackageDirWithDependencies;

export const isDependenciesPackagingDirectory = (
  packageDir: PackageDir
): packageDir is BasePackageDirWithDependencies => isDependenciesPackagingDir(packageDir);

const isDependenciesPackagingDir = (packageDir: PackageDir): boolean =>
  // 'dependencies' in packageDir && typeof packageDir.dependencies === PackageDirDependency[];
  'dependencies' in packageDir &&
  // && typeof packageDir.dependencies === PackageDirDependency;
  // && typeof packageDir?.dependencies === PackageDirDependency[]
  Array.isArray(packageDir?.dependencies);

// export {};

// export const isDependenciesPackagingDirectory = (packageDir: PackageDir): boolean => (packageDir is BasePackageDirWithDependencies);
