import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_DURATION_SEC = 300; // 5 minutes max limit

const AudioRecorder = ({ onSendAudio, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioPlayerRef = useRef(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecordingTrack();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const stopRecordingTrack = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= MAX_DURATION_SEC - 1) {
                        handleStopRecording();
                        toast.success("Max 5 minute limit reached");
                        return MAX_DURATION_SEC;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            toast.error("Microphone access denied or not available");
            onCancel();
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            stopRecordingTrack();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = () => {
        if (!audioBlob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            onSendAudio(reader.result);
        };
        reader.readAsDataURL(audioBlob);
    };

    const togglePlayback = () => {
        if (!audioPlayerRef.current) return;
        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPlayerRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-[#282142] px-4 py-2 rounded-full border border-violet-500/30 text-white w-full">
            {/* Trash / Cancel */}
            <button
                type="button"
                onClick={() => {
                    handleStopRecording();
                    onCancel();
                }}
                className="text-red-400 hover:text-red-300 transition-colors p-1"
                title="Discard voice note"
            >
                <Trash2 size={20} />
            </button>

            {/* Timer / Pulse Indicator */}
            <div className="flex items-center gap-2 flex-1">
                {isRecording ? (
                    <>
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-xs font-mono text-red-400">Recording {formatTime(recordingTime)} / 05:00</span>
                    </>
                ) : (
                    <div className="flex items-center gap-2 flex-1">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            className="p-1 text-violet-400 hover:text-violet-300"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <audio
                            ref={audioPlayerRef}
                            src={audioUrl || ''}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                        <span className="text-xs font-mono text-gray-300">{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            {/* Stop or Send Action */}
            {isRecording ? (
                <button
                    type="button"
                    onClick={handleStopRecording}
                    className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-all"
                    title="Stop recording"
                >
                    <Square size={16} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSend}
                    className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full transition-all flex items-center justify-center"
                    title="Send voice note"
                >
                    <Send size={16} />
                </button>
            )}
        </div>
    );
};

export default AudioRecorder;
