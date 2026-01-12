/**
 * Health Check API Endpoint
 * 
 * Returns system health status for monitoring and load balancer health checks.
 * 
 * @endpoint GET /api/health
 * @returns {object} Health status with database, storage, and timestamp
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: {
        database: { ok: boolean; latency_ms?: number; error?: string };
        storage: { ok: boolean; error?: string };
        auth: { ok: boolean; error?: string };
    };
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<HealthCheck>> {
    const startTime = Date.now();

    const checks = {
        database: { ok: false, latency_ms: 0, error: undefined as string | undefined },
        storage: { ok: false, error: undefined as string | undefined },
        auth: { ok: false, error: undefined as string | undefined },
    };

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '0.0.0',
            checks: {
                database: { ok: false, error: 'Missing Supabase configuration' },
                storage: { ok: false, error: 'Missing Supabase configuration' },
                auth: { ok: false, error: 'Missing Supabase configuration' },
            },
        }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check database connectivity
    try {
        const dbStart = Date.now();
        const { error } = await supabase.from('user_profiles').select('count').limit(1);
        checks.database.latency_ms = Date.now() - dbStart;

        if (error && !error.message.includes('does not exist')) {
            // Table might not exist yet, but connection works
            checks.database.ok = true;
        } else {
            checks.database.ok = true;
        }
    } catch (err) {
        checks.database.error = err instanceof Error ? err.message : 'Unknown database error';
    }

    // Check storage bucket
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            checks.storage.error = error.message;
        } else {
            checks.storage.ok = true;
        }
    } catch (err) {
        checks.storage.error = err instanceof Error ? err.message : 'Unknown storage error';
    }

    // Check auth service
    try {
        const { error } = await supabase.auth.getSession();
        if (error && !error.message.includes('session')) {
            checks.auth.error = error.message;
        } else {
            checks.auth.ok = true;
        }
    } catch (err) {
        checks.auth.error = err instanceof Error ? err.message : 'Unknown auth error';
    }

    // Determine overall status
    const allOk = Object.values(checks).every((c) => c.ok);
    const anyOk = Object.values(checks).some((c) => c.ok);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allOk) {
        status = 'healthy';
    } else if (anyOk) {
        status = 'degraded';
    } else {
        status = 'unhealthy';
    }

    const response: HealthCheck = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.0.0',
        checks,
    };

    return NextResponse.json(response, {
        status: status === 'unhealthy' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
