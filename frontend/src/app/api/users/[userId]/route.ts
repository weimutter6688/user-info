import { NextResponse, NextRequest } from 'next/server';

// Define params type
type RouteParams = { userId: string };

// Ensure the backend URL is available server-side
const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// GET /api/users/{userId}
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    const { userId } = await params;

    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(`${backendUrl}/api/users/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error(`Backend API error (GET user ${userId}): ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error fetching user ${userId} from backend API:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch data from backend', details: errorMessage }, { status: 500 });
    }
}

// PUT /api/users/{userId}
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    const { userId } = await params;

    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();

        const res = await fetch(`${backendUrl}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error(`Backend API error (PUT user ${userId}): ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error updating user ${userId} via backend API:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update data via backend', details: errorMessage }, { status: 500 });
    }
}

// DELETE /api/users/{userId}
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    const { userId } = await params;

    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(`${backendUrl}/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error(`Backend API error (DELETE user ${userId}): ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        // Handle potential empty response body for DELETE
        if (res.status === 204 || res.headers.get('content-length') === '0') {
            return new Response(null, { status: 204 }); // No Content
        }

        const data = await res.json();
        return NextResponse.json(data); // Or return status 204 if backend confirms deletion without body

    } catch (error) {
        console.error(`Error deleting user ${userId} via backend API:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to delete data via backend', details: errorMessage }, { status: 500 });
    }
}