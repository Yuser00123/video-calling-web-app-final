import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { roomStore } from '@/lib/roomStore';

export async function POST(request) {
  try {
    const { action, roomCode, adminToken } = await request.json();

    if (action === 'create') {
      // Verify admin token
      if (!adminToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const code = uuidv4().substring(0, 8).toUpperCase();
      roomStore.set(code, {
        createdAt: Date.now(),
        active: true,
        adminToken,
      });

      return NextResponse.json({ success: true, roomCode: code });
    }

    if (action === 'verify') {
      const room = roomStore.get(roomCode?.toUpperCase());
      if (room && room.active) {
        return NextResponse.json({ success: true, exists: true });
      }
      return NextResponse.json({ success: true, exists: false });
    }

    if (action === 'end') {
      const room = roomStore.get(roomCode?.toUpperCase());
      if (room) {
        room.active = false;
        roomStore.set(roomCode.toUpperCase(), room);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}