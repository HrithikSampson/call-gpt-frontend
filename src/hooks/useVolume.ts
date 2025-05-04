import { useEffect, useState } from 'react';

export function useMicVolume(stream: MediaStream | null) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!stream) {
      setVolume(0);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let rafId: number;
    const getVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setVolume(avg);
      rafId = requestAnimationFrame(getVolume);
    };

    getVolume();

    return () => {
      cancelAnimationFrame(rafId);
      audioContext.close();
    };
  }, [stream]);

  return volume;
}
