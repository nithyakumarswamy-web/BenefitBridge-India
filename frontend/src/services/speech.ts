import { SupportedLanguage } from '../types';

const BROWSER_LANG_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

// Global audio element to prevent overlapping speech
let currentAudio: HTMLAudioElement | null = null;

// Speech queue state for chunked sequential playback
let speechQueue: string[] = [];
let currentChunkIndex = 0;
let isSpeakingActive = false;
let isPausedState = false;
let currentLanguage: SupportedLanguage = 'en';
let onSpeechEndCallback: (() => void) | null = null;
let onStateChangeCallback: ((state: SpeechState) => void) | null = null;
let fullText = '';

export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentChunk: number;
  totalChunks: number;
  isLoading: boolean;
}

/**
 * Cleans markdown formatting from text while preserving words and punctuation.
 * Removes *, #, `, >, |, ---, ===, []() links but keeps link text.
 */
function cleanMarkdown(text: string): string {
  let cleaned = text
    // Remove markdown links but keep the label text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headers (##, ###, etc.) but keep text
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Remove underscores used for emphasis
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    // Remove code backticks
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Remove blockquote markers
    .replace(/^>\s*/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove bullet markers (-, *, •) at start of lines
    .replace(/^[\s]*[-*•]\s+/gm, '')
    // Remove numbered list markers
    .replace(/^[\s]*\d+[.)]\s+/gm, '')
    // Remove pipe tables
    .replace(/\|/g, ',')
    // Collapse multiple whitespace/newlines
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Splits text into speakable chunks of approximately maxLen characters,
 * breaking on sentence boundaries (., !, ?, ;) or commas where possible.
 * Ensures no chunk is too large for the browser speech API to handle.
 */
function splitIntoChunks(text: string, maxLen: number = 180): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to find a sentence boundary (. ! ? ;) within maxLen
    let splitIdx = -1;
    const searchRegion = remaining.substring(0, maxLen);

    // Look for sentence-ending punctuation (last occurrence within maxLen)
    for (let i = searchRegion.length - 1; i >= Math.min(40, searchRegion.length / 3); i--) {
      const ch = searchRegion[i];
      if (ch === '.' || ch === '!' || ch === '?' || ch === ';') {
        // Make sure it's not a decimal point (e.g. "2.5")
        if (ch === '.' && i > 0 && i < searchRegion.length - 1) {
          const before = searchRegion[i - 1];
          const after = searchRegion[i + 1];
          if (before >= '0' && before <= '9' && after >= '0' && after <= '9') {
            continue; // skip decimal points
          }
        }
        splitIdx = i + 1;
        break;
      }
    }

    // Fallback: split at comma
    if (splitIdx === -1) {
      for (let i = searchRegion.length - 1; i >= 40; i--) {
        if (searchRegion[i] === ',') {
          splitIdx = i + 1;
          break;
        }
      }
    }

    // Last fallback: split at space
    if (splitIdx === -1) {
      const lastSpace = searchRegion.lastIndexOf(' ');
      splitIdx = lastSpace > 20 ? lastSpace : maxLen;
    }

    const chunk = remaining.substring(0, splitIdx).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    remaining = remaining.substring(splitIdx).trim();
  }

  return chunks.filter(c => c.length > 0);
}

function emitState(isLoading = false) {
  onStateChangeCallback?.({
    isSpeaking: isSpeakingActive,
    isPaused: isPausedState,
    currentChunk: currentChunkIndex,
    totalChunks: speechQueue.length,
    isLoading,
  });
}

function speakNextChunk() {
  if (!isSpeakingActive || isPausedState) return;

  if (currentChunkIndex >= speechQueue.length) {
    // All chunks complete
    isSpeakingActive = false;
    isPausedState = false;
    emitState();
    onSpeechEndCallback?.();
    return;
  }

  const chunkText = speechQueue[currentChunkIndex];
  if (!chunkText) {
    currentChunkIndex++;
    speakNextChunk();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(chunkText);
  utterance.lang = BROWSER_LANG_CODES[currentLanguage] || 'en-IN';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try finding best matching Indian voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = BROWSER_LANG_CODES[currentLanguage];
  const matchedVoice = voices.find((v) => v.lang.startsWith(langCode) || v.lang.startsWith(currentLanguage));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    currentChunkIndex++;
    emitState();
    // Small delay between chunks to prevent overlap/stuttering
    setTimeout(() => speakNextChunk(), 80);
  };

  utterance.onerror = (event) => {
    console.warn('SpeechSynthesis chunk error:', event.error);
    // On error, try next chunk
    currentChunkIndex++;
    emitState();
    setTimeout(() => speakNextChunk(), 100);
  };

  emitState();
  window.speechSynthesis.speak(utterance);
}


