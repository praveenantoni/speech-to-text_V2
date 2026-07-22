import { TranscriptionResult, SamplePreset } from '../types';

export const SAMPLE_HANSEL_AND_GRETEL: TranscriptionResult = {
  metadata: {
    audioName: 'The Art of Make-Believe and Happy Endings 2.mp3',
    duration: 36.119,
    language: 'English (en)',
    wordCount: 84,
    sentenceCount: 9,
    createdAt: new Date().toISOString(),
    format: 'Audio/MP3 (24kHz)'
  },
  words: [
    { id: 'w1', word: 'Far', punctuatedWord: 'Far', start: 0.825, end: 2.170, confidence: 0.99 },
    { id: 'w2', word: 'in', punctuatedWord: 'in', start: 2.170, end: 2.329, confidence: 0.98 },
    { id: 'w3', word: 'the', punctuatedWord: 'the', start: 2.329, end: 2.450, confidence: 0.98 },
    { id: 'w4', word: 'dark', punctuatedWord: 'dark', start: 2.450, end: 2.769, confidence: 0.99 },
    { id: 'w5', word: 'forest', punctuatedWord: 'forest.', start: 2.769, end: 3.939, confidence: 0.99 },
    
    { id: 'w6', word: 'One', punctuatedWord: 'One', start: 3.939, end: 4.730, confidence: 0.99 },
    { id: 'w7', word: 'day', punctuatedWord: 'day,', start: 4.730, end: 5.170, confidence: 0.99 },
    { id: 'w8', word: 'far', punctuatedWord: 'far', start: 5.170, end: 5.409, confidence: 0.98 },
    { id: 'w9', word: 'in', punctuatedWord: 'in', start: 5.409, end: 5.530, confidence: 0.98 },
    { id: 'w10', word: 'the', punctuatedWord: 'the', start: 5.530, end: 5.690, confidence: 0.98 },
    { id: 'w11', word: 'dark', punctuatedWord: 'dark', start: 5.690, end: 6.050, confidence: 0.99 },
    { id: 'w12', word: 'forest', punctuatedWord: 'forest,', start: 6.050, end: 6.765, confidence: 0.99 },
    { id: 'w13', word: 'Hansel', punctuatedWord: 'Hansel', start: 6.765, end: 7.289, confidence: 0.99 },
    { id: 'w14', word: 'and', punctuatedWord: 'and', start: 7.289, end: 7.489, confidence: 0.98 },
    { id: 'w15', word: 'Gretel', punctuatedWord: 'Gretel', start: 7.489, end: 8.050, confidence: 0.99 },
    { id: 'w16', word: 'saw', punctuatedWord: 'saw', start: 8.050, end: 8.170, confidence: 0.99 },
    { id: 'w17', word: 'a', punctuatedWord: 'a', start: 8.170, end: 8.449, confidence: 0.97 },
    { id: 'w18', word: 'cute', punctuatedWord: 'cute', start: 8.449, end: 8.710, confidence: 0.99 },
    { id: 'w19', word: 'house', punctuatedWord: 'house', start: 8.710, end: 9.250, confidence: 0.99 },
    { id: 'w20', word: 'made', punctuatedWord: 'made', start: 9.250, end: 9.409, confidence: 0.99 },
    { id: 'w21', word: 'of', punctuatedWord: 'of', start: 9.409, end: 9.770, confidence: 0.98 },
    { id: 'w22', word: 'sweets', punctuatedWord: 'sweets.', start: 9.770, end: 10.735, confidence: 0.99 },

    { id: 'w23', word: 'They', punctuatedWord: 'They', start: 10.735, end: 11.420, confidence: 0.99 },
    { id: 'w24', word: 'were', punctuatedWord: 'were', start: 11.420, end: 11.604, confidence: 0.98 },
    { id: 'w25', word: 'delighted', punctuatedWord: 'delighted.', start: 11.604, end: 12.654, confidence: 0.99 },

    { id: 'w26', word: 'They', punctuatedWord: 'They', start: 12.654, end: 13.229, confidence: 0.99 },
    { id: 'w27', word: 'did', punctuatedWord: 'did', start: 13.229, end: 13.390, confidence: 0.98 },
    { id: 'w28', word: 'not', punctuatedWord: 'not', start: 13.390, end: 13.550, confidence: 0.99 },
    { id: 'w29', word: 'suspect', punctuatedWord: 'suspect', start: 13.550, end: 14.149, confidence: 0.99 },
    { id: 'w30', word: 'it', punctuatedWord: 'it', start: 14.149, end: 14.350, confidence: 0.98 },
    { id: 'w31', word: 'was', punctuatedWord: 'was', start: 14.350, end: 14.510, confidence: 0.98 },
    { id: 'w32', word: 'a', punctuatedWord: 'a', start: 14.510, end: 14.630, confidence: 0.97 },
    { id: 'w33', word: 'trap', punctuatedWord: 'trap', start: 14.630, end: 15.340, confidence: 0.99 },
    { id: 'w34', word: 'set', punctuatedWord: 'set', start: 15.340, end: 15.590, confidence: 0.99 },
    { id: 'w35', word: 'by', punctuatedWord: 'by', start: 15.590, end: 15.750, confidence: 0.98 },
    { id: 'w36', word: 'a', punctuatedWord: 'a', start: 15.750, end: 15.869, confidence: 0.97 },
    { id: 'w37', word: 'witch', punctuatedWord: 'witch.', start: 15.869, end: 17.040, confidence: 0.99 },

    { id: 'w38', word: 'The', punctuatedWord: 'The', start: 17.040, end: 17.819, confidence: 0.99 },
    { id: 'w39', word: 'kids', punctuatedWord: 'kids', start: 17.819, end: 18.229, confidence: 0.99 },
    { id: 'w40', word: 'started', punctuatedWord: 'started', start: 18.229, end: 18.549, confidence: 0.99 },
    { id: 'w41', word: 'to', punctuatedWord: 'to', start: 18.549, end: 18.709, confidence: 0.98 },
    { id: 'w42', word: 'eat', punctuatedWord: 'eat', start: 18.709, end: 19.229, confidence: 0.99 },
    { id: 'w43', word: 'huge', punctuatedWord: 'huge', start: 19.229, end: 19.909, confidence: 0.99 },
    { id: 'w44', word: 'bites', punctuatedWord: 'bites', start: 19.909, end: 20.750, confidence: 0.99 },
    { id: 'w45', word: 'until', punctuatedWord: 'until', start: 20.750, end: 20.950, confidence: 0.98 },
    { id: 'w46', word: 'they', punctuatedWord: 'they', start: 20.950, end: 21.229, confidence: 0.98 },
    { id: 'w47', word: 'saw', punctuatedWord: 'saw', start: 21.229, end: 21.399, confidence: 0.99 },
    { id: 'w48', word: 'the', punctuatedWord: 'the', start: 21.399, end: 21.500, confidence: 0.98 },
    { id: 'w49', word: 'witch', punctuatedWord: 'witch.', start: 21.500, end: 22.730, confidence: 0.99 },

    { id: 'w50', word: 'Then', punctuatedWord: 'Then', start: 22.730, end: 23.765, confidence: 0.99 },
    { id: 'w51', word: 'they', punctuatedWord: 'they', start: 23.765, end: 23.889, confidence: 0.98 },
    { id: 'w52', word: 'scurried', punctuatedWord: 'scurried', start: 23.889, end: 24.450, confidence: 0.99 },
    { id: 'w53', word: 'through', punctuatedWord: 'through', start: 24.450, end: 24.610, confidence: 0.98 },
    { id: 'w54', word: 'the', punctuatedWord: 'the', start: 24.610, end: 24.770, confidence: 0.98 },
    { id: 'w55', word: 'forest', punctuatedWord: 'forest', start: 24.770, end: 25.409, confidence: 0.99 },
    { id: 'w56', word: 'away', punctuatedWord: 'away', start: 25.409, end: 25.770, confidence: 0.99 },
    { id: 'w57', word: 'from', punctuatedWord: 'from', start: 25.770, end: 25.889, confidence: 0.98 },
    { id: 'w58', word: 'the', punctuatedWord: 'the', start: 25.889, end: 25.930, confidence: 0.97 },
    { id: 'w59', word: 'witch', punctuatedWord: 'witch.', start: 25.930, end: 26.950, confidence: 0.99 },

    { id: 'w60', word: 'They', punctuatedWord: 'They', start: 26.950, end: 27.559, confidence: 0.99 },
    { id: 'w61', word: 'ran', punctuatedWord: 'ran', start: 27.559, end: 27.959, confidence: 0.99 },
    { id: 'w62', word: 'home', punctuatedWord: 'home', start: 27.959, end: 28.219, confidence: 0.99 },
    { id: 'w63', word: 'to', punctuatedWord: 'to', start: 28.219, end: 28.399, confidence: 0.98 },
    { id: 'w64', word: 'their', punctuatedWord: 'their', start: 28.399, end: 28.680, confidence: 0.98 },
    { id: 'w65', word: 'dad', punctuatedWord: 'dad,', start: 28.680, end: 29.180, confidence: 0.99 },
    { id: 'w66', word: 'who', punctuatedWord: 'who', start: 29.180, end: 29.440, confidence: 0.98 },
    { id: 'w67', word: 'scooped', punctuatedWord: 'scooped', start: 29.440, end: 30.030, confidence: 0.99 },
    { id: 'w68', word: 'them', punctuatedWord: 'them', start: 30.030, end: 30.190, confidence: 0.98 },
    { id: 'w69', word: 'up', punctuatedWord: 'up', start: 30.190, end: 30.350, confidence: 0.99 },
    { id: 'w70', word: 'in', punctuatedWord: 'in', start: 30.350, end: 30.479, confidence: 0.98 },
    { id: 'w71', word: 'his', punctuatedWord: 'his', start: 30.479, end: 30.709, confidence: 0.98 },
    { id: 'w72', word: 'arms', punctuatedWord: 'arms.', start: 30.709, end: 31.690, confidence: 0.99 },

    { id: 'w73', word: 'The', punctuatedWord: 'The', start: 31.690, end: 32.009, confidence: 0.99 },
    { id: 'w74', word: 'kids', punctuatedWord: 'kids', start: 32.009, end: 32.240, confidence: 0.99 },
    { id: 'w75', word: 'were', punctuatedWord: 'were', start: 32.240, end: 32.439, confidence: 0.98 },
    { id: 'w76', word: 'not', punctuatedWord: 'not', start: 32.439, end: 32.669, confidence: 0.99 },
    { id: 'w77', word: 'harmed', punctuatedWord: 'harmed.', start: 32.669, end: 33.555, confidence: 0.99 },

    { id: 'w78', word: 'Nothing', punctuatedWord: 'Nothing', start: 33.555, end: 34.279, confidence: 0.99 },
    { id: 'w79', word: 'was', punctuatedWord: 'was', start: 34.279, end: 34.479, confidence: 0.98 },
    { id: 'w80', word: 'as', punctuatedWord: 'as', start: 34.479, end: 34.880, confidence: 0.98 },
    { id: 'w81', word: 'sweet', punctuatedWord: 'sweet', start: 34.880, end: 35.080, confidence: 0.99 },
    { id: 'w82', word: 'as', punctuatedWord: 'as', start: 35.080, end: 35.319, confidence: 0.98 },
    { id: 'w83', word: 'being', punctuatedWord: 'being', start: 35.319, end: 35.680, confidence: 0.99 },
    { id: 'w84', word: 'home', punctuatedWord: 'home.', start: 35.680, end: 36.119, confidence: 0.99 }
  ],
  sentences: [
    { id: 's1', text: 'Far in the dark forest.', start: 0.825, end: 3.939, wordIndices: [0, 1, 2, 3, 4] },
    { id: 's2', text: 'One day far in the dark forest, Hansel and Gretel saw a cute house made of sweets.', start: 3.939, end: 10.735, wordIndices: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] },
    { id: 's3', text: 'They were delighted.', start: 10.735, end: 12.654, wordIndices: [22, 23, 24] },
    { id: 's4', text: 'They did not suspect it was a trap set by a witch.', start: 12.654, end: 17.040, wordIndices: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36] },
    { id: 's5', text: 'The kids started to eat huge bites until they saw the witch.', start: 17.040, end: 22.730, wordIndices: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48] },
    { id: 's6', text: 'Then they scurried through the forest away from the witch.', start: 22.730, end: 26.950, wordIndices: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58] },
    { id: 's7', text: 'They ran home to their dad, who scooped them up in his arms.', start: 26.950, end: 31.690, wordIndices: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71] },
    { id: 's8', text: 'The kids were not harmed.', start: 31.690, end: 33.555, wordIndices: [72, 73, 74, 75, 76] },
    { id: 's9', text: 'Nothing was as sweet as being home.', start: 33.555, end: 36.119, wordIndices: [77, 78, 79, 80, 81, 82, 83] }
  ]
};

