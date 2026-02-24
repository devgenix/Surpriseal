"use client";

import { useState, useEffect, useRef } from "react";
import { Slider, ConfigProvider, theme } from "antd";
import { Play, Pause, Music, Loader2 } from "lucide-react";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";

interface AudioTrimmerProps {
  url: string;
  start: number;
  duration: number;
  onUpdate: (start: number, duration: number) => void;
}

export default function AudioTrimmer({ url, start, duration, onUpdate }: AudioTrimmerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const soundRef = useRef<Howl | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    const sound = new Howl({
      src: [url],
      html5: true,
      onload: () => {
        setTotalDuration(sound.duration());
        setLoading(false);
      },
      onplay: () => {
        setIsPlaying(true);
        startTimer();
      },
      onpause: () => {
        setIsPlaying(false);
        stopTimer();
      },
      onstop: () => {
        setIsPlaying(false);
        stopTimer();
      },
      onend: () => {
        setIsPlaying(false);
        stopTimer();
      },
    });

    soundRef.current = sound;

    return () => {
      sound.unload();
      stopTimer();
    };
  }, [url]);

  const startTimer = () => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      if (soundRef.current) {
        const pos = soundRef.current.seek();
        setCurrentTime(typeof pos === "number" ? pos : 0);

        // Loop logic for the selected segment
        if (pos >= start + duration) {
          soundRef.current.seek(start);
        }
      }
    }, 100);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const togglePlay = () => {
    if (!soundRef.current || loading) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.seek(start);
      soundRef.current.play();
    }
  };

  const handleSliderChange = (values: number[]) => {
    const newStart = values[0];
    const newDuration = values[1] - values[0];
    onUpdate(newStart, newDuration);
    
    if (soundRef.current && isPlaying) {
      soundRef.current.seek(newStart);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#e64c19",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={togglePlay}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="ml-0.5" />
              )}
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {isPlaying ? "Playing Segment" : "Preview Segment"}
              </span>
              <span className="text-[10px] font-bold text-primary">
                {formatTime(start)} - {formatTime(start + duration)} ({duration.toFixed(1)}s)
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-text-muted">
            Total: {formatTime(totalDuration)}
          </div>
        </div>

        <div className="px-1">
          <Slider
            range
            min={0}
            max={totalDuration || 100}
            step={0.1}
            value={[start, start + duration]}
            onChange={handleSliderChange}
            tooltip={{
              formatter: (val) => formatTime(val || 0),
            }}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] text-text-muted font-medium italic">
          <span>Move handles to trim audio</span>
          {isPlaying && (
            <span className="not-italic font-bold text-primary animate-pulse">
              Current: {formatTime(currentTime)}
            </span>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
