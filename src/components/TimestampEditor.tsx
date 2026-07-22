import React, { useState } from 'react';
import {
  WordTimestamp,
  SentenceTimestamp,
  TranscriptionResult
} from '../types';
import { snapContiguousTimestamps } from '../utils/exportFormats';
import {
  Search,
  Play,
  Edit3,
  Trash2,
  Plus,
  Clock,
  Layers,
  FileText,
  Check,
  X,
  Scissors,
  Merge,
  Zap
} from 'lucide-react';

interface TimestampEditorProps {
  data: TranscriptionResult;
  setData: React.Dispatch<React.SetStateAction<TranscriptionResult | null>>;
  activeWord: WordTimestamp | null;
  activeSentence: SentenceTimestamp | null;
  onSeek: (seconds: number) => void;
}

export const TimestampEditor: React.FC<TimestampEditorProps> = ({
  data,
  setData,
  activeWord,
  activeSentence,
  onSeek,
}) => {
  const [editorTab, setEditorTab] = useState<'sentences' | 'words'>('sentences');
  const [wordSearch, setWordSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit state buffers
  const [editSentenceText, setEditSentenceText] = useState('');
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number>(0);

  const [editWordText, setEditWordText] = useState('');
  const [editPunctuatedWord, setEditPunctuatedWord] = useState('');

  // Start editing a sentence
  const handleStartEditSentence = (s: SentenceTimestamp) => {
    setEditingId(s.id);
    setEditSentenceText(s.text);
    setEditStart(s.start);
    setEditEnd(s.end);
  };

  // Save edited sentence
  const handleSaveSentence = (id: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sentences: prev.sentences.map((s) =>
          s.id === id
            ? { ...s, text: editSentenceText, start: editStart, end: editEnd }
            : s
        ),
      };
    });
    setEditingId(null);
  };

  // Start editing a word
  const handleStartEditWord = (w: WordTimestamp) => {
    setEditingId(w.id);
    setEditWordText(w.word);
    setEditPunctuatedWord(w.punctuatedWord || w.word);
    setEditStart(w.start);
    setEditEnd(w.end);
  };

  // Save edited word
  const handleSaveWord = (id: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        words: prev.words.map((w) =>
          w.id === id
            ? {
                ...w,
                word: editWordText,
                punctuatedWord: editPunctuatedWord,
                start: editStart,
                end: editEnd,
              }
            : w
        ),
      };
    });
    setEditingId(null);
  };

  // Delete word
  const handleDeleteWord = (id: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        words: prev.words.filter((w) => w.id !== id),
      };
    });
  };

  // Delete sentence
  const handleDeleteSentence = (id: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sentences: prev.sentences.filter((s) => s.id !== id),
      };
    });
  };

  // Filtered words for word search
  const filteredWords = data.words.filter(
    (w) =>
      w.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
      (w.punctuatedWord && w.punctuatedWord.toLowerCase().includes(wordSearch.toLowerCase()))
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Editor Tab Navigation Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditorTab('sentences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              editorTab === 'sentences'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sentence View ({data.sentences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorTab('words')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              editorTab === 'words'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Word-by-Word ({data.words.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editorTab === 'words' && (
            <button
              type="button"
              onClick={() => setData((prev) => (prev ? snapContiguousTimestamps(prev) : null))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
              title="Snap word[i].end to equal word[i+1].start for gapless SMIL overlay playback"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Snap Contiguous SMIL</span>
            </button>
          )}

          {/* Word search filter */}
          {editorTab === 'words' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search word..."
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-lg border border-slate-700/80 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 max-h-[520px] overflow-y-auto custom-scrollbar">
        {/* SENTENCE-WISE VIEW */}
        {editorTab === 'sentences' && (
          <div className="space-y-3">
            {data.sentences.map((sent, index) => {
              const isActive = activeSentence?.id === sent.id;
              const isEditing = editingId === sent.id;
              const sentenceWords = data.words.filter((_, idx) => sent.wordIndices.includes(idx));

              return (
                <div
                  key={sent.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Start:</span>
                        <input
                          type="number"
                          step="0.001"
                          value={editStart}
                          onChange={(e) => setEditStart(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-100 text-xs"
                        />
                        <span>s → End:</span>
                        <input
                          type="number"
                          step="0.001"
                          value={editEnd}
                          onChange={(e) => setEditEnd(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-100 text-xs"
                        />
                        <span>s</span>
                      </div>

                      <textarea
                        value={editSentenceText}
                        onChange={(e) => setEditSentenceText(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSentence(sent.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {sent.start.toFixed(3)}s → {sent.end.toFixed(3)}s
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({(sent.end - sent.start).toFixed(2)}s duration)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSeek(sent.start)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1 px-2"
                            title="Play sentence"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Seek</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEditSentence(sent)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                            title="Edit sentence text or timing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSentence(sent.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                            title="Delete sentence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-200 leading-relaxed">
                        {sent.text}
                      </p>

                      {/* Display underlying word timestamps tokens inside sentence card */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                        {sentenceWords.map((w) => (
                          <span
                            key={w.id}
                            onClick={() => onSeek(w.start)}
                            className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer transition ${
                              activeWord?.id === w.id
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400'
                            }`}
                            title={`${w.start.toFixed(3)}s -> ${w.end.toFixed(3)}s`}
                          >
                            {w.punctuatedWord || w.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* WORD-BY-WORD VIEW */}
        {editorTab === 'words' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredWords.map((w, index) => {
              const isActive = activeWord?.id === w.id;
              const isEditing = editingId === w.id;

              return (
                <div
                  key={w.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editPunctuatedWord}
                          onChange={(e) => setEditPunctuatedWord(e.target.value)}
                          placeholder="Word"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100"
                        />
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <input
                          type="number"
                          step="0.001"
                          value={editStart}
                          onChange={(e) => setEditStart(parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                        />
                        <span className="text-slate-500">→</span>
                        <input
                          type="number"
                          step="0.001"
                          value={editEnd}
                          onChange={(e) => setEditEnd(parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                        />
                        <span className="text-slate-500">s</span>
                      </div>

                      <div className="flex justify-end gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveWord(w.id)}
                          className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          #{index + 1}
                        </span>

                        <span
                          onClick={() => onSeek(w.start)}
                          className={`text-xs font-bold truncate cursor-pointer hover:underline ${
                            isActive ? 'text-indigo-300 font-extrabold' : 'text-slate-200'
                          }`}
                        >
                          {w.punctuatedWord || w.word}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                          {w.start.toFixed(3)}s
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStartEditWord(w)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                          title="Edit word"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWord(w.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                          title="Delete word"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
