import React, { useContext, useState } from 'react';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import { X, ShieldCheck, UserPlus, UserMinus, Users } from 'lucide-react';

const GroupInfoModal = ({ group, onClose }) => {
    const { authUser } = useContext(AuthContext);
    const { users, addMemberToGroup, removeMemberFromGroup } = useContext(ChatContext);

    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

    const isAdmin = group.admins.some((a) => (typeof a === 'object' ? a._id : a) === authUser?._id);

    const nonMembers = users.filter(
        (u) => !group.members.some((m) => (typeof m === 'object' ? m._id : m) === u._id)
    );

    const handleAddMember = async () => {
        if (!selectedUserToAdd) return;
        await addMemberToGroup(group._id, selectedUserToAdd);
        setSelectedUserToAdd('');
        setShowAddMember(false);
    };

    const handleRemoveMember = async (memberId) => {
        await removeMemberFromGroup(group._id, memberId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1e1b2e] border border-violet-500/30 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
                >
                    <X size={20} />
                </button>

                {/* Header Info */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-gray-700/50">
                    <img
                        src={group.groupPic || assets.avatar_icon}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-violet-500 mb-2 shadow-md"
                    />
                    <h2 className="text-xl font-bold text-white">{group.name}</h2>
                    {group.description && (
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">{group.description}</p>
                    )}
                    <p className="text-[11px] text-violet-300 mt-1 font-medium">
                        {group.members?.length || 0} Members
                    </p>
                </div>

                {/* Members List */}
                <div className="py-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                            Group Members
                        </h3>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddMember(!showAddMember)}
                                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
                            >
                                <UserPlus size={14} /> Add Member
                            </button>
                        )}
                    </div>

                    {/* Add Member Dropdown */}
                    {showAddMember && (
                        <div className="flex items-center gap-2 mb-3 bg-[#282142] p-2 rounded-xl border border-violet-500/30">
                            <select
                                value={selectedUserToAdd}
                                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                                className="flex-1 bg-transparent text-xs text-white outline-none"
                            >
                                <option value="" className="bg-[#1e1b2e]">
                                    Select contact to add...
                                </option>
                                {nonMembers.map((u) => (
                                    <option key={u._id} value={u._id} className="bg-[#1e1b2e]">
                                        {u.fullName}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddMember}
                                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {group.members?.map((member) => {
                            const memberObj = typeof member === 'object' ? member : { _id: member };
                            const isMemberAdmin = group.admins.some(
                                (a) => (typeof a === 'object' ? a._id : a) === memberObj._id
                            );
                            const isSelf = memberObj._id === authUser?._id;

                            return (
                                <div
                                    key={memberObj._id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-[#282142]/40 hover:bg-[#282142]/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={memberObj.profilePic || assets.avatar_icon}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover border border-violet-400/30"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {memberObj.fullName || 'User'}{' '}
                                                {isSelf && <span className="text-xs text-gray-400">(You)</span>}
                                            </p>
                                            {memberObj.bio && (
                                                <p className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                                    {memberObj.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isMemberAdmin && (
                                            <span className="flex items-center gap-1 text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded-full font-medium">
                                                <ShieldCheck size={11} /> Admin
                                            </span>
                                        )}

                                        {isAdmin && !isSelf && (
                                            <button
                                                onClick={() => handleRemoveMember(memberObj._id)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="Remove member"
                                            >
                                                <UserMinus size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-700/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupInfoModal;
