import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import { OperationQueue } from '../../src/services/operationQueue';
import { OperationRequest } from '../../src/types/operations';

describe('OperationQueue', () => {
    let queue: OperationQueue;

    beforeEach(() => {
        queue = new OperationQueue();
    });

    afterEach(() => {
        queue.dispose();
        sinon.restore();
    });

    function createRequest(toolId: string): OperationRequest {
        return {
            toolId,
            action: 'install',
            timestamp: Date.now(),
        };
    }

    it('should start with length 0 and no current operation', () => {
        assert.equal(queue.length, 0);
        assert.equal(queue.current, undefined);
    });

    it('should enqueue an operation and return position', () => {
        const handler = sinon.stub().resolves({ toolId: 'a', action: 'install', success: true, message: 'ok', timestamp: Date.now() });
        const position = queue.enqueue(createRequest('tool-a'), handler);
        assert.equal(position, 0);
    });

    it('should process operations in FIFO order', async () => {
        const order: string[] = [];

        const handlerA = () => new Promise<void>((resolve) => {
            order.push('a');
            resolve();
        }).then(() => ({ toolId: 'a', action: 'install' as const, success: true, message: 'ok', timestamp: Date.now() }));

        const handlerB = () => new Promise<void>((resolve) => {
            order.push('b');
            resolve();
        }).then(() => ({ toolId: 'b', action: 'install' as const, success: true, message: 'ok', timestamp: Date.now() }));

        queue.enqueue(createRequest('tool-a'), handlerA);
        queue.enqueue(createRequest('tool-b'), handlerB);

        // Wait for both to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.deepEqual(order, ['a', 'b']);
    });

    it('should execute operations sequentially, not concurrently', async () => {
        let concurrent = 0;
        let maxConcurrent = 0;

        const createHandler = (toolId: string) => async () => {
            concurrent++;
            maxConcurrent = Math.max(maxConcurrent, concurrent);
            await new Promise((resolve) => setTimeout(resolve, 50));
            concurrent--;
            return { toolId, action: 'install' as const, success: true, message: 'ok', timestamp: Date.now() };
        };

        queue.enqueue(createRequest('tool-a'), createHandler('tool-a'));
        queue.enqueue(createRequest('tool-b'), createHandler('tool-b'));

        await new Promise((resolve) => setTimeout(resolve, 250));

        assert.equal(maxConcurrent, 1, 'Operations should not run concurrently');
    });

    it('should track current operation', async () => {
        let resolveHandler: (() => void) | undefined;
        const handler = () => new Promise<void>((resolve) => {
            resolveHandler = resolve;
        }).then(() => ({ toolId: 'a', action: 'install' as const, success: true, message: 'ok', timestamp: Date.now() }));

        const request = createRequest('tool-a');
        queue.enqueue(request, handler);

        await new Promise((resolve) => setTimeout(resolve, 10));
        assert.deepEqual(queue.current, request);

        resolveHandler!();
        await new Promise((resolve) => setTimeout(resolve, 10));
        assert.equal(queue.current, undefined);
    });

    it('should fire onDidChange event on state changes', async () => {
        const listener = sinon.stub();
        queue.onDidChange(listener);

        const handler = async () => ({ toolId: 'a', action: 'install' as const, success: true, message: 'ok', timestamp: Date.now() });
        queue.enqueue(createRequest('tool-a'), handler);

        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.ok(listener.called, 'onDidChange should have been fired');
    });

    it('should report correct length with multiple queued items', () => {
        const slowHandler = () => new Promise<never>(() => {}); // never resolves
        queue.enqueue(createRequest('tool-a'), slowHandler);
        queue.enqueue(createRequest('tool-b'), slowHandler);
        queue.enqueue(createRequest('tool-c'), slowHandler);

        // First one starts immediately, 2 remain queued + 1 current
        assert.equal(queue.length, 3);
    });
});
