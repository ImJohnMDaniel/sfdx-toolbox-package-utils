export class Constants {
    public static readonly PACKAGE_ID_PREFIX = '0Ho';
    public static readonly PACKAGE_VERSION_ID_PREFIX = '04t';

    public static isPackageId( inputToEvaluate: string ): boolean {
        return inputToEvaluate ? inputToEvaluate.startsWith(Constants.PACKAGE_ID_PREFIX) : false;
    }

    public static isPackageVersionId( inputToEvaluate: string ): boolean {
        return inputToEvaluate ? inputToEvaluate.startsWith(Constants.PACKAGE_VERSION_ID_PREFIX) : false;
    }
}
