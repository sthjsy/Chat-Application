import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
// import { PhoneIncoming, Video, X, Mic, MicOff, Phone } from 'react-icons/hi';
import { PhoneIncoming, Video, X, Mic, MicOff, Phone } from 'lucide-react';


const IncomingCallModal = ({ call, onAccept, onReject }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.type === 'video');
  const [remainingTime, setRemainingTime] = useState(30);
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio('/sounds/incoming-call.mp3'));
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  useEffect(() => {
    // Play ringtone
    audioRef.current.loop = true;
    audioRef.current.play().catch(err => console.error('Failed to play sound:', err));

    // Set timer for auto-rejection
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      // Clean up on unmount
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAccept = () => {
    audioRef.current.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Send accept call signal
    socket.emit('call:accept', {
      callId: call.callId,
      to: call.caller.id,
      withVideo: isVideoEnabled,
      withAudio: isAudioEnabled
    });
    
    onAccept({
      ...call,
      isAudioEnabled,
      isVideoEnabled
    });
    
    // Navigate to call screen
    navigate(`/calls/${call.callId}`);
  };

  const handleReject = () => {
    audioRef.current.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Send reject call signal
    socket.emit('call:reject', {
      callId: call.callId,
      to: call.caller.id
    });
    
    onReject(call.callId);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
  };

  return (
    <div className="modal-overlay">
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .incoming-call-modal {
          background-color: #292929;
          border-radius: 8px;
          width: 350px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          color: white;
        }
        
        .call-header {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #1f1f1f;
        }
        
        .call-type {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #6264a7;
        }
        
        .call-type svg {
          margin-right: 8px;
        }
        
        .timer {
          font-size: 14px;
          opacity: 0.7;
        }
        
        .caller-info {
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #6264a7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 500;
          margin-bottom: 16px;
          overflow: hidden;
        }
        
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .caller-name {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .call-label {
          font-size: 14px;
          opacity: 0.7;
        }
        
        .media-options {
          display: flex;
          justify-content: center;
          padding: 16px;
          gap: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .media-btn {
          background-color: #3b3b3b;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }
        
        .media-btn:hover {
          background-color: #4b4b4b;
        }
        
        .media-btn.off {
          background-color: #d74747;
        }
        
        .media-btn.off:hover {
          background-color: #e25a5a;
        }
        
        .call-actions {
          display: flex;
          padding: 16px;
          gap: 16px;
          justify-content: space-around;
          background-color: #1f1f1f;
        }
        
        .call-btn {
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 24px;
          transition: all 0.2s;
        }
        
        .accept-btn {
          background-color: #2d8530;
        }
        
        .accept-btn:hover {
          background-color: #339436;
        }
        
        .reject-btn {
          background-color: #d74747;
        }
        
        .reject-btn:hover {
          background-color: #e25a5a;
        }
      `}</style>
      <div className="incoming-call-modal">
        <div className="call-header">
          <div className="call-type">
            {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
            {call.type === 'video' ? 'Video Call' : 'Audio Call'}
          </div>
          <div className="timer">{remainingTime}s</div>
        </div>
        
        <div className="caller-info">
          <div className="avatar">
            {call.caller.avatar ? (
              <img src={call.caller.avatar} alt={call.caller.name} />
            ) : (
              call.caller.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="caller-name">{call.caller.name}</div>
          <div className="call-label">
            {call.isGroupCall ? 'Incoming group call' : 'Incoming call'}
          </div>
        </div>
        
        {call.type === 'video' && (
          <div className="media-options">
            <button 
              className={`media-btn ${!isAudioEnabled ? 'off' : ''}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
              className={`media-btn ${!isVideoEnabled ? 'off' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              <Video size={20} />
            </button>
          </div>
        )}
        
        <div className="call-actions">
          <button 
            className="call-btn reject-btn"
            onClick={handleReject}
            title="Decline"
          >
            <X size={24} />
          </button>
          <button 
            className="call-btn accept-btn"
            onClick={handleAccept}
            title="Accept"
          >
            {call.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;