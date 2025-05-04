import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
// import { ToastProvider } from 'react-toast-notifications';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AppLayout from './components/layout/AppLayout';
import Chat from './components/chat/Chat';
import Activity from './components/activity/Activity';
import Announcement from './components/announcement/Announcement';
import Calendar from './components/calendar/Calendar';
import Call from './components/calls/Call';
import VideoCall from './components/calls/VideoCall';
import AudioCall from './components/calls/AudioCall';
import ProtectedRoute from './components/common/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <CallProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/chat" replace />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="chat/:chatId" element={<Chat />} />
                    <Route path="activity" element={<Activity />} />
                    <Route path="announcement" element={<Announcement />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="call" element={<Call />} />
                    <Route path="video-call/:callId" element={<VideoCall />} />
                    <Route path="audio-call/:callId" element={<AudioCall />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CallProvider>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </>
    </BrowserRouter>
  );
};

export default App;