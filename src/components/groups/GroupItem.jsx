// GroupItem.jsx
import React from 'react';
import { Users } from 'lucide-react';

const GroupItem = ({ group, isSelected, onClick }) => {
  return (
    <div
      className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-200 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
        {group.avatar ? (
          <img src={group.avatar} alt={group.name} className="w-10 h-10 rounded-full" />
        ) : (
          <Users size={18} className="text-white" />
        )}
      </div>
      
      <div className="ml-3 flex-grow min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{group.name}</span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
            {group.memberCount} members
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{group.description || 'No description'}</p>
      </div>
    </div>
  );
};

export default GroupItem;