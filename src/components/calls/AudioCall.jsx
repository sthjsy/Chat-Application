// AudioCall.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import CallControls from './CallControls';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import { Mic, MicOff, X } from 'lucide-react';

const AudioCall = ({ call, onEndCall }) => {
  const [participants, setParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
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
        avatar: currentUser.avatar
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
            avatar: participant.avatar
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
            isAudioEnabled: true
          }
        ]);
      });

      // Listen for participants leaving
      socket.on('participant_left', (participantId) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
      });

      // Listen for audio state changes
      socket.on('media_state_change', ({ participantId, audio }) => {
        setParticipants(prev => 
          prev.map(p => 
            p.id === participantId 
              ? { ...p, isAudioEnabled: audio } 
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
  }, [call, currentUser, socket, isAudioEnabled]);

  const handleToggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
    // In a real app, this would also modify the MediaStream tracks
    if (socket) {
      socket.emit('media_state_change', {
        callId: call.id,
        participantId: currentUser.id,
        audio: !isAudioEnabled
      });
    }
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

  // Function to get the call duration
  const getDuration = () => {
    const startTime = new Date(call.startTime).getTime();
    const elapsedMs = Date.now() - startTime;
    
    const seconds = Math.floor((elapsedMs / 1000) % 60);
    const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full bg-gray-900">
      <div className="flex-grow flex flex-col">
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-8">Audio Call</h2>
            
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full ${participant.isAudioEnabled ? 'bg-blue-500' : 'bg-gray-500'} flex items-center justify-center mb-2 relative`}>
                    {participant.avatar ? (
                      <img 
                        src={participant.avatar} 
                        alt={participant.name} 
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-white">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    
                    <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1">
                      {participant.isAudioEnabled ? (
                        <Mic size={16} className="text-green-500" />
                      ) : (
                        <MicOff size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-white">{participant.name} {participant.isLocal ? '(You)' : ''}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-white text-xl">{getDuration()}</div>
          </div>
        </div>
        <div className="p-4 flex justify-center">
          <CallControls 
            onEnd={handleEndCall}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={() => {}}
            onToggleChat={() => setShowChat(prev => !prev)}
            onToggleParticipants={() => setShowParticipants(prev => !prev)}
            onToggleScreenShare={() => {}}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={false}
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
                    {participant.avatar ? (
                      <img 
                        src={participant.avatar} 
                        alt={participant.name} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span>{participant.name} {participant.isLocal ? '(You)' : ''}</span>
                </div>
                <div>
                  {!participant.isAudioEnabled && <MicOff size={16} className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioCall;