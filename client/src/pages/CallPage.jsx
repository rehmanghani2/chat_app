import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";

import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/utils";
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    CallControls,
    SpeakerLayout,
    StreamTheme,
    CallingState,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import { ChatContext } from "../../context/chatContext";
import { ShieldCheck, Video, PhoneCall } from 'lucide-react';
import assets from "../assets/assets";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
    const { selectedUser } = useContext(ChatContext);
    const { id: callId } = useParams();
    const [searchParams] = useSearchParams();
    const isVideoMode = searchParams.get("video") !== "false";

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);

    const { authUser } = useContext(AuthContext);

    const { data: tokenData } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        staleTime: 1000 * 6 * 5,
        enabled: !!authUser,
    });

    useEffect(() => {
        const initCall = async () => {
            if (!tokenData?.streamToken || !authUser || !callId) return;
            try {
                const user = {
                    id: authUser._id,
                    name: authUser.fullName,
                    image: authUser.profilePic,
                };

                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user,
                    token: tokenData.streamToken
                });

                const callInstance = videoClient.call("default", callId);
                await callInstance.join({ create: true });

                if (!isVideoMode) {
                    await callInstance.camera.disable();
                }

                setClient(videoClient);
                setCall(callInstance);
            } catch (error) {
                console.error("Error joining call: ", error);
                toast.error("Could not join the call. Please try again.");
            } finally {
                setIsConnecting(false);
            }
        };
        initCall();
    }, [tokenData, authUser, callId, isVideoMode]);

    return (
        <div className="h-screen w-screen bg-[#0d0f18] text-white flex flex-col justify-between overflow-hidden relative">
            {client && call ? (
                <StreamVideo client={client}>
                    <StreamCall call={call}>
                        <CallContent selectedUser={selectedUser} callId={callId} isVideoMode={isVideoMode} />
                    </StreamCall>
                </StreamVideo>
            ) : (
                <div className="flex flex-col items-center justify-center h-full bg-[#0d0f18] gap-6">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full border-4 border-violet-500/40 animate-ping absolute inset-0"></div>
                        <img
                            src={selectedUser?.profilePic || authUser?.profilePic || assets.avatar_icon}
                            alt=""
                            className="w-28 h-28 rounded-full object-cover relative z-10 border-4 border-violet-500 shadow-2xl"
                        />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold tracking-wide">
                            {selectedUser?.fullName || (isVideoMode ? "WhatsApp Video Call" : "WhatsApp Voice Call")}
                        </h3>
                        <p className="text-sm text-violet-400 font-medium animate-pulse flex items-center justify-center gap-2">
                            {isVideoMode ? <Video size={16} /> : <PhoneCall size={16} />}
                            {isVideoMode ? "Connecting video call..." : "Connecting voice call..."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const CallContent = ({ selectedUser, callId, isVideoMode }) => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const { activeCallPeerId, endCall } = useContext(ChatContext);
    const navigate = useNavigate();

    const peerId = selectedUser?._id || activeCallPeerId;

    const [callSeconds, setCallSeconds] = useState(0);

    // Timer counter for call duration
    useEffect(() => {
        const timer = setInterval(() => {
            setCallSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimer = (totalSecs) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            endCall(peerId, callId);
            navigate("/");
        }
    }, [callingState, peerId, callId]);

    const handleLeaveCall = () => {
        endCall(peerId, callId);
        navigate("/");
    };

    return (
        <StreamTheme className="w-full h-full flex flex-col justify-between relative">
            {/* Top Floating Glassmorphic Call Header */}
            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                    <img
                        src={selectedUser?.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border-2 border-violet-500"
                    />
                    <div>
                        <h4 className="text-sm font-semibold text-white">
                            {selectedUser?.fullName || (isVideoMode ? "WhatsApp Video" : "WhatsApp Voice")}
                        </h4>
                        <p className="text-xs text-green-400 font-mono font-medium">
                            {formatTimer(callSeconds)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-violet-500/20 text-violet-300 text-xs px-3 py-1.5 rounded-full border border-violet-500/30">
                    <ShieldCheck size={14} />
                    <span>End-to-End Encrypted</span>
                </div>
            </div>

            {/* Main Stream Container: Video vs Voice layout */}
            <div className="flex-1 w-full h-full pt-20 pb-24 px-4 flex items-center justify-center">
                {isVideoMode ? (
                    <SpeakerLayout />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 z-20">
                        <div className="relative flex items-center justify-center">
                            <div className="w-44 h-44 rounded-full bg-indigo-500/20 animate-ping absolute"></div>
                            <div className="w-36 h-36 rounded-full bg-violet-600/30 animate-pulse absolute"></div>
                            <img
                                src={selectedUser?.profilePic || assets.avatar_icon}
                                alt=""
                                className="w-28 h-28 rounded-full object-cover relative z-10 border-4 border-indigo-500 shadow-2xl"
                            />
                        </div>
                        <div className="text-center space-y-1.5 z-10">
                            <h3 className="text-2xl font-bold text-white tracking-wide">
                                {selectedUser?.fullName || "Voice Call"}
                            </h3>
                            <p className="text-xs text-indigo-300 font-mono font-medium animate-pulse">
                                Voice Call in Progress • {formatTimer(callSeconds)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Call Controls Toolbar */}
            <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center">
                <div className="bg-black/60 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl">
                    <CallControls onLeave={handleLeaveCall} />
                </div>
            </div>
        </StreamTheme>
    );
};

export default CallPage;