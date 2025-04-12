import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        // Get the FormData from the client request
        const formData = await request.formData();

        // Forward the FormData directly to the backend
        // NOTE: Do NOT manually set Content-Type header when forwarding FormData
        const res = await fetch(`${backendUrl}/api/users/import/csv`, {
            method: 'POST',
            body: formData,
            cache: 'no-store',
        });

        // Always expect JSON response from backend import endpoint, even for errors
        const data = await res.json();

        // Return the response from the backend (including status code and JSON body)
        return NextResponse.json(data, { status: res.status });

    } catch (error) {
        console.error('Error posting import CSV to backend API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to forward import request to backend', details: errorMessage }, { status: 500 });
    }
}