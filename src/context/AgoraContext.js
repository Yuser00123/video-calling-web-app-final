'use client';

import { createContext, useContext } from 'react';

const AgoraContext = createContext(null);

export function AgoraProvider({ children, value }) {
  return <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>;
}

export function useAgoraContext() {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error('useAgoraContext must be used within AgoraProvider');
  }
  return context;
}