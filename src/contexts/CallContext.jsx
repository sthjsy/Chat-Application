import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';
import IncomingCallModal from '../components/calls/IncomingCallModal';
import CallWindow from '../components/calls/CallWindow';

const CallContext = createContext(null);

const LOG_PREFIX = '[WebRTC-Call]';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { subscribe, publish, connected } = useSocket();

  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const localStreamRef = useRef(null);
  const subscriptionsRef = useRef([]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const getRemoteUsername = useCallback((call) => {
    if (!call) return null;
    if (call.status === 'outgoing') {
      return call.recipient?.username;
    }
    return call.caller?.username || call.caller;
  }, []);

  const isVideoCallType = (type) => (type || 'audio').toLowerCase().includes('video');

  const requestMediaPermissions = async (type = 'audio') => {
    const isVideo = isVideoCallType(type);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
      stream.getTracks().forEach((track) => track.stop());
      setMediaPermission(true);
      return true;
    } catch (error) {
      if (isVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          audioStream.getTracks().forEach((track) => track.stop());
          setMediaPermission(true);
          return true;
        } catch {
          setMediaPermission(false);
          return false;
        }
      }
      console.error(`${LOG_PREFIX} Media permission denied:`, error);
      setMediaPermission(false);
      return false;
    }
  };

  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const resetPeerConnection = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    iceCandidateQueueRef.current = [];
    setRemoteStream(null);
    incomingOfferRef.current = null;
  }, []);

  const cleanupCall = useCallback((clearActive = true) => {
    stopLocalMedia();
    resetPeerConnection();
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    if (clearActive) {
      setActiveCall(null);
      activeCallRef.current = null;
    }
    setIncomingCall(null);
    incomingCallRef.current = null;
    setIsCallMinimized(false);
  }, [resetPeerConnection, stopLocalMedia]);

  const flushIceCandidateQueue = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;

    const queue = [...iceCandidateQueueRef.current];
    iceCandidateQueueRef.current = [];

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error flushing ICE candidate:`, error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (data) => {
    try {
      const candidate = new RTCIceCandidate(data.payload);
      const pc = peerConnectionRef.current;

      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error adding ICE candidate:`, error);
    }
  }, []);

  const handleHangup = useCallback((data) => {
    console.info(`${LOG_PREFIX} [RECV] hangup:`, data);
    cleanupCall();
  }, [cleanupCall]);

  const setupPeerConnection = useCallback(async ({ sessionId, target, callType }, isInitiator) => {
    try {
      console.info(`${LOG_PREFIX} Setting up PeerConnection. isInitiator: ${isInitiator}`);

      stopLocalMedia();
      resetPeerConnection();

      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCallType(callType),
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioMuted(false);
      setIsVideoMuted(false);
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        const [remote] = event.streams;
        if (remote) {
          setRemoteStream(remote);
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          publish('/app/ice-candidate', {
            target,
            sessionId,
            payload: event.candidate,
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        const call = activeCallRef.current;

        if (state === 'connected') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : prev));
        }

        // Only auto-end after a call was actually connected.
        // "failed" fires while ringing with no peer — don't dismiss the call UI.
        if (state === 'failed' && call?.status === 'connected') {
          cleanupCall();
        }
      };

      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        publish('/app/offer', { target, sessionId, payload: offer });
      }

      return peerConnection;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error setting up peer connection:`, error);
      cleanupCall();
      return null;
    }
  }, [cleanupCall, publish, resetPeerConnection, stopLocalMedia]);

  const processOffer = useCallback(async (offerData) => {
    try {
      const call = activeCallRef.current;
      const target = getRemoteUsername(call) || offerData.caller;
      const callType = call?.type || incomingCallRef.current?.type || 'audio';

      if (!peerConnectionRef.current) {
        await setupPeerConnection(
          { sessionId: offerData.sessionId, target, callType },
          false
        );
      }

      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offerData.payload));
      await flushIceCandidateQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      publish('/app/answer', {
        target,
        sessionId: offerData.sessionId,
        payload: answer,
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} Error processing offer:`, error);
      cleanupCall();
    }
  }, [cleanupCall, flushIceCandidateQueue, getRemoteUsername, publish, setupPeerConnection]);

  const handleOffer = useCallback(async (data) => {
    console.info(`${LOG_PREFIX} [RECV] offer:`, data);
    const call = activeCallRef.current;

    if (call && ['connecting', 'outgoing', 'connected'].includes(call.status)) {
      await processOffer(data);
    } else {
      incomingOfferRef.current = data;
    }
  }, [processOffer]);

  const handleAnswer = useCallback(async (data) => {
    console.info(`${LOG_PREFIX} [RECV] answer:`, data);
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      await flushIceCandidateQueue();
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : prev));
    } catch (error) {
      console.error(`${LOG_PREFIX} Error handling answer:`, error);
      cleanupCall();
    }
  }, [cleanupCall, flushIceCandidateQueue]);

  const handleIncomingCall = useCallback((data) => {
    console.info(`${LOG_PREFIX} [RECV] incoming call:`, data);

    if (incomingCallRef.current?.callId === data.sessionId) {
      return;
    }

    if (activeCallRef.current) {
      publish('/app/hangup', {
        target: data.caller,
        sessionId: data.sessionId,
        payload: { reason: 'busy' },
      });
      return;
    }

    const incomingCallData = {
      ...data,
      caller: {
        username: data.caller,
        id: data.callerId,
        fullName: data.callerName || data.caller,
      },
      type: data.callType?.toLowerCase() || 'audio',
      callId: data.sessionId,
      status: 'incoming',
    };

    incomingCallRef.current = incomingCallData;
    flushSync(() => {
      setIncomingCall(incomingCallData);
    });
    console.info(`${LOG_PREFIX} Incoming call UI state set for session:`, data.sessionId);
  }, [publish]);

  useEffect(() => {
    if (!connected || !currentUser?.id) return;

    const onIncoming = (msg) => handleIncomingCall(JSON.parse(msg.body));
    const onOffer = (msg) => handleOffer(JSON.parse(msg.body));
    const onAnswer = (msg) => handleAnswer(JSON.parse(msg.body));
    const onIce = (msg) => handleIceCandidate(JSON.parse(msg.body));
    const onHangup = (msg) => handleHangup(JSON.parse(msg.body));

    const subs = [
      subscribe('/user/queue/call/incoming', onIncoming),
      subscribe('/user/queue/offer', onOffer),
      subscribe('/user/queue/answer', onAnswer),
      subscribe('/user/queue/ice-candidate', onIce),
      subscribe('/user/queue/hangup', onHangup),
    ];
    subscriptionsRef.current = subs;

    return () => {
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe());
    };
  }, [
    connected,
    currentUser?.id,
    subscribe,
    handleIncomingCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleHangup,
  ]);

  const startCall = async (recipient, type = 'AUDIO', isGroup = false) => {
    if (!connected) {
      alert('Not connected to server. Please wait and try again.');
      return null;
    }

    if (activeCallRef.current || incomingCallRef.current) {
      alert('You are already in a call.');
      return null;
    }

    const permission = mediaPermission || (await requestMediaPermissions(type));
    if (!permission) {
      alert('Microphone/camera permissions are required.');
      return null;
    }

    const normalizedType = type.toLowerCase();
    let sessionId;

    try {
      const payload = isGroup ? { groupId: recipient.id } : { participantId: recipient.id };
      const response = await api.post('/calls/initiate', { ...payload, callType: type.toUpperCase() });
      sessionId = response.data.sessionId || response.data.callId || response.data.id;
    } catch (error) {
      console.warn(`${LOG_PREFIX} Call API unavailable, using local session ID:`, error.message);
      sessionId = uuidv4();
    }

    const callData = {
      callId: sessionId,
      type: normalizedType,
      caller: currentUser,
      recipient,
      status: 'outgoing',
      startTime: new Date(),
    };

    flushSync(() => {
      setActiveCall(callData);
      setIsCallMinimized(false);
    });
    activeCallRef.current = callData;

    publish('/app/call/incoming', {
      target: recipient.username,
      sessionId,
      caller: currentUser.username,
      callerId: currentUser.id,
      callerName: currentUser.fullName || currentUser.username,
      callType: type.toUpperCase(),
    });

    setupPeerConnection(
      { sessionId, target: recipient.username, callType: normalizedType },
      true
    ).catch((err) => {
      console.error(`${LOG_PREFIX} Peer connection setup failed:`, err);
    });

    return callData;
  };

  const answerCall = async (accept) => {
    const call = incomingCallRef.current;
    if (!call) return;

    const { callId, caller, type } = call;

    if (!accept) {
      publish('/app/hangup', {
        target: caller.username,
        sessionId: callId,
        payload: { reason: 'rejected' },
      });
      api.post(`/calls/${callId}/reject`).catch(() => {});
      setIncomingCall(null);
      incomingCallRef.current = null;
      return;
    }

    const permission = mediaPermission || (await requestMediaPermissions(type));
    if (!permission) {
      alert('Microphone/camera permissions are required.');
      setIncomingCall(null);
      incomingCallRef.current = null;
      return;
    }

    const activeCallData = {
      ...call,
      status: 'connecting',
      recipient: caller,
      startTime: new Date(),
    };

    flushSync(() => {
      setActiveCall(activeCallData);
      setIncomingCall(null);
      setIsCallMinimized(false);
    });
    activeCallRef.current = activeCallData;
    incomingCallRef.current = null;

    api.post(`/calls/${callId}/accept`).catch(() => {});

    const storedOffer = incomingOfferRef.current;
    if (storedOffer && storedOffer.sessionId === callId) {
      await processOffer(storedOffer);
      incomingOfferRef.current = null;
    } else {
      await setupPeerConnection(
        { sessionId: callId, target: caller.username, callType: type },
        false
      );
    }
  };

  const endCall = () => {
    const call = activeCallRef.current;
    if (!call) return;

    const target = getRemoteUsername(call);
    if (target) {
      publish('/app/hangup', {
        target,
        sessionId: call.callId,
        payload: { reason: 'ended' },
      });
    }

    api.post(`/calls/${call.callId}/end`).catch(() => {});

    cleanupCall();
  };

  const toggleAudio = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    const nextMuted = tracks.length > 0 ? tracks[0].enabled : false;
    tracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsAudioMuted(nextMuted);
  };

  const toggleVideo = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    const nextMuted = tracks.length > 0 ? tracks[0].enabled : false;
    tracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsVideoMuted(nextMuted);
  };

  const value = {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo,
    isCallMinimized,
    setIsCallMinimized,
  };

  const callOverlay =
    typeof document !== 'undefined'
      ? createPortal(
          <>
            {incomingCall && !activeCall && <IncomingCallModal />}
            {activeCall && <CallWindow />}
          </>,
          document.body
        )
      : null;

  return (
    <CallContext.Provider value={value}>
      {children}
      {callOverlay}
    </CallContext.Provider>
  );
};
