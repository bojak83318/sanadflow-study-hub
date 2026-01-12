/**
 * Database Types for Supabase
 * Generated from Prisma schema - TDD v3.0
 * 
 * @module src/types/database
 * @agent frontend-engineer
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string
                    full_name: string
                    role: string
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                    last_login_at: string | null
                    is_active: boolean
                }
                Insert: {
                    id: string
                    full_name: string
                    role?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    last_login_at?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    full_name?: string
                    role?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    last_login_at?: string | null
                    is_active?: boolean
                }
            }
            workspaces: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    owner_id: string
                    icon_emoji: string | null
                    settings: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    owner_id: string
                    icon_emoji?: string | null
                    settings?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    owner_id?: string
                    icon_emoji?: string | null
                    settings?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    permission: string
                    invited_by: string | null
                    joined_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    permission?: string
                    invited_by?: string | null
                    joined_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    permission?: string
                    invited_by?: string | null
                    joined_at?: string
                }
            }
            documents: {
                Row: {
                    id: string
                    workspace_id: string
                    title: string
                    content_yjs: string | null // Base64 encoded
                    content_json: Json | null
                    parent_id: string | null
                    icon_emoji: string | null
                    cover_image_url: string | null
                    is_template: boolean
                    created_by: string
                    updated_by: string | null
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    title: string
                    content_yjs?: string | null
                    content_json?: Json | null
                    parent_id?: string | null
                    icon_emoji?: string | null
                    cover_image_url?: string | null
                    is_template?: boolean
                    created_by: string
                    updated_by?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    title?: string
                    content_yjs?: string | null
                    content_json?: Json | null
                    parent_id?: string | null
                    icon_emoji?: string | null
                    cover_image_url?: string | null
                    is_template?: boolean
                    created_by?: string
                    updated_by?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
            }
            hadiths: {
                Row: {
                    id: string
                    workspace_id: string
                    document_id: string | null
                    arabic_text: string
                    english_translation: string | null
                    transliteration: string | null
                    collection: string | null
                    book_number: string | null
                    hadith_number: string | null
                    grading: string | null
                    narrator_ids: string[]
                    narration_chain: string | null
                    topic_tags: string[]
                    notes: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    document_id?: string | null
                    arabic_text: string
                    english_translation?: string | null
                    transliteration?: string | null
                    collection?: string | null
                    book_number?: string | null
                    hadith_number?: string | null
                    grading?: string | null
                    narrator_ids?: string[]
                    narration_chain?: string | null
                    topic_tags?: string[]
                    notes?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    document_id?: string | null
                    arabic_text?: string
                    english_translation?: string | null
                    transliteration?: string | null
                    collection?: string | null
                    book_number?: string | null
                    hadith_number?: string | null
                    grading?: string | null
                    narrator_ids?: string[]
                    narration_chain?: string | null
                    topic_tags?: string[]
                    notes?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            narrators: {
                Row: {
                    id: string
                    workspace_id: string
                    name_arabic: string
                    name_english: string | null
                    kunyah: string | null
                    laqab: string | null
                    birth_year: number | null
                    death_year: number | null
                    biography_ar: string | null
                    biography_en: string | null
                    reliability_grade: string | null
                    teachers: string[]
                    students: string[]
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    name_arabic: string
                    name_english?: string | null
                    kunyah?: string | null
                    laqab?: string | null
                    birth_year?: number | null
                    death_year?: number | null
                    biography_ar?: string | null
                    biography_en?: string | null
                    reliability_grade?: string | null
                    teachers?: string[]
                    students?: string[]
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    name_arabic?: string
                    name_english?: string | null
                    kunyah?: string | null
                    laqab?: string | null
                    birth_year?: number | null
                    death_year?: number | null
                    biography_ar?: string | null
                    biography_en?: string | null
                    reliability_grade?: string | null
                    teachers?: string[]
                    students?: string[]
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            diagrams: {
                Row: {
                    id: string
                    workspace_id: string
                    document_id: string | null
                    title: string
                    description: string | null
                    storage_path: string
                    file_size_bytes: number
                    mime_type: string
                    canvas_state: Json | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    document_id?: string | null
                    title: string
                    description?: string | null
                    storage_path: string
                    file_size_bytes: number
                    mime_type?: string
                    canvas_state?: Json | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    document_id?: string | null
                    title?: string
                    description?: string | null
                    storage_path?: string
                    file_size_bytes?: number
                    mime_type?: string
                    canvas_state?: Json | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            yjs_documents: {
                Row: {
                    room_id: string
                    workspace_id: string
                    document_id: string
                    state: string // Base64 encoded
                    updated_at: string
                }
                Insert: {
                    room_id: string
                    workspace_id: string
                    document_id: string
                    state: string
                    updated_at?: string
                }
                Update: {
                    room_id?: string
                    workspace_id?: string
                    document_id?: string
                    state?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            search_hadith_arabic: {
                Args: {
                    query_text: string
                    workspace_uuid: string
                    min_similarity?: number
                    max_results?: number
                }
                Returns: {
                    id: string
                    arabic_text: string
                    english_translation: string | null
                    grading: string | null
                    similarity: number
                }[]
            }
            search_hadith_english: {
                Args: {
                    query_text: string
                    workspace_uuid: string
                    max_results?: number
                }
                Returns: {
                    id: string
                    arabic_text: string
                    english_translation: string | null
                    grading: string | null
                    rank: number
                }[]
            }
            search_narrator: {
                Args: {
                    query_text: string
                    workspace_uuid: string
                    max_results?: number
                }
                Returns: {
                    id: string
                    name_arabic: string
                    name_english: string | null
                    reliability_grade: string | null
                    similarity: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
