import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCall } from '../../contexts/CallContext';
import { Video, X, Phone } from 'lucide-react';
import './IncomingCallModal.css';

const IncomingCallModal = () => {
  const { incomingCall, answerCall } = useCall();
  const [remainingTime, setRemainingTime] = useState(30);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  const stopRingtone = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // already stopped
      }
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const startRingtone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      audioContextRef.current = ctx;
      oscillatorRef.current = oscillator;
    } catch (err) {
      console.warn('Could not play ringtone:', err);
    }
  }, []);

  const handleReject = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopRingtone();
    answerCall(false);
  }, [answerCall, stopRingtone]);

  const handleAccept = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopRingtone();
    answerCall(true);
  }, [answerCall, stopRingtone]);

  useEffect(() => {
    if (!incomingCall) return undefined;

    setRemainingTime(30);
    startRingtone();

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRingtone();
    };
  }, [incomingCall, startRingtone, stopRingtone, handleReject]);

  if (!incomingCall) {
    return null;
  }

  const callerName =
    incomingCall.caller?.fullName ||
    incomingCall.caller?.username ||
    'Unknown Caller';

  const isVideo = incomingCall.type === 'video';

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-modal">
        <div className="incoming-call-header">
          <div className="incoming-call-type">
            {isVideo ? <Video size={20} /> : <Phone size={20} />}
            {isVideo ? 'Video Call' : 'Audio Call'}
          </div>
          <div className="incoming-call-timer">{remainingTime}s</div>
        </div>

        <div className="incoming-call-caller-info">
          <div className="incoming-call-avatar">
            {incomingCall.caller?.avatar ? (
              <img src={incomingCall.caller.avatar} alt={callerName} />
            ) : (
              callerName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="incoming-call-name">{callerName}</div>
          <div className="incoming-call-label">
            Incoming {incomingCall.type} call
          </div>
        </div>

        <div className="incoming-call-actions">
          <button
            type="button"
            className="incoming-call-btn incoming-call-reject-btn"
            onClick={handleReject}
            title="Decline"
          >
            <X size={24} />
          </button>
          <button
            type="button"
            className="incoming-call-btn incoming-call-accept-btn"
            onClick={handleAccept}
            title="Accept"
          >
            {isVideo ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
