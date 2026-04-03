import { strict as assert } from 'assert';
import {
    isTool,
    isToolRegistry,
    isExtensionSource,
    isNpmSource,
    isArtifactorySource,
} from '../../src/utils/typeGuards';

describe('Type Guards', () => {
    describe('isExtensionSource', () => {
        it('should return true for valid ExtensionSource', () => {
            const source = { extensionId: 'aep.ui-copilot', vsixPath: 'path/to/file.vsix' };
            assert.equal(isExtensionSource(source), true);
        });

        it('should return false for missing extensionId', () => {
            const source = { vsixPath: 'path/to/file.vsix' };
            assert.equal(isExtensionSource(source), false);
        });

        it('should return false for missing vsixPath', () => {
            const source = { extensionId: 'aep.ui-copilot' };
            assert.equal(isExtensionSource(source), false);
        });

        it('should return false for non-object input', () => {
            assert.equal(isExtensionSource(null), false);
            assert.equal(isExtensionSource('string'), false);
            assert.equal(isExtensionSource(42), false);
        });
    });

    describe('isNpmSource', () => {
        it('should return true for valid NpmSource', () => {
            const source = { packageName: '@aep/cli', dependencyType: 'devDependencies' };
            assert.equal(isNpmSource(source), true);
        });

        it('should accept dependencies as dependencyType', () => {
            const source = { packageName: '@aep/cli', dependencyType: 'dependencies' };
            assert.equal(isNpmSource(source), true);
        });

        it('should return false for invalid dependencyType', () => {
            const source = { packageName: '@aep/cli', dependencyType: 'peerDependencies' };
            assert.equal(isNpmSource(source), false);
        });

        it('should return false for missing fields', () => {
            assert.equal(isNpmSource({ packageName: '@aep/cli' }), false);
            assert.equal(isNpmSource({ dependencyType: 'dependencies' }), false);
        });
    });

    describe('isArtifactorySource', () => {
        it('should return true for valid ArtifactorySource', () => {
            const source = {
                repository: 'aep-tools-release',
                artifactPath: 'smartada/2.0.0/smartada.zip',
                targetPath: '.smartada',
            };
            assert.equal(isArtifactorySource(source), true);
        });

        it('should return false for missing fields', () => {
            assert.equal(isArtifactorySource({ repository: 'repo' }), false);
            assert.equal(isArtifactorySource({ repository: 'repo', artifactPath: 'path' }), false);
        });
    });

    describe('isTool', () => {
        const validExtensionTool = {
            id: 'aep-ui-copilot',
            name: 'AEP UI Copilot',
            description: 'AI assistant',
            category: 'Extensions',
            type: 'extension',
            version: '1.2.0',
            registrySource: { extensionId: 'aep.ui-copilot', vsixPath: 'path/to.vsix' },
        };

        it('should return true for valid extension tool', () => {
            assert.equal(isTool(validExtensionTool), true);
        });

        it('should return true for valid npm tool', () => {
            const tool = {
                ...validExtensionTool,
                type: 'npm',
                registrySource: { packageName: '@aep/cli', dependencyType: 'devDependencies' },
            };
            assert.equal(isTool(tool), true);
        });

        it('should return true for valid artifactory tool', () => {
            const tool = {
                ...validExtensionTool,
                type: 'artifactory',
                registrySource: { repository: 'repo', artifactPath: 'path', targetPath: '.dir' },
            };
            assert.equal(isTool(tool), true);
        });

        it('should return false for invalid type', () => {
            const tool = { ...validExtensionTool, type: 'unknown' };
            assert.equal(isTool(tool), false);
        });

        it('should return false for mismatched source and type', () => {
            const tool = {
                ...validExtensionTool,
                type: 'npm',
                registrySource: { extensionId: 'aep.ui-copilot', vsixPath: 'path/to.vsix' },
            };
            assert.equal(isTool(tool), false);
        });

        it('should return false for missing required fields', () => {
            assert.equal(isTool({ id: 'test' }), false);
            assert.equal(isTool(null), false);
            assert.equal(isTool(undefined), false);
        });

        it('should handle optional deprecated field', () => {
            const tool = { ...validExtensionTool, deprecated: true };
            assert.equal(isTool(tool), true);
        });
    });

    describe('isToolRegistry', () => {
        it('should return true for valid registry', () => {
            const registry = {
                version: '1.0.0',
                tools: [
                    {
                        id: 'test',
                        name: 'Test',
                        description: 'A test tool',
                        category: 'Testing',
                        type: 'extension',
                        version: '1.0.0',
                        registrySource: { extensionId: 'test.ext', vsixPath: 'path.vsix' },
                    },
                ],
            };
            assert.equal(isToolRegistry(registry), true);
        });

        it('should return false for empty tools array', () => {
            assert.equal(isToolRegistry({ version: '1.0.0', tools: [] }), false);
        });

        it('should return false for missing version', () => {
            assert.equal(isToolRegistry({ tools: [{}] }), false);
        });

        it('should return false for invalid tool in array', () => {
            const registry = {
                version: '1.0.0',
                tools: [{ id: 'incomplete' }],
            };
            assert.equal(isToolRegistry(registry), false);
        });
    });
});
