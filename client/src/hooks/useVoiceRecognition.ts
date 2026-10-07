import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecognitionOptions {
  recordAudio?: boolean;
  continuous?: boolean;
  lang?: string;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const { recordAudio = false, continuous = false, lang = 'en-US' } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition || !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 1. Web Speech API for live transcription (independent of MediaRecorder)
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentTranscript.trim();
          setTranscript(cleaned);
        };

        recognition.onerror = (event: any) => {
          console.warn('[Voice Recognition] Event:', event.error);
          if (event.error === 'no-speech') {
            return;
          }
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access in your browser.');
          } else if (event.error === 'audio-capture') {
            setError('Microphone unavailable or in use by another program.');
          } else if (event.error === 'network') {
            setError('Speech network error. Please verify your connection.');
          } else {
            setError(`Speech input notice: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('[Voice Recognition] Start error:', err);
        setError('Failed to start speech recognition. Please check mic permissions.');
        setIsListening(false);
      }
      return;
    }

    // 2. Fallback: If SpeechRecognition is unsupported, capture audio stream via getUserMedia
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
        setError('Live speech-to-text requires Chrome/Edge. Recording audio stream.');
      } catch (err: any) {
        setError('Microphone permission denied or device not found.');
        setIsListening(false);
      }
    } else {
      setError('Microphone is not supported in this browser environment.');
    }
  }, [continuous, lang]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    audioBlob,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
