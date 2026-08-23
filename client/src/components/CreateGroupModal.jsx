import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/chatContext';
import assets from '../assets/assets';
import { X, Users, Image as ImageIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose }) => {
    const { users, createGroup, setSelectedGroup } = useContext(ChatContext);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [groupPic, setGroupPic] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const handlePicUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Select a valid image file');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setGroupPic(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const toggleMember = (userId) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Group name is required');
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error('Select at least one member to create a group');
            return;
        }

        setLoading(true);
        const group = await createGroup({
            name: name.trim(),
            description: description.trim(),
            groupPic,
            members: selectedMembers
        });
        setLoading(false);

        if (group) {
            setSelectedGroup(group);
            onClose();
        }
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

                <h2 className="text-xl font-bold text-violet-300 flex items-center gap-2 mb-4">
                    <Users size={24} /> Create New Group
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Group Icon Upload */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full bg-violet-900/50 border border-violet-500/40 flex items-center justify-center overflow-hidden">
                            {groupPic ? (
                                <img src={groupPic} alt="Group Icon" className="w-full h-full object-cover" />
                            ) : (
                                <Users size={28} className="text-violet-300 opacity-60" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePicUpload}
                                id="group-pic-input"
                                hidden
                            />
                        </div>
                        <label
                            htmlFor="group-pic-input"
                            className="cursor-pointer text-xs bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                        >
                            <ImageIcon size={14} /> Upload Icon
                        </label>
                    </div>

                    {/* Group Name Input */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Group Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Developers"
                            className="w-full bg-[#282142] border border-stone-600/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Group Description Input */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Description (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this group about?"
                            className="w-full bg-[#282142] border border-stone-600/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Member Selection Checkboxes */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">
                            Add Members ({selectedMembers.length} selected)
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 bg-[#282142]/40 rounded-xl p-2 border border-stone-700/50">
                            {users.map((user) => {
                                const isSelected = selectedMembers.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleMember(user._id)}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                            isSelected ? 'bg-violet-600/40' : 'hover:bg-violet-900/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={user.profilePic || assets.avatar_icon}
                                                alt=""
                                                className="w-7 h-7 rounded-full object-cover"
                                            />
                                            <span className="text-sm font-medium">{user.fullName}</span>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                isSelected
                                                    ? 'bg-violet-500 border-violet-400'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
