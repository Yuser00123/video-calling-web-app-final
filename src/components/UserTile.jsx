'use client';

import { useEffect, useRef } from 'react';

export default function UserTile({ videoTrack, name, isAdmin, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current);
    }
    return () => {
      videoTrack?.stop?.();
    };
  }, [videoTrack]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-dark-light border border-white/5">
      {videoTrack ? (
        <div ref={videoRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-light to-dark-card">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
            isAdmin ? 'bg-gradient-to-br from-primary to-accent' : 'bg-white/10'
          }`}>
            {name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg glass text-xs text-white">
        {name} {isAdmin && <span className="text-warning">(Admin)</span>} {isLocal && <span className="text-accent">(You)</span>}
      </div>
    </div>
  );
}