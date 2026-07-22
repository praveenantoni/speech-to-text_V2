import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  Square,
  Sparkles,
  Loader2,
  FileAudio,
  Play,
  Globe,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_PRESETS } from '../data/sampleTranscripts';
import { TranscriptionResult } from '../types';

interface UploadSectionProps {
  onTranscribeSuccess: (results: TranscriptionResult[]) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  result?: TranscriptionResult;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onTranscribeSuccess,
  isLoading,
  setIsLoading,
  errorMessage,
  setErrorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples'>('upload');
  const [language, setLanguage] = useState('English');
  const [dragOver, setDragOver] = useState(false);

  // Batch queue state for multi-file processing
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  // Mic recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Helper to extract true media playback duration from file
  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      const element = isVideo ? document.createElement('video') : document.createElement('audio');
      const url = URL.createObjectURL(file);
      element.src = url;
      element.onloadedmetadata = () => {
        const dur = element.duration;
        URL.revokeObjectURL(url);
        resolve(dur && !isNaN(dur) && isFinite(dur) ? dur : 0);
      };
      element.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });
  };

  // Process a single file to API
  const transcribeSingleFile = async (file: File): Promise<TranscriptionResult> => {
    const measuredDuration = await getMediaDuration(file);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const localMediaUrl = URL.createObjectURL(file);
          const isVideo = file.type.startsWith('video/');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: file.type || 'audio/mp3',
              languageHint: language,
              audioName: file.name,
              audioDuration: measuredDuration,
            }),
          });

          const data = await response.json();

          if (!response.ok || data.error) {
            throw new Error(data.error || `Failed to process ${file.name}`);
          }

          const result: TranscriptionResult = {
            ...data,
            id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            mediaUrl: localMediaUrl,
            mediaType: isVideo ? 'video' : 'audio',
            status: 'completed',
          };

          resolve(result);
        } catch (err: any) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error(`Error reading file ${file.name}`));
      };
    });
  };

  // Process multiple files in sequence
  const processAudioFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    const initialQueue: BatchItem[] = files.map((file, idx) => ({
      id: `item_${idx}_${Date.now()}`,
      file,
      status: 'pending',
    }));

    setBatchQueue(initialQueue);

    const completedResults: TranscriptionResult[] = [];

    for (let i = 0; i < initialQueue.length; i++) {
      setCurrentBatchIndex(i);

      // Update current item to processing
      setBatchQueue((prev) =>
        prev.map((item, index) => (index === i ? { ...item, status: 'processing' } : item))
      );

      try {
        const result = await transcribeSingleFile(initialQueue[i].file);
        completedResults.push(result);

        // Update current item to completed
        setBatchQueue((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: 'completed', result } : item
          )
        );
      } catch (err: any) {
        const errMsg = err.message || `Failed to transcribe ${initialQueue[i].file.name}`;
        setBatchQueue((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: 'error', errorMessage: errMsg } : item
          )
        );
      }
    }

    setIsLoading(false);

    if (completedResults.length > 0) {
      onTranscribeSuccess(completedResults);
    } else {
      setErrorMessage('None of the uploaded files could be transcribed successfully.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAudioFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAudioFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([audioBlob], `mic_recording_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        await processAudioFiles([recordedFile]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or not available in current environment.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Load Preset Sample
  const loadSamplePreset = (presetId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const preset = SAMPLE_PRESETS.find(p => p.id === presetId) || SAMPLE_PRESETS[0];

      const result: TranscriptionResult = {
        metadata: {
          audioName: preset.title,
          duration: preset.duration,
          language: 'English (en)',
          wordCount: preset.words.length,
          sentenceCount: preset.sentences.length,
          createdAt: new Date().toISOString(),
          format: 'Audio Sample',
        },
        words: preset.words.map((w, idx) => ({
          id: `w_${idx + 1}`,
          ...w,
        })),
        sentences: preset.sentences.map((s, idx) => ({
          id: `s_${idx + 1}`,
          ...s,
        })),
      };

      setIsLoading(false);
      onTranscribeSuccess([result]);
    }, 400);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Intro Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>High-Precision Speech Alignment Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Convert Speech to Text with Dual Timestamps
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Generate millisecond-accurate word-by-word and sentence-wise timestamps.
          Export directly to SRT, WebVTT with cue tags, JSON, and TSV for Adobe Premiere Pro, CapCut, DaVinci Resolve, and Final Cut.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'record'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Record Audio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('samples')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'samples'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Try Samples</span>
        </button>
      </div>

      {/* Settings Row */}
      <div className="flex items-center justify-end gap-3 mb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="English" className="bg-slate-900">English</option>
            <option value="Spanish" className="bg-slate-900">Spanish</option>
            <option value="French" className="bg-slate-900">French</option>
            <option value="German" className="bg-slate-900">German</option>
            <option value="Japanese" className="bg-slate-900">Japanese</option>
            <option value="Chinese" className="bg-slate-900">Chinese</option>
            <option value="Hindi" className="bg-slate-900">Hindi</option>
            <option value="Auto Detect" className="bg-slate-900">Auto Detect</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3 max-w-2xl mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-200 mb-0.5">Transcription Notice</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Loading Overlay State / Batch Progress Queue */}
      {isLoading ? (
        <div className="p-8 sm:p-10 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-2xl space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3 animate-pulse">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              {batchQueue.length > 1
                ? `Transcribing Batch (${currentBatchIndex + 1} of ${batchQueue.length})`
                : 'Analyzing Audio & Aligning Speech...'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Extracting millisecond-precise word-by-word timestamps and sentence alignments for each uploaded file.
            </p>
          </div>

          {/* Batch Progress Bar */}
          {batchQueue.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Batch Progress</span>
                <span>
                  {Math.round(
                    (batchQueue.filter((i) => i.status === 'completed' || i.status === 'error')
                      .length /
                      batchQueue.length) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${
                      (batchQueue.filter((i) => i.status === 'completed' || i.status === 'error')
                        .length /
                        batchQueue.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Batch Item Queue List */}
          {batchQueue.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {batchQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    item.status === 'processing'
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-200'
                      : item.status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : item.status === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                    <FileAudio
                      className={`w-4 h-4 shrink-0 ${
                        item.status === 'processing'
                          ? 'text-indigo-400'
                          : item.status === 'completed'
                          ? 'text-emerald-400'
                          : item.status === 'error'
                          ? 'text-rose-400'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="font-medium truncate">{item.file.name}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    {item.status === 'processing' && (
                      <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcribing...</span>
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error</span>
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-slate-500">Queued ({idx + 1})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* TAB 1: FILE UPLOAD DROPZONE */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <input
                type="file"
                multiple
                accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.flac,.aac"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/60 border border-slate-700 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:border-indigo-500/40 transition-all shadow-lg mb-4">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-slate-200">
                Drop your Audio or Video file(s) here
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Upload single or multiple files at once (MP3, WAV, M4A, OGG, WEBM, MP4, MOV, FLAC)
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition">
                <span>Browse Local Files</span>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MIC RECORDER */}
          {activeTab === 'record' && (
            <div className="border border-slate-800 rounded-2xl p-8 bg-slate-900/60 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 mb-4 relative">
                {isRecording && (
                  <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                )}
                <Mic className={`w-8 h-8 ${isRecording ? 'text-rose-400' : 'text-indigo-400'}`} />
              </div>

              {isRecording ? (
                <div>
                  <div className="text-2xl font-mono font-bold text-rose-400 tracking-wider">
                    {formatTimer(recordingTime)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Recording live microphone audio...</p>

                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop & Process Transcript</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-bold text-slate-200">Record Directly from Microphone</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Speak clearly into your microphone to generate instant word-level and sentence-level timestamps.
                  </p>

                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Microphone Recording</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRESET SAMPLES */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 text-center mb-2">
                Click any pre-loaded sample to test timestamp conversion and video editor exports instantly:
              </p>

              {SAMPLE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => loadSamplePreset(preset.id)}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition">
                        {preset.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{preset.description}</div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                        <span>Duration: {preset.duration}s</span>
                        <span>•</span>
                        <span>{preset.words.length} words</span>
                        <span>•</span>
                        <span>{preset.sentences.length} sentences</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load Sample</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Output Format Compatibility Badges */}
      <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-3xl mx-auto">
        <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Export Compatibility Across Video Editors
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-slate-200">Adobe Premiere</div>
            <div className="text-[10px] text-slate-400 mt-0.5">SRT / VTT / TSV</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-slate-200">CapCut / Reels</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Word SRT / JSON</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-slate-200">DaVinci Resolve</div>
            <div className="text-[10px] text-slate-400 mt-0.5">SRT / VTT</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-slate-200">Final Cut Pro</div>
            <div className="text-[10px] text-slate-400 mt-0.5">VTT / JSON</div>
          </div>
        </div>
      </div>
    </div>
  );
};
