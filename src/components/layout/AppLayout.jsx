import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import IncomingCallModal from '../calls/IncomingCallModal';
import { useCall } from '../../contexts/CallContext';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const { incomingCall } = useCall();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Determine if we're in a call page
  const inCallPage = location.pathname.includes('/video-call') || 
                     location.pathname.includes('/audio-call');

  return (
    <div className="app-container">
      {!inCallPage && <Sidebar />}
      <main className={inCallPage ? 'w-full' : 'flex-1 overflow-hidden'}>
        <Outlet />
      </main>
      {incomingCall && <IncomingCallModal />}
    </div>
  );
};

export default AppLayout;