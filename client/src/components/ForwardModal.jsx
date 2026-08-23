import React, { useContext, useState } from 'react';
import { ChatContext } from '../../context/chatContext';
import assets from '../assets/assets';
import { X, Search, Forward, Users, User, Check } from 'lucide-react';

const ForwardModal = ({ message, onClose }) => {
  const { users, groups, forwardMessage } = useContext(ChatContext);
  const [search, setSearch] = useState('');
  const [forwardedTargetIds, setForwardedTargetIds] = useState([]);

  const filteredUsers = search
    ? users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()))
    : users;

  const filteredGroups = search
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const handleForward = async (target) => {
    await forwardMessage(target, message);
    setForwardedTargetIds((prev) => [...prev, target._id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#1e1b2e] border border-violet-500/30 rounded-2xl w-full max-w-md p-5 text-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/60">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600/30 p-2 rounded-full text-violet-400">
              <Forward size={20} />
            </div>
            <h2 className="text-base font-bold text-white">Forward Message</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Preview Banner */}
        <div className="my-3 bg-black/30 border-l-4 border-violet-500 p-2.5 rounded-r-lg text-xs text-gray-300">
          <p className="font-semibold text-violet-300">Message Content:</p>
          <p className="truncate mt-0.5 font-normal">
            {message.text ||
              (message.image && '📷 Photo Attachment') ||
              (message.audio && '🎵 Voice Note') ||
              (message.fileName && `📄 ${message.fileName}`) ||
              'Attachment'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2 px-3.5 mb-3 border border-white/10">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts or groups..."
            className="bg-transparent border-none outline-none text-white text-xs placeholder-gray-400 flex-1"
          />
        </div>

        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-bold text-violet-300 tracking-wider mb-1 px-1">
                Groups ({filteredGroups.length})
              </p>
              {filteredGroups.map((group) => {
                const isSent = forwardedTargetIds.includes(group._id);
                return (
                  <div
                    key={group._id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={group.groupPic || assets.avatar_icon}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-violet-400/30"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-violet-600 p-0.5 rounded-full text-white">
                          <Users size={9} />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {group.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleForward({ ...group, isGroup: true })}
                      disabled={isSent}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        isSent
                          ? 'bg-green-600/30 text-green-400 border border-green-500/40 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <Check size={12} /> Sent
                        </>
                      ) : (
                        'Forward'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct Users Section */}
          {filteredUsers.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] uppercase font-bold text-violet-300 tracking-wider mb-1 px-1">
                Contacts ({filteredUsers.length})
              </p>
              {filteredUsers.map((user) => {
                const isSent = forwardedTargetIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-violet-400/30"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleForward(user)}
                      disabled={isSent}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        isSent
                          ? 'bg-green-600/30 text-green-400 border border-green-500/40 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <Check size={12} /> Sent
                        </>
                      ) : (
                        'Forward'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
