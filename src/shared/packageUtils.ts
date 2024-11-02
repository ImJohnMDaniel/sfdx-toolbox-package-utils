import { InstalledPackages, PackagingSObjects } from '@salesforce/packaging';

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