export const speechService = {
  isRecognitionSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  },

  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  },

  startListening(
    language: SupportedLanguage,
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser. Please use text input.');
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = BROWSER_LANG_CODES[language] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const text = event.results[0][0].transcript;
          onResult(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning/error:', event.error);
        onError(event.error || 'Speech recognition failed');
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();
      return recognition;
    } catch (err: any) {
      onError(err.message || 'Could not start microphone');
      return null;
    }
  },

  /**
   * Speaks the ENTIRE text by chunking and playing sequentially.
   * Primary: Sarvam AI audio (single base64 URL) if provided.
   * Fallback: Browser Web Speech API with queue-based chunking for full text.
   *
   * IMPORTANT: This function speaks ALL text, not just the first sentence.
   */
  async speakText(
    text: string,
    language: SupportedLanguage,
    onEnd?: () => void,
    audioUrl?: string | null,
    onStateChange?: (state: SpeechState) => void
  ) {
    // Cancel any previous speech immediately
    this.stopSpeaking();

    fullText = text;
    currentLanguage = language;
    onSpeechEndCallback = onEnd || null;
    onStateChangeCallback = onStateChange || null;

    // 1. If Sarvam AI audio data is provided, play directly with HTML5 Audio
    if (audioUrl) {
      try {
        isSpeakingActive = true;
        emitState(true);

        const audio = new Audio(audioUrl);
        currentAudio = audio;
        audio.onended = () => {
          currentAudio = null;
          isSpeakingActive = false;
          emitState();
          onEnd?.();
        };
        audio.onerror = () => {
          currentAudio = null;
          // Fall back to browser speech synthesis for the full text
          this._startChunkedSpeech(text, language);
        };
        await audio.play();
        emitState();
        return;
      } catch (e) {
        console.warn('Audio playback error, falling back to chunked speech synthesis:', e);
      }
    }

    // 2. Fallback to Web Speech API with full-text chunking
    this._startChunkedSpeech(text, language);
  },

  /**
   * Internal: Starts chunked sequential speech for the entire text.
   * Cleans markdown, splits into manageable chunks, and plays them in order.
   */
  _startChunkedSpeech(text: string, language: SupportedLanguage) {
    if (!this.isSynthesisSupported()) {
      onSpeechEndCallback?.();
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown and prepare full text for speech
    const cleanedText = cleanMarkdown(text);
    if (!cleanedText) {
      onSpeechEndCallback?.();
      return;
    }

    // Split the ENTIRE cleaned text into chunks (no truncation)
    speechQueue = splitIntoChunks(cleanedText, 180);
    currentChunkIndex = 0;
    isSpeakingActive = true;
    isPausedState = false;

    emitState();
    speakNextChunk();
  },

  /** Pause speech (works with Web Speech API) */
  pauseSpeaking() {
    if (isSpeakingActive && !isPausedState) {
      isPausedState = true;
      if (this.isSynthesisSupported()) {
        window.speechSynthesis.pause();
      }
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
      }
      emitState();
    }
  },

  /** Resume speech (works with Web Speech API) */
  resumeSpeaking() {
    if (isSpeakingActive && isPausedState) {
      isPausedState = false;
      if (this.isSynthesisSupported()) {
        window.speechSynthesis.resume();
      }
      if (currentAudio && currentAudio.paused) {
        currentAudio.play().catch(() => {});
      }
      emitState();
    }
  },

  /** Replay from the beginning */
  replaySpeaking() {
    if (fullText) {
      this.stopSpeaking();
      setTimeout(() => {
        this._startChunkedSpeech(fullText, currentLanguage);
      }, 100);
    }
  },

  /** Stop all speech immediately */
  stopSpeaking() {
    isSpeakingActive = false;
    isPausedState = false;
    speechQueue = [];
    currentChunkIndex = 0;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    emitState();
  },

  /** Get current speech state */
  getState(): SpeechState {
    return {
      isSpeaking: isSpeakingActive,
      isPaused: isPausedState,
      currentChunk: currentChunkIndex,
      totalChunks: speechQueue.length,
      isLoading: false,
    };
  },
};
