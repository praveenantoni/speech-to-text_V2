import React, { useRef } from 'react';
import { TranscriptionResult } from '../types';
import {
  FileAudio,
  FileVideo,
  Plus,
  X,
  Archive,
  CheckCircle,
  FileText
} from 'lucide-react';
import JSZip from 'jszip';
import { generateSRT, generateVTT, generateTSV, generateSMIL } from '../utils/exportFormats';

interface FileTabsBarProps {
  transcripts: TranscriptionResult[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  isAddLoading: boolean;
}

export const FileTabsBar: React.FC<FileTabsBarProps> = ({
  transcripts,
  activeId,
  onSelect,
  onRemove,
  onAddFiles,
  isAddLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download all transcripts as a ZIP archive
  const handleBatchZipDownload = async () => {
    if (transcripts.length === 0) return;

    const zip = new JSZip();
    const config = {
      granularity: 'word' as const,
      maxWordsPerLine: 5,
      timeOffset: 0,
      includeMetadata: true,
      jsonFlavor: 'full' as const,
    };

    transcripts.forEach((t, idx) => {
      const cleanName = (t.metadata.audioName || `transcript_${idx + 1}`)
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      // Add SRT
      const srtData = generateSRT(t, config);
      zip.file(`${cleanName}_word.srt`, srtData);

      // Add VTT
      const vttData = generateVTT(t, config);
      zip.file(`${cleanName}_word.vtt`, vttData);

      // Add TSV
      const tsvData = generateTSV(t, config);
      zip.file(`${cleanName}_word.tsv`, tsvData);

      // Add SMIL
      const smilData = generateSMIL(t, config);
      zip.file(`${cleanName}_overlay.smil`, smilData);

      // Add JSON
      zip.file(`${cleanName}_full.json`, JSON.stringify(t, null, 2));
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_transcripts_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (transcripts.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 lg:px-8 py-2.5 backdrop-blur sticky top-[61px] z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* File Tabs Strip */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0 py-0.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Files ({transcripts.length}):</span>
          </div>

          {transcripts.map((t, idx) => {
            const itemKey = t.id || `tr_${idx}_${t.metadata.audioName}`;
            const isActive = itemKey === activeId;
            const isVideo = t.mediaType === 'video';

            return (
              <div
                key={itemKey}
                onClick={() => onSelect(itemKey)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition shrink-0 select-none border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {isVideo ? (
                  <FileVideo className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                ) : (
                  <FileAudio className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                )}

                <span className="max-w-[140px] truncate">{t.metadata.audioName}</span>

                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {t.metadata.wordCount}w
                </span>

                {transcripts.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(itemKey);
                    }}
                    className={`p-0.5 rounded-md transition ${
                      isActive
                        ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white'
                        : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Hidden File Input for Adding More Files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.flac"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAddLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition shrink-0"
            title="Add more audio or video files to current batch"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add File(s)</span>
          </button>
        </div>

        {/* Batch Export ZIP Button */}
        {transcripts.length > 0 && (
          <button
            type="button"
            onClick={handleBatchZipDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition shrink-0 ml-auto"
            title={`Download ZIP containing all ${transcripts.length} transcribed files in SRT, VTT, TSV, SMIL & JSON formats`}
          >
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download All ({transcripts.length}) ZIP</span>
          </button>
        )}
      </div>
    </div>
  );
};
