import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET() { // Remove unused request parameter
    if (!backendUrl) {
        return NextResponse.json({ error: 'Backend API URL not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(`${backendUrl}/api/users/export/csv`, {
            method: 'GET',
            headers: {
                // Forward necessary headers if needed
                'Accept': 'text/csv', // Indicate we expect CSV
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error(`Backend API error (Export CSV): ${res.status} ${res.statusText}`, errorData);
            return NextResponse.json({ error: `Backend error: ${res.statusText}`, details: errorData }, { status: res.status });
        }

        // Get the blob data (CSV content)
        const blob = await res.blob();

        // Get headers from the backend response to forward to the client
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        const contentDisposition = res.headers.get('Content-Disposition');
        if (contentDisposition) {
            headers.set('Content-Disposition', contentDisposition);
        }

        // Return the blob data with appropriate headers
        return new NextResponse(blob, { status: 200, headers });

    } catch (error) {
        console.error('Error fetching export CSV from backend API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch export data from backend', details: errorMessage }, { status: 500 });
    }
}