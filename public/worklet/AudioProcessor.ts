"use client";

class AudioProcessor extends AudioWorkletProcessor {
    process(inputs: Float32Array[][],
        _outputs: Float32Array[][],
        _parameters: Record<string, Float32Array>): boolean {
      const input = inputs[0];
      if (input && input[0]) {
        this.port.postMessage(input[0]);
      }
      return true; // Keep the processor alive
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);