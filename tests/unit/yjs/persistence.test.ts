import { YjsPersistence } from '@/lib/yjs/persistence';
import * as Y from 'yjs';

// Mock global fetch
global.fetch = jest.fn();

describe('YjsPersistence', () => {
    let doc: Y.Doc;
    let persistence: YjsPersistence;

    // Helper to mock fetch response
    const mockFetchResponse = (ok: boolean, data: any, status = 200) => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok,
            status,
            statusText: ok ? 'OK' : 'Error',
            json: async () => data,
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        doc = new Y.Doc();
    });

    afterEach(() => {
        jest.useRealTimers();
        doc.destroy();
        if (persistence) persistence.destroy();
    });

    test('should load document state successfully', async () => {
        persistence = new YjsPersistence({
            documentId: 'doc-123',
            doc,
        });

        // Create a state to return
        const remoteDoc = new Y.Doc();
        remoteDoc.getText('content').insert(0, 'persistence test');
        const state = Y.encodeStateAsUpdate(remoteDoc);
        const stateBase64 = Buffer.from(state).toString('base64');

        mockFetchResponse(true, { state: stateBase64 });

        await persistence.load();

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/documents/doc-123/yjs',
            expect.objectContaining({ method: 'GET' })
        );
        expect(doc.getText('content').toString()).toBe('persistence test');
    });

    test('should handle 404 when loading new document', async () => {
        persistence = new YjsPersistence({
            documentId: 'new-doc',
            doc,
        });

        mockFetchResponse(false, {}, 404);

        await persistence.load(); // Should not throw

        expect(doc.getText('content').toString()).toBe('');
    });

    test('should save changes automatically (debounced)', async () => {
        persistence = new YjsPersistence({
            documentId: 'doc-123',
            doc,
            saveInterval: 100,
        });

        mockFetchResponse(true, {}); // For the save request

        // Make a change
        doc.getText('content').insert(0, 'test save');

        // Should not save immediately
        expect(global.fetch).not.toHaveBeenCalled();

        // Fast-forward timer
        jest.advanceTimersByTime(1000);

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/documents/doc-123/yjs',
            expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('state'),
            })
        );
    });

    test('should save immediately when saveNow is called', async () => {
        persistence = new YjsPersistence({
            documentId: 'doc-123',
            doc,
        });

        mockFetchResponse(true, {});

        doc.getText('content').insert(0, 'test immediate');

        await persistence.saveNow();

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should skip save if no changes', async () => {
        persistence = new YjsPersistence({
            documentId: 'doc-123',
            doc,
        });

        await persistence.saveNow();

        // Initial save usually happens to checkpoint, but if we call saveNow on empty doc that hasn't changed...
        // Actually, logic is: hasUnsavedChanges() compares against lastSavedStateVector.
        // Initially lastSavedStateVector is null, so it returns true.
        expect(global.fetch).toHaveBeenCalled();

        // Now save again without changes
        (global.fetch as jest.Mock).mockClear();
        await persistence.saveNow();

        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle save failure gracefully', async () => {
        persistence = new YjsPersistence({
            documentId: 'doc-123',
            doc,
        });

        mockFetchResponse(false, { error: 'Failed' }, 500);

        doc.getText('content').insert(0, 'failure test');

        await expect(persistence.saveNow()).rejects.toThrow();
    });
});
