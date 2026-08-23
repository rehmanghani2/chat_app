import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime, getStreamToken } from '../lib/utils';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import AudioRecorder from './AudioRecorder';
import GroupInfoModal from './GroupInfoModal';
import UserProfileModal from './UserProfileModal';
import ForwardModal from './ForwardModal';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StreamChat } from 'stream-chat';
import {
  Mic,
  Paperclip,
  X,
  Check,
  CheckCheck,
  FileText,
  Download,
  CornerUpLeft,
  Info,
  Users,
  Play,
  Pause,
  Video,
  PhoneCall,
  Search,
  Star,
  Volume2,
  VolumeX,
  Forward
} from 'lucide-react';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    selectedGroup,
    setSelectedGroup,
    sendMessage,
    getMessages,
    getGroupMessages,
    typingUsers,
    groupTypingUsers,
    sendTypingStatus,
    replyingTo,
    setReplyingTo,
    reactToMessage,
    initiateCall,
    starredMessages,
    toggleStarMessage,
    mutedChats,
    toggleMuteChat,
    wallpaper,
    fontSize,
    readReceipts
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef(null);
  const typingTimeoutRef = useRef(null);
  const documentInputRef = useRef(null);

  const [input, setInput] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);

  // In-Chat Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const activeChat = selectedGroup || selectedUser;
  const isGroupChat = !!selectedGroup;
  const isMuted = activeChat ? mutedChats.includes(activeChat._id) : false;

  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Handle typing status change
  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  // Handle sending a text message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (input.trim() === '') return;
    sendTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const messageText = input.trim();
    setInput('');
    await sendMessage({ text: messageText });
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Handle sending a document file
  const handleSendDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize =
      sizeInMB >= 1
        ? `${sizeInMB.toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({
        fileData: reader.result,
        fileName: file.name,
        fileType: file.type || 'document',
        fileSize: formattedSize
      });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Handle voice note audio sending
  const handleSendVoiceNote = async (base64Audio) => {
    setShowAudioRecorder(false);
    await sendMessage({ audio: base64Audio });
  };

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
    } else if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Stream Video Call Initialization (Only for 1-on-1 chats for now)
  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    staleTime: 1000 * 6 * 5,
    enabled: !!authUser
  });

  const handleCall = (isVideo = true) => {
    if (!selectedUser) return;
    const callId = Math.random().toString(36).substring(2, 9);
    initiateCall(selectedUser._id, callId);
    navigate(`/call/${callId}?video=${isVideo}`);
  };

  const isDirectUserTyping = selectedUser && typingUsers[selectedUser._id];
  const isGroupUserTyping = selectedGroup && groupTypingUsers[selectedGroup._id];

  // Helper to render WhatsApp Status Ticks
  const renderStatusTicks = (msg) => {
    const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
    if (senderId !== authUser._id) return null;
    if (msg.seen) {
      return (
        <CheckCheck
          size={14}
          className="text-cyan-400 inline ml-1 cursor-default"
          title="Read"
        />
      );
    }
    if (msg.delivered) {
      return (
        <CheckCheck
          size={14}
          className="text-gray-400 inline ml-1 cursor-default"
          title="Delivered"
        />
      );
    }
    return (
      <Check
        size={14}
        className="text-gray-400 inline ml-1 cursor-default"
        title="Sent"
      />
    );
  };

  return activeChat ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg flex flex-col justify-between">
      {/* Group Info Modal */}
      {showGroupInfoModal && selectedGroup && (
        <GroupInfoModal
          group={selectedGroup}
          onClose={() => setShowGroupInfoModal(false)}
        />
      )}

      {/* User Profile Info Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
        />
      )}

      {/* Message Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {/* -------- HEADER ------- */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500 bg-black/20 z-10">
        <img
          src={
            isGroupChat
              ? selectedGroup.groupPic || assets.avatar_icon
              : selectedUser.profilePic || assets.avatar_icon
          }
          alt=""
          className="w-10 h-10 rounded-full object-cover border border-violet-500/40 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => {
            if (isGroupChat) {
              setShowGroupInfoModal(true);
            } else if (selectedUser) {
              setSelectedProfileUser(selectedUser);
            }
          }}
        />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => isGroupChat && setShowGroupInfoModal(true)}
        >
          <p className="text-lg text-white font-medium flex items-center gap-2 truncate">
            {isGroupChat ? selectedGroup.name : selectedUser.fullName}
            {!isGroupChat && onlineUsers.includes(selectedUser._id) && (
              <span
                className="w-2.5 h-2.5 rounded-full bg-green-500"
                title="Online"
              ></span>
            )}
          </p>
          <p className="text-xs text-violet-300 transition-all">
            {isGroupChat ? (
              isGroupUserTyping ? (
                <span className="text-green-400 font-semibold animate-pulse">
                  Someone is typing...
                </span>
              ) : (
                `${selectedGroup.members?.length || 0} members`
              )
            ) : isDirectUserTyping ? (
              <span className="text-green-400 font-semibold animate-pulse">
                typing...
              </span>
            ) : onlineUsers.includes(selectedUser._id) ? (
              'Online'
            ) : (
              'Offline'
            )}
          </p>
        </div>

        <img
          onClick={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
          }}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />

        {/* Action Controls: Search, Mute, Voice, Video */}
        <div className="flex items-center gap-2">
          {/* In-Chat Search Toggle Button */}
          <button
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setSearchQuery('');
            }}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              showSearch
                ? 'bg-violet-600 text-white'
                : 'text-violet-300 hover:text-white bg-violet-600/20 hover:bg-violet-600/40'
            }`}
            title="Search Messages in Chat"
          >
            <Search size={18} />
          </button>

          {/* Mute Chat Toggle Button */}
          <button
            onClick={() => activeChat && toggleMuteChat(activeChat._id)}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-600/30 text-red-400 border border-red-500/40'
                : 'text-violet-300 hover:text-white bg-violet-600/20 hover:bg-violet-600/40'
            }`}
            title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {isGroupChat ? (
            <button
              onClick={() => setShowGroupInfoModal(true)}
              className="p-2 text-violet-300 hover:text-white bg-violet-600/30 hover:bg-violet-600/50 rounded-full transition-colors cursor-pointer"
              title="Group Information"
            >
              <Info size={19} />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  getStreamToken();
                  handleCall(false);
                }}
                className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                title="Start Voice Call"
              >
                <PhoneCall size={18} />
              </button>
              <button
                onClick={() => {
                  getStreamToken();
                  handleCall(true);
                }}
                className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                title="Start Video Call"
              >
                <Video size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* In-Chat Search Bar Drawer */}
      {showSearch && (
        <div className="bg-[#1e1b2e] border-b border-violet-500/30 px-4 py-2 flex items-center gap-3 z-10 shadow-lg">
          <Search size={16} className="text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages in this chat..."
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder-gray-400 py-1"
            autoFocus
          />
          {searchQuery && (
            <span className="text-[10px] text-violet-300 font-mono">
              {filteredMessages.length} match(es)
            </span>
          )}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="text-gray-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* --------- CHAT MESSAGES AREA -------- */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 ${
          wallpaper === 'dark-violet'
            ? 'bg-gradient-to-br from-[#1e1b2e] via-[#2d1b4e] to-[#120e24]'
            : wallpaper === 'emerald'
            ? 'bg-gradient-to-br from-[#062c24] via-[#0b3c32] to-[#041a15]'
            : wallpaper === 'midnight'
            ? 'bg-gradient-to-br from-[#0b192c] via-[#1e3e62] to-[#000000]'
            : wallpaper === 'sunset'
            ? 'bg-gradient-to-br from-[#2b1055] via-[#591a53] to-[#25082a]'
            : wallpaper === 'cyber-dark'
            ? 'bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#010409]'
            : 'bg-black/10'
        }`}
      >
        {filteredMessages.map((msg, index) => {
          const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
          const senderIdVal = senderObj ? senderObj._id : msg.senderId;
          const isMe = senderIdVal === authUser._id;
          const isStarred = starredMessages.includes(msg._id);

          return (
            <div
              key={msg._id || index}
              className={`flex items-end gap-2 group relative ${
                isMe ? 'justify-end' : 'justify-start flex-row-reverse'
              }`}
            >
              {/* Message Bubble Container */}
              <div className="relative max-w-[80%] md:max-w-[65%]">
                {/* 6 Emoji Reaction + Star + Reply Toolbar */}
                <div
                  className={`absolute -top-9 ${
                    isMe ? 'right-0' : 'left-0'
                  } hidden group-hover:flex items-center gap-1 bg-[#1e1b2e] border border-violet-500/30 px-2 py-1 rounded-full shadow-lg z-20 transition-all`}
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(msg._id, emoji)}
                      className="hover:scale-125 transition-transform text-sm px-0.5"
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Star / Bookmark Button */}
                  <button
                    onClick={() => toggleStarMessage(msg._id)}
                    className={`ml-1 pl-1 border-l border-gray-600 ${
                      isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                    title={isStarred ? 'Unstar Message' : 'Star Message'}
                  >
                    <Star size={14} className={isStarred ? 'fill-yellow-400' : ''} />
                  </button>

                  {/* Forward Button */}
                  <button
                    onClick={() => setForwardingMessage(msg)}
                    className="ml-1 pl-1 border-l border-gray-600 text-gray-400 hover:text-violet-400"
                    title="Forward Message"
                  >
                    <Forward size={14} />
                  </button>

                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="ml-1 pl-1 border-l border-gray-600 text-gray-400 hover:text-violet-400"
                    title="Reply"
                  >
                    <CornerUpLeft size={14} />
                  </button>
                </div>

                {/* Quoted Reply Display inside Message */}
                {msg.replyTo && (
                  <div className="bg-black/30 border-l-4 border-violet-400 p-2 rounded-t-lg text-xs text-gray-300 mb-1">
                    <p className="font-semibold text-violet-300">
                      {msg.replyTo.senderId === authUser._id ? 'You' : 'Replied message'}
                    </p>
                    <p className="truncate">
                      {msg.replyTo.text ||
                        (msg.replyTo.image && '📷 Photo') ||
                        (msg.replyTo.audio && '🎵 Voice Note') ||
                        (msg.replyTo.fileName && `📄 ${msg.replyTo.fileName}`)}
                    </p>
                  </div>
                )}

                {/* Main Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-white shadow-md relative break-words ${
                    isMe
                      ? 'bg-violet-600/60 rounded-br-none border border-violet-400/30'
                      : 'bg-[#282142] rounded-bl-none border border-gray-700/50'
                  }`}
                >
                  {/* Forwarded Tag */}
                  {msg.isForwarded && (
                    <p className="text-[10px] italic text-gray-300 flex items-center gap-1 mb-1">
                      <Forward size={10} className="text-violet-300" /> Forwarded
                    </p>
                  )}

                  {/* Sender Name in Group Chat */}
                  {isGroupChat && !isMe && senderObj && (
                    <p className="text-xs font-bold text-violet-300 mb-1">
                      {senderObj.fullName}
                    </p>
                  )}

                  {/* Text Message */}
                  {msg.text && (
                    <p
                      className={`font-normal leading-relaxed whitespace-pre-wrap ${
                        fontSize === 'small'
                          ? 'text-xs'
                          : fontSize === 'large'
                          ? 'text-base'
                          : 'text-sm'
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}

                  {/* Image Attachment */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Attachment"
                      className="max-w-full max-h-72 rounded-lg object-cover mt-1 border border-gray-700/40"
                    />
                  )}

                  {/* Audio Voice Note Player */}
                  {msg.audio && (
                    <div className="flex items-center gap-3 py-1 min-w-[200px]">
                      <button
                        onClick={() => {
                          const audioEl = document.getElementById(
                            `audio-${msg._id}`
                          );
                          if (!audioEl) return;
                          if (playingAudioId === msg._id) {
                            audioEl.pause();
                            setPlayingAudioId(null);
                          } else {
                            document
                              .querySelectorAll('audio')
                              .forEach((a) => a.pause());
                            audioEl.play();
                            setPlayingAudioId(msg._id);
                          }
                        }}
                        className="bg-violet-500 hover:bg-violet-400 text-white p-2.5 rounded-full transition-all shadow"
                      >
                        {playingAudioId === msg._id ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                      </button>
                      <audio
                        id={`audio-${msg._id}`}
                        src={msg.audio}
                        onEnded={() => setPlayingAudioId(null)}
                        className="hidden"
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="w-full bg-gray-600/50 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-violet-400 ${
                              playingAudioId === msg._id ? 'animate-pulse' : ''
                            }`}
                            style={{
                              width:
                                playingAudioId === msg._id ? '100%' : '0%'
                            }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-violet-200 mt-1">
                          🎵 Voice Note
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Document Attachment Card */}
                  {msg.fileUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl border border-white/10 my-1">
                      <div className="bg-violet-500/30 p-2 rounded-lg text-violet-300">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {msg.fileName || 'Document'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {msg.fileSize || 'File attachment'}
                        </p>
                      </div>
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={msg.fileName}
                        className="p-2 text-violet-300 hover:text-white bg-violet-500/20 hover:bg-violet-500/40 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  )}

                  {/* Timestamp, Star Indicator & Ticks Footer */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-violet-200/70">
                    {isStarred && (
                      <Star size={11} className="text-yellow-400 fill-yellow-400 mr-0.5" title="Starred Message" />
                    )}
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {!isGroupChat && renderStatusTicks(msg)}
                  </div>
                </div>

                {/* Reaction Badges Footer */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div
                    className={`absolute -bottom-2 ${
                      isMe ? 'right-2' : 'left-2'
                    } flex items-center bg-[#1e1b2e] border border-violet-500/40 px-1.5 py-0.5 rounded-full text-xs shadow`}
                  >
                    {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map(
                      (emoji) => (
                        <span key={emoji} className="mx-0.5">
                          {emoji}
                        </span>
                      )
                    )}
                    {msg.reactions.length > 1 && (
                      <span className="text-[10px] font-semibold text-violet-300 ml-1">
                        {msg.reactions.length}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <img
                src={
                  isMe
                    ? authUser?.profilePic || assets.avatar_icon
                    : senderObj?.profilePic ||
                      selectedUser?.profilePic ||
                      assets.avatar_icon
                }
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-violet-400/30 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  const targetUser = isMe ? authUser : (senderObj || selectedUser);
                  if (targetUser) setSelectedProfileUser(targetUser);
                }}
              />
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* ----- BOTTOM INPUT AREA ------ */}
      <div className="p-3 border-t border-stone-600/50 bg-black/20 z-10">
        {/* Quoted Reply Preview Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-[#282142] border-l-4 border-violet-500 px-3 py-2 rounded-t-lg mb-2 text-xs text-white">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-violet-300">Replying to message</p>
              <p className="text-gray-300 truncate">
                {replyingTo.text ||
                  (replyingTo.image && '📷 Photo') ||
                  (replyingTo.audio && '🎵 Voice Note') ||
                  (replyingTo.fileName && `📄 ${replyingTo.fileName}`)}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Audio Recorder Mode vs Standard Input Bar */}
        {showAudioRecorder ? (
          <AudioRecorder
            onSendAudio={handleSendVoiceNote}
            onCancel={() => setShowAudioRecorder(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-gray-100/10 border border-white/10 px-3 py-1 rounded-full">
              {/* Document File Attachment Button */}
              <input
                type="file"
                ref={documentInputRef}
                onChange={handleSendDocument}
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              />
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                className="text-gray-400 hover:text-white mr-2 transition-colors"
                title="Attach Document"
              >
                <Paperclip size={18} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                onChange={handleInputChange}
                value={input}
                onKeyDown={(e) =>
                  e.key === 'Enter' ? handleSendMessage(e) : null
                }
                placeholder={
                  isGroupChat
                    ? `Message ${selectedGroup.name}`
                    : 'Send a message'
                }
                className="flex-1 text-sm bg-transparent border-none outline-none text-white placeholder-gray-400 py-2"
              />

              {/* Image Attachment Button */}
              <input
                onChange={handleSendImage}
                type="file"
                id="image"
                accept="image/png, image/jpeg, image/webp"
                hidden
              />
              <label htmlFor="image">
                <img
                  src={assets.gallery_icon}
                  alt="Gallery"
                  className="w-5 mr-1 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                  title="Attach Image"
                />
              </label>

              {/* Mic Button for Voice Note */}
              <button
                type="button"
                onClick={() => setShowAudioRecorder(true)}
                className="text-gray-400 hover:text-violet-400 transition-colors p-1"
                title="Voice Note"
              >
                <Mic size={19} />
              </button>
            </div>

            {/* Send Button */}
            <img
              onClick={handleSendMessage}
              src={assets.send_button}
              alt="Send"
              className="w-8 h-8 cursor-pointer hover:scale-105 transition-transform"
              title="Send Message"
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-white/5 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16 opacity-80" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      <p className="text-xs text-gray-500">
        Select a contact or group from the sidebar to start chatting
      </p>
    </div>
  );
};

export default ChatContainer;
