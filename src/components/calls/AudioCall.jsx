import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import CallControls from './CallControls';
import { Mic, MicOff } from 'lucide-react';

const StreamAudio = ({ stream, muted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = stream || null;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline muted={muted} />;
};

const AudioCall = () => {
  const {
    activeCall,
    endCall,
    toggleAudio,
    localStream,
    remoteStream,
    isAudioMuted,
  } = useCall();
  const { currentUser } = useAuth();
  const [duration, setDuration] = useState('00:00');

  const remoteParticipant =
    activeCall?.status === 'outgoing' ? activeCall.recipient : activeCall?.caller;

  const remoteName =
    remoteParticipant?.fullName ||
    remoteParticipant?.username ||
    remoteParticipant?.name ||
    'Remote User';

  const localName =
    currentUser?.fullName || currentUser?.username || 'You';

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
      <div className="flex-grow p-4 flex items-center justify-center">
        <div className="text-center w-full">
          <h2 className="text-xl font-semibold text-white mb-6">Audio Call</h2>

          <div className="flex justify-center gap-10">
            <div className="flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full ${
                  !isAudioMuted ? 'bg-blue-500' : 'bg-gray-500'
                } flex items-center justify-center mb-2 relative`}
              >
                <span className="text-2xl font-semibold text-white">
                  {localName.charAt(0).toUpperCase()}
                </span>
                <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1">
                  {!isAudioMuted ? (
                    <Mic size={16} className="text-green-500" />
                  ) : (
                    <MicOff size={16} className="text-red-500" />
                  )}
                </div>
              </div>
              <span className="text-white text-sm">{localName} (You)</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center mb-2">
                <span className="text-2xl font-semibold text-white">
                  {remoteName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm">{remoteName}</span>
              <span className="text-gray-400 text-xs mt-1 capitalize">
                {activeCall.status === 'connected' ? 'Connected' : activeCall.status}
              </span>
            </div>
          </div>

          <div className="mt-8 text-white text-xl font-mono">{duration}</div>
        </div>
      </div>

      <div className="p-4 flex justify-center">
        <CallControls
          onEnd={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={() => {}}
          onToggleChat={() => {}}
          onToggleParticipants={() => {}}
          onToggleScreenShare={() => {}}
          isAudioEnabled={!isAudioMuted}
          isVideoEnabled={false}
          isInCall
          showVideo={false}
          showScreenShare={false}
          showChat={false}
          showParticipants={false}
        />
      </div>

      {localStream && <StreamAudio stream={localStream} muted />}
      {remoteStream && <StreamAudio stream={remoteStream} />}
    </div>
  );
};

export default AudioCall;
