import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Increase payload limit for audio files (up to 100MB base64)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper to initialize Gemini SDK safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Audio Speech-to-Text Endpoint with Word & Sentence Timestamps
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithRetry(ai: any, params: any) {
  const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota') ||
          err?.status === 'RESOURCE_EXHAUSTED';

        if (isRateLimit) {
          let waitMs = 3000 * attempt;
          const retryMatch = errMsg.match(/retry in ([0-9.]+)(ms|s)/i);
          if (retryMatch) {
            const val = parseFloat(retryMatch[1]);
            const unit = retryMatch[2].toLowerCase();
            const parsedMs = unit === 's' ? val * 1000 : val;
            if (!isNaN(parsedMs) && parsedMs > 0 && parsedMs < 65000) {
              waitMs = Math.max(parsedMs + 1000, waitMs);
            }
          }
          console.warn(
            `[Gemini Rate Limit 429] Model '${model}' attempt ${attempt}/3 hit free tier quota. Retrying in ${Math.round(
              waitMs
            )}ms...`
          );
          await sleep(waitMs);
        } else {
          console.warn(`[Gemini Error] Model '${model}' failed: ${errMsg}. Trying fallback model...`);
          break;
        }
      }
    }
  }

  throw lastError;
}

async function transcribeWithElevenLabs(
  cleanBase64: string,
  mimeType: string,
  languageHint: string,
  audioDuration: number,
  audioName: string,
  apiKeyOverride?: string
) {
  const elevenApiKey = apiKeyOverride || process.env.ELEVENLABS_API_KEY || 'sk_cbc7e4a4241863ada57c313ecb13c062071ce55c9005adad';

  const buffer = Buffer.from(cleanBase64, 'base64');
  const audioBlob = new Blob([buffer], { type: mimeType || 'audio/mp3' });

  const formData = new FormData();
  formData.append('file', audioBlob, audioName || 'audio.mp3');
  formData.append('model_id', 'scribe_v1');
  formData.append('tag_audio_events', 'true');
  formData.append('timestamps_granularity', 'word');

  console.log(`[ElevenLabs STT] Requesting transcription for ${audioName}...`);
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': elevenApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ElevenLabs STT Error ${response.status}]:`, errorText);
    throw new Error(`ElevenLabs STT API error (${response.status}): ${errorText || response.statusText}`);
  }

  const data: any = await response.json();
  const rawItems = Array.isArray(data.words) ? data.words : [];

  const formattedWords: any[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (item.type === 'word' || (typeof item.start === 'number' && typeof item.end === 'number' && item.text && item.text.trim())) {
      const rawText = String(item.text || '').trim();
      if (!rawText) continue;

      let pWord = rawText;
      if (i + 1 < rawItems.length) {
        const nextItem = rawItems[i + 1];
        if (nextItem.type === 'spacing' || nextItem.type === 'punctuation' || typeof nextItem.start !== 'number') {
          const trailing = String(nextItem.text || '').trim();
          if (trailing && /^[,.?!;:–—'"]+$/.test(trailing)) {
            pWord += trailing;
          }
        }
      }

      const cleanWord = rawText.replace(/[^\w\s'-]/g, '');

      formattedWords.push({
        id: `w_${formattedWords.length + 1}`,
        word: cleanWord || rawText,
        punctuatedWord: pWord,
        start: parseFloat(Number(item.start || 0).toFixed(3)),
        end: parseFloat(Number(item.end || 0).toFixed(3)),
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.99,
        speakerId: item.speaker_id,
      });
    }
  }

  // Fallback if words array was empty but text existed
  if (formattedWords.length === 0 && data.text) {
    const textWords = String(data.text).trim().split(/\s+/);
    const estDuration = audioDuration > 0 ? audioDuration : Math.max(2, textWords.length * 0.4);
    const step = estDuration / Math.max(1, textWords.length);
    textWords.forEach((tw, idx) => {
      const wStart = idx * step;
      const wEnd = Math.min(estDuration, (idx + 1) * step);
      const cleanW = tw.replace(/[^\w\s'-]/g, '');
      formattedWords.push({
        id: `w_${idx + 1}`,
        word: cleanW || tw,
        punctuatedWord: tw,
        start: parseFloat(wStart.toFixed(3)),
        end: parseFloat(wEnd.toFixed(3)),
        confidence: 0.95,
      });
    });
  }

  // Group into sentences
  const formattedSentences: any[] = [];
  if (formattedWords.length > 0) {
    let currentSentenceWords: typeof formattedWords = [];
    let currentWordIndices: number[] = [];

    formattedWords.forEach((w, wIdx) => {
      currentSentenceWords.push(w);
      currentWordIndices.push(wIdx);

      const isEndPunctuation = /[.!?]$/.test(w.punctuatedWord);
      const nextWord = formattedWords[wIdx + 1];
      const isPause = nextWord ? (nextWord.start - w.end > 1.2) : true;
      const isSpeakerChange = nextWord && w.speakerId && nextWord.speakerId && w.speakerId !== nextWord.speakerId;

      if (isEndPunctuation || isPause || isSpeakerChange || wIdx === formattedWords.length - 1) {
        const sentText = currentSentenceWords.map(sw => sw.punctuatedWord).join(' ');
        formattedSentences.push({
          id: `s_${formattedSentences.length + 1}`,
          text: sentText,
          start: currentSentenceWords[0].start,
          end: currentSentenceWords[currentSentenceWords.length - 1].end,
          wordIndices: [...currentWordIndices],
        });
        currentSentenceWords = [];
        currentWordIndices = [];
      }
    });
  }

  const finalDuration = audioDuration > 0 ? audioDuration : (formattedWords[formattedWords.length - 1]?.end || 0);

  return {
    metadata: {
      audioName: audioName,
      duration: parseFloat(finalDuration.toFixed(3)),
      language: data.language_code || languageHint || 'English',
      wordCount: formattedWords.length,
      sentenceCount: formattedSentences.length,
      createdAt: new Date().toISOString(),
      format: mimeType,
      engine: 'ElevenLabs Scribe v1',
    },
    words: formattedWords,
    sentences: formattedSentences,
  };
}

app.post('/api/transcribe', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/mp3',
      languageHint = 'English',
      audioDuration = 0,
      audioName = 'Uploaded Audio',
      provider = 'gemini',
      apiKey,
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 payload.' });
    }

    // Clean base64 string if data URI prefix was sent
    const cleanBase64 = audioBase64.includes('base64,')
      ? audioBase64.split('base64,')[1]
      : audioBase64;

    if (provider === 'elevenlabs') {
      const elevenResult = await transcribeWithElevenLabs(
        cleanBase64,
        mimeType,
        languageHint,
        audioDuration,
        audioName,
        apiKey
      );
      return res.json(elevenResult);
    }

    const ai = getGeminiClient();

    const durationInfo = audioDuration > 0
      ? ` Total audio length is ${audioDuration.toFixed(3)} seconds.`
      : '';

    const systemPrompt = `You are a high-precision Acoustic Speech Transcriber and Forced Alignment Engine.
Your goal is to transcribe audio with maximum accuracy and extract HIGH-PRECISION word-level and sentence-level timestamps matching the exact acoustic vocalization boundaries.

CRITICAL TIMESTAMP PRECISION RULES:
1. Acoustic Word Boundaries:
   - Extract every spoken word in sequence with millisecond-level precision (3 decimal places, e.g. start: 1.870, end: 2.008).
   - 'start': exact second (float with 3 decimal places) when the speaker begins vocalizing the initial phoneme of the word.
   - 'end': exact second (float with 3 decimal places) when the speaker ceases vocalizing the final phoneme of the word.
   - DO NOT pad, stretch, or bridge silent gaps or pauses between words. If a word is spoken from 1.870s to 2.008s, start MUST be 1.870 and end MUST be 2.008.
   - 'word': raw clean string without punctuation (e.g., "her").
   - 'punctuatedWord': punctuated string with original capitalization (e.g., "her,").
   - 'confidence': estimated score between 0.90 and 1.0.

2. Sentence Grouping:
   - Group contiguous words into complete sentences.
   - 'start': start time of the first word in the sentence.
   - 'end': end time of the last word in the sentence.
   - 'text': complete punctuated sentence string.
   - 'wordIndices': 0-based array of word index numbers belonging to this sentence.

3. Language: ${languageHint}.${durationInfo}`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/mp3',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Please transcribe this audio with acoustic millisecond precision word and sentence timestamps. ${audioDuration > 0 ? `Total audio duration: ${audioDuration.toFixed(3)}s.` : ''}`,
    };

    const response = await generateContentWithRetry(ai, {
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for maximum alignment precision
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            duration: { type: Type.NUMBER, description: 'Audio duration in seconds' },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  punctuatedWord: { type: Type.STRING },
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                },
                required: ['word', 'punctuatedWord', 'start', 'end'],
              },
            },
            sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  wordIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                  },
                },
                required: ['text', 'start', 'end', 'wordIndices'],
              },
            },
          },
          required: ['words', 'sentences'],
        },
      },
    });

    const jsonText = response.text || '{}';
    let parsedData: any;

    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini output JSON:', jsonText);
      return res.status(500).json({
        error: 'Failed to parse transcription timestamps. Output was invalid JSON.',
        raw: jsonText,
      });
    }

    // Post-process raw words without distorting exact acoustic timestamps
    const rawWords = Array.isArray(parsedData.words) ? parsedData.words : [];
    const trueDuration = audioDuration > 0 ? audioDuration : (parsedData.duration || 0);

    const formattedWords = rawWords.map((w: any, idx: number) => {
      const rawStart = typeof w.start === 'number' ? Math.max(0, w.start) : 0;
      const rawEnd = typeof w.end === 'number' ? Math.max(rawStart, w.end) : rawStart + 0.2;
      return {
        id: `w_${idx + 1}`,
        word: String(w.word || '').trim(),
        punctuatedWord: String(w.punctuatedWord || w.word || '').trim(),
        start: parseFloat(rawStart.toFixed(3)),
        end: parseFloat(rawEnd.toFixed(3)),
        confidence: typeof w.confidence === 'number' ? w.confidence : 0.98,
      };
    });

    const rawSentences = Array.isArray(parsedData.sentences) ? parsedData.sentences : [];
    const formattedSentences = rawSentences.map((s: any, idx: number) => {
      let indices: number[] = Array.isArray(s.wordIndices) ? s.wordIndices : [];
      
      // Fallback index assignment if wordIndices missed
      if (indices.length === 0 && formattedWords.length > 0) {
        const sStart = typeof s.start === 'number' ? s.start : 0;
        const sEnd = typeof s.end === 'number' ? s.end : sStart + 1.0;
        indices = formattedWords
          .map((w, wIdx) => (w.start >= sStart - 0.1 && w.end <= sEnd + 0.2 ? wIdx : -1))
          .filter(i => i !== -1);
      }

      const firstWord = formattedWords[indices[0]];
      const lastWord = formattedWords[indices[indices.length - 1]];

      const sentStart = firstWord ? firstWord.start : parseFloat((s.start || 0).toFixed(3));
      const sentEnd = lastWord ? lastWord.end : parseFloat((s.end || 0).toFixed(3));

      return {
        id: `s_${idx + 1}`,
        text: String(s.text || '').trim(),
        start: sentStart,
        end: sentEnd,
        wordIndices: indices,
      };
    });

    const finalDuration = trueDuration > 0 ? trueDuration : (formattedWords[formattedWords.length - 1]?.end || 0);

    const result = {
      metadata: {
        audioName: audioName,
        duration: parseFloat(finalDuration.toFixed(3)),
        language: parsedData.language || languageHint || 'English',
        wordCount: formattedWords.length,
        sentenceCount: formattedSentences.length,
        createdAt: new Date().toISOString(),
        format: mimeType,
        engine: 'Gemini 2.5 Flash',
      },
      words: formattedWords,
      sentences: formattedSentences,
    };

    return res.json(result);
  } catch (err: any) {
    console.error('Transcription API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Server error occurred during speech-to-text processing.',
    });
  }
});

export default app;

if (process.env.VERCEL !== '1') {
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startServer();
}
