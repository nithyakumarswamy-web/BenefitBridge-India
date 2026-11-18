import { SupportedLanguage } from '../types';

const BROWSER_LANG_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
};

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
      onError('Speech recognition is not supported in this browser. Please use text input or standard fallback.');
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

  speakText(text: string, language: SupportedLanguage, onEnd?: () => void) {
    if (!this.isSynthesisSupported()) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    // Clean markdown characters like *, #, etc. for cleaner audio
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = BROWSER_LANG_CODES[language] || 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = BROWSER_LANG_CODES[language];
    const matchedVoice = voices.find((v) => v.lang.startsWith(langCode) || v.lang.startsWith(language));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },
};
