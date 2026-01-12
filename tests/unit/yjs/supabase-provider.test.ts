import { SupabaseProvider } from '@/lib/yjs/supabase-provider';
import * as Y from 'yjs';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
    createClient: jest.fn(),
}));

describe('SupabaseProvider', () => {
    let doc: Y.Doc;
    let mockSupabase: any;
    let mockChannel: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        doc = new Y.Doc();

        // Setup mock channel
        mockChannel = {
            subscribe: jest.fn((cb) => {
                // Simulate successful subscription immediately
                if (cb) cb('SUBSCRIBED');
                return mockChannel;
            }),
            unsubscribe: jest.fn(),
            send: jest.fn(),
            on: jest.fn(),
            presenceState: jest.fn(() => ({})),
            track: jest.fn(),
        };

        // Setup mock Supabase client
        mockSupabase = {
            channel: jest.fn(() => mockChannel),
        };
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        jest.useRealTimers();
        doc.destroy();
    });

    test('should initialize and connect successfully', () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
        });

        expect(createClient).toHaveBeenCalled();
        expect(mockSupabase.channel).toHaveBeenCalledWith(
            'room:test-room',
            expect.objectContaining({
                config: expect.objectContaining({
                    broadcast: { self: false },
                    presence: expect.any(Object),
                }),
            })
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(provider.status).toBe('connected');
    });

    test('should sync initial state on connection', async () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
        });

        // Wait for connection
        jest.advanceTimersByTime(100);

        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'broadcast',
                event: 'sync-request',
            })
        );
    });

    test('should handle remote document updates', () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
        });

        // Capture the event listener for broadcast
        const onBroadcastCalls = mockChannel.on.mock.calls.filter(
            (call: any) => call[1].event === 'yjs-update'
        );

        // Find the callback
        const callback = onBroadcastCalls[0][2];

        // Simulate remote update
        const remoteDoc = new Y.Doc();
        remoteDoc.getText('test').insert(0, 'hello');
        const update = Y.encodeStateAsUpdate(remoteDoc);

        callback({
            payload: {
                clientId: 'remote-client',
                update: Array.from(update),
            },
        });

        expect(doc.getText('test').toString()).toBe('hello');
    });

    test('should broadcast local updates', () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
            batchInterval: 100,
        });

        // Make local change
        doc.getText('test').insert(0, 'world');

        // Fast-forward debounce timer
        jest.advanceTimersByTime(100);

        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'broadcast',
                event: 'yjs-update',
                payload: expect.objectContaining({
                    update: expect.any(Array),
                }),
            })
        );
    });

    test('should handle reconnection with backoff', () => {
        // Mock random to avoid jitter
        jest.spyOn(Math, 'random').mockReturnValue(0);

        // Setup subscription to fail initially
        mockChannel.subscribe.mockImplementationOnce((cb: any) => {
            cb('TIMED_OUT');
            return mockChannel;
        });

        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
            reconnectBaseDelay: 100,
        });

        expect(provider.status).toBe('reconnecting');

        // Fast-forward backoff time (100ms delay + 0ms jitter)
        jest.advanceTimersByTime(150);

        // Should attempt to reconnect (subscribe called again)
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
    });

    test('should update presence', async () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
        });

        await provider.updatePresence({
            displayName: 'Test User',
            color: '#ff0000',
        });

        expect(mockChannel.track).toHaveBeenCalledWith(
            expect.objectContaining({
                displayName: 'Test User',
                color: '#ff0000',
                lastActiveAt: expect.any(Number),
            })
        );
    });

    test('should cleanup on destroy', () => {
        const provider = new SupabaseProvider({
            roomId: 'test-room',
            doc,
        });

        provider.destroy();

        expect(mockChannel.unsubscribe).toHaveBeenCalled();
        expect(provider.status).toBe('disconnected');
    });
});
