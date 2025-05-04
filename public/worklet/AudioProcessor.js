"use client";
class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, _outputs, _parameters) {
        const input = inputs[0];
        if (input && input[0]) {
            this.port.postMessage(input[0]);
        }
        return true; // Keep the processor alive
    }
}
registerProcessor('audio-processor', AudioProcessor);
