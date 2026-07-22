import React, { useState } from 'react';
import { TranscriptionResult } from '../types';
import { SlidersHorizontal, Check, X, Clock, Maximize2, RefreshCw } from 'lucide-react';

interface TimeOffsetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TranscriptionResult;
  setData: React.Dispatch<React.SetStateAction<TranscriptionResult | null>>;
}

export const TimeOffsetModal: React.FC<TimeOffsetModalProps> = ({
  isOpen,
  onClose,
  data,
  setData,
}) => {
  const [activeTab, setActiveTab] = useState<'shift' | 'scale'>('shift');
  const [shiftSeconds, setShiftSeconds] = useState<number>(0);
  const [targetDuration, setTargetDuration] = useState<number>(data?.metadata?.duration || 36.119);

  if (!isOpen) return null;

  const currentLastEnd = data?.words?.length > 0 ? data.words[data.words.length - 1].end : 0;

  const handleApplyShift = () => {
    if (shiftSeconds === 0) {
      onClose();
      return;
    }

    setData((prev) => {
      if (!prev) return null;

      const updatedWords = prev.words.map((w) => ({
        ...w,
        start: Math.max(0, parseFloat((w.start + shiftSeconds).toFixed(3))),
        end: Math.max(0, parseFloat((w.end + shiftSeconds).toFixed(3))),
      }));

      const updatedSentences = prev.sentences.map((s) => ({
        ...s,
        start: Math.max(0, parseFloat((s.start + shiftSeconds).toFixed(3))),
        end: Math.max(0, parseFloat((s.end + shiftSeconds).toFixed(3))),
      }));

      return {
        ...prev,
        words: updatedWords,
        sentences: updatedSentences,
      };
    });

    onClose();
  };

  const handleApplyScale = () => {
    if (!targetDuration || targetDuration <= 0 || currentLastEnd <= 0) {
      onClose();
      return;
    }

    const scaleFactor = targetDuration / currentLastEnd;

    setData((prev) => {
      if (!prev) return null;

      const updatedWords = prev.words.map((w) => ({
        ...w,
        start: Math.max(0, parseFloat((w.start * scaleFactor).toFixed(3))),
        end: Math.max(0, parseFloat((w.end * scaleFactor).toFixed(3))),
      }));

      const updatedSentences = prev.sentences.map((s) => ({
        ...s,
        start: Math.max(0, parseFloat((s.start * scaleFactor).toFixed(3))),
        end: Math.max(0, parseFloat((s.end * scaleFactor).toFixed(3))),
      }));

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          duration: targetDuration,
        },
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
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Timing Calibration & Shift</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              activeTab === 'shift'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Time Offset (+/- sec)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scale')}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              activeTab === 'scale'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto Scale / Stretch
          </button>
        </div>

        {activeTab === 'shift' ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">
              Shift every timestamp forward or backward to correct constant video audio delays.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Time Shift Amount (Seconds):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={shiftSeconds}
                  onChange={(e) => setShiftSeconds(parseFloat(e.target.value) || 0)}
                  placeholder="+0.5 or -0.5"
                  className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 font-mono">sec</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShiftSeconds(-0.86)}
                className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-700/50 font-mono text-indigo-300 font-bold hover:bg-indigo-900"
                title="Exact delta to match AWS from -0.65 Gemini offset"
              >
                -0.860s (To AWS)
              </button>
              <button
                type="button"
                onClick={() => setShiftSeconds(-1.51)}
                className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-700/50 font-mono text-indigo-300 font-bold hover:bg-indigo-900"
                title="Full raw Gemini to AWS offset"
              >
                -1.510s (AWS Baseline)
              </button>
              <button
                type="button"
                onClick={() => setShiftSeconds(-0.5)}
                className="px-2 py-1 rounded bg-slate-800 font-mono text-slate-300 hover:bg-slate-700"
              >
                -0.50s
              </button>
              <button
                type="button"
                onClick={() => setShiftSeconds(-0.1)}
                className="px-2 py-1 rounded bg-slate-800 font-mono text-slate-300 hover:bg-slate-700"
              >
                -0.10s
              </button>
              <button
                type="button"
                onClick={() => setShiftSeconds(0.1)}
                className="px-2 py-1 rounded bg-slate-800 font-mono text-slate-300 hover:bg-slate-700"
              >
                +0.10s
              </button>
              <button
                type="button"
                onClick={() => setShiftSeconds(0.5)}
                className="px-2 py-1 rounded bg-slate-800 font-mono text-slate-300 hover:bg-slate-700"
              >
                +0.50s
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">
              Proportionally expand or compress all timestamps to fit exact physical audio duration (e.g. 36.119s).
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Current Last Word End:</span>
                <span className="text-amber-400 font-bold">{currentLastEnd.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Audio Duration:</span>
                <span className="text-emerald-400 font-bold">{targetDuration.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1 mt-1">
                <span>Scale Ratio:</span>
                <span className="text-indigo-400 font-bold">
                  {currentLastEnd > 0 ? (targetDuration / currentLastEnd).toFixed(5) : '1.000'}x
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Set Target Duration (Seconds):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setTargetDuration(36.119)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 font-mono font-bold"
                  title="Reset to 36.119s (Sample Attached Audio Duration)"
                >
                  36.119s
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeTab === 'shift' ? handleApplyShift : handleApplyScale}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25"
          >
            <Check className="w-4 h-4" />
            <span>{activeTab === 'shift' ? 'Apply Time Shift' : 'Calibrate Scale'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
