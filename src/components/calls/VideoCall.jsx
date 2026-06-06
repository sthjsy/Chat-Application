import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';

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

  const localName =
    currentUser?.fullName || currentUser?.username || 'You';

  const participants = useMemo(
    () => [
      {
        id: currentUser?.id || 'local',
        name: localName,
        isLocal: true,
        isAudioEnabled: !isAudioMuted,
        isVideoEnabled: !isVideoMuted,
        videoStream: localStream,
      },
      {
        id: remoteParticipant?.id || 'remote',
        name: remoteName,
        isLocal: false,
        isAudioEnabled: true,
        isVideoEnabled: true,
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
      <div className="flex h-full bg-gray-900 items-center justify-center">
        <p className="text-white">Call not found or has ended.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="p-2 text-center text-white text-sm bg-gray-800">
        {remoteName} — {duration}
        {activeCall.status !== 'connected' && (
          <span className="ml-2 text-yellow-400 capitalize">({activeCall.status})</span>
        )}
      </div>
      <div className="flex-grow p-2 min-h-0">
        <VideoGrid
          participants={participants}
          pinnedParticipantId={pinnedParticipantId}
          onPinParticipant={setPinnedParticipantId}
        />
      </div>
      <div className="p-3 flex justify-center">
        <CallControls
          onEnd={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleChat={() => {}}
          onToggleParticipants={() => {}}
          onToggleScreenShare={() => {}}
          isAudioEnabled={!isAudioMuted}
          isVideoEnabled={!isVideoMuted}
          isInCall
          showChat={false}
          showParticipants={false}
        />
      </div>
    </div>
  );
};

export default VideoCall;
