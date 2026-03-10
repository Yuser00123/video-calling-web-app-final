'use client';

import AdminLogin from '@/components/AdminLogin';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-danger/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <Navbar />
      <main className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
        <AdminLogin />
      </main>
    </div>
  );
}