
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlobFromFloat32 } from '../utils/audio';
import { decryptKey } from '../utils/secure';
import { Message, FridayStatus, UserProfile, Attachment } from '../types';
import Visualizer, { VisualizerMode } from './Visualizer';
import DropZone from './DropZone';
import { saveSession } from '../services/db';

const LIVE_MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const VISION_MODEL_NAME = 'gemini-3-flash-preview';

interface FridayAgentProps {
  userProfile: UserProfile;
}

const FridayAgent: React.FC<FridayAgentProps> = ({ userProfile }) => {
  const [sessionId] = useState(`session-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<FridayStatus>({
    isConnected: false, isListening: false, isThinking: false, isSpeaking: false,
  });
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [fridayTranscript, setFridayTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<boolean>(false);

  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; inputNode: GainNode; outputNode: GainNode; analyzer: AnalyserNode; } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messages.length > 0) {
        saveSession({
            id: sessionId,
            timestamp: new Date(),
            summary: messages[messages.length - 1].text.substring(0, 60),
            messages: messages
        }).catch(err => console.error("Memory Core Write Failure:", err));
    }
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sessionId]);

  useEffect(() => { return () => stopSession(); }, []);

  const getVisualizerMode = (): VisualizerMode => {
    if (processingFile) return 'thinking';
    if (!status.isConnected) return 'idle';
    if (status.isSpeaking) return 'speaking';
    if (status.isThinking) return 'thinking';
    if (status.isListening) return 'listening';
    return 'idle';
  };

  const initAudio = async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.input.state === 'suspended') await audioContextRef.current.input.resume();
      if (audioContextRef.current.output.state === 'suspended') await audioContextRef.current.output.resume();
      return;
    }
    try {
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputNode = inputAudioContext.createGain();
      const outputNode = outputAudioContext.createGain();
      const analyzer = outputAudioContext.createAnalyser();
      analyzer.fftSize = 2048; 
      analyzer.smoothingTimeConstant = 0.5;
      outputNode.connect(analyzer);
      outputNode.connect(outputAudioContext.destination);
      audioContextRef.current = { input: inputAudioContext, output: outputAudioContext, inputNode, outputNode, analyzer };
    } catch (e) { throw new Error("Vocal core synchronization failed."); }
  };

  const startSession = async () => {
    setError(null);
    try {
      const encryptedKey = process.env.API_KEY;
      if (!encryptedKey) throw new Error("ERR_ENV_MISSING: API_KEY not found in environment.");
      const apiKey = decryptKey(encryptedKey);
      await initAudio();
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL_NAME,
        callbacks: {
          onopen: () => {
            setStatus(prev => ({ ...prev, isConnected: true, isListening: true, isThinking: false }));
            const source = audioContextRef.current!.input.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.input.createScriptProcessor(2048, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlobFromFloat32(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmBlob, mimeType: 'audio/pcm;rate=16000' } });
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.input.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setCurrentTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
              setStatus(prev => ({ ...prev, isListening: true }));
            }
            if (message.serverContent?.turnComplete) {
               setStatus(prev => ({ ...prev, isThinking: true }));
               setMessages(prev => [
                 ...prev,
                 { id: Date.now().toString(), role: 'user', text: currentTranscript || "[Vocal Command]", timestamp: new Date() },
                 { id: (Date.now() + 1).toString(), role: 'friday', text: fridayTranscript, timestamp: new Date() }
               ]);
               setCurrentTranscript('');
               setFridayTranscript('');
            }
            if (message.serverContent?.outputTranscription) {
              setFridayTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
              setStatus(prev => ({ ...prev, isThinking: false })); 
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus(prev => ({ ...prev, isSpeaking: true, isThinking: false }));
              const ctx = audioContextRef.current!.output;
              if (nextStartTimeRef.current < ctx.currentTime) nextStartTimeRef.current = ctx.currentTime + 0.05;
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current!.outputNode);
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                    nextStartTimeRef.current = 0;
                    setStatus(prev => ({ ...prev, isSpeaking: false, isListening: true }));
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus(prev => ({ ...prev, isSpeaking: false, isListening: true, isThinking: false }));
            }
          },
          onerror: (e: any) => {
            setError("LINK_ERROR: Neural bridge compromised.");
            setStatus(prev => ({ ...prev, isConnected: false }));
          },
          onclose: () => setStatus(prev => ({ ...prev, isConnected: false, isListening: false }))
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are FRIDAY (Female Replacement Intelligent Digital Assistant Youth), a highly advanced AI. Be concise, intelligent, and helpful. Current user: ${userProfile.name}.`
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err: any) {
      setError(err.message || "INITIALIZATION_FAILURE");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) { sessionRef.current.then((s: any) => s.close()); sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    setStatus(prev => ({ ...prev, isConnected: false, isListening: false, isSpeaking: false, isThinking: false }));
  };

  const handleFileUpload = async (file: File) => {
    if (!status.isConnected) { setError("ERR: Bridge offline. Initialize first."); return; }
    setProcessingFile(true);
    // Mock processing for now, real implementation would follow
    setTimeout(() => setProcessingFile(false), 2000); 
  };

  const mode = getVisualizerMode();

  return (
    <DropZone onFileAccepted={handleFileUpload} isProcessing={processingFile}>
    <div className="flex flex-col h-full bg-[#030303] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group">
      
      {/* Top Status Bar */}
      <div className="p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${status.isConnected ? 'bg-cyan-400 shadow-[0_0_10px_#00d4ff]' : 'bg-red-500/50'}`}></div>
          <div className="flex flex-col">
            <h2 className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase font-mono">FRIDAY CORE</h2>
            <span className="text-[8px] text-white/20 tracking-widest uppercase">
                {mode === 'idle' ? 'STANDBY' : mode.toUpperCase()}
            </span>
          </div>
        </div>
        <button 
          onClick={status.isConnected ? stopSession : startSession}
          className={`px-6 py-2 rounded-full font-bold transition-all text-[10px] uppercase tracking-widest border backdrop-blur-md ${status.isConnected ? 'border-red-500/30 text-red-400 hover:bg-red-950/30' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30'}`}
        >
          {status.isConnected ? 'DISCONNECT' : 'INITIALIZE'}
        </button>
      </div>

      {/* Main Visualizer Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        {/* Background Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${mode === 'speaking' ? 'bg-[#ffcc00]/10' : mode === 'thinking' ? 'bg-purple-500/10' : 'bg-cyan-500/5'}`}></div>
        
        {/* The Orb */}
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center z-10">
            <Visualizer 
              analyzer={audioContextRef.current?.analyzer || null} 
              mode={mode}
            />
        </div>

        {/* Floating Captions */}
        <div className="absolute bottom-12 w-full max-w-2xl text-center min-h-[4rem] z-20 px-8">
          {fridayTranscript ? (
            <p className="text-xl md:text-2xl font-light text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 duration-500">
                {fridayTranscript}
            </p>
          ) : currentTranscript ? (
            <p className="text-lg text-cyan-400/80 italic font-mono animate-pulse">
                {currentTranscript}...
            </p>
          ) : (
            <div className={`transition-opacity duration-1000 ${status.isConnected ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 animate-pulse">Listening for input</p>
            </div>
          )}
        </div>
      </div>

      {/* Compact Chat Log (Collapsed Terminal Style) */}
      <div className="h-40 bg-[#080808]/90 border-t border-white/5 backdrop-blur-xl relative flex flex-col font-mono text-[10px]">
        <div className="px-6 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <span className="text-white/30 font-bold uppercase tracking-widest">Neural Log</span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
            {messages.length === 0 && <div className="text-white/10 italic text-center mt-4">System Initialized. Awaiting Interaction.</div>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'text-white/50' : msg.role === 'system' ? 'text-cyan-500/70' : 'text-[#ffcc00]/70'}`}>
                 <span className="font-bold shrink-0 w-12">{msg.role === 'user' ? 'USER' : 'AI'}</span>
                 <span className="flex-1 leading-relaxed">{msg.text}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500/30 text-red-200 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg">
            <span className="w-2 h-2 bg-red-500 animate-pulse rounded-full"></span>
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:text-white">×</button>
        </div>
      )}
    </div>
    </DropZone>
  );
};

export default FridayAgent;
