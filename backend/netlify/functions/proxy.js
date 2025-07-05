import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = `http://${process.env.REACT_APP_API_URL}:5000/api${searchParams}`;
  
  try {
    const response = await fetch(targetUrl);
    return NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type'),
        'Access-Control-Allow-Origin': '*', // Adjust to your domain
      },
    });
  } catch (error) {
    return NextResponse('Proxy failed', { status: 500 });
  }
}
