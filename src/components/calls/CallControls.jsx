import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import './CallControls.css';

const CallControls = ({
  onEnd,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleParticipants,
  onToggleScreenShare,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing = false,
  isInCall,
  showVideo = true,
  showScreenShare = true,
  showChat = true,
  showParticipants = true,
  showDisconnectLabel = true,
}) => {
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 50) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  if (!isInCall) return null;

  return (
    <div className="call-controls-bar">
      <button
        type="button"
        onClick={onToggleAudio}
        className={`call-control-btn ${!isAudioEnabled ? 'active-off' : ''}`}
        title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {showVideo && (
        <button
          type="button"
          onClick={onToggleVideo}
          className={`call-control-btn ${!isVideoEnabled ? 'active-off' : ''}`}
          title={
            isScreenSharing
              ? 'Stop screen share'
              : isVideoEnabled
                ? 'Turn off camera'
                : 'Turn on camera'
          }
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      )}

      {showScreenShare && (
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`call-control-btn ${isScreenSharing ? 'active-on' : ''}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
        </button>
      )}

      <div className="call-controls-volume-wrap">
        <button
          type="button"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="call-control-btn"
          title="Adjust volume"
        >
          {getVolumeIcon()}
        </button>

        {showVolumeSlider && (
          <div className="call-controls-volume-slider">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            />
          </div>
        )}
      </div>

      {showChat && (
        <button type="button" onClick={onToggleChat} className="call-control-btn" title="Open chat">
          <MessageSquare size={20} />
        </button>
      )}

      {showParticipants && (
        <button
          type="button"
          onClick={onToggleParticipants}
          className="call-control-btn"
          title="Show participants"
        >
          <Users size={20} />
        </button>
      )}

      <button
        type="button"
        onClick={onEnd}
        className="call-control-btn disconnect-btn"
        title="Disconnect call"
      >
        <PhoneOff size={18} />
        {showDisconnectLabel && <span>Disconnect</span>}
      </button>
    </div>
  );
};

export default CallControls;
