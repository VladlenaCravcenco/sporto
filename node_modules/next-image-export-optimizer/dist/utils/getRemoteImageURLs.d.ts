export declare function getRemoteImageURLs(remoteImageFileName: string, nextConfigFolder: string, folderPathForRemoteImages: string): Promise<{
    remoteImageFilenames: {
        basePath: string;
        file: any;
        dirPathWithoutBasePath: string;
        fullPath: string;
    }[];
    remoteImageURLs: string[];
}>;
