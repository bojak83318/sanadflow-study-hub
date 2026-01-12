
import { createClient, User } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function importSampleData() {
    console.log('Starting sample data import...');

    // 1. Get or Create User
    const TEST_USER_EMAIL = 'test-user-e2e@example.com';
    let userId: string;

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = (users as User[]).find(u => u.email === TEST_USER_EMAIL);

    if (existingUser) {
        userId = existingUser.id;
        console.log(`Found existing user: ${userId}`);
    } else {
        console.log('Test user not found, creating...');
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_USER_EMAIL,
            password: 'TestUser123!',
            email_confirm: true,
            user_metadata: { name: 'E2E Test User' },
        });
        if (error) throw error;
        userId = data.user.id;
        console.log(`Created new user: ${userId}`);
    }

    // 2. Ensure User Profile exists (Trigger might handle this, but being safe)
    // Note: In TDD v3.0, profile creation is usually handled by a trigger on auth.users
    // We will verify profile existence
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (!profile) {
        console.log('Creating user profile...');
        await supabase.from('user_profiles').insert({
            id: userId,
            full_name: 'E2E Test User',
            role: 'member'
        });
    }

    // 3. Get or Create Workspace
    let workspaceId: string;
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);

    if (wsError) throw wsError;

    if (workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
        console.log(`Found existing workspace: ${workspaceId}`);
    } else {
        console.log('Creating new workspace...');
        const { data: newWs, error: createWsError } = await supabase
            .from('workspaces')
            .insert({
                name: 'SanadFlow Pilot',
                slug: 'sanadflow-pilot',
                owner_id: userId,
                settings: { rtl_default: true }
            })
            .select()
            .single();

        if (createWsError) throw createWsError;
        workspaceId = newWs.id;
        console.log(`Created workspace: ${workspaceId}`);

        // Add member
        await supabase.from('workspace_members').insert({
            workspace_id: workspaceId,
            user_id: userId,
            permission: 'admin'
        });
    }

    // 4. Read and Parse CSV
    const csvPath = path.resolve(process.cwd(), 'data/sample-hadiths.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Simple CSV parser ignoring complexities like newlines inside quotes for now
    // as our sample data is simple.
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    console.log(`Found ${lines.length - 1} hadiths to import`);

    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Specific regex to handle quoted CSV fields
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Fallback for simple split if regex fails or for unquoted simple CSVs
        // This is a rough parser for the known 4-column structure: 
        // "arabic","english","grading","source"

        // Let's use a robust regex for CSV splitting
        const row = [];
        let inQuote = false;
        let currentField = '';

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(currentField.replace(/^"|"$/g, '')); // Remove surrounding quotes
                currentField = '';
            } else {
                currentField += char;
            }
        }
        row.push(currentField.replace(/^"|"$/g, ''));

        if (row.length < 2) continue; // Skip malformed

        let [arabicText, englishTranslation, grading, collection] = row;

        // Fix grading casing (sahih -> Sahih)
        if (grading) {
            grading = grading.charAt(0).toUpperCase() + grading.slice(1).toLowerCase();
        }


        // Check if exists to avoid duplicates
        const { data: existing } = await supabase
            .from('hadiths')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('arabic_text', arabicText)
            .single();

        if (!existing) {
            const { error: insertError } = await supabase
                .from('hadiths')
                .insert({
                    workspace_id: workspaceId,
                    arabic_text: arabicText,
                    english_translation: englishTranslation,
                    grading: grading,
                    collection: collection,
                    created_by: userId,
                    topic_tags: ['sample']
                });

            if (insertError) {
                console.error(`Failed to insert hadith ${i}:`, insertError.message);
            } else {
                importedCount++;
            }
        } else {
            console.log(`Skipping duplicate hadith ${i}`);
        }
    }

    console.log(`Import complete. Imported ${importedCount} hadiths.`);
}

importSampleData().catch(e => {
    console.error('Import failed:', e);
    process.exit(1);
});
