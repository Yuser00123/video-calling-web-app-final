'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import VideoPlayer from './VideoPlayer';
import Controls from './Controls';
import ChatPanel from './ChatPanel';
import ParticipantList from './ParticipantList';

export default function MeetingRoom({ isAdmin, roomCode: propRoomCode, userName: propUserName }) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState(propRoomCode || '');
  const [meetingActive, setMeetingActive] = useState(!!propRoomCode);
  const [creating, setCreating] = useState(false);
  const [agoraReady, setAgoraReady] = useState(false);

  const agoraRef = useRef(null);
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  const [localUid, setLocalUid] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const [messages, setMessages] = useState([]);
  const participantNamesRef = useRef({});
  const displayName = isAdmin ? 'Admin' : propUserName || 'User';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAgora = async () => {
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        AgoraRTC.setLogLevel(3);
        agoraRef.current = AgoraRTC;
        setAgoraReady(true);
      } catch (err) {
        console.error('Failed to load Agora:', err);
        toast.error('Failed to load video SDK');
      }
    };
    loadAgora();
  }, []);

  const createMeeting = async () => {
    setCreating(true);
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', adminToken }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomCode(data.roomCode);
        setMeetingActive(true);
        toast.success('Meeting created! Code: ' + data.roomCode);
      }
    } catch (error) {
      toast.error('Failed to create meeting');
    } finally {
      setCreating(false);
    }
  };

  const joinChannel = useCallback(async () => {
    if (!roomCode || !agoraRef.current) return;

    const AgoraRTC = agoraRef.current;

    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      const uid = isAdmin ? 1 : Math.floor(Math.random() * 100000) + 2;

      const tokenRes = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: roomCode,
          uid: uid,
          role: isAdmin ? 'admin' : 'user',
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenData.token) {
        throw new Error('Failed to get token');
      }

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            const filtered = prev.filter((u) => u.uid !== user.uid);
            return [...filtered, { uid: user.uid, videoTrack: user.videoTrack, audioTrack: user.audioTrack }];
          });
        }
        if (mediaType === 'audio') {
          if (user.audioTrack) user.audioTrack.play();
          setRemoteUsers((prev) =>
            prev.map((u) => (u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u))
          );
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) =>
            prev.map((u) => (u.uid === user.uid ? { ...u, videoTrack: null } : u))
          );
        }
      });

      client.on('user-joined', (user) => {
        setRemoteUsers((prev) => {
          if (!prev.find((u) => u.uid === user.uid)) {
            return [...prev, { uid: user.uid, videoTrack: null, audioTrack: null }];
          }
          return prev;
        });
        toast.info('A user joined the meeting');
      });

      client.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        toast.info('A user left the meeting');
      });

      await client.join(appId, roomCode, tokenData.token, uid);
      setLocalUid(uid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = audioTrack;
      await client.publish([audioTrack]);

      try {
        const dataStreamId = await client.createDataStream({ reliable: false, ordered: true });
        clientRef.current._dataStreamId = dataStreamId;
        const infoMsg = JSON.stringify({
          type: 'user-info',
          uid: uid,
          name: displayName,
          isAdmin: isAdmin,
        });
        client.sendStreamMessage(dataStreamId, new TextEncoder().encode(infoMsg));
      } catch (e) {
        console.log('Data stream setup:', e.message);
      }

      client.on('stream-message', (remoteUid, data) => {
        try {
          const decoded = new TextDecoder().decode(data);
          const msg = JSON.parse(decoded);

          if (msg.type === 'chat') {
            setMessages((prev) => [...prev, msg]);
          } else if (msg.type === 'user-info') {
            participantNamesRef.current[msg.uid] = { name: msg.name, isAdmin: msg.isAdmin };
            setParticipants((prev) => {
              const exists = prev.find((p) => p.uid === msg.uid);
              if (exists) {
                return prev.map((p) =>
                  p.uid === msg.uid ? { ...p, name: msg.name, isAdmin: msg.isAdmin } : p
                );
              }
              return [...prev, { uid: msg.uid, name: msg.name, isAdmin: msg.isAdmin }];
            });
          } else if (msg.type === 'force-mute' && msg.targetUid === uid) {
            if (localAudioTrackRef.current) {
              localAudioTrackRef.current.setEnabled(false);
              setIsMicOn(false);
              toast.warning('Admin has muted your microphone');
            }
          } else if (msg.type === 'kick' && msg.targetUid === uid) {
            toast.error('You have been removed from the meeting by admin');
            leaveChannel();
          } else if (msg.type === 'end-meeting') {
            toast.error('Meeting has been ended by admin');
            leaveChannel();
          }
        } catch (e) {}
      });

      setParticipants([{ uid, name: displayName, isAdmin }]);
      participantNamesRef.current[uid] = { name: displayName, isAdmin };
      toast.success('Joined the meeting!');
    } catch (error) {
      console.error('Error joining channel:', error);
      toast.error('Failed to join meeting. Check your connection.');
    }
  }, [roomCode, isAdmin, displayName]);

  useEffect(() => {
    if (meetingActive && roomCode && agoraReady) {
      joinChannel();
    }
  }, [meetingActive, agoraReady, joinChannel]);

  useEffect(() => {
    return () => {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!clientRef.current || !localUid) return;

    const interval = setInterval(() => {
      try {
        if (clientRef.current && clientRef.current._dataStreamId != null) {
          const infoMsg = JSON.stringify({
            type: 'user-info',
            uid: localUid,
            name: displayName,
            isAdmin: isAdmin,
          });
          clientRef.current.sendStreamMessage(
            clientRef.current._dataStreamId,
            new TextEncoder().encode(infoMsg)
          );
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [localUid, displayName, isAdmin]);

  const leaveChannel = async () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (e) {}
      clientRef.current = null;
    }

    setRemoteUsers([]);
    setMeetingActive(false);
    setLocalUid(null);
    setMessages([]);
    setParticipants([]);

    if (isAdmin) {
      router.push('/admin/meeting');
    } else {
      router.push('/join');
    }
  };

  const toggleMic = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = async () => {
    const client = clientRef.current;
    const AgoraRTC = agoraRef.current;
    if (!client || !AgoraRTC) return;

    if (!isCamOn) {
      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoTrackRef.current = videoTrack;
        await client.publish([videoTrack]);
        setIsCamOn(true);
      } catch (error) {
        toast.error('Failed to enable camera');
      }
    } else {
      if (localVideoTrackRef.current) {
        await client.unpublish([localVideoTrackRef.current]);
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      setIsCamOn(false);
    }
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;

    const msg = {
      type: 'chat',
      uid: localUid,
      name: displayName,
      text: text.trim(),
      timestamp: Date.now(),
      isAdmin,
    };

    setMessages((prev) => [...prev, msg]);

    try {
      if (clientRef.current && clientRef.current._dataStreamId != null) {
        clientRef.current.sendStreamMessage(
          clientRef.current._dataStreamId,
          new TextEncoder().encode(JSON.stringify(msg))
        );
      }
    } catch (e) {
      console.error('Failed to send message');
    }
  };

  const forceMuteUser = (targetUid) => {
    try {
      if (clientRef.current && clientRef.current._dataStreamId != null) {
        const msg = JSON.stringify({ type: 'force-mute', targetUid });
        clientRef.current.sendStreamMessage(
          clientRef.current._dataStreamId,
          new TextEncoder().encode(msg)
        );
        toast.success('User has been muted');
      }
    } catch (e) {
      toast.error('Failed to mute user');
    }
  };

  const kickUser = (targetUid) => {
    try {
      if (clientRef.current && clientRef.current._dataStreamId != null) {
        const msg = JSON.stringify({ type: 'kick', targetUid });
        clientRef.current.sendStreamMessage(
          clientRef.current._dataStreamId,
          new TextEncoder().encode(msg)
        );
        toast.success('User has been removed');
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== targetUid));
      }
    } catch (e) {
      toast.error('Failed to remove user');
    }
  };

  const endMeeting = async () => {
    try {
      if (clientRef.current && clientRef.current._dataStreamId != null) {
        const msg = JSON.stringify({ type: 'end-meeting' });
        clientRef.current.sendStreamMessage(
          clientRef.current._dataStreamId,
          new TextEncoder().encode(msg)
        );
      }

      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', roomCode }),
      });

      setTimeout(() => {
        leaveChannel();
        toast.success('Meeting ended for all participants');
      }, 500);
    } catch (e) {
      leaveChannel();
    }
  };

  const getParticipantName = (uid) => {
    return participantNamesRef.current[uid]
      ? participantNamesRef.current[uid].name
      : 'User ' + uid;
  };

  const isParticipantAdmin = (uid) => {
    return (
      uid === 1 ||
      (participantNamesRef.current[uid] && participantNamesRef.current[uid].isAdmin)
    );
  };

  const totalParticipants = 1 + remoteUsers.length;

  if (isAdmin && !meetingActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create a Meeting</h2>
          <p className="text-white/50 mb-8">Start a new meeting and share the code with participants</p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={createMeeting}
            disabled={creating}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-semibold text-lg shadow-lg shadow-primary/25 disabled:opacity-50 transition-all duration-300"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Meeting'
            )}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 flex items-center justify-between px-4 glass-dark border-b border-white/5 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-white/90 font-medium text-sm">MeetFlow</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <span className="text-white/50 text-xs">Room: {roomCode}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                toast.success('Room code copied!');
              }}
              className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Code
            </motion.button>
          )}

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-white/70 hover:text-white transition-colors relative"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>{totalParticipants}</span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
            {messages.length > 0 && <span className="w-2 h-2 bg-accent rounded-full" />}
          </button>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-3 overflow-auto">
          <div
            className={
              'grid gap-3 h-full auto-rows-fr ' +
              (totalParticipants === 1
                ? 'grid-cols-1'
                : totalParticipants === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : totalParticipants <= 4
                ? 'grid-cols-2'
                : totalParticipants <= 6
                ? 'grid-cols-2 md:grid-cols-3'
                : totalParticipants <= 9
                ? 'grid-cols-3'
                : 'grid-cols-3 md:grid-cols-4')
            }
          >
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <VideoPlayer
                videoTrack={localVideoTrackRef.current}
                uid={localUid}
                isLocal={true}
                name={displayName}
                isAdmin={isAdmin}
                isMicOn={isMicOn}
                isCamOn={isCamOn}
              />
            </motion.div>

            {remoteUsers.map((user) => {
              const name = getParticipantName(user.uid);
              const userIsAdmin = isParticipantAdmin(user.uid);
              return (
                <motion.div
                  key={user.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={
                    userIsAdmin ? 'col-span-1 row-span-1 md:col-span-2 md:row-span-2 order-first' : ''
                  }
                >
                  <VideoPlayer
                    videoTrack={user.videoTrack}
                    uid={user.uid}
                    isLocal={false}
                    name={name}
                    isAdmin={userIsAdmin}
                    showAdminControls={isAdmin && !userIsAdmin}
                    onForceMute={() => forceMuteUser(user.uid)}
                    onKick={() => kickUser(user.uid)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l border-white/5 overflow-hidden flex-shrink-0"
            >
              <ChatPanel
                messages={messages}
                onSend={sendChatMessage}
                onClose={() => setShowChat(false)}
                currentUid={localUid}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l border-white/5 overflow-hidden flex-shrink-0"
            >
              <ParticipantList
                localUid={localUid}
                localName={displayName}
                localIsAdmin={isAdmin}
                remoteUsers={remoteUsers}
                participantNames={participantNamesRef.current}
                onClose={() => setShowParticipants(false)}
                isAdmin={isAdmin}
                onForceMute={forceMuteUser}
                onKick={kickUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Controls
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onLeave={leaveChannel}
        onEndMeeting={isAdmin ? endMeeting : null}
        isAdmin={isAdmin}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        participantCount={totalParticipants}
      />
    </div>
  );
}