import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/chatContext';
import CreateGroupModal from './CreateGroupModal';
import StatusStoryBar from './StatusStoryBar';
import { Plus, Users, User, MessageSquare } from 'lucide-react';

const Sidebar = () => {
    const {
        getUsers,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        typingUsers,
        groups,
        selectedGroup,
        setSelectedGroup,
        getUserGroups,
        groupTypingUsers
    } = useContext(ChatContext);

    const { logout, onlineUsers } = useContext(AuthContext);

    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'direct', 'groups'
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const navigate = useNavigate();

    const filteredUsers = input
        ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
        : users;

    // Sort active (online) users to the top
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aOnline = onlineUsers.includes(a._id);
        const bOnline = onlineUsers.includes(b._id);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return a.fullName.localeCompare(b.fullName);
    });

    const filteredGroups = input
        ? groups.filter((group) => group.name.toLowerCase().includes(input.toLowerCase()))
        : groups;

    useEffect(() => {
        getUsers();
        getUserGroups();
    }, [onlineUsers]);

    return (
        <div
            className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white flex flex-col justify-between ${
                selectedUser || selectedGroup ? 'max-md:hidden' : ''
            }`}
        >
            {/* Modal for creating a new group */}
            {showCreateGroupModal && (
                <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
            )}

            <div>
                {/* Header */}
                <div className="pb-4 border-b border-stone-700/50">
                    <div className="flex justify-between items-center">
                        <img src={assets.logo} alt="logo" className="max-w-36" />
                        <div className="flex items-center gap-2">
                            {/* New Group Button */}
                            <button
                                onClick={() => setShowCreateGroupModal(true)}
                                className="p-1.5 bg-violet-600/80 hover:bg-violet-600 text-white rounded-full transition-all shadow"
                                title="Create New Group"
                            >
                                <Plus size={18} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="relative py-2 group">
                                <img
                                    src={assets.menu_icon}
                                    alt="Menu"
                                    className="max-h-5 cursor-pointer opacity-80 hover:opacity-100"
                                />
                                <div className="absolute top-full right-0 z-20 w-36 p-4 rounded-xl bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block shadow-xl">
                                    <p
                                        onClick={() => navigate('/profile')}
                                        className="cursor-pointer text-xs hover:text-violet-300 py-1"
                                    >
                                        Edit Profile
                                    </p>
                                    <hr className="my-1.5 border-t border-gray-600" />
                                    <p
                                        onClick={() => logout()}
                                        className="cursor-pointer text-xs hover:text-red-400 py-1"
                                    >
                                        Logout
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2.5 px-4 mt-4 border border-white/5">
                        <img src={assets.search_icon} alt="Search" className="w-3 opacity-60" />
                        <input
                            onChange={(e) => setInput(e.target.value)}
                            type="text"
                            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
                            placeholder="Search contacts or groups..."
                        />
                    </div>

                    {/* Status / Stories Bar */}
                    <StatusStoryBar />

                    {/* Tabs Bar */}
                    <div className="flex items-center justify-around mt-4 bg-[#282142]/60 p-1 rounded-full text-xs border border-white/5">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-1.5 text-center rounded-full transition-all ${
                                activeTab === 'all'
                                    ? 'bg-violet-600 text-white font-medium shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('direct')}
                            className={`flex-1 py-1.5 text-center rounded-full transition-all ${
                                activeTab === 'direct'
                                    ? 'bg-violet-600 text-white font-medium shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Direct
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 py-1.5 text-center rounded-full transition-all ${
                                activeTab === 'groups'
                                    ? 'bg-violet-600 text-white font-medium shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Groups
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex flex-col space-y-1 mt-3">
                    {/* GROUPS LIST */}
                    {(activeTab === 'all' || activeTab === 'groups') && (
                        <>
                            {filteredGroups.length > 0 && activeTab === 'all' && (
                                <p className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold px-2 my-1">
                                    Groups ({filteredGroups.length})
                                </p>
                            )}
                            {filteredGroups.map((group) => {
                                const isSelected = selectedGroup?._id === group._id;
                                const isGroupTyping = groupTypingUsers[group._id];

                                return (
                                    <div
                                        onClick={() => setSelectedGroup(group)}
                                        key={group._id}
                                        className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-violet-600/40 border border-violet-500/40 shadow-sm'
                                                : 'hover:bg-[#282142]/40'
                                        }`}
                                    >
                                        <div className="relative">
                                            <img
                                                src={group.groupPic || assets.avatar_icon}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover border border-violet-400/30"
                                            />
                                            <span className="absolute -bottom-1 -right-1 bg-violet-600 p-0.5 rounded-full text-white">
                                                <Users size={10} />
                                            </span>
                                        </div>
                                        <div className="flex flex-col leading-snug flex-1 min-w-0">
                                            <p className="font-medium text-sm text-white truncate">
                                                {group.name}
                                            </p>
                                            <p className="text-xs truncate">
                                                {isGroupTyping ? (
                                                    <span className="text-green-400 animate-pulse font-semibold">
                                                        Someone is typing...
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        {group.members?.length || 0} members
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* DIRECT MESSAGES LIST */}
                    {(activeTab === 'all' || activeTab === 'direct') && (
                        <>
                            {sortedUsers.length > 0 && activeTab === 'all' && (
                                <p className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold px-2 mt-3 mb-1">
                                    Direct Messages ({sortedUsers.length})
                                </p>
                            )}
                            {sortedUsers.map((user) => {
                                const isSelected = selectedUser?._id === user._id;

                                return (
                                    <div
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setUnseenMessages((prev) => ({
                                                ...prev,
                                                [user._id]: 0
                                            }));
                                        }}
                                        key={user._id}
                                        className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-violet-600/40 border border-violet-500/40 shadow-sm'
                                                : 'hover:bg-[#282142]/40'
                                        }`}
                                    >
                                        <div className="relative">
                                            <img
                                                src={user?.profilePic || assets.avatar_icon}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover border border-violet-400/30"
                                            />
                                            {onlineUsers.includes(user._id) && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1b2e] shadow-sm animate-pulse"></span>
                                            )}
                                        </div>
                                        <div className="flex flex-col leading-snug flex-1 min-w-0">
                                            <p className="font-medium text-sm text-white truncate">
                                                {user.fullName}
                                            </p>
                                            {typingUsers[user._id] ? (
                                                <span className="text-green-400 text-xs animate-pulse font-semibold">
                                                    typing...
                                                </span>
                                            ) : onlineUsers.includes(user._id) ? (
                                                <span className="text-green-400 text-xs">Online</span>
                                            ) : (
                                                <span className="text-neutral-400 text-xs">Offline</span>
                                            )}
                                        </div>
                                        {unseenMessages[user._id] > 0 && (
                                            <p className="h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white text-[10px] font-bold shadow">
                                                {unseenMessages[user._id]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
