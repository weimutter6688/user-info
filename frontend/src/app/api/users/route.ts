import { NextResponse } from 'next/server';

// Ensure the backend URL is available server-side
const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(request: Request) {
    // Extract search params from the incoming request (e.g., for skip, limit, search)
    const { searchParams } = new URL(request.url);

    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        // Forward the request (including search params) to the actual backend
        const res = await fetch(`${backendUrl}/api/users?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                // Forward necessary headers if needed, be careful with sensitive ones
                'Content-Type': 'application/json',
            },
            // Important for server-to-server requests within Docker network
            cache: 'no-store',
        });

        if (!res.ok) {
            // Forward the error status and message from the backend if possible
            const errorData = await res.text(); // Use text() in case response is not JSON
            console.error(`Backend API error: ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching from backend API:', error);
        // Use instanceof check for better type safety
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch data from backend', details: errorMessage }, { status: 500 });
    }
}

// Add POST function similarly if needed by the client
export async function POST(request: Request) {
    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        const body = await request.json(); // Get the body from the client request

        const res = await fetch(`${backendUrl}/api/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward other necessary headers
            },
            body: JSON.stringify(body), // Forward the body
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error(`Backend API error: ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: res.status }); // Forward status code (e.g., 201 Created)

    } catch (error) {
        console.error('Error posting to backend API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to post data to backend', details: errorMessage }, { status: 500 });
    }
}