import { TranscriptionResult, SubtitleExportConfig } from '../types';

// Format seconds into HH:MM:SS,mmm for SRT
export function formatSRTTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
}

// Format seconds into HH:MM:SS.mmm for WebVTT
export function formatVTTTime(seconds: number, short = false): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  if (short && hrs === 0) {
    return `${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
  }
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
}

// Format seconds into seconds string with 3 decimal places e.g. "0.825"
export function formatSecondsDecimal(seconds: number): string {
  return Math.max(0, seconds).toFixed(3);
}

/**
 * Generate SRT Subtitles
 */
export function generateSRT(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;
  const blocks: string[] = [];
  let index = 1;

  if (config.granularity === 'word') {
    // Word-level SRT (One word per subtitle cue)
    for (const w of data.words) {
      const start = formatSRTTime(w.start + offset);
      const end = formatSRTTime(w.end + offset);
      const text = w.punctuatedWord || w.word;
      blocks.push(`${index++}\n${start} --> ${end}\n${text}`);
    }
  } else {
    // Sentence-level or Max Words split
    for (const sent of data.sentences) {
      const sentWords = data.words.filter((_, idx) => sent.wordIndices.includes(idx));
      const targetWords = sentWords.length > 0 ? sentWords : [];

      if (config.maxWordsPerLine && config.maxWordsPerLine > 0 && targetWords.length > config.maxWordsPerLine) {
        // Chunk sentence into smaller word groups
        for (let i = 0; i < targetWords.length; i += config.maxWordsPerLine) {
          const chunk = targetWords.slice(i, i + config.maxWordsPerLine);
          const chunkStart = formatSRTTime(chunk[0].start + offset);
          const chunkEnd = formatSRTTime(chunk[chunk.length - 1].end + offset);
          const chunkText = chunk.map(cw => cw.punctuatedWord || cw.word).join(' ');
          blocks.push(`${index++}\n${chunkStart} --> ${chunkEnd}\n${chunkText}`);
        }
      } else {
        const start = formatSRTTime(sent.start + offset);
        const end = formatSRTTime(sent.end + offset);
        blocks.push(`${index++}\n${start} --> ${end}\n${sent.text}`);
      }
    }
  }

  return blocks.join('\n\n');
}

/**
 * Generate WebVTT Subtitles (with inline word timestamps for video editors)
 */
export function generateVTT(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;
  const lines: string[] = ['WEBVTT', ''];
  let index = 1;

  if (config.granularity === 'word') {
    // Word-level WebVTT
    for (const w of data.words) {
      const start = formatVTTTime(w.start + offset);
      const end = formatVTTTime(w.end + offset);
      const text = w.punctuatedWord || w.word;
      lines.push(`${index++}`);
      lines.push(`${start} --> ${end}`);
      lines.push(`${text}\n`);
    }
  } else {
    // Sentence-level WebVTT with optional inline word timestamp tags
    for (const sent of data.sentences) {
      const sentWords = data.words.filter((_, idx) => sent.wordIndices.includes(idx));
      
      if (config.maxWordsPerLine && config.maxWordsPerLine > 0 && sentWords.length > config.maxWordsPerLine) {
        for (let i = 0; i < sentWords.length; i += config.maxWordsPerLine) {
          const chunk = sentWords.slice(i, i + config.maxWordsPerLine);
          const chunkStart = formatVTTTime(chunk[0].start + offset);
          const chunkEnd = formatVTTTime(chunk[chunk.length - 1].end + offset);
          
          // Generate inline word timestamps e.g. "Far <00:02.170><c>in</c>"
          const inlineText = chunk.map((cw, cIdx) => {
            const wordStr = cw.punctuatedWord || cw.word;
            if (cIdx === 0) return wordStr;
            const tTag = formatVTTTime(cw.start + offset, true);
            return `<${tTag}><c>${wordStr}</c>`;
          }).join(' ');

          lines.push(`${index++}`);
          lines.push(`${chunkStart} --> ${chunkEnd}`);
          lines.push(`${inlineText}\n`);
        }
      } else {
        const start = formatVTTTime(sent.start + offset);
        const end = formatVTTTime(sent.end + offset);

        let inlineText = sent.text;
        if (sentWords.length > 0) {
          inlineText = sentWords.map((cw, cIdx) => {
            const wordStr = cw.punctuatedWord || cw.word;
            if (cIdx === 0) return wordStr;
            const tTag = formatVTTTime(cw.start + offset, true);
            return `<${tTag}><c>${wordStr}</c>`;
          }).join(' ');
        }

        lines.push(`${index++}`);
        lines.push(`${start} --> ${end}`);
        lines.push(`${inlineText}\n`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Generate TSV/CSV format (Matching attached user format)
 */
export function generateTSV(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;
  const lines: string[] = [];
  const prefix = config.customPrefix || 'X123197 The Art of Make-Believe and Happy Endings 2_3';

  if (config.granularity === 'word') {
    const contiguousWords = enforceContiguousWords(data.words, data.metadata.duration);

    // Add leading EMPTY line if speech starts after 0.000s
    if (contiguousWords.length > 0 && contiguousWords[0].start > 0) {
      const emptyEnd = formatSecondsDecimal(contiguousWords[0].start + offset);
      lines.push(`0.000\t${emptyEnd}\tEMPTY`);
    }

    contiguousWords.forEach((w, idx) => {
      const start = formatSecondsDecimal(w.start + offset);
      const end = formatSecondsDecimal(w.end + offset);
      const seqStr = String(idx + 1).padStart(3, '0');
      const cleanWord = w.word;
      const tag = prefix ? `${prefix}word${seqStr}_${cleanWord}` : cleanWord;
      lines.push(`${start}\t${end}\t${tag}`);
    });
  } else {
    data.sentences.forEach((s, idx) => {
      const start = formatSecondsDecimal(s.start + offset);
      const end = formatSecondsDecimal(s.end + offset);
      const seqStr = String(idx + 1).padStart(3, '0');
      const text = s.text;
      const tag = prefix ? `${prefix}sentence${seqStr}_${text}` : text;
      lines.push(`${start}\t${end}\t${tag}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate JSON Export
 */
export function generateJSON(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;

  if (config.jsonFlavor === 'whisper') {
    return JSON.stringify({
      text: data.sentences.map(s => s.text).join(' '),
      segments: data.sentences.map(s => {
        const sentWords = data.words.filter((_, idx) => s.wordIndices.includes(idx));
        return {
          id: s.id,
          start: parseFloat((s.start + offset).toFixed(3)),
          end: parseFloat((s.end + offset).toFixed(3)),
          text: s.text,
          words: sentWords.map(w => ({
            word: w.word,
            punctuatedWord: w.punctuatedWord,
            start: parseFloat((w.start + offset).toFixed(3)),
            end: parseFloat((w.end + offset).toFixed(3)),
            confidence: w.confidence || 0.98
          }))
        };
      })
    }, null, 2);
  } else if (config.jsonFlavor === 'userSample') {
    return JSON.stringify(
      data.words.map((w, idx) => ({
        id: idx + 1,
        word: w.word,
        punctuatedWord: w.punctuatedWord,
        start: parseFloat((w.start + offset).toFixed(3)),
        end: parseFloat((w.end + offset).toFixed(3)),
        duration: parseFloat((w.end - w.start).toFixed(3))
      })),
      null,
      2
    );
  }

  // Full default schema
  return JSON.stringify(
    {
      metadata: {
        ...data.metadata,
        timeOffsetApplied: offset
      },
      sentences: data.sentences.map(s => ({
        ...s,
        start: parseFloat((s.start + offset).toFixed(3)),
        end: parseFloat((s.end + offset).toFixed(3))
      })),
      words: data.words.map(w => ({
        ...w,
        start: parseFloat((w.start + offset).toFixed(3)),
        end: parseFloat((w.end + offset).toFixed(3))
      }))
    },
    null,
    2
  );
}

/**
 * Helper to guarantee strict word timestamp contiguity for ePUB 3 SMIL Media Overlays
 * Sets word[i].end = word[i+1].start for every adjacent word pair.
 */
export function enforceContiguousWords<T extends { start: number; end: number }>(
  words: T[],
  targetDuration?: number
): T[] {
  if (!words || words.length === 0) return [];

  const result = words.map((w) => ({ ...w }));

  // Step 1: Ensure monotonically non-decreasing start times
  for (let i = 0; i < result.length; i++) {
    result[i].start = Math.max(0, parseFloat((result[i].start || 0).toFixed(3)));
    if (i > 0 && result[i].start < result[i - 1].start) {
      result[i].start = result[i - 1].start;
    }
  }

  // Step 2: Strictly set word[i].end = word[i+1].start for gapless SMIL continuity
  for (let i = 0; i < result.length - 1; i++) {
    result[i].end = result[i + 1].start;
  }

  // Step 3: Set last word end time
  const lastIdx = result.length - 1;
  const lastStart = result[lastIdx].start;
  let finalEnd = result[lastIdx].end;

  if (targetDuration && targetDuration > lastStart) {
    finalEnd = targetDuration;
  } else if (!finalEnd || finalEnd <= lastStart) {
    finalEnd = parseFloat((lastStart + 0.35).toFixed(3));
  }

  result[lastIdx].end = parseFloat(finalEnd.toFixed(3));

  return result;
}

/**
 * Snap word timestamps to be contiguous (closing all gaps between adjacent spoken words)
 * Essential for ePUB 3 SMIL Media Overlays and AWS-style contiguous word boundaries.
 */
export function snapContiguousTimestamps(data: TranscriptionResult): TranscriptionResult {
  if (!data.words || data.words.length <= 1) return data;

  const contiguousWords = enforceContiguousWords(data.words, data.metadata.duration);

  // Re-align sentences based on updated contiguous word boundaries
  const newSentences = data.sentences.map((s) => {
    const sentWords = contiguousWords.filter((_, idx) => s.wordIndices.includes(idx));
    if (sentWords.length > 0) {
      return {
        ...s,
        start: sentWords[0].start,
        end: sentWords[sentWords.length - 1].end,
      };
    }
    return s;
  });

  return {
    ...data,
    words: contiguousWords,
    sentences: newSentences,
  };
}

/**
 * Generate EPUB 3 SMIL Media Overlay XML
 */
export function generateSMIL(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;
  const clockFormat = config.smilClockFormat || 'clock';
  const xhtmlRef = config.smilXhtmlRef || 'chapter1.xhtml';
  const audioRef = data.metadata.audioName || 'audio.mp3';

  const formatClock = (seconds: number) => {
    const s = Math.max(0, seconds + offset);
    if (clockFormat === 'sec') {
      return `${s.toFixed(3)}s`;
    }
    return formatVTTTime(s, false); // HH:MM:SS.mmm
  };

  const parBlocks: string[] = [];

  if (config.granularity === 'word') {
    const contiguousWords = enforceContiguousWords(data.words, data.metadata.duration);
    contiguousWords.forEach((w, idx) => {
      const seqStr = String(idx + 1).padStart(3, '0');
      const parId = `par${seqStr}`;
      const textId = `word${seqStr}`;
      const cb = formatClock(w.start);
      const ce = formatClock(w.end);
      const contentStr = w.punctuatedWord || w.word;

      parBlocks.push(
        `      <par id="${parId}">\n` +
        `        <text src="${xhtmlRef}#${textId}"/>\n` +
        `        <audio src="${audioRef}" clipBegin="${cb}" clipEnd="${ce}"/>\n` +
        `        <!-- ${contentStr} -->\n` +
        `      </par>`
      );
    });
  } else {
    data.sentences.forEach((s, idx) => {
      const seqStr = String(idx + 1).padStart(3, '0');
      const parId = `par${seqStr}`;
      const textId = `sent${seqStr}`;
      const cb = formatClock(s.start);
      const ce = formatClock(s.end);

      parBlocks.push(
        `      <par id="${parId}">\n` +
        `        <text src="${xhtmlRef}#${textId}"/>\n` +
        `        <audio src="${audioRef}" clipBegin="${cb}" clipEnd="${ce}"/>\n` +
        `        <!-- ${s.text} -->\n` +
        `      </par>`
      );
    });
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<smil xmlns="http://www.w3.org/ns/SMIL" xmlns:epub="http://www.idpf.org/2007/ops" version="3.0">\n` +
    `  <body>\n` +
    `    <seq id="seq1" epub:textref="${xhtmlRef}">\n` +
    parBlocks.join('\n') +
    `\n    </seq>\n` +
    `  </body>\n` +
    `</smil>`
  );
}

/**
 * Format time for Google Cloud Speech python script style: "0:00:00.825"
 */
export function formatGCSTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  return `${pad(hrs, 1)}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
}

/**
 * Generate Google Cloud Speech output format (filename#0st#0et#word)
 */
export function generateGCSSpeech(data: TranscriptionResult, config: SubtitleExportConfig): string {
  const offset = config.timeOffset || 0;
  const filename = data.metadata.audioName || 'audio.mp3';
  const lines: string[] = [];

  if (config.granularity === 'word') {
    data.words.forEach((w) => {
      const st = formatGCSTime(w.start + offset);
      const et = formatGCSTime(w.end + offset);
      const word = w.punctuatedWord || w.word;
      lines.push(`${filename}#0${st}#0${et}#${word}`);
    });
  } else {
    data.sentences.forEach((s) => {
      const st = formatGCSTime(s.start + offset);
      const et = formatGCSTime(s.end + offset);
      lines.push(`${filename}#0${st}#0${et}#${s.text}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate Plain Text
 */
export function generateTXT(data: TranscriptionResult): string {
  return data.sentences.map(s => s.text).join('\n\n');
}
