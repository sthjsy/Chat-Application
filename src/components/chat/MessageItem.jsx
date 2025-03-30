import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MessageItem = ({ message, isOwnMessage }) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <CheckCircle size={12} className="text-gray-400" />;
      case 'delivered':
        return <CheckCircle size={12} className="text-blue-400" />;
      case 'read':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'sending':
        return <Clock size={12} className="text-gray-400" />;
      case 'failed':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          {message.sender.avatar ? (
            <img 
              src={message.sender.avatar} 
              alt={message.sender.name} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                {message.sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isOwnMessage ? 'order-1' : 'order-2'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 ml-1">
            {message.sender.name}
          </div>
        )}
        
        <div className={`rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 rounded-bl-none'
        }`}>
          <div className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </div>
          
          <div className="flex justify-end items-center mt-1">
            <span className={`text-xs mr-1 ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
            
            {isOwnMessage && getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;