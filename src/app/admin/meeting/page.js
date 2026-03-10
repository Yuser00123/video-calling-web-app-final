'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MeetingRoom from '@/components/MeetingRoom';
import Navbar from '@/components/Navbar';

export default function AdminMeetingPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
    } else {
      setIsAuthed(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <MeetingRoom isAdmin={true} />
      </main>
    </div>
  );
}