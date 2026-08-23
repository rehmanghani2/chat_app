import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../../context/chatContext';
import assets from '../assets/assets';
import { Phone, PhoneOff, Video } from 'lucide-react';

const IncomingCallModal = () => {
    const { incomingCall, acceptCall, rejectCall } = useContext(ChatContext);
    const navigate = useNavigate();
    const audioCtxRef = useRef(null);
    const intervalRef = useRef(null);

    // Realistic Web Audio API dual-tone ringtone synthesizer
    const startRingtone = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            const playTone = () => {
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'sine';
                osc2.type = 'sine';
                osc1.frequency.setValueAtTime(440, ctx.currentTime);
                osc2.frequency.setValueAtTime(480, ctx.currentTime);

                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start();
                osc2.start();
                osc1.stop(ctx.currentTime + 1.8);
                osc2.stop(ctx.currentTime + 1.8);
            };

            playTone();
            intervalRef.current = setInterval(playTone, 2500);
        } catch (e) {
            console.error("Audio context error:", e);
        }
    };

    const stopRingtone = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
        }
    };

    useEffect(() => {
        if (incomingCall) {
            startRingtone();
        }
        return () => stopRingtone();
    }, [incomingCall]);

    if (!incomingCall) return null;

    const isVideoCall = incomingCall.isVideo !== false;

    const handleAccept = () => {
        stopRingtone();
        const callId = incomingCall.callId;
        acceptCall();
        navigate(`/call/${callId}?video=${isVideoCall}`);
    };

    const handleDecline = () => {
        stopRingtone();
        rejectCall();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1e1b2e] border border-violet-500/40 rounded-3xl w-full max-w-sm p-8 text-white shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                {/* Sonar Pulsing Ring Background Effect */}
                <div className="absolute w-44 h-44 rounded-full bg-violet-600/20 animate-ping pointer-events-none"></div>

                {/* Caller Avatar */}
                <div className="relative mb-4 z-10">
                    <img
                        src={incomingCall.callerPic || assets.avatar_icon}
                        alt={incomingCall.callerName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-violet-500 shadow-xl"
                    />
                    <span className={`absolute bottom-0 right-0 p-2 rounded-full border-2 border-[#1e1b2e] text-white ${isVideoCall ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {isVideoCall ? <Video size={16} /> : <Phone size={16} />}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 z-10">
                    {incomingCall.callerName || 'Incoming Call'}
                </h3>
                <p className="text-xs text-violet-300 animate-pulse font-medium mb-8 z-10">
                    {isVideoCall ? 'WhatsApp Video Call...' : 'WhatsApp Voice Call...'}
                </p>

                {/* Call Controls */}
                <div className="flex items-center justify-around w-full z-10 px-4">
                    {/* Decline Button */}
                    <button
                        onClick={handleDecline}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                            <PhoneOff size={24} />
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Decline</span>
                    </button>

                    {/* Accept Button */}
                    <button
                        onClick={handleAccept}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 animate-bounce">
                            <Phone size={24} />
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
