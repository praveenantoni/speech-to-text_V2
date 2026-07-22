import React from 'react';
import { Mic, FileCode, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  onOpenOffset: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasData,
  onOpenOffset,
  onOpenSearch,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Speech To Text Timestamp Converter
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Word & Sentence
              </span>
            </div>
            <p className="text-xs text-slate-4 rate-slate-400 text-slate-400">
              Precise word-by-word & sentence-wise timestamps for SRT, VTT, JSON & TSV exports
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {hasData && (
            <>
              <button
                type="button"
                onClick={onOpenOffset}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Shift or adjust all timestamps"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Time Shift</span>
              </button>

              <button
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Search and replace words"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Find & Replace</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition"
                title="New Transcript / Reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </>
          )}

          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-800 text-[11px] text-slate-400">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>SRT • VTT • JSON • TSV</span>
          </div>
        </div>
      </div>
    </header>
  );
};
