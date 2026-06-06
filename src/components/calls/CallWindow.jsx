import React, { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Minimize2, Maximize2, PhoneOff } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import AudioCall from './AudioCall';
import VideoCall from './VideoCall';

const CallWindow = () => {
  const { activeCall, isCallMinimized, setIsCallMinimized, endCall } = useCall();
  const nodeRef = useRef(null);

  useEffect(() => {
    if (activeCall) {
      console.log('[CallWindow] Active call:', activeCall);
    }
  }, [activeCall]);

  if (!activeCall) {
    return null;
  }

  const isVideo =
    activeCall.type === 'video' || activeCall.type === 'VIDEO';

  return (
    <Draggable nodeRef={nodeRef} handle=".call-window-header" bounds="parent">
      <div
        ref={nodeRef}
        className={`call-window ${isCallMinimized ? 'minimized' : ''}`}
        style={{
          position: 'fixed',
          top: '50px',
          right: '50px',
          zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2c2f33',
          border: '1px solid #444',
        }}
      >
        <div
          className="call-window-header"
          style={{
            padding: '12px',
            backgroundColor: '#23272a',
            color: 'white',
            cursor: 'move',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #111',
            gap: '8px',
          }}
        >
          <span style={{ fontWeight: 'bold', flex: 1 }}>
            {isVideo ? 'Video Call' : 'Audio Call'}
            {activeCall.status === 'outgoing' && ' — Ringing…'}
            {activeCall.status === 'connecting' && ' — Connecting…'}
          </span>
          <button
            type="button"
            onClick={endCall}
            title="Disconnect call"
            style={{
              background: '#ed4245',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <PhoneOff size={14} />
            Disconnect
          </button>
          <button
            type="button"
            onClick={() => setIsCallMinimized((prev) => !prev)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            {isCallMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
        {!isCallMinimized && (
          <div
            className="call-window-body"
            style={{
              height: isVideo ? '500px' : '420px',
              width: isVideo ? '640px' : '400px',
              position: 'relative',
            }}
          >
            {isVideo ? <VideoCall /> : <AudioCall />}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default CallWindow;
