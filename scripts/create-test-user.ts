

import { createClient, User } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

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

const TEST_USER = {
    email: 'test-user-e2e@example.com',
    password: 'TestUser123!',
    user_metadata: {
        name: 'E2E Test User',
    },
};

async function createTestUser() {
    console.log(`Checking if user ${TEST_USER.email} exists...`);

    // Try to sign in first to see if user exists (admin auth doesn't have a direct "get user by email" easily without listing)
    // Actually, listUsers is better.
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }

    const existingUser = (users as User[]).find(u => u.email === TEST_USER.email);

    if (existingUser) {
        console.log('User already exists. ID:', existingUser.id);
        // Optionally update password to ensure it's correct
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: TEST_USER.password, user_metadata: TEST_USER.user_metadata, email_confirm: true }
        );

        if (updateError) {
            console.error('Error updating user:', updateError);
            process.exit(1);
        }
        console.log('User updated successfully.');
        return;
    }

    console.log('Creating new user...');
    const { data, error } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: TEST_USER.user_metadata,
    });

    if (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }

    console.log('User created successfully:', data.user.id);
}

createTestUser();