export const SAMPLE_TECH_SPEECH: TranscriptionResult = {
  metadata: {
    audioName: 'AI Studio Tech Intro.mp3',
    duration: 14.500,
    language: 'English (en)',
    wordCount: 32,
    sentenceCount: 3,
    createdAt: new Date().toISOString(),
    format: 'Audio/WAV'
  },
  words: [
    { id: 'tw1', word: 'Welcome', punctuatedWord: 'Welcome', start: 0.120, end: 0.650, confidence: 0.99 },
    { id: 'tw2', word: 'to', punctuatedWord: 'to', start: 0.650, end: 0.800, confidence: 0.99 },
    { id: 'tw3', word: 'the', punctuatedWord: 'the', start: 0.800, end: 0.950, confidence: 0.99 },
    { id: 'tw4', word: 'future', punctuatedWord: 'future', start: 0.950, end: 1.400, confidence: 0.99 },
    { id: 'tw5', word: 'of', punctuatedWord: 'of', start: 1.400, end: 1.550, confidence: 0.99 },
    { id: 'tw6', word: 'video', punctuatedWord: 'video', start: 1.550, end: 1.950, confidence: 0.99 },
    { id: 'tw7', word: 'editing', punctuatedWord: 'editing.', start: 1.950, end: 2.600, confidence: 0.99 },

    { id: 'tw8', word: 'Our', punctuatedWord: 'Our', start: 3.100, end: 3.350, confidence: 0.98 },
    { id: 'tw9', word: 'advanced', punctuatedWord: 'advanced', start: 3.350, end: 3.900, confidence: 0.99 },
    { id: 'tw10', word: 'AI', punctuatedWord: 'AI', start: 3.900, end: 4.250, confidence: 0.99 },
    { id: 'tw11', word: 'converts', punctuatedWord: 'converts', start: 4.250, end: 4.700, confidence: 0.99 },
    { id: 'tw12', word: 'speech', punctuatedWord: 'speech', start: 4.700, end: 5.150, confidence: 0.99 },
    { id: 'tw13', word: 'into', punctuatedWord: 'into', start: 5.150, end: 5.400, confidence: 0.99 },
    { id: 'tw14', word: 'precise', punctuatedWord: 'precise', start: 5.400, end: 5.950, confidence: 0.99 },
    { id: 'tw15', word: 'word', punctuatedWord: 'word-level', start: 5.950, end: 6.400, confidence: 0.99 },
    { id: 'tw16', word: 'level', punctuatedWord: 'and', start: 6.400, end: 6.650, confidence: 0.99 },
    { id: 'tw17', word: 'sentence', punctuatedWord: 'sentence-wise', start: 6.650, end: 7.300, confidence: 0.99 },
    { id: 'tw18', word: 'timestamps', punctuatedWord: 'timestamps.', start: 7.300, end: 8.200, confidence: 0.99 },

    { id: 'tw19', word: 'Export', punctuatedWord: 'Export', start: 8.800, end: 9.300, confidence: 0.99 },
    { id: 'tw20', word: 'seamlessly', punctuatedWord: 'seamlessly', start: 9.300, end: 10.050, confidence: 0.99 },
    { id: 'tw21', word: 'to', punctuatedWord: 'to', start: 10.050, end: 10.200, confidence: 0.99 },
    { id: 'tw22', word: 'SRT', punctuatedWord: 'SRT,', start: 10.200, end: 10.700, confidence: 0.99 },
    { id: 'tw23', word: 'VTT', punctuatedWord: 'VTT,', start: 10.700, end: 11.200, confidence: 0.99 },
    { id: 'tw24', word: 'JSON', punctuatedWord: 'JSON,', start: 11.200, end: 11.700, confidence: 0.99 },
    { id: 'tw25', word: 'and', punctuatedWord: 'and', start: 11.700, end: 11.900, confidence: 0.99 },
    { id: 'tw26', word: 'TSV', punctuatedWord: 'TSV', start: 11.900, end: 12.350, confidence: 0.99 },
    { id: 'tw27', word: 'for', punctuatedWord: 'for', start: 12.350, end: 12.500, confidence: 0.99 },
    { id: 'tw28', word: 'Adobe', punctuatedWord: 'Adobe', start: 12.500, end: 12.900, confidence: 0.99 },
    { id: 'tw29', word: 'Premiere', punctuatedWord: 'Premiere,', start: 12.900, end: 13.400, confidence: 0.99 },
    { id: 'tw30', word: 'DaVinci', punctuatedWord: 'DaVinci', start: 13.400, end: 13.900, confidence: 0.99 },
    { id: 'tw31', word: 'Resolve', punctuatedWord: 'Resolve,', start: 13.900, end: 14.300, confidence: 0.99 },
    { id: 'tw32', word: 'and', punctuatedWord: 'and CapCut.', start: 14.300, end: 14.500, confidence: 0.99 }
  ],
  sentences: [
    { id: 'ts1', text: 'Welcome to the future of video editing.', start: 0.120, end: 2.600, wordIndices: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'ts2', text: 'Our advanced AI converts speech into precise word-level and sentence-wise timestamps.', start: 3.100, end: 8.200, wordIndices: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
    { id: 'ts3', text: 'Export seamlessly to SRT, VTT, JSON, and TSV for Adobe Premiere, DaVinci Resolve, and CapCut.', start: 8.800, end: 14.500, wordIndices: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] }
  ]
};

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'hansel_gretel',
    title: 'Hansel & Gretel Story (Sample Attached Format)',
    description: 'Matches the user sample file structure with 84 word timestamps and 9 sentences.',
    duration: 36.119,
    words: SAMPLE_HANSEL_AND_GRETEL.words,
    sentences: SAMPLE_HANSEL_AND_GRETEL.sentences
  },
  {
    id: 'tech_demo',
    title: 'AI Studio Tech Intro',
    description: 'Concise speech sample showcasing high-accuracy software capabilities.',
    duration: 14.5,
    words: SAMPLE_TECH_SPEECH.words,
    sentences: SAMPLE_TECH_SPEECH.sentences
  }
];
