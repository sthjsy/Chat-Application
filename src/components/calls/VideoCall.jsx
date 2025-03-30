// VideoCall.jsx
import React, { useState, useEffect } from 'react';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import { X } from 'lucide-react';

const VideoCall = ({ call, onEndCall }) => {
  const [participants, setParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState([]);
  const { socket, connected } = useSocket();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Initialize with the current user
    const initialParticipants = [
      {
        id: currentUser.id,
        name: currentUser.name,
        isLocal: true,
        isAudioEnabled,
        isVideoEnabled,
        videoStream: null // In a real app, this would be a MediaStream object
      }
    ];

    // Add other participants from the call
    if (call.participants) {
      call.participants.forEach(participant => {
        if (participant.id !== currentUser.id) {
          initialParticipants.push({
            id: participant.id,
            name: participant.name,
            isLocal: false,
            isAudioEnabled: true,
            isVideoEnabled: true,
            videoStream: null // In a real app, this would be received from WebRTC
          });
        }
      });
    }

    setParticipants(initialParticipants);

    // Set up event listeners for WebRTC and socket events
    if (socket) {
      // Listen for new participants
      socket.on('participant_joined', (participant) => {
        setParticipants(prev => [
          ...prev, 
          { 
            ...participant, 
            isLocal: false, 
            isAudioEnabled: true, 
            isVideoEnabled: true, 
            videoStream: null 
          }
        ]);
      });

      // Listen for participants leaving
      socket.on('participant_left', (participantId) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        if (pinnedParticipantId === participantId) {
          setPinnedParticipantId(null);
        }
      });

      // Listen for audio/video state changes
      socket.on('media_state_change', ({ participantId, audio, video }) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === participantId 
              ? { ...p, isAudioEnabled: audio, isVideoEnabled: video } 
              : p
          )
        );
      });

      // Listen for call messages
      socket.on('call_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('participant_joined');
        socket.off('participant_left');
        socket.off('media_state_change');
        socket.off('call_message');
      };
    }
  }, [call, currentUser, socket, isAudioEnabled, isVideoEnabled, pinnedParticipantId]);

  const handleToggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
    // In a real app, this would also modify the MediaStream tracks
    if (socket) {
      socket.emit('media_state_change', {
        callId: call.id,
        participantId: currentUser.id,
        audio: !isAudioEnabled,
        video: isVideoEnabled
      });
    }
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
    // In a real app, this would also modify the MediaStream tracks
    if (socket) {
      socket.emit('media_state_change', {
        callId: call.id,
        participantId: currentUser.id,
        audio: isAudioEnabled,
        video: !isVideoEnabled
      });
    }
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(prev => !prev);
    // In a real app, this would handle screen sharing via WebRTC
  };

  const handleEndCall = () => {
    // In a real app, close all WebRTC connections
    if (socket) {
      socket.emit('leave_call', {
        callId: call.id,
        participantId: currentUser.id
      });
    }
    onEndCall();
  };

  const sendMessage = (content) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: currentUser,
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (socket) {
      socket.emit('send_call_message', {
        callId: call.id,
        message: newMessage
      });
    }
  };

  return (
    <div className="flex h-full bg-gray-900">
      <div className="flex-grow flex flex-col">
        <div className="flex-grow p-4">
          <VideoGrid 
            participants={participants} 
            pinnedParticipantId={pinnedParticipantId}
            onPinParticipant={setPinnedParticipantId}
          />
        </div>
        <div className="p-4 flex justify-center">
          <CallControls 
            onEnd={handleEndCall}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleChat={() => setShowChat(prev => !prev)}
            onToggleParticipants={() => setShowParticipants(prev => !prev)}
            onToggleScreenShare={handleToggleScreenShare}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isInCall={true}
          />
        </div>
      </div>

      {showChat && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Call Chat</h3>
            <button 
              onClick={() => setShowChat(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          <MessageList 
            messages={messages} 
            currentUserId={currentUser.id} 
            loading={false} 
          />
          <div className="p-4 border-t border-gray-200">
            <MessageInput onSendMessage={sendMessage} onTyping={() => {}} />
          </div>
        </div>
      )}

      {showParticipants && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Participants ({participants.length})</h3>
            <button 
              onClick={() => setShowParticipants(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="overflow-y-auto flex-grow">
            {participants.map((participant) => (
              <div 
                key={participant.id} 
                className="p-4 border-b border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-white">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{participant.name} {participant.isLocal ? '(You)' : ''}</span>
                </div>
                <div className="flex space-x-1">
                  {!participant.isAudioEnabled && <MicOff size={16} className="text-red-500" />}
                  {!participant.isVideoEnabled && <VideoOff size={16} className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;