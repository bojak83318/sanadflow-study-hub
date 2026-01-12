/**
 * Yjs Document State API Route
 * GET/PUT handlers for Yjs document persistence
 *
 * @module src/app/api/documents/[id]/yjs/route
 * @agent backend-engineer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type YjsDocumentRow = Database['public']['Tables']['yjs_documents']['Row'];
type YjsDocumentInsert = Database['public']['Tables']['yjs_documents']['Insert'];
type DocumentRow = Database['public']['Tables']['documents']['Row'];

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]/yjs
 * Load Yjs document state from database
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { id: documentId } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch Yjs document state
        const { data, error } = await supabase
            .from('yjs_documents')
            .select('state, updated_at')
            .eq('document_id', documentId)
            .single<Pick<YjsDocumentRow, 'state' | 'updated_at'>>();

        // PGRST116 = "Row not found" - expected for new documents
        if (error) {
            if (error.code === 'PGRST116') {
                // No document found - return null state for new documents
                return NextResponse.json({
                    state: null,
                    updatedAt: null,
                });
            }
            console.error('[YjsRoute] Failed to fetch document:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Return state
        return NextResponse.json({
            state: data.state,
            updatedAt: data.updated_at,
        });
    } catch (error) {
        console.error('[YjsRoute] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/documents/[id]/yjs
 * Save Yjs document state to database
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        const { id: documentId } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { state } = body as { state?: string };

        if (!state) {
            return NextResponse.json(
                { error: 'Missing state in request body' },
                { status: 400 }
            );
        }

        // Get the document to find its workspace_id
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('id, workspace_id')
            .eq('id', documentId)
            .single<Pick<DocumentRow, 'id' | 'workspace_id'>>();

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Prepare the upsert data with explicit type
        const upsertData: YjsDocumentInsert = {
            room_id: `doc:${documentId}`,
            workspace_id: document.workspace_id,
            document_id: documentId,
            state: state,
            updated_at: new Date().toISOString(),
        };

        // Upsert Yjs document state
        // Note: Using type assertion due to Supabase type generation limitations
        const { error: upsertError } = await supabase
            .from('yjs_documents')
            .upsert(upsertData as unknown as never, {
                onConflict: 'document_id',
            });

        if (upsertError) {
            console.error('[YjsRoute] Failed to save document:', upsertError);
            return NextResponse.json(
                { error: upsertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[YjsRoute] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
