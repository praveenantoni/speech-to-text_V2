import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Increase payload limit for audio files (up to 50MB base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.post('/api/transcribe', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/mp3',
      languageHint = 'English',
      audioDuration = 0,
      audioName = 'Uploaded Audio',
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 payload.' });
    }

    // Clean base64 string if data URI prefix was sent
    const cleanBase64 = audioBase64.includes('base64,')
      ? audioBase64.split('base64,')[1]
      : audioBase64;

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
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
