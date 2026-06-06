import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Pin, PinOff } from 'lucide-react';

const StreamVideo = ({ stream, muted, className }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
};

const VideoGrid = ({ participants, pinnedParticipantId, onPinParticipant }) => {
  const pinnedParticipant = participants.find((p) => p.id === pinnedParticipantId);
  const otherParticipants = participants.filter((p) => p.id !== pinnedParticipantId);

  const getGridClassName = (count) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const renderParticipantVideo = (participant, isPinned = false) => (
    <div key={participant.id} className={`relative ${isPinned ? 'col-span-full' : ''}`}>
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {participant.videoStream ? (
          <StreamVideo
            stream={participant.videoStream}
            muted={participant.isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-2xl font-semibold text-white">
                {(participant.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black bg-opacity-60 rounded-lg px-2 py-1 text-white flex items-center space-x-2">
          <span>
            {participant.name} {participant.isLocal ? '(You)' : ''}
          </span>
          {participant.isAudioEnabled ? (
            <Mic size={16} className="text-white" />
          ) : (
            <MicOff size={16} className="text-white" />
          )}
        </div>

        <button
          type="button"
          onClick={() => onPinParticipant(isPinned ? null : participant.id)}
          className="bg-black bg-opacity-60 rounded-lg p-1 text-white"
        >
          {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {pinnedParticipant ? (
        <div className="h-full grid grid-rows-4 gap-2">
          <div className="row-span-3">{renderParticipantVideo(pinnedParticipant, true)}</div>
          <div className={`grid ${getGridClassName(otherParticipants.length)} gap-2`}>
            {otherParticipants.map((participant) => renderParticipantVideo(participant))}
          </div>
        </div>
      ) : (
        <div className={`h-full grid ${getGridClassName(participants.length)} gap-2`}>
          {participants.map((participant) => renderParticipantVideo(participant))}
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
