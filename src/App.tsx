import React, { useState, useMemo } from 'react';
import { TranscriptionResult, WordTimestamp, SentenceTimestamp } from './types';
import { Header } from './components/Header';
import { FileTabsBar } from './components/FileTabsBar';
import { UploadSection } from './components/UploadSection';
import { MediaPlayer } from './components/MediaPlayer';
import { TimestampEditor } from './components/TimestampEditor';
import { ExportPanel } from './components/ExportPanel';
import { TimeOffsetModal } from './components/TimeOffsetModal';
import { SearchReplaceModal } from './components/SearchReplaceModal';
import { SAMPLE_HANSEL_AND_GRETEL } from './data/sampleTranscripts';
import {
  FileAudio,
  FileVideo,
  Sparkles,
  Clock,
  Layers,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  Plus
} from 'lucide-react';

const INITIAL_SAMPLE: TranscriptionResult = {
  ...SAMPLE_HANSEL_AND_GRETEL,
  id: 'sample_hansel_gretel',
};

export default function App() {
  // Array of uploaded transcripts
  const [transcripts, setTranscripts] = useState<TranscriptionResult[]>([INITIAL_SAMPLE]);
  const [activeId, setActiveId] = useState<string>('sample_hansel_gretel');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modals state
  const [isOffsetOpen, setIsOffsetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Find currently active transcript
  const activeTranscript = useMemo<TranscriptionResult | null>(() => {
    if (transcripts.length === 0) return null;
    return transcripts.find((t) => (t.id || t.metadata.audioName) === activeId) || transcripts[0];
  }, [transcripts, activeId]);

  // Update current active transcript's data safely
  const handleUpdateActiveTranscript = (updated: TranscriptionResult) => {
    if (!activeTranscript) return;
    const targetKey = activeTranscript.id || activeTranscript.metadata.audioName;
    setTranscripts((prev) =>
      prev.map((t) => ((t.id || t.metadata.audioName) === targetKey ? updated : t))
    );
  };

  // Find active word based on currentTime
  const activeWord = useMemo<WordTimestamp | null>(() => {
    if (!activeTranscript || activeTranscript.words.length === 0) return null;
    return (
      activeTranscript.words.find(
        (w) => currentTime >= w.start && currentTime <= w.end + 0.05
      ) || null
    );
  }, [activeTranscript, currentTime]);

  // Find active sentence based on currentTime
  const activeSentence = useMemo<SentenceTimestamp | null>(() => {
    if (!activeTranscript || activeTranscript.sentences.length === 0) return null;
    return (
      activeTranscript.sentences.find(
        (s) => currentTime >= s.start && currentTime <= s.end + 0.1
      ) || null
    );
  }, [activeTranscript, currentTime]);

  // Seek handler from list clicks
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
  };

  // Reset all transcripts back to upload state
  const handleReset = () => {
    setTranscripts([]);
    setActiveId('');
    setCurrentTime(0);
    setIsPlaying(false);
    setErrorMessage(null);
  };

  // Select transcript tab
  const handleSelectTranscript = (id: string) => {
    setActiveId(id);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Remove a single transcript from batch
  const handleRemoveTranscript = (idToRemove: string) => {
    setTranscripts((prev) => {
      const filtered = prev.filter((t) => (t.id || t.metadata.audioName) !== idToRemove);
      if (filtered.length > 0 && (activeTranscript?.id || activeTranscript?.metadata.audioName) === idToRemove) {
        setActiveId(filtered[0].id || filtered[0].metadata.audioName);
      }
      return filtered;
    });
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Transcribe new batch of files and append
  const handleBatchSuccess = (newResults: TranscriptionResult[]) => {
    setTranscripts((prev) => {
      // Filter out any initial placeholder if user uploads custom files
      const cleanPrev = prev.filter((t) => t.id !== 'sample_hansel_gretel');
      return [...cleanPrev, ...newResults];
    });

    if (newResults.length > 0) {
      const firstId = newResults[0].id || newResults[0].metadata.audioName;
      setActiveId(firstId);
    }
    setIsLoading(false);
    setCurrentTime(0);
  };

  // Handle adding more files directly from FileTabsBar
  const handleAddFiles = async (files: File[]) => {
    setIsLoading(true);
    setErrorMessage(null);

    const newTranscripts: TranscriptionResult[] = [];

    for (const file of files) {
      try {
        const isVideo = file.type.startsWith('video/');
        const reader = new FileReader();

        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        });

        const base64Data = await base64Promise;
        const localMediaUrl = URL.createObjectURL(file);

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: file.type || 'audio/mp3',
            languageHint: 'English',
            audioName: file.name,
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || `Failed to transcribe ${file.name}`);
        }

        newTranscripts.push({
          ...data,
          id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          mediaUrl: localMediaUrl,
          mediaType: isVideo ? 'video' : 'audio',
        });
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || `Error processing ${file.name}`);
      }
    }

    if (newTranscripts.length > 0) {
      handleBatchSuccess(newTranscripts);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Application Bar */}
      <Header
        onReset={handleReset}
        hasData={transcripts.length > 0}
        onOpenOffset={() => setIsOffsetOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Multi-File Tabs Strip */}
      {transcripts.length > 0 && (
        <FileTabsBar
          transcripts={transcripts}
          activeId={activeTranscript ? (activeTranscript.id || activeTranscript.metadata.audioName) : ''}
          onSelect={handleSelectTranscript}
          onRemove={handleRemoveTranscript}
          onAddFiles={handleAddFiles}
          isAddLoading={isLoading}
        />
      )}

      {/* Main Workspace */}
      <main className="pb-24">
        {!activeTranscript || transcripts.length === 0 ? (
          <UploadSection
            onTranscribeSuccess={handleBatchSuccess}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
            {/* Transcript Metadata Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeTranscript.mediaType === 'video' ? (
                    <FileVideo className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <FileAudio className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{activeTranscript.metadata.audioName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {activeTranscript.metadata.format || 'Audio/Video'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {activeTranscript.metadata.duration.toFixed(2)}s Duration
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      {activeTranscript.metadata.wordCount} Words
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      {activeTranscript.metadata.sentenceCount} Sentences
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOffsetOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Time Offset</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Synchronized Media & Subtitle Player */}
            <MediaPlayer
              data={activeTranscript}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              activeWord={activeWord}
              activeSentence={activeSentence}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onSeek={handleSeek}
            />

            {/* Dual Timestamp Interactive Editor */}
            <TimestampEditor
              data={activeTranscript}
              setData={handleUpdateActiveTranscript}
              activeWord={activeWord}
              activeSentence={activeSentence}
              onSeek={handleSeek}
            />

            {/* Multi-Format Video Editor Export Panel */}
            <ExportPanel data={activeTranscript} setData={handleUpdateActiveTranscript} />
          </div>
        )}
      </main>

      {/* Time Offset Modal */}
      {activeTranscript && (
        <TimeOffsetModal
          isOpen={isOffsetOpen}
          onClose={() => setIsOffsetOpen(false)}
          data={activeTranscript}
          setData={handleUpdateActiveTranscript}
        />
      )}

      {/* Search & Replace Modal */}
      {activeTranscript && (
        <SearchReplaceModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          data={activeTranscript}
          setData={handleUpdateActiveTranscript}
        />
      )}
    </div>
  );
}
