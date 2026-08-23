import React, { useContext, useState } from 'react';
import { ChatContext } from '../../context/chatContext';
import { X, Settings, Palette, Bell, Shield, Check, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

const WALLPAPER_OPTIONS = [
  { id: 'default', name: 'Default Dark', bg: 'bg-[#1e1b2e]' },
  { id: 'dark-violet', name: 'Violet Glow', bg: 'bg-gradient-to-br from-[#1e1b2e] via-[#2d1b4e] to-[#120e24]' },
  { id: 'emerald', name: 'Emerald Forest', bg: 'bg-gradient-to-br from-[#062c24] via-[#0b3c32] to-[#041a15]' },
  { id: 'midnight', name: 'Midnight Ocean', bg: 'bg-gradient-to-br from-[#0b192c] via-[#1e3e62] to-[#000000]' },
  { id: 'sunset', name: 'Sunset Rose', bg: 'bg-gradient-to-br from-[#2b1055] via-[#591a53] to-[#25082a]' },
  { id: 'cyber-dark', name: 'Cyber Matrix', bg: 'bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#010409]' }
];

const FONT_SIZE_OPTIONS = [
  { id: 'small', label: 'Small', sizeClass: 'text-xs' },
  { id: 'normal', label: 'Medium', sizeClass: 'text-sm' },
  { id: 'large', label: 'Large', sizeClass: 'text-base' }
];

const SettingsModal = ({ onClose }) => {
  const {
    wallpaper,
    setWallpaper,
    fontSize,
    setFontSize,
    soundEnabled,
    setSoundEnabled,
    readReceipts,
    setReadReceipts
  } = useContext(ChatContext);

  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#1e1b2e] border border-violet-500/30 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-violet-600/30 p-2 rounded-full text-violet-400">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Settings & Personalization</h2>
              <p className="text-[11px] text-violet-300">Customize your WhatsApp experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 mt-4 p-1 bg-[#282142]/60 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'bg-violet-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Palette size={14} /> Appearance
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-violet-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell size={14} /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-violet-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={14} /> Privacy
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-5 custom-scrollbar">
          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Wallpaper Picker */}
              <div>
                <label className="text-xs font-bold text-violet-300 block mb-2">
                  Chat Wallpaper Theme
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {WALLPAPER_OPTIONS.map((wp) => {
                    const isSelected = wallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        onClick={() => setWallpaper(wp.id)}
                        className={`h-20 rounded-xl p-2 relative flex flex-col justify-end border-2 transition-all overflow-hidden ${wp.bg} ${
                          isSelected
                            ? 'border-violet-400 shadow-lg shadow-violet-500/20 scale-[1.02]'
                            : 'border-white/10 hover:border-violet-500/40'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-violet-600 p-1 rounded-full text-white shadow">
                            <Check size={10} />
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-white shadow-sm bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm self-start truncate">
                          {wp.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-xs font-bold text-violet-300 block mb-2">
                  Message Font Size
                </label>
                <div className="flex items-center gap-3 bg-[#282142] p-1.5 rounded-xl border border-white/5">
                  {FONT_SIZE_OPTIONS.map((opt) => {
                    const isSelected = fontSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setFontSize(opt.id)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                  Live Preview
                </label>
                <div
                  className={`p-4 rounded-xl border border-white/10 min-h-[90px] flex flex-col justify-center transition-all ${
                    WALLPAPER_OPTIONS.find((w) => w.id === wallpaper)?.bg || 'bg-[#1e1b2e]'
                  }`}
                >
                  <div className="bg-violet-600/70 text-white p-2.5 rounded-2xl rounded-br-none max-w-[80%] self-end shadow-md">
                    <p
                      className={`font-normal leading-relaxed ${
                        fontSize === 'small'
                          ? 'text-xs'
                          : fontSize === 'large'
                          ? 'text-base'
                          : 'text-sm'
                      }`}
                    >
                      Hey! This is how your chat messages look with your chosen wallpaper & font size! 🚀
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#282142]/70 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-500/20 p-2 rounded-lg text-violet-300">
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Notification Sounds</p>
                    <p className="text-[10px] text-gray-400">Play audio alert when messages arrive</p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    soundEnabled ? 'bg-violet-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#282142]/70 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-500/20 p-2 rounded-lg text-violet-300">
                    {readReceipts ? <Eye size={18} /> : <EyeOff size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Read Receipts (Blue Ticks)</p>
                    <p className="text-[10px] text-gray-400">If turned off, you won't send read receipts</p>
                  </div>
                </div>
                <button
                  onClick={() => setReadReceipts(!readReceipts)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    readReceipts ? 'bg-violet-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      readReceipts ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
