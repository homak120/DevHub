import { Tool, ExtensionSource, NpmSource, ArtifactorySource } from '../types/tool';
import { ToolRegistry } from '../types/registry';

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function isExtensionSource(value: unknown): value is ExtensionSource {
    if (!isObject(value)) return false;
    return (
        typeof value.extensionId === 'string' &&
        typeof value.vsixPath === 'string'
    );
}

export function isNpmSource(value: unknown): value is NpmSource {
    if (!isObject(value)) return false;
    return (
        typeof value.packageName === 'string' &&
        (value.dependencyType === 'dependencies' || value.dependencyType === 'devDependencies')
    );
}

export function isArtifactorySource(value: unknown): value is ArtifactorySource {
    if (!isObject(value)) return false;
    return (
        typeof value.repository === 'string' &&
        typeof value.artifactPath === 'string' &&
        typeof value.targetPath === 'string'
    );
}

function isValidSourceForType(type: string, source: unknown): boolean {
    switch (type) {
        case 'extension': return isExtensionSource(source);
        case 'npm': return isNpmSource(source);
        case 'artifactory': return isArtifactorySource(source);
        default: return false;
    }
}

export function isTool(value: unknown): value is Tool {
    if (!isObject(value)) return false;
    const v = value;
    return (
        typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        typeof v.description === 'string' &&
        typeof v.category === 'string' &&
        typeof v.version === 'string' &&
        typeof v.type === 'string' &&
        (v.type === 'extension' || v.type === 'npm' || v.type === 'artifactory') &&
        isValidSourceForType(v.type as string, v.registrySource) &&
        (v.deprecated === undefined || typeof v.deprecated === 'boolean')
    );
}

export function isToolRegistry(value: unknown): value is ToolRegistry {
    if (!isObject(value)) return false;
    return (
        typeof value.version === 'string' &&
        Array.isArray(value.tools) &&
        value.tools.length > 0 &&
        (value.tools as unknown[]).every(isTool)
    );
}
