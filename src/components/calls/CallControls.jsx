import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  Users,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';

const CallControls = ({
  onEnd,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleParticipants,
  onToggleScreenShare,
  isAudioEnabled,
  isVideoEnabled,
  isInCall,
  showVideo = true,
  showScreenShare = true,
  showChat = true,
  showParticipants = true,
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
    <div className="bg-gray-800 p-3 rounded-lg flex items-center justify-center flex-wrap gap-2">
      <button
        type="button"
        onClick={onToggleAudio}
        className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
        title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isAudioEnabled ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
      </button>

      {showVideo && (
        <button
          type="button"
          onClick={onToggleVideo}
          className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
        </button>
      )}

      {showScreenShare && (
        <button
          type="button"
          onClick={onToggleScreenShare}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
          title="Share screen"
        >
          <MonitorUp size={20} className="text-white" />
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
          title="Adjust volume"
        >
          {getVolumeIcon()}
        </button>

        {showVolumeSlider && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-700 p-3 rounded-lg shadow-lg">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-32"
            />
          </div>
        )}
      </div>

      {showChat && (
        <button
          type="button"
          onClick={onToggleChat}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
          title="Open chat"
        >
          <MessageSquare size={20} className="text-white" />
        </button>
      )}

      {showParticipants && (
        <button
          type="button"
          onClick={onToggleParticipants}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
          title="Show participants"
        >
          <Users size={20} className="text-white" />
        </button>
      )}

      <button
        type="button"
        onClick={onEnd}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600"
        title="End call"
      >
        <PhoneOff size={20} className="text-white" />
      </button>
    </div>
  );
};

export default CallControls;
