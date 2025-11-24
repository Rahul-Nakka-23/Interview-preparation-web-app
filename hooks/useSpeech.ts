
import { useState, useEffect, useCallback, useRef } from 'react';

// FIX: Add type definitions for the Web Speech API to satisfy TypeScript.
// This is necessary because these properties are not part of the standard DOM typings.
interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Fallback for environments where SpeechRecognition is not available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeech = (onResult: (text: string) => void, onError?: (error: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // This is safe to call even if recognition is not active.
      // We rely on the `onend` event to update the isListening state.
      recognitionRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        onResult(transcript);
        stopListening();
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup to avoid memory leaks
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, [onResult, stopListening, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error: any) {
        console.error("Speech recognition error:", error);
        if (onError) {
          // DOMException names for permission errors vary across browsers.
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              onError('Microphone permission denied. Please allow microphone access in your browser settings.');
          } else {
              onError('Speech recognition failed to start. Please check your microphone.');
          }
        }
        // Reset state on error
        setIsListening(false);
      }
    }
  }, [isListening, onError]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech to prevent overlap
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) {
          onEnd();
        }
      };
      speechSynthesis.speak(utterance);
    } else {
      console.warn('SpeechSynthesis API not supported in this browser.');
    }
  }, []);
  
  return { isListening, isSpeaking, startListening, stopListening, speak };
};
