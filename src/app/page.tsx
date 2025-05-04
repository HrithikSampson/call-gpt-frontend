"use client";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

import { motion } from 'framer-motion';
import { useMicVolume } from '@/hooks/useVolume';
import { useEffect, useRef, useState } from 'react';
import { AudioWaveform, Bot } from "lucide-react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  
  const [streamRef,setStreamRef] = useState<MediaStream | null>(null);
  const volume = useMicVolume(streamRef);

  const audioContextRef = useRef<AudioContext | null>(null);
  const [supervisorVolume, setSupervisorVolume] = useState(0);
  const [botVolume, setBotVolume] = useState(0);


  const socket = new WebSocket("ws://localhost:8000");
  const scale = 1 + volume / 100;
  const toggleRecording = () => {
    if (isRecording) {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
        setStreamRef(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        setStreamRef(stream);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        audioContext.resume();
      }).catch((err) => {
        console.error("Failed to access mic:", err);
      });
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  
    const audioContext = audioContextRef.current;
  
    const supervisorGain = audioContext.createGain();
    const llmGain = audioContext.createGain();
  
    const supervisorAnalyser = audioContext.createAnalyser();
    const llmAnalyser = audioContext.createAnalyser();
  
    supervisorGain.connect(supervisorAnalyser);
    supervisorAnalyser.connect(audioContext.destination);
  
    llmGain.connect(llmAnalyser);
    llmAnalyser.connect(audioContext.destination);
  
    const getVolume = (analyser: AnalyserNode): number => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      return data.reduce((a, b) => a + b, 0) / data.length;
    };
  
    let animationFrameId: number;
    const tick = () => {
      setSupervisorVolume(getVolume(supervisorAnalyser));
      setBotVolume(getVolume(llmAnalyser));
      animationFrameId = requestAnimationFrame(tick);
    };
  
    animationFrameId = requestAnimationFrame(tick);
  
    socket.onmessage = (event) => {
      const currentType = event.data.type;
        audioContextRef.current!.decodeAudioData(event.data.audio.slice(0)).then((buffer) => {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = buffer;
          source.connect(currentType === "supervisor" ? supervisorGain : llmGain);
          source.start();
        });
    }
  
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  
  return (
    <>
      <div className="flex pt-10 w-full justify-center">
        <button className="relative block rounded-full border-8 border-amber-50" onClick={() => {
          toggleRecording();
        }}>

          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full opacity-30"
            animate={{ scale }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
          <Image
            className={twMerge("dark:invert","rounded-full")}
            src="/mic.jpg"
            alt="Microphone logo"
            width={300}
            height={180}
            priority
          />
        </button>
      </div>

      <div className="text-2xl font-bold text-gray-500 text-center mt-10">Human in the Loop<br/>AI Calling</div>
      <div className="flex flex-row justify-center gap-10 mt-16">
        <div className="flex flex-row items-center justify-center gap-4 mt-10">
          <div>
            <h1>Supervisor</h1>
          </div>
          <div className={twMerge("relative w-auto h-auto flex items-center justify-center")}>
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full opacity-30"
              animate={{ scale: supervisorVolume / 100 + 1 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full bg-green-500 rounded-full opacity-30"
            />
            <AudioWaveform
              className="text-blue-500"
              size={50}
            />
            <audio id="audio-livekit" controls/>
          </div>
        </div>
        <div className="flex flex-row items-center justify-center gap-4 mt-10">
          <div>
            <h1>Livekit</h1>
          </div>
          <div className={twMerge("relative w-auto h-auto flex items-center justify-center")}>
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full opacity-30"
              animate={{ scale: botVolume / 100 + 1}}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full bg-green-500 rounded-full opacity-30"
            />
            <Bot
              className="text-blue-500 p-1"
              size={50}
            />
            <audio id="audio-bot" controls/>
          </div>
        </div>
      </div>
    </>
  );
}
