export type ToolType = 'extension' | 'npm' | 'artifactory';

export interface ExtensionSource {
    extensionId: string;
    vsixPath: string;
}

export interface NpmSource {
    packageName: string;
    dependencyType: 'dependencies' | 'devDependencies';
}

export interface ArtifactorySource {
    repository: string;
    artifactPath: string;
    targetPath: string;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    type: ToolType;
    version: string;
    registrySource: ExtensionSource | NpmSource | ArtifactorySource;
    deprecated?: boolean;
}
