import React, { useState } from 'react';
import { TranscriptionResult } from '../types';
import { Sparkles, X, Check, Search } from 'lucide-react';

interface SearchReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TranscriptionResult;
  setData: React.Dispatch<React.SetStateAction<TranscriptionResult | null>>;
}

export const SearchReplaceModal: React.FC<SearchReplaceModalProps> = ({
  isOpen,
  onClose,
  data,
  setData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  if (!isOpen) return null;

  const handleReplaceAll = () => {
    if (!searchTerm.trim()) return;

    setData((prev) => {
      if (!prev) return null;

      const regex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );

      const updatedWords = prev.words.map((w) => ({
        ...w,
        word: w.word.replace(regex, replaceTerm),
        punctuatedWord: w.punctuatedWord
          ? w.punctuatedWord.replace(regex, replaceTerm)
          : w.word.replace(regex, replaceTerm),
      }));

      const updatedSentences = prev.sentences.map((s) => ({
        ...s,
        text: s.text.replace(regex, replaceTerm),
      }));

      return {
        ...prev,
        words: updatedWords,
        sentences: updatedSentences,
      };
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Search & Replace Terms</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Find Word / Phrase:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. Witch"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Replace With:
            </label>
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="e.g. Sorceress"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="matchCase"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="matchCase" className="text-slate-400 cursor-pointer">
              Match Case Exactly
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25"
          >
            <Check className="w-4 h-4" />
            <span>Replace All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
