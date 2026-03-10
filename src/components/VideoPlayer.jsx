'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoPlayer({
  videoTrack,
  uid,
  isLocal,
  name,
  isAdmin,
  isMicOn,
  isCamOn,
  showAdminControls,
  onForceMute,
  onKick,
}) {
  const videoRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current);
    }
    return () => {
      if (videoTrack) {
        videoTrack.stop?.();
      }
    };
  }, [videoTrack]);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '?';

  const hasVideo = !!videoTrack;

  return (
    <div className="video-container relative w-full h-full min-h-[160px] group rounded-2xl overflow-hidden border border-white/5">
      {/* Video element */}
      {hasVideo ? (
        <div
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-dark-light to-dark-card flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
              isAdmin
                ? 'bg-gradient-to-br from-primary to-accent'
                : 'bg-gradient-to-br from-primary/60 to-secondary/60'
            }`}
          >
            {initials}
          </motion.div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-sm">
          {isAdmin && (
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
          )}
          <span className="text-white font-medium truncate max-w-[120px]">{name}</span>
          {isAdmin && (
            <span className="text-[10px] text-warning font-semibold uppercase ml-1">Admin</span>
          )}
          {isLocal && (
            <span className="text-[10px] text-accent font-medium ml-1">(You)</span>
          )}
        </div>
      </div>

      {/* Mic indicator */}
      {isLocal && (
        <div className="absolute top-3 left-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMicOn ? 'bg-accent-green/20' : 'bg-danger/20'}`}>
            {isMicOn ? (
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Admin controls for remote users */}
      {showAdminControls && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-40 glass rounded-xl overflow-hidden shadow-xl z-50"
                >
                  <button
                    onClick={() => {
                      onForceMute?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    Mute
                  </button>
                  <button
                    onClick={() => {
                      onKick?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                    Remove
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}