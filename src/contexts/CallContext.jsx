import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { socket, connected } = useSocket();
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('webrtc:ice-candidate');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
    };
  }, [socket, connected]);

  const handleIncomingCall = (callData) => {
    console.log('Incoming call:', callData);
    setIncomingCall(callData);
  };

  const handleCallAccepted = async (callData) => {
    console.log('Call accepted:', callData);
    setActiveCall(prev => ({
      ...prev,
      status: 'connected',
      remoteSettings: callData.settings
    }));
    await setupPeerConnection(callData);
  };

  const handleCallRejected = (callData) => {
    console.log('Call rejected:', callData);
    if (activeCall?.callId === callData.callId) {
      cleanupCall();
    }
  };

  const handleCallEnded = (callData) => {
    console.log('Call ended:', callData);
    if (activeCall?.callId === callData.callId) {
      cleanupCall();
      navigate('/');
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleOffer = async (data) => {
    if (!peerConnectionRef.current) {
      await setupPeerConnection();
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit('webrtc:answer', {
        callId: data.callId,
        to: data.from,
        sdp: peerConnectionRef.current.localDescription
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const setupPeerConnection = async (callData = null) => {
    try {
      cleanupCall();

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      const callType = callData?.type || activeCall?.type || 'audio';
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });

      setLocalStream(stream);
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          const recipient = callData?.from || activeCall?.recipient?.id;
          socket.emit('webrtc:ice-candidate', {
            callId: callData?.callId || activeCall?.callId,
            to: recipient,
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed' ||
            peerConnection.connectionState === 'closed') {
          cleanupCall();
        }
      };

      if (activeCall?.status === 'outgoing' && !callData) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('webrtc:offer', {
          callId: activeCall.callId,
          to: activeCall.recipient.id,
          sdp: peerConnection.localDescription
        });
      }

      return peerConnection;
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      return null;
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
  };

  const startCall = async (recipient, type = 'audio') => {
    if (!socket || !connected) {
      console.error('Socket not connected');
      return null;
    }

    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const callData = {
        callId,
        type,
        caller: {
          id: currentUser.id,
          name: currentUser.fullName,
          avatar: currentUser.profilePicture
        },
        recipient,
        status: 'outgoing',
        startTime: new Date(),
        localSettings: {
          audio: true,
          video: type === 'video'
        }
      };

      setActiveCall(callData);
      await setupPeerConnection();

      socket.emit('call:start', {
        callId,
        to: recipient.id,
        type
      });

      navigate(`/${type}-call/${callId}`);
      return callData;
    } catch (error) {
      console.error('Error starting call:', error);
      return null;
    }
  };

  const answerCall = async (accept) => {
    if (!socket || !incomingCall) return;

    if (accept) {
      const mediaOptions = {
        audio: true,
        video: incomingCall.type === 'video'
      };

      socket.emit('call:accept', {
        callId: incomingCall.callId,
        to: incomingCall.caller.id,
        settings: mediaOptions
      });

      setActiveCall({
        ...incomingCall,
        status: 'connected',
        localSettings: mediaOptions
      });

      navigate(`/${incomingCall.type}-call/${incomingCall.callId}`);
    } else {
      socket.emit('call:reject', {
        callId: incomingCall.callId,
        to: incomingCall.caller.id
      });
    }

    setIncomingCall(null);
  };

  const endCall = () => {
    if (!socket || !activeCall) return;

    socket.emit('call:end', {
      callId: activeCall.callId,
      to: activeCall.recipient.id
    });

    cleanupCall();
    navigate('/');
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveCall(prev => ({
        ...prev,
        localSettings: {
          ...prev.localSettings,
          audio: audioTrack.enabled
        }
      }));
    }
  };

  const toggleVideo = async () => {
    if (!localStream || activeCall?.type !== 'video') return;

    try {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders()
            .find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }
      }

      setActiveCall(prev => ({
        ...prev,
        localSettings: {
          ...prev.localSettings,
          video: true
        }
      }));
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const value = {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
