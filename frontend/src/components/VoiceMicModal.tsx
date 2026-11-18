import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { speechService } from '../services/speech';
import { Mic, MicOff, Volume2, X, Sparkles, Send, Globe } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface VoiceMicModalProps {
  onClose: () => void;
  onSubmitPrompt: (text: string) => void;
}

export const VoiceMicModal: React.FC<VoiceMicModalProps> = ({ onClose, onSubmitPrompt }) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionObj, setRecognitionObj] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick native language samples for 1-click voice simulation
  const DEMO_SAMPLES: Record<string, string> = {
    kn: 'ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?',
    hi: 'मेरे लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?',
    en: 'Which government schemes can I apply for as a farmer?',
    ta: 'எனக்கு என்னென்ன அரசு திட்டங்கள் கிடைக்கின்றன?',
    te: 'నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?',
    ml: 'എനിക്ക് ലഭ്യമായ സർക്കാർ പദ്ധതികൾ ഏതൊക്കെയാണ്?',
    mr: 'माझ्यासाठी कोणत्या सरकारी योजना उपलब्ध आहेत?',
  };

  const samplePrompt = DEMO_SAMPLES[language] || DEMO_SAMPLES['en'];

  const startListening = () => {
    setErrorMsg(null);
    setIsListening(true);
    setTranscript('');

    const rec = speechService.startListening(
      language,
      (text) => {
        setTranscript(text);
        setIsListening(false);
      },
      (err) => {
        console.warn('Voice listening notice:', err);
        setErrorMsg('Microphone listening timed out or not supported. You can use the quick speech button or text.');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (rec) {
      setRecognitionObj(rec);
    }
  };

  const stopListening = () => {
    if (recognitionObj) {
      recognitionObj.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    startListening();
    return () => {
      if (recognitionObj) {
        recognitionObj.stop();
      }
      speechService.stopSpeaking();
    };
  }, [language]);

  const handleSend = () => {
    const textToSend = transcript.trim() || samplePrompt;
    onSubmitPrompt(textToSend);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Language selector in modal */}
        <div className="mb-6 flex items-center gap-2">
          <LanguageSelector />
        </div>

        {/* Mic Pulse Icon */}
        <div className="relative my-4">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
              <div className="absolute -inset-3 rounded-full bg-blue-500/20 animate-pulse"></div>
            </>
          )}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-tr from-red-500 to-rose-600 text-white scale-105'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-700 text-white hover:scale-105'
            }`}
          >
            {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-10 h-10" />}
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mt-2">
          {isListening ? t('chat.listening') : 'Tap Mic to Speak'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Speak in {language.toUpperCase()} about schemes, eligibility, or documents.
        </p>

        {/* Live Recognized Speech Box */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 text-left min-h-[90px] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Recognized Speech
            </span>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {transcript || (isListening ? 'Listening...' : 'No voice detected yet.')}
            </p>
          </div>

          {/* Quick 1-click native query sample */}
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Quick Prompt:</span>
            <button
              onClick={() => setTranscript(samplePrompt)}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
            >
              "{samplePrompt}"
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-amber-600 mb-2">{errorMsg}</p>
        )}

        {/* Action button */}
        <button
          onClick={handleSend}
          className="w-full mt-2 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Ask AI Assistant Now</span>
        </button>
      </div>
    </div>
  );
};
