import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Pin, PinOff } from 'lucide-react';
import './VideoGrid.css';

const hasLiveVideoTrack = (stream) =>
  stream?.getVideoTracks?.().some((track) => track.readyState === 'live') ?? false;

const StreamVideo = ({ stream, muted }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    el.srcObject = stream || null;

    if (stream) {
      el.play().catch((err) => {
        console.warn('[VideoGrid] autoplay failed:', err);
      });
    }

    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="video-participant-stream"
    />
  );
};

const VideoGrid = ({ participants, pinnedParticipantId, onPinParticipant }) => {
  const pinnedParticipant = participants.find((p) => p.id === pinnedParticipantId);
  const otherParticipants = participants.filter((p) => p.id !== pinnedParticipantId);

  const renderParticipantVideo = (participant, isPinned = false) => {
    const showVideo = hasLiveVideoTrack(participant.videoStream);

    return (
      <div
        key={participant.id}
        className={`video-participant ${isPinned ? 'pinned' : ''}`}
      >
        <div className="video-participant-frame">
          {showVideo ? (
            <StreamVideo stream={participant.videoStream} muted={participant.isLocal} />
          ) : (
            <div className="video-participant-placeholder">
              <div className="video-participant-avatar">
                {(participant.name || '?').charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <div className="video-participant-overlay">
            <div className="video-participant-label">
              <span>
                {participant.name} {participant.isLocal ? '(You)' : ''}
              </span>
              {participant.isAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
            </div>

            <button
              type="button"
              onClick={() => onPinParticipant(isPinned ? null : participant.id)}
              className="video-participant-pin-btn"
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (pinnedParticipant) {
    return (
      <div className="video-grid video-grid-split">
        <div className="video-grid-main">
          {renderParticipantVideo(pinnedParticipant, true)}
        </div>
        <div className={`video-grid-thumbs count-${Math.min(otherParticipants.length, 4) || 1}`}>
          {otherParticipants.map((participant) => renderParticipantVideo(participant))}
        </div>
      </div>
    );
  }

  return (
    <div className={`video-grid video-grid-equal count-${Math.min(participants.length, 4) || 1}`}>
      {participants.map((participant) => renderParticipantVideo(participant))}
    </div>
  );
};

export default VideoGrid;
