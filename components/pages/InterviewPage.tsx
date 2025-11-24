
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useSpeech } from '../../hooks/useSpeech';
import { aiService } from '../../services';
import Button from '../ui/Button';
import MicIcon from '../icons/MicIcon';

const InterviewPage: React.FC = () => {
  const { user, interviewTypes, transcript, addMessageToTranscript, setPage } = useContext(AppContext);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking' | 'finished'>('thinking');
  const [currentAiResponse, setCurrentAiResponse] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUserSpeech = useCallback((text: string) => {
    let image: string | undefined = undefined;
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Flip the image horizontally for a mirror effect
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            image = canvas.toDataURL('image/jpeg');
        }
    }
    addMessageToTranscript({ speaker: 'user', text, image });
    setStatus('thinking');
  }, [addMessageToTranscript]);

  const { isListening, isSpeaking, startListening, stopListening, speak } = useSpeech(handleUserSpeech, setMicError);
  
  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [transcript, currentAiResponse]);
  
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const setupCamera = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            // Optionally, inform the user that camera access is required for full functionality
        }
    };
    setupCamera();

    return () => {
        mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const processStream = useCallback(async (stream: AsyncGenerator<string>) => {
    let fullText = "";
    for await (const chunkText of stream) {
        fullText += chunkText;
        setCurrentAiResponse(fullText);
    }
    return fullText;
  }, []);

  const getNextAiMessage = useCallback(async (message: string) => {
    const maxRetries = 2; // Total attempts will be maxRetries + 1
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const stream = await aiService.streamNextQuestion(message);
        const fullText = await processStream(stream);
        addMessageToTranscript({ speaker: 'ai', text: fullText });
        setCurrentAiResponse('');
        setStatus('speaking');
        speak(fullText, () => setStatus('idle'));
        return; // Success, exit the loop and function
      } catch (error) {
        console.error(`Error getting AI message (Attempt ${attempt + 1}):`, error);
        attempt++;
        if (attempt > maxRetries) {
          const errorMessage = "I'm sorry, I'm having trouble connecting right now. Let's end the interview here and you can review the results so far.";
          addMessageToTranscript({ speaker: 'ai', text: errorMessage });
          setCurrentAiResponse('');
          speak(errorMessage, () => setPage('results'));
        } else {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          setCurrentAiResponse(`I'm having a little trouble connecting. Trying again in a moment...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }, [addMessageToTranscript, processStream, speak, setPage]);

  useEffect(() => {
    if (user && transcript.length === 0 && interviewTypes.length > 0) {
      aiService.startInterviewChat(user.goal, interviewTypes);
      getNextAiMessage("Start the interview.");
    }
  }, [user, transcript.length, getNextAiMessage, interviewTypes]);
  
  useEffect(() => {
    if (status === 'thinking' && transcript.length > 0 && transcript[transcript.length-1].speaker === 'user') {
      const lastUserMessage = transcript[transcript.length-1].text;
      getNextAiMessage(lastUserMessage);
    }
  }, [status, transcript, getNextAiMessage]);


  const handleMicClick = () => {
    setMicError(null); // Clear previous errors on a new attempt
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFinishInterview = () => {
    setStatus('finished');
    setPage('results');
  };

  const interviewTitle = interviewTypes.length > 0 
    ? interviewTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ') + ' Interview'
    : 'Interview';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">{interviewTitle} for: <span className="text-accent">{user?.goal}</span></h2>
      
      <div className="flex-grow bg-secondary rounded-lg p-4 overflow-y-auto mb-4 border border-gray-700 relative">
        {transcript.map((msg, index) => (
          <div key={index} className={`flex mb-4 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.speaker === 'user' ? 'bg-accent text-white' : 'bg-gray-700 text-text-primary'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {currentAiResponse && (
           <div className="flex mb-4 justify-start">
            <div className="rounded-lg px-4 py-2 max-w-sm bg-gray-700 text-text-primary">
              <p>{currentAiResponse}<span className="inline-block w-1 h-4 bg-white ml-1 animate-ping"></span></p>
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
        
        <div className="absolute top-4 right-4 w-40 h-30 md:w-48 md:h-36 z-10">
            <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full rounded-lg object-cover transform -scale-x-100 shadow-lg border-2 border-gray-700"
            ></video>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
         <div className="h-6 text-center">
            {micError ? (
                <p className="text-red-400 text-sm">{micError}</p>
            ) : (
                <p className="text-text-secondary">
                    {isListening && "Listening..."}
                    {isSpeaking && "AI is speaking..."}
                    {status === 'thinking' && "AI is thinking..."}
                </p>
            )}
        </div>
        <div className="flex items-center space-x-4">
            <button
                onClick={handleMicClick}
                disabled={isSpeaking || status === 'thinking'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors
                    ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-accent hover:bg-accent-hover'}
                    disabled:bg-gray-600 disabled:cursor-not-allowed`}
            >
                <MicIcon className="w-8 h-8 text-white" />
            </button>
            <Button onClick={handleFinishInterview} variant="secondary" disabled={transcript.length < 2}>
                Finish Interview
            </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
