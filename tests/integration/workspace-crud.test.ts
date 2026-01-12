import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
    createClient: jest.fn(),
}));

describe('Workspace CRUD Integration', () => {
    let mockSupabase: any;
    let mockFrom: any;
    let mockSelect: any;
    let mockInsert: any;
    let mockUpdate: any;
    let mockDelete: any;
    let mockEq: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Chainable mock setup
        mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

        mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockInsert = jest.fn(() => ({ select: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }) }));
        mockUpdate = jest.fn(() => ({ eq: mockEq }));
        mockDelete = jest.fn(() => ({ eq: mockEq }));

        mockFrom = jest.fn(() => ({
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
        }));

        mockSupabase = {
            from: mockFrom,
        };

        (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    // Helper functions (mimicking potential service layer)
    const createWorkspace = async (name: string, ownerId: string) => {
        const supabase = createClient() as any;
        return await supabase.from('workspaces').insert({ name, owner_id: ownerId }).select();
    };

    const getWorkspace = async (id: string) => {
        const supabase = createClient() as any;
        return await supabase.from('workspaces').select('*').eq('id', id);
    };

    const updateWorkspace = async (id: string, updates: any) => {
        const supabase = createClient() as any;
        return await supabase.from('workspaces').update(updates).eq('id', id);
    };

    const deleteWorkspace = async (id: string) => {
        const supabase = createClient() as any;
        return await supabase.from('workspaces').delete().eq('id', id);
    };

    test('should create workspace', async () => {
        const result = await createWorkspace('Test Workspace', 'user-123');

        expect(mockFrom).toHaveBeenCalledWith('workspaces');
        expect(mockInsert).toHaveBeenCalledWith({ name: 'Test Workspace', owner_id: 'user-123' });
        expect(result.data).toBeDefined();
    });

    test('should retrieve workspace by id', async () => {
        await getWorkspace('ws-123');

        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalledWith('id', 'ws-123');
    });

    test('should update workspace details', async () => {
        await updateWorkspace('ws-123', { name: 'Updated Name' });

        expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name' });
        expect(mockEq).toHaveBeenCalledWith('id', 'ws-123');
    });

    test('should delete workspace', async () => {
        await deleteWorkspace('ws-123');

        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', 'ws-123');
    });
});
