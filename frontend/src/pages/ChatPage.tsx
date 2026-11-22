import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { speechService, SpeechState } from '../services/speech';
import { ChatMessage, Scheme } from '../types';
import { LanguageSelector } from '../components/LanguageSelector';
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ExternalLink,
  ArrowRight,
  FileText,
  AlertCircle,
  RotateCcw,
  Pause,
  Play,
  Square,
  RefreshCw,
} from 'lucide-react';

interface ChatPageProps {
  initialPrompt?: string;
  onOpenVoice: () => void;
  onCheckEligibility?: (schemeId: number) => void;
  onOpenActionPlan?: (schemeId: number) => void;
  onOpenDocuments?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialPrompt,
  onOpenVoice,
  onCheckEligibility,
  onOpenActionPlan,
  onOpenDocuments,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { profile } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionUuid, setSessionUuid] = useState<string>('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>({
    isSpeaking: false,
    isPaused: false,
    currentChunk: 0,
    totalChunks: 0,
    isLoading: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts per language
  const PROMPTS_BY_LANG: Record<string, string[]> = {
    kn: [
      'ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?',
      'ನಾನು ಕರ್ನಾಟಕದ ರೈತ. ನನಗೆ ಸಿಗುವ ಪ್ರಯೋಜನಗಳು ಯಾವುವು?',
      'ಕಾಲೇಜು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಯಾವ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳಿವೆ?',
      'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?'
    ],
    hi: [
      'मेरे लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?',
      'पीएम-किसान योजना के लिए क्या पात्रता है?',
      'कॉलेज छात्रों के लिए छात्रवृत्ति योजनाएं बताएं',
      'आयुष्मान भारत योजना के तहत मुफ्त इलाज कैसे पाएं?'
    ],
    ta: [
      'எனக்கு என்னென்ன அரசு திட்டங்கள் கிடைக்கின்றன?',
      'விவசாயிகளுக்கான அரசு திட்டங்கள் என்னென்ன?',
      'மகளிர் உரிமைத் திட்டத்திற்கு எப்படி விண்ணப்பிப்பது?'
    ],
    te: [
      'నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?',
      'రైతులకు అందుబాటులో ఉన్న సంక్షేమ పథకాలు ఏవి?',
      'విద్యార్థుల స్కాలర్‌షిప్ వివరాలు తెలపండి'
    ],
    ml: [
      'എനിക്ക് ലഭ്യമായ സർക്കാർ പദ്ധതികൾ ഏതൊക്കെയാണ്?',
      'കർഷകർക്കുള്ള പ്രധാന ആനുകൂല്യങ്ങൾ എന്തൊക്കെയാണ്?'
    ],
    mr: [
      'माझ्यासाठी कोणत्या सरकारी योजना उपलब्ध आहेत?',
      'शेतकऱ्यांसाठी कोणत्या योजना उपलब्ध आहेत?'
    ],
    en: [
      'Which government schemes can I apply for?',
      'I am a farmer from Karnataka. What benefits can I get?',
      'Are there scholarships for college students?',
      'How can my family apply for housing assistance?'
    ]
  };

  const suggestedPrompts = PROMPTS_BY_LANG[language] || PROMPTS_BY_LANG['en'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeContent =
        language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು ಬೆನಿಫಿಟ್ ಬ್ರಿಡ್ಜ್ ಇಂಡಿಯಾ. ಭಾರತ ಸರ್ಕಾರದ ಮತ್ತು ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು, ಅರ್ಹತೆ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯ ಕುರಿತು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಕೆಳಗಿನ ಸೂಚಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಬಹುದು.'
          : language === 'hi'
          ? 'नमस्ते! मैं बेनिफिटब्रिज इंडिया हूँ। सरकारी कल्याणकारी योजनाओं, पात्रता और आवेदन प्रक्रिया में आपकी सहायता करने के लिए यहाँ हूँ। आप बोलकर या लिखकर प्रश्न पूछ सकते हैं।'
          : 'Hello! I am BenefitBridge India, your AI guide to government welfare schemes. Ask me anything about eligibility, benefits, or documents for central and state schemes.';

      setMessages([
        {
          role: 'assistant',
          content: welcomeContent,
          language: language,
          suggested_questions: suggestedPrompts,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [language]);

  // If initialPrompt passed, trigger send
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Stop any ongoing speech when sending a new message
    speechService.stopSpeaking();
    setSpeakingIdx(null);

    setInput('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      language: language,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage({
        message: query,
        session_uuid: sessionUuid || undefined,
        language: language,
      });

      setMessages((prev) => [...prev, response]);

      // CRITICAL FIX: Send the FULL response text to TTS, NOT just split('\n')[0]
      const fullResponseText = response.content;
      const replyLang = (response.language || language) as any;

      // Attempt backend Sarvam TTS synthesis with full text
      try {
        const synthRes = await api.synthesizeVoice({
          text: fullResponseText,
          language: replyLang,
        });
        const newIdx = messages.length + 1; // userMsg + response
        setSpeakingIdx(newIdx);
        speechService.speakText(
          fullResponseText,
          replyLang,
          () => setSpeakingIdx(null),
          synthRes.audio_url,
          (state) => setSpeechState(state)
        );
      } catch (synthErr) {
        // Fall back directly to client SpeechSynthesis with full text
        const newIdx = messages.length + 1;
        setSpeakingIdx(newIdx);
        speechService.speakText(
          fullResponseText,
          replyLang,
          () => setSpeakingIdx(null),
          null,
          (state) => setSpeechState(state)
        );
      }
    } catch (err) {
      console.error('Chat send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            language === 'kn'
              ? 'ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'
              : 'Sorry, there was an issue processing your request. Please try again.',
          language: language,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    speechService.stopSpeaking();
    setMessages([]);
    setSpeakingIdx(null);
  };

  /**
   * CRITICAL FIX: Speaks the FULL message text, not just split('\n')[0]
   */
  const handleToggleSpeak = async (idx: number, text: string, msgLang?: string) => {
    if (speakingIdx === idx) {
      // If already speaking this message, stop it
      speechService.stopSpeaking();
      setSpeakingIdx(null);
      return;
    }

    // Stop any previous speech first
    speechService.stopSpeaking();
    setSpeakingIdx(idx);

    const targetLang = (msgLang || language) as any;
    // Send the FULL text, cleaned of markdown by speechService internally
    const fullMsgText = text;

    try {
      const synthRes = await api.synthesizeVoice({
        text: fullMsgText,
        language: targetLang,
      });
      speechService.speakText(
        fullMsgText,
        targetLang,
        () => setSpeakingIdx(null),
        synthRes.audio_url,
        (state) => setSpeechState(state)
      );
    } catch {
      speechService.speakText(
        fullMsgText,
        targetLang,
        () => setSpeakingIdx(null),
        null,
        (state) => setSpeechState(state)
      );
    }
  };

  const handlePause = () => speechService.pauseSpeaking();
  const handleResume = () => speechService.resumeSpeaking();
  const handleReplay = () => speechService.replaySpeaking();
  const handleStopSpeech = () => {
    speechService.stopSpeaking();
    setSpeakingIdx(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      {/* Chat Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-none">
                BenefitBridge AI Assistant
              </h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Deterministic RAG Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Profile: {profile?.occupation || 'Citizen'} • {profile?.state || 'India'} (
              {profile?.residence_type || 'Rural'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={t('chat.clearChat')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-6 shadow-xs">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isCurrentlySpeaking = speakingIdx === idx;
          return (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 sm:p-5 space-y-3 ${
                  isUser
                    ? 'bg-blue-800 text-white rounded-tr-xs shadow-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-xs'
                }`}
              >
                {/* Message Header with TTS controls for Assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      BenefitBridge AI Guide
                    </span>
                    <div className="flex items-center gap-1">
                      {isCurrentlySpeaking ? (
                        <>
                          {/* Speaking indicator */}
                          <span className="text-[10px] text-blue-600 font-medium mr-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                            {speechState.isPaused ? 'Paused' : `Speaking ${speechState.currentChunk + 1}/${speechState.totalChunks || '...'}`}
                          </span>

                          {/* Pause / Resume */}
                          {speechState.isPaused ? (
                            <button
                              onClick={handleResume}
                              className="p-1 rounded text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Resume"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={handlePause}
                              className="p-1 rounded text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Pause"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Replay */}
                          <button
                            onClick={handleReplay}
                            className="p-1 rounded text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Replay from start"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Stop */}
                          <button
                            onClick={handleStopSpeech}
                            className="p-1 rounded text-rose-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Stop speaking"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleToggleSpeak(idx, msg.content, msg.language)}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-blue-100/60 hover:bg-blue-200/60 px-2 py-0.5 rounded transition-all cursor-pointer"
                          title="Listen to entire response"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Hear Response</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.content}
                </div>

                {/* Structured Scheme Recommendation Cards if present */}
                {msg.recommended_schemes && msg.recommended_schemes.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/70 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      {t('chat.recommendedSchemes')}
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.recommended_schemes.slice(0, 3).map((rec: any, rIdx: number) => {
                        const isPassed = rec.eligibility_status === 'PASSED';
                        const isFailed = rec.eligibility_status === 'FAILED';
                        const isUnknown = rec.eligibility_status === 'UNKNOWN';

                        return (
                          <div
                            key={rIdx}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-blue-700 uppercase">
                                  {rec.authority}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm">{rec.name}</h4>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                                  isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isFailed
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isPassed && <CheckCircle2 className="w-3 h-3" />}
                                {isFailed && <XCircle className="w-3 h-3" />}
                                {isUnknown && <HelpCircle className="w-3 h-3" />}
                                {isPassed ? 'PASSED' : isFailed ? 'FAILED' : 'INFO MISSING'}
                              </span>
                            </div>

                            <p className="text-emerald-900 font-semibold bg-emerald-50 p-2 rounded-lg">
                              Benefit: {rec.benefits}
                            </p>

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {onCheckEligibility && (
                                <button
                                  onClick={() => onCheckEligibility(rec.id)}
                                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                  {t('chat.checkEligibility')}
                                </button>
                              )}
                              {onOpenActionPlan && (
                                <button
                                  onClick={() => onOpenActionPlan(rec.id)}
                                  className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                                >
                                  {t('chat.generatePlan')}
                                </button>
                              )}
                              {rec.official_apply_url && (
                                <a
                                  href={rec.official_apply_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                                >
                                  <span>{t('chat.officialLink')}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2">Searching schemes & evaluating eligibility...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
        </span>
        {suggestedPrompts.map((p, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSendMessage(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 font-medium whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center gap-2">
        <button
          onClick={onOpenVoice}
          className="p-2.5 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-blue-50 transition-all cursor-pointer"
          title="Voice Assistant (Speak in any language)"
        >
          <Mic className="w-5 h-5 text-blue-700" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={t('chat.placeholder')}
          className="flex-1 text-sm bg-transparent px-2 py-1 focus:outline-none text-slate-800 placeholder:text-slate-400"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all shadow-xs cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
