'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-dark"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">MeetFlow</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/join"
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-200"
            >
              Join Meeting
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm rounded-xl glass hover:border-primary/30 border border-transparent text-white/70 hover:text-white transition-all duration-200"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}