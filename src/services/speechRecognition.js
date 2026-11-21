/**
 * Speech Recognition Wrapper for Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * Strictly conforms to native browser capabilities without simulation.
 */

export function isSpeechSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
  }

  start({
    language = 'en-IN',
    onStart,
    onResult,
    onError,
    onEnd
  }) {
    if (!isSpeechSupported()) {
      if (onError) {
        onError({
          code: 'unsupported_browser',
          message: 'Voice recognition is not supported in this browser. Chrome, Edge, or Safari on desktop/Android are recommended. You can type your complaint directly.'
        });
      }
      return;
    }

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();

      this.recognition.lang = language;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (onResult) {
          onResult({
            final: finalTranscript,
            interim: interimTranscript
          });
        }
      };

      this.recognition.onerror = (event) => {
        let userMessage = 'An error occurred during voice recognition.';

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            userMessage = 'Microphone access denied. Please click the lock or camera/mic icon in your browser address bar and enable microphone permission.';
            break;
          case 'no-speech':
            userMessage = 'No speech was detected. Please try speaking closer to your device microphone.';
            break;
          case 'audio-capture':
            userMessage = 'No microphone device was detected. Please connect a working microphone.';
            break;
          case 'network':
            userMessage = 'Speech recognition service encountered a network error. Ensure internet connection is active for cloud recognition.';
            break;
          case 'aborted':
            userMessage = 'Voice listening was paused.';
            break;
          default:
            userMessage = `Voice recognition error: ${event.error}. You can enter your complaint manually below.`;
        }

        if (onError) {
          onError({
            code: event.error,
            message: userMessage
          });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) {
        onError({
          code: 'init_failed',
          message: `Could not start speech recognition: ${err.message}`
        });
      }
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore already stopped error
      }
      this.isListening = false;
    }
  }
}

export const speechService = new SpeechService();
