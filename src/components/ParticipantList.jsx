'use client';

import { motion } from 'framer-motion';

export default function ParticipantList({
  localUid,
  localName,
  localIsAdmin,
  remoteUsers,
  participantNames,
  onClose,
  isAdmin,
  onForceMute,
  onKick,
}) {
  const allParticipants = [
    { uid: localUid, name: localName, isAdmin: localIsAdmin, isLocal: true },
    ...remoteUsers.map((u) => ({
      uid: u.uid,
      name: participantNames[u.uid]?.name || `User ${u.uid}`,
      isAdmin: participantNames[u.uid]?.isAdmin || u.uid === 1,
      isLocal: false,
    })),
  ];

  // Sort: admin first
  allParticipants.sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return 0;
  });

  return (
    <div className="h-full flex flex-col bg-dark/50 w-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
          Participants ({allParticipants.length})
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {allParticipants.map((p, i) => (
          <motion.div
            key={p.uid || i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  p.isAdmin
                    ? 'bg-gradient-to-br from-primary to-accent'
                    : 'bg-white/10'
                }`}
              >
                {p.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  {p.isLocal && (
                    <span className="text-[10px] text-accent">(You)</span>
                  )}
                </div>
                {p.isAdmin && (
                  <span className="text-[10px] text-warning font-semibold uppercase">Admin</span>
                )}
              </div>
            </div>

            {/* Admin controls for non-admin remote users */}
            {isAdmin && !p.isLocal && !p.isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onForceMute(p.uid)}
                  className="w-8 h-8 rounded-full hover:bg-warning/10 flex items-center justify-center text-white/40 hover:text-warning transition-colors"
                  title="Mute user"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </button>
                <button
                  onClick={() => onKick(p.uid)}
                  className="w-8 h-8 rounded-full hover:bg-danger/10 flex items-center justify-center text-white/40 hover:text-danger transition-colors"
                  title="Remove user"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}