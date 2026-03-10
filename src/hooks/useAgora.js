'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export function useAgora() {
  const client = useRef(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  const init = useCallback(async () => {
    client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    client.current.on('user-published', async (user, mediaType) => {
      await client.current.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.current.on('user-unpublished', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    client.current.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });
  }, []);

  const join = useCallback(async (appId, channel, token, uid) => {
    if (!client.current) await init();
    await client.current.join(appId, channel, token, uid);
    setJoined(true);
  }, [init]);

  const leave = useCallback(async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    setRemoteUsers([]);
    if (client.current) {
      await client.current.leave();
    }
    setJoined(false);
  }, [localAudioTrack, localVideoTrack]);

  return {
    client: client.current,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    joined,
    join,
    leave,
    init,
    setLocalAudioTrack,
    setLocalVideoTrack,
  };
}