import React, { useContext } from 'react';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import { X, PhoneCall, Video, ShieldAlert, Mail, UserCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfileModal = ({ user, onClose }) => {
    const { initiateCall, blockUser } = useContext(ChatContext);
    const { onlineUsers } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!user) return null;

    const isOnline = onlineUsers.includes(user._id);

    const handleVoiceCall = () => {
        onClose();
        const callId = Math.random().toString(36).substring(2, 9);
        initiateCall(user._id, callId, false);
        navigate(`/call/${callId}?video=false`);
    };

    const handleVideoCall = () => {
        onClose();
        const callId = Math.random().toString(36).substring(2, 9);
        initiateCall(user._id, callId, true);
        navigate(`/call/${callId}?video=true`);
    };

    const handleBlockUser = async () => {
        await blockUser(user._id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#1e1b2e] border border-violet-500/40 rounded-3xl w-full max-w-sm p-6 text-white shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                {/* Header background gradient glow */}
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-violet-600/30 to-transparent pointer-events-none"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all"
                    title="Close"
                >
                    <X size={18} />
                </button>

                {/* Avatar with Status Ring */}
                <div className="relative mb-4 mt-2 z-10">
                    <img
                        src={user.profilePic || assets.avatar_icon}
                        alt={user.fullName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-violet-500 shadow-xl"
                    />
                    <span
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e1b2e] shadow-sm ${
                            isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'
                        }`}
                        title={isOnline ? 'Online' : 'Offline'}
                    ></span>
                </div>

                {/* Full Name & Status */}
                <h3 className="text-xl font-bold text-white mb-1 z-10 truncate max-w-full">
                    {user.fullName}
                </h3>
                <p className="text-xs text-violet-300 font-medium mb-4 z-10 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    {isOnline ? 'Online Now' : 'Offline'}
                </p>

                {/* Bio / About */}
                <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-3.5 mb-4 text-left z-10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                        <Info size={14} />
                        <span>About / Bio</span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed italic">
                        "{user.bio || 'Hey there! I am using WhatsApp.'}"
                    </p>
                </div>

                {/* Contact Information */}
                {user.email && (
                    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-3.5 mb-5 text-left z-10 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                            <Mail size={14} />
                            <span>Email Contact</span>
                        </div>
                        <p className="text-xs text-gray-300 truncate">
                            {user.email}
                        </p>
                    </div>
                )}

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full z-10 mb-3">
                    <button
                        onClick={handleVoiceCall}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <PhoneCall size={16} />
                        <span>Voice Call</span>
                    </button>
                    <button
                        onClick={handleVideoCall}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <Video size={16} />
                        <span>Video Call</span>
                    </button>
                </div>

                {/* Block / Security Button */}
                <button
                    onClick={handleBlockUser}
                    className="w-full py-2.5 px-4 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer z-10"
                >
                    <ShieldAlert size={16} />
                    <span>Block / Unblock User</span>
                </button>
            </div>
        </div>
    );
};

export default UserProfileModal;
