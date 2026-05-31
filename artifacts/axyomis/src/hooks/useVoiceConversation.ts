import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';

const SESSION_SECONDS = 30 * 60;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useVoiceConversation(isActive: boolean) {
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [phase, setPhase] = useState('Ready');
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);

  const { studentProfile } = useUser();
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef('');
  const turnsRef = useRef<VoiceTurn[]>([]);
  const isActiveRef = useRef(isActive);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { turnsRef.current = turns; }, [turns]);

  const resumeAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch { /* ignore */ }
  }, []);

  const scheduleListen = useCallback((delay = 500) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (!isActiveRef.current || isThinkingRef.current || isListeningRef.current) return;
      try {
        resumeAudio();
        recognitionRef.current?.start();
      } catch { /* mic busy */ }
    }, delay);
  }, [resumeAudio]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!window.speechSynthesis) {
      onDone?.();
      return;
    }
    const clean = text.replace(/[#*`\[\]]/g, '').replace(/\[YT_SEARCH:.*?\]/gs, '').trim().slice(0, 900);
    if (!clean) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.02;
    utt.pitch = 1.05;
    if (preferredVoiceRef.current) utt.voice = preferredVoiceRef.current;
    utt.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setPhase('Speaking');
    };
    utt.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      onDone?.();
    };
    utt.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      onDone?.();
    };
    window.speechSynthesis.speak(utt);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinkingRef.current) return;
    setIsThinking(true);
    isThinkingRef.current = true;
    setPhase('Thinking');

    const userTurn: VoiceTurn = { id: generateId(), role: 'user', content: text.trim() };
    setTurns(prev => [...prev, userTurn]);

    try {
      const history = [...turnsRef.current, userTurn].slice(-12);
      const studentName = studentProfile?.studentName?.trim();
      const learnerDescription = studentName ? `You are speaking with ${studentName}, a curious learner.` : 'You are speaking with a curious learner.';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are ASTRA, a warm, emotionally intelligent voice tutor created by SAHIL KARNA for Axyomis-X. ${learnerDescription} Reply in 2-4 short spoken sentences. No markdown, no bullet lists, no headings. Be natural, friendly, confident, and reassuring. If asked who created you, say you were built by SAHIL KARNA, founder of Axyomis-X.`,
            },
            ...history.map(t => ({ role: t.role, content: t.content })),
          ],
        }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json() as { reply: string };
      const reply = (data.reply || 'Sorry, I could not process that.').replace(/\[YT_SEARCH:.*?\]/gs, '').trim();
      const assistantTurn: VoiceTurn = { id: generateId(), role: 'assistant', content: reply };
      setTurns(prev => [...prev, assistantTurn]);
      setIsThinking(false);
      isThinkingRef.current = false;
      speak(reply, () => {
        if (isActiveRef.current) scheduleListen(400);
      });
    } catch {
      setIsThinking(false);
      isThinkingRef.current = false;
      const err = 'Something went wrong. Let us try again.';
      speak(err, () => scheduleListen(600));
    }
  }, [speak, scheduleListen, studentProfile]);

  const sendRef = useRef(sendMessage);
  sendRef.current = sendMessage;
  const scheduleRef = useRef(scheduleListen);
  scheduleRef.current = scheduleListen;

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      preferredVoiceRef.current =
        voices.find(v => v.name.includes('Samantha')) ||
        voices.find(v => v.name.toLowerCase().includes('google uk english female')) ||
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setPhase('Listening');
    };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      const display = (finalText || interim).trim();
      setLiveTranscript(display);
      inputRef.current = display;
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      const transcript = inputRef.current.trim();
      inputRef.current = '';
      setLiveTranscript('');
      if (transcript && isActiveRef.current) {
        sendRef.current(transcript);
      } else if (isActiveRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
        scheduleRef.current(800);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      isListeningRef.current = false;
      if (['no-speech', 'aborted', 'audio-capture'].includes(event.error) && isActiveRef.current) {
        scheduleRef.current(1000);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, []);

  const welcomedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      window.speechSynthesis?.cancel();
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      welcomedRef.current = false;
      setTimeLeft(SESSION_SECONDS);
      return;
    }

    resumeAudio();
    setTimeLeft(SESSION_SECONDS);
    sessionTimerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    if (!welcomedRef.current) {
      welcomedRef.current = true;
      setPhase('Initializing');
      const studentName = studentProfile?.studentName?.trim();
      const greeting = studentName
        ? `Hi ${studentName}, I'm Astra — your premium voice tutor from Axyomis-X. I was built by Sahil Karna. What would you like to explore today?`
        : "Hi, I'm Astra — your premium voice tutor from Axyomis-X. I was built by Sahil Karna. What would you like to explore today?";
      speak(greeting, () => scheduleListen(700));
    }

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isActive, resumeAudio, speak, scheduleListen, studentProfile]);

  const orbState: VoiceOrbState = isSpeaking
    ? 'speaking'
    : isThinking
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'idle';

  const startListening = useCallback(() => {
    resumeAudio();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    try {
      recognitionRef.current?.start();
    } catch { /* ignore */ }
  }, [resumeAudio]);

  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsSpeaking(false);
    setIsListening(false);
    setIsThinking(false);
  }, []);

  const lastAssistant = [...turns].reverse().find(t => t.role === 'assistant')?.content || '';

  return {
    turns,
    liveTranscript,
    isListening,
    isSpeaking,
    isThinking,
    phase,
    timeLeft,
    orbState,
    lastAssistant,
    startListening,
    stopAll,
    sessionExpired: timeLeft <= 0,
  };
}
