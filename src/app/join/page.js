'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

const JoinRoom = dynamic(() => import('@/components/JoinRoom'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50">Loading...</p>
      </div>
    </div>
  ),
});

export default function JoinPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
      </div>
      <Navbar />
      <main className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
        <JoinRoom />
      </main>
    </div>
  );
}