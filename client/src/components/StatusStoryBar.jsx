import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import { Plus } from 'lucide-react';
import StatusViewerModal from './StatusViewerModal';
import toast from 'react-hot-toast';

const StatusStoryBar = () => {
    const { statuses, getStatuses, createStatus } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext);

    const [activeStatusGroup, setActiveStatusGroup] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        getStatuses();
    }, []);

    // Handle posting a new status story
    const handleStatusUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        const captionText = prompt('Enter a caption for your status story (optional):');

        const reader = new FileReader();
        reader.onloadend = async () => {
            await createStatus({
                media: reader.result,
                caption: captionText || ''
            });
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    // My user's status group
    const myStatusGroup = statuses.find((st) => st.user?._id === authUser?._id);
    // Contacts' status groups
    const contactStatusGroups = statuses.filter((st) => st.user?._id !== authUser?._id);

    return (
        <div className="py-2 border-b border-stone-600/40">
            {/* Status Viewer Modal */}
            {activeStatusGroup && (
                <StatusViewerModal
                    userStatusGroup={activeStatusGroup}
                    onClose={() => setActiveStatusGroup(null)}
                />
            )}

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-1 py-1">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleStatusUpload}
                    accept="image/png, image/jpeg, image/webp"
                    hidden
                />

                {/* My Status Item */}
                <div className="flex flex-col items-center min-w-[60px] cursor-pointer group">
                    <div className="relative">
                        <div
                            onClick={() => {
                                if (myStatusGroup) {
                                    setActiveStatusGroup(myStatusGroup);
                                } else {
                                    fileInputRef.current?.click();
                                }
                            }}
                            className={`w-12 h-12 rounded-full p-0.5 ${
                                myStatusGroup
                                    ? 'bg-gradient-to-tr from-violet-500 to-fuchsia-500'
                                    : 'border border-gray-600'
                            }`}
                        >
                            <img
                                src={authUser?.profilePic || assets.avatar_icon}
                                alt="My Status"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="absolute bottom-0 right-0 bg-violet-600 hover:bg-violet-500 text-white rounded-full p-0.5 shadow border border-stone-900"
                            title="Add Status"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                    <span className="text-[10px] text-gray-300 font-medium mt-1 truncate max-w-[56px]">
                        My Status
                    </span>
                </div>

                {/* Contacts' Status Items */}
                {contactStatusGroups.map((stGroup) => (
                    <div
                        key={stGroup.user?._id}
                        onClick={() => setActiveStatusGroup(stGroup)}
                        className="flex flex-col items-center min-w-[60px] cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-400 animate-pulse">
                            <img
                                src={stGroup.user?.profilePic || assets.avatar_icon}
                                alt={stGroup.user?.fullName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium mt-1 truncate max-w-[56px]">
                            {stGroup.user?.fullName?.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusStoryBar;
