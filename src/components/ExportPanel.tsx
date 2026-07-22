import React, { useState, useMemo } from 'react';
import {
  TranscriptionResult,
  ExportFormat,
  SubtitleExportConfig,
  SubtitleGranularity
} from '../types';
import {
  generateSRT,
  generateVTT,
  generateJSON,
  generateTSV,
  generateGCSSpeech,
  generateSMIL,
  snapContiguousTimestamps,
  generateTXT
} from '../utils/exportFormats';
import {
  Download,
  Copy,
  Check,
  FileCode,
  SlidersHorizontal,
  Sliders,
  CheckCircle2,
  FileText,
  Code2,
  FileSpreadsheet,
  Settings,
  BookOpen,
  Zap
} from 'lucide-react';

interface ExportPanelProps {
  data: TranscriptionResult;
  setData?: React.Dispatch<React.SetStateAction<TranscriptionResult | null>>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ data, setData }) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('smil');
  const [copied, setCopied] = useState(false);
  const [snappedMsg, setSnappedMsg] = useState(false);

  // Export options state
  const [granularity, setGranularity] = useState<SubtitleGranularity>('word');
  const [maxWordsPerLine, setMaxWordsPerLine] = useState<number>(0);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [customPrefix, setCustomPrefix] = useState<string>('X123197 The Art of Make-Believe and Happy Endings 2_3');
  const [jsonFlavor, setJsonFlavor] = useState<'full' | 'whisper' | 'userSample'>('full');
  const [smilClockFormat, setSmilClockFormat] = useState<'clock' | 'sec'>('clock');
  const [smilXhtmlRef, setSmilXhtmlRef] = useState<string>('chapter1.xhtml');

  const exportConfig: SubtitleExportConfig = useMemo(
    () => ({
      granularity,
      maxWordsPerLine,
      timeOffset,
      customPrefix,
      includeMetadata: true,
      jsonFlavor,
      smilClockFormat,
      smilXhtmlRef,
    }),
    [granularity, maxWordsPerLine, timeOffset, customPrefix, jsonFlavor, smilClockFormat, smilXhtmlRef]
  );

  // Compute active file output text
  const exportedContent = useMemo(() => {
    switch (activeFormat) {
      case 'smil':
        return generateSMIL(data, exportConfig);
      case 'srt':
        return generateSRT(data, exportConfig);
      case 'vtt':
        return generateVTT(data, exportConfig);
      case 'json':
        return generateJSON(data, exportConfig);
      case 'tsv':
        return generateTSV(data, exportConfig);
      case 'gcs':
        return generateGCSSpeech(data, exportConfig);
      case 'txt':
        return generateTXT(data);
      default:
        return '';
    }
  }, [data, activeFormat, exportConfig]);

  // Handle Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(exportedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Snap Contiguous SMIL Timestamps
  const handleSnapContiguous = () => {
    if (setData) {
      setData((prev) => (prev ? snapContiguousTimestamps(prev) : null));
      setSnappedMsg(true);
      setTimeout(() => setSnappedMsg(false), 2500);
    }
  };

  // Handle Download File
  const handleDownload = () => {
    const extMap: Record<ExportFormat, string> = {
      smil: 'smil',
      srt: 'srt',
      vtt: 'vtt',
      json: 'json',
      tsv: 'tsv',
      gcs: 'txt',
      txt: 'txt',
    };

    const mimeMap: Record<ExportFormat, string> = {
      smil: 'application/smil+xml;charset=utf-8',
      srt: 'text/plain;charset=utf-8',
      vtt: 'text/vtt;charset=utf-8',
      json: 'application/json;charset=utf-8',
      tsv: 'text/tab-separated-values;charset=utf-8',
      gcs: 'text/plain;charset=utf-8',
      txt: 'text/plain;charset=utf-8',
    };

    const filename = `${data.metadata.audioName.replace(/\.[^/.]+$/, '')}_${granularity}_timestamps.${extMap[activeFormat]}`;
    const blob = new Blob([exportedContent], { type: mimeMap[activeFormat] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header & Format Selector Tabs */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>ePUB 3 Media Overlay & Exporters</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports EPUB 3 SMIL XML Media Overlays, AWS Transcribe speech timing, Adobe Premiere, FCPX & DaVinci.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {setData && (
              <button
                type="button"
                onClick={handleSnapContiguous}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                title="Eliminates micro gaps between words so word[i].end matches word[i+1].start for smooth ePUB SMIL overlays"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{snappedMsg ? 'Gaps Snapped!' : 'Snap Continuous SMIL'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download .{activeFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Format Selector Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFormat('smil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'smil'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>.SMIL (EPUB 3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('tsv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'tsv'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>AWS / TSV Output</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('srt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'srt'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>.SRT (SubRip)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('vtt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'vtt'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>.VTT (WebVTT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('json')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'json'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>.JSON (Data)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('gcs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'gcs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-pink-400" />
            <span>Google Speech (# Output)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('txt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFormat === 'txt'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>.TXT (Plain)</span>
          </button>
        </div>
      </div>

      {/* Format Options Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Granularity option */}
        <div>
          <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Granularity Level:</span>
          </label>
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setGranularity('word')}
              className={`flex-1 py-1 text-center rounded font-medium transition ${
                granularity === 'word'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Word-by-Word
            </button>
            <button
              type="button"
              onClick={() => setGranularity('sentence')}
              className={`flex-1 py-1 text-center rounded font-medium transition ${
                granularity === 'sentence'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentence-Wise
            </button>
          </div>
        </div>

        {/* SMIL Options */}
        {activeFormat === 'smil' && (
          <>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                SMIL Clock Format:
              </label>
              <select
                value={smilClockFormat}
                onChange={(e: any) => setSmilClockFormat(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="clock">Full Clock (00:00:00.825)</option>
                <option value="sec">Seconds (0.825s)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                EPUB XHTML Text Reference:
              </label>
              <input
                type="text"
                value={smilXhtmlRef}
                onChange={(e) => setSmilXhtmlRef(e.target.value)}
                placeholder="chapter1.xhtml"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {/* Max Words per Line (for SRT/VTT) */}
        {(activeFormat === 'srt' || activeFormat === 'vtt') && (
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Max Words per Line: <span className="text-indigo-400 font-mono font-bold">{maxWordsPerLine === 0 ? 'Full Sentence' : maxWordsPerLine}</span>
            </label>
            <input
              type="range"
              min={0}
              max={15}
              value={maxWordsPerLine}
              onChange={(e) => setMaxWordsPerLine(parseInt(e.target.value) || 0)}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        )}

        {/* Time Offset Adjustment */}
        <div>
          <label className="block font-semibold text-slate-400 mb-1">
            Timestamp Offset (sec):
          </label>
          <input
            type="number"
            step="0.05"
            value={timeOffset}
            onChange={(e) => setTimeOffset(parseFloat(e.target.value) || 0)}
            placeholder="0.0"
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Custom JSON Flavor or TSV Prefix */}
        {activeFormat === 'json' && (
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              JSON Structure:
            </label>
            <select
              value={jsonFlavor}
              onChange={(e: any) => setJsonFlavor(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="full">Full Standard Schema</option>
              <option value="whisper">Whisper-Compatible</option>
              <option value="userSample">Word Array Only</option>
            </select>
          </div>
        )}

        {activeFormat === 'tsv' && (
          <div className="col-span-1 sm:col-span-2">
            <label className="block font-semibold text-slate-400 mb-1">
              TSV Tag Prefix:
            </label>
            <input
              type="text"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder="e.g. X123197..."
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Code / Text Output Preview Box */}
      <div className="relative p-6 bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 max-h-[400px] overflow-y-auto custom-scrollbar">
        <pre className="whitespace-pre-wrap break-words">{exportedContent}</pre>
      </div>
    </div>
  );
};

