import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Gauge,
  Music,
  Video,
  Clock,
  Sparkles
} from 'lucide-react';
import { WordTimestamp, SentenceTimestamp, TranscriptionResult } from '../types';

interface MediaPlayerProps {
  data: TranscriptionResult;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  activeWord: WordTimestamp | null;
  activeSentence: SentenceTimestamp | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onSeek: (time: number) => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  data,
  currentTime,
  setCurrentTime,
  activeWord,
  activeSentence,
  isPlaying,
  setIsPlaying,
  onSeek,
}) => {
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const duration = data.metadata.duration || 30;

  // Sync media element playback state
  useEffect(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.play().catch(() => setIsPlaying(false));
      } else {
        mediaRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync playback speed
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync seek time when user clicks on a timestamp from word/sentence list
  const handleSeek = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
    onSeek(seconds);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const skipSeconds = (amount: number) => {
    const nextTime = Math.min(Math.max(0, currentTime + amount), duration);
    handleSeek(nextTime);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Subtitle Visual Preview Screen (Karaoke Style Display) */}
      <div className="relative bg-slate-950 p-6 sm:p-8 min-h-[160px] flex flex-col items-center justify-center text-center border-b border-slate-800/80 group">
        {/* Optional Media Element */}
        {data.mediaUrl && data.mediaType === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={data.mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="w-full max-h-[220px] rounded-xl object-contain mb-4 bg-black"
          />
        ) : data.mediaUrl ? (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={data.mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        ) : null}

        {/* Live Karaokee Subtitle Box */}
        <div className="max-w-2xl mx-auto px-4">
          {activeSentence ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-mono border border-indigo-500/20">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTime(activeSentence.start)} → {formatTime(activeSentence.end)}
                </span>
              </div>

              {/* Render words inside current active sentence with karaoke highlight */}
              <div className="text-lg sm:text-2xl font-bold tracking-wide text-slate-300 leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1">
                {data.words
                  .filter((_, idx) => activeSentence.wordIndices.includes(idx))
                  .map((w) => {
                    const isWordActive = activeWord?.id === w.id;
                    return (
                      <span
                        key={w.id}
                        onClick={() => handleSeek(w.start)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded-md transition-all ${
                          isWordActive
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-extrabold shadow-lg shadow-indigo-500/30 scale-110 -translate-y-0.5'
                            : 'hover:text-white hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {w.punctuatedWord || w.word}
                      </span>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic">
              {isPlaying ? 'Playing...' : 'Click play or select a word/sentence below to begin playback'}
            </div>
          )}
        </div>

        {/* Media Type Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
          {data.mediaType === 'video' ? (
            <>
              <Video className="w-3 h-3 text-cyan-400" />
              <span>Video Sync</span>
            </>
          ) : (
            <>
              <Music className="w-3 h-3 text-indigo-400" />
              <span>Audio Sync</span>
            </>
          )}
        </div>
      </div>

      {/* Scrubbing Bar & Timeline */}
      <div className="px-6 pt-4 pb-2 bg-slate-900/90">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-indigo-400 font-semibold">
            {activeWord ? `Word: "${activeWord.word}" (${activeWord.start.toFixed(3)}s)` : 'Select timestamp'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Media Player Controls Toolbar */}
      <div className="px-6 py-3.5 bg-slate-900 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skipSeconds(-5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Backward 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-medium">Speed:</span>
          {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                playbackSpeed === speed
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
