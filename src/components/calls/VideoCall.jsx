import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';
import './VideoGrid.css';

const VideoCall = () => {
  const {
    activeCall,
    endCall,
    toggleAudio,
    toggleVideo,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
  } = useCall();
  const { currentUser } = useAuth();
  const [duration, setDuration] = useState('00:00');
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);

  const remoteParticipant =
    activeCall?.status === 'outgoing' ? activeCall.recipient : activeCall?.caller;

  const remoteName =
    remoteParticipant?.fullName ||
    remoteParticipant?.username ||
    remoteParticipant?.name ||
    'Remote User';

  const localName = currentUser?.fullName || currentUser?.username || 'You';

  const localHasVideo = localStream?.getVideoTracks?.().length > 0;
  const remoteHasVideo = remoteStream?.getVideoTracks?.().length > 0;

  const participants = useMemo(
    () => [
      {
        id: currentUser?.id || 'local',
        name: localName,
        isLocal: true,
        isAudioEnabled: !isAudioMuted,
        isVideoEnabled: localHasVideo && !isVideoMuted,
        videoStream: localStream,
      },
      {
        id: remoteParticipant?.id || 'remote',
        name: remoteName,
        isLocal: false,
        isAudioEnabled: true,
        isVideoEnabled: remoteHasVideo,
        videoStream: remoteStream,
      },
    ],
    [
      currentUser?.id,
      localName,
      remoteName,
      remoteParticipant?.id,
      isAudioMuted,
      isVideoMuted,
      localStream,
      remoteStream,
      localHasVideo,
      remoteHasVideo,
    ]
  );

  useEffect(() => {
    if (!activeCall?.startTime) return undefined;

    const tick = () => {
      const elapsedMs = Date.now() - new Date(activeCall.startTime).getTime();
      const seconds = Math.floor((elapsedMs / 1000) % 60);
      const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      setDuration(
        `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.startTime]);

  if (!activeCall) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <p style={{ color: '#fff' }}>Call not found or has ended.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#111' }}>
      <div style={{ padding: '8px', textAlign: 'center', color: '#fff', fontSize: '13px', background: '#1e1f22' }}>
        {remoteName} — {duration}
        {activeCall.status !== 'connected' && (
          <span style={{ marginLeft: '8px', color: '#f0b232', textTransform: 'capitalize' }}>
            ({activeCall.status})
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: '8px' }}>
        <VideoGrid
          participants={participants}
          pinnedParticipantId={pinnedParticipantId}
          onPinParticipant={setPinnedParticipantId}
        />
      </div>

      <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
        <CallControls
          onEnd={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleChat={() => {}}
          onToggleParticipants={() => {}}
          onToggleScreenShare={() => {}}
          isAudioEnabled={!isAudioMuted}
          isVideoEnabled={localHasVideo && !isVideoMuted}
          isInCall
          showChat={false}
          showParticipants={false}
        />
      </div>
    </div>
  );
};

export default VideoCall;
