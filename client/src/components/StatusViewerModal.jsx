import React, { useContext, useEffect, useState } from 'react';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import { formatMessageTime } from '../lib/utils';
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import assets from '../assets/assets';

const StatusViewerModal = ({ userStatusGroup, onClose }) => {
    const { viewStatus } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showViewers, setShowViewers] = useState(false);

    const stories = userStatusGroup?.stories || [];
    const currentStory = stories[currentIndex];
    const isMe = userStatusGroup?.user?._id === authUser?._id;

    // Trigger status view tracking on current story
    useEffect(() => {
        if (currentStory?._id) {
            viewStatus(currentStory._id);
        }
        setProgress(0);
    }, [currentIndex, currentStory]);

    // Automatic 5-second progress bar timer
    useEffect(() => {
        if (!currentStory) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex((i) => i + 1);
                        return 0;
                    } else {
                        onClose();
                        return 100;
                    }
                }
                return prev + 2;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentIndex, currentStory, stories.length]);

    if (!currentStory) return null;

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg">
            <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl">
                {/* Progress Segmented Bar */}
                <div className="absolute top-3 left-0 right-0 px-3 z-30 flex items-center gap-1.5">
                    {stories.map((s, idx) => (
                        <div
                            key={s._id || idx}
                            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                        >
                            <div
                                className="h-full bg-white transition-all ease-linear"
                                style={{
                                    width:
                                        idx < currentIndex
                                            ? '100%'
                                            : idx === currentIndex
                                            ? `${progress}%`
                                            : '0%'
                                }}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Header Information */}
                <div className="absolute top-6 left-0 right-0 px-4 py-2 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-3">
                        <img
                            src={userStatusGroup?.user?.profilePic || assets.avatar_icon}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-violet-500"
                        />
                        <div>
                            <p className="text-white text-sm font-semibold">
                                {userStatusGroup?.user?.fullName}
                            </p>
                            <p className="text-gray-300 text-xs">
                                {formatMessageTime(currentStory.createdAt)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 p-1.5 rounded-full bg-black/40"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Main Media Container */}
                <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
                    <img
                        src={currentStory.mediaUrl}
                        alt="Status"
                        className="w-full h-full object-contain"
                    />

                    {/* Touch Navigation Overlay */}
                    <div
                        onClick={handlePrev}
                        className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer flex items-center justify-start pl-2 text-white/40 hover:text-white"
                    >
                        {currentIndex > 0 && <ChevronLeft size={36} />}
                    </div>
                    <div
                        onClick={handleNext}
                        className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer flex items-center justify-end pr-2 text-white/40 hover:text-white"
                    >
                        <ChevronRight size={36} />
                    </div>
                </div>

                {/* Caption Footer */}
                {currentStory.caption && (
                    <div className="absolute bottom-16 left-0 right-0 z-30 px-6 py-3 bg-black/60 text-center backdrop-blur-sm">
                        <p className="text-white text-sm font-medium">
                            {currentStory.caption}
                        </p>
                    </div>
                )}

                {/* Viewers Counter Bar (Only for story owner) */}
                {isMe && (
                    <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center">
                        <button
                            onClick={() => setShowViewers(!showViewers)}
                            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-4 py-1.5 rounded-full border border-white/20 transition-all"
                        >
                            <Eye size={14} className="text-violet-400" />
                            <span>
                                {currentStory.viewers?.length || 0} Viewers
                            </span>
                        </button>
                    </div>
                )}

                {/* Viewers List Drawer Overlay */}
                {showViewers && isMe && (
                    <div className="absolute inset-x-0 bottom-0 z-40 bg-[#1e1b2e] border-t border-violet-500/30 p-4 rounded-t-2xl max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                            <h4 className="text-sm font-semibold text-white">
                                Viewed by ({currentStory.viewers?.length || 0})
                            </h4>
                            <button
                                onClick={() => setShowViewers(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {currentStory.viewers?.map((v, i) => (
                                <div
                                    key={v._id || i}
                                    className="flex items-center gap-3 py-1 text-xs text-white"
                                >
                                    <img
                                        src={
                                            v.userId?.profilePic ||
                                            assets.avatar_icon
                                        }
                                        alt=""
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <span>
                                        {v.userId?.fullName || 'User'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusViewerModal;
