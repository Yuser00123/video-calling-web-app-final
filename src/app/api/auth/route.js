import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const validUsername = process.env.ADMIN_USERNAME || 'Yashvardhan';
    const validPassword = process.env.ADMIN_PASSWORD || 'Yash@130123';

    if (username === validUsername && password === validPassword) {
      // Simple token - in production use JWT
      const token = Buffer.from(
        JSON.stringify({
          user: username,
          role: 'admin',
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
      ).toString('base64');

      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}