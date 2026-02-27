"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import { 
  Keyboard, 
  Mic, 
  Camera, 
  X, 
  Send, 
  Square, 
  CheckCircle2, 
  Loader2,
  Video,
  RefreshCcw,
  AlertCircle,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionCollectorProps {
  momentId: string;
  isPreview?: boolean;
  onActiveChange?: (isActive: boolean) => void;
  onWatchAgain?: () => void;
}

type Mode = "idle" | "text" | "voice" | "camera" | "submitting" | "success";

export default function ReactionCollector({ momentId, isPreview, onActiveChange, onWatchAgain }: ReactionCollectorProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [textMode, setTextMode] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("❤️");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<{ 
    title: string;
    message: string; 
    type: 'permission' | 'generic'; 
    onRetry?: () => void;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const emojis = ["❤️", "😭", "🥺", "🎉", "🔥", "🤣"];

  // Stop all media streams
  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => stopStreams();
  }, []);

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(mode !== "idle" && mode !== "success");
    }
  }, [mode, onActiveChange]);

  const handleStartVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMode("voice");
    } catch (err) {
      console.error("Mic access denied", err);
      setError({
        title: "Microphone Access Required",
        message: "We need your microphone to record voice notes. Please enable it in your browser settings.",
        type: 'permission',
        onRetry: handleStartVoice
      });
    }
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setMode("camera");
      
      // Delay to let the video element render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied", err);
      setError({
        title: "Camera Access Required",
        message: "We need your camera to record video reactions. Please enable it in your browser settings.",
        type: 'permission',
        onRetry: handleStartCamera
      });
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    // Fallbacks for MediaRecorder type
    let options = { mimeType: "" };
    if (mode === "camera") {
      options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? { mimeType: 'video/webm;codecs=vp9,opus' } 
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? { mimeType: 'video/webm;codecs=vp8,opus' }
      : { mimeType: 'video/webm' };
    } else {
      options = { mimeType: 'audio/webm' };
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { 
        type: mode === "camera" ? 'video/webm' : 'audio/webm' 
      });
      setMediaBlob(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 60) {
          stopRecording(); // max 60 seconds
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      stopStreams(); // Stop camera/mic after recording
    }
  };

  const handleSubmit = async () => {
    if (!momentId) return;
    setMode("submitting");

    if (isPreview) {
      setTimeout(() => {
        stopStreams();
        setMode("success");
      }, 1500);
      return;
    }

    try {
      if (auth && !auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn("Anonymous auth failed", authErr);
        }
      }

      let content = textMode;

      if ((mode === "voice" || mode === "camera") && mediaBlob) {
        if (!storage) throw new Error("Storage not initialized");
        // Upload Blob
        const ext = mode === "camera" ? "webm" : "webm"; 
        const path = `public/reactions/${momentId}/${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        const uploadResult = await uploadBytes(storageRef, mediaBlob, { contentType: mode === "camera" ? 'video/webm' : 'audio/webm' });
        content = await getDownloadURL(uploadResult.ref);
      }

      const payload = {
        momentId,
        type: mediaBlob ? (mode === "camera" ? "camera" : "voice") : "text",
        content,
        emoji: mode === "text" ? selectedEmoji : null,
        createdAt: serverTimestamp(),
        status: "unread"
      };

      if (db) {
         await addDoc(collection(db, "reactions"), payload);
      }
      stopStreams();
      setMode("success");
    } catch (err) {
      console.error("Reaction submission failed", err);
      setMode("idle");
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError({
        title: "Upload Failed",
        message: errorMessage,
        type: 'generic',
        onRetry: handleSubmit
      });
    }
  };

  const reset = () => {
    stopStreams();
    setMode("idle");
    setMediaBlob(null);
    setTextMode("");
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center z-50">
      <AnimatePresence mode="popLayout">
        
        {mode === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl pointer-events-auto"
          >
            <button 
              onClick={() => setMode("text")}
              className="size-12 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center text-white transition-all active:scale-95 group"
            >
              <Keyboard size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <div className="w-px h-6 bg-white/20" />
            <button 
              onClick={handleStartVoice}
              className="size-12 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center text-white transition-all active:scale-95 group"
            >
              <Mic size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <div className="w-px h-6 bg-white/20" />
            <button 
              onClick={handleStartCamera}
              className="size-12 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center text-white transition-all active:scale-95 group"
            >
              <Camera size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            {onWatchAgain && (
               <>
                 <div className="w-px h-6 bg-white/20" />
                 <button 
                   onClick={onWatchAgain}
                   className="size-12 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center text-white transition-all active:scale-95 group"
                   title="Watch Again"
                 >
                   <RefreshCcw size={20} className="group-hover:-rotate-90 transition-transform duration-300" />
                 </button>
               </>
            )}
          </motion.div>
        )}

        {mode === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/60">Written Note</span>
              <button onClick={reset} className="text-white/60 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex gap-2 justify-center mb-3">
              {emojis.map(e => (
                <button 
                  key={e} 
                  onClick={() => setSelectedEmoji(e)}
                  className={cn(
                    "text-xl hover:scale-125 transition-transform",
                    selectedEmoji === e ? "scale-125 filter drop-shadow-md" : "opacity-50 grayscale"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>

            <textarea 
              value={textMode}
              onChange={(e) => setTextMode(e.target.value)}
              placeholder="Leave a private note..."
              className="w-full h-20 bg-black/20 text-white placeholder:text-white/30 rounded-xl p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
            />

            <button 
              onClick={handleSubmit}
              disabled={!textMode.trim()}
              className="w-full mt-3 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Note
            </button>
          </motion.div>
        )}

        {(mode === "voice" || mode === "camera") && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl relative overflow-hidden pointer-events-auto"
          >
            <div className="flex justify-between items-center z-10 relative px-2 mb-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/60">
                {mode === "voice" ? "Voice Note" : "Video Reaction"}
              </span>
              <button onClick={reset} className="text-white/60 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {mode === "camera" && !mediaBlob && (
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black mb-4 relative shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
                
                {isRecording && (
                   <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                     <span className="size-2 bg-red-500 rounded-full animate-pulse" />
                     <span className="text-white font-bold text-xs font-mono">{formatTime(recordingTime)}</span>
                   </div>
                )}
              </div>
            )}

            {mode === "voice" && !mediaBlob && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className={cn(
                  "size-24 rounded-full flex items-center justify-center transition-all duration-300",
                  isRecording ? "bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)]" : "bg-black/20"
                )}>
                  <Mic size={40} className={cn("transition-colors", isRecording ? "text-red-500" : "text-white/50")} />
                </div>
                {isRecording && (
                  <p className="mt-6 font-mono text-2xl font-bold text-white tracking-widest">
                    {formatTime(recordingTime)}
                  </p>
                )}
              </div>
            )}

            {mediaBlob && (
              <div className="py-8 text-center space-y-4">
                <div className="size-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-white font-black uppercase tracking-widest text-xs">Ready to Send</p>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest">
                  {formatTime(recordingTime)} Recorded
                </p>
              </div>
            )}

            {!mediaBlob ? (
              <div className="flex justify-center mt-2 relative z-10">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    className="size-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none border-4 border-transparent hover:border-white/20 ring-4 ring-white/10"
                  >
                    {mode === "camera" ? <Video size={24} /> : <Mic size={24} />}
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="size-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-500/50 hover:scale-105 active:scale-95 transition-all outline-none animate-pulse"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 relative z-10 mt-3">
                <button 
                  onClick={() => {
                    setMediaBlob(null);
                    setRecordingTime(0);
                    if (mode === "camera") handleStartCamera();
                    else handleStartVoice();
                  }}
                  className="flex-1 py-3 rounded-lg border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5 active:scale-95 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Send
                </button>
              </div>
            )}
            
          </motion.div>
        )}

        {mode === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl pointer-events-auto"
          >
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">Sending Love...</p>
          </motion.div>
        )}

        {mode === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 bg-green-500/10 backdrop-blur-md p-4 rounded-2xl border border-green-500/30 shadow-xl pointer-events-auto text-center"
          >
            <CheckCircle2 size={32} className="text-green-500 mx-auto" />
            <p className="text-green-100 font-black uppercase tracking-widest text-[10px]">Reaction Sent!</p>
          </motion.div>
        )}

      </AnimatePresence>
      
      {/* Custom Error Modal */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-surface border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6 text-center space-y-4">
                <div className="size-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                  {error.type === 'permission' ? <ShieldAlert size={32} /> : <AlertCircle size={32} />}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">{error.title}</h3>
                  <p className="text-xs text-text-muted font-bold leading-relaxed">{error.message}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setError(null)}
                    className="flex-1 py-3 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Dismiss
                  </button>
                  {error.onRetry && (
                    <button 
                      onClick={() => {
                        const retry = error.onRetry;
                        setError(null);
                        retry?.();
                      }}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
