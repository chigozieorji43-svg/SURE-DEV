import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('VoiceNotePlayer playback error:', err);
          setHasError(true);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !Number.isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-1 w-full max-w-xs p-2.5 rounded-xl bg-gray-100 dark:bg-slate-900/90 border border-gray-300 dark:border-slate-700/80 text-gray-900 dark:text-slate-100 shadow-xs">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-brand-green hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer font-bold shadow-xs"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-300 dark:bg-slate-700 accent-emerald-500 rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-gray-400 dark:text-slate-400" />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Audio format unavailable or blocked on this device</span>
        </div>
      )}
    </div>
  );
};
