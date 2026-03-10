'use client';

import JoinRoom from '@/components/JoinRoom';
import Navbar from '@/components/Navbar';

export default function JoinPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      <Navbar />
      <main className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
        <JoinRoom />
      </main>
    </div>
  );
}