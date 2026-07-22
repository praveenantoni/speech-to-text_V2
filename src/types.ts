export interface WordTimestamp {
  id: string;
  word: string;
  punctuatedWord: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence?: number;
}

export interface SentenceTimestamp {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  wordIndices: number[]; // indices in the master words array
}

export interface TranscriptionMetadata {
  audioName: string;
  duration: number; // in seconds
  language: string;
  wordCount: number;
  sentenceCount: number;
  createdAt: string;
  sampleRate?: number;
  format?: string;
}

export interface TranscriptionResult {
  id?: string;
  metadata: TranscriptionMetadata;
  words: WordTimestamp[];
  sentences: SentenceTimestamp[];
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  status?: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export type ExportFormat = 'srt' | 'vtt' | 'json' | 'tsv' | 'gcs' | 'smil' | 'txt';

export type SubtitleGranularity = 'sentence' | 'word';

export interface SubtitleExportConfig {
  granularity: SubtitleGranularity;
  maxWordsPerLine: number; // For sentence splitting in SRT/VTT (e.g. 5, 8, 12, or 0 for original sentences)
  timeOffset: number; // Shift all timestamps by X seconds (positive or negative)
  customPrefix?: string; // e.g. for user's sample format: "X123197 The Art of..."
  includeMetadata: boolean;
  jsonFlavor: 'full' | 'whisper' | 'userSample';
  smilClockFormat?: 'clock' | 'sec'; // '00:00:00.825' vs '0.825s'
  smilXhtmlRef?: string; // e.g. 'chapter1.xhtml'
}

export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl?: string;
  words: Omit<WordTimestamp, 'id'>[];
  sentences: Omit<SentenceTimestamp, 'id'>[];
}
