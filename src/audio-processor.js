// Audio processing utilities for preprocessing audio files
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
    }

    // Initialize Web Audio API context
    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Load audio file and return audio buffer
    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioContext = await this.initAudioContext();
            this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            return this.audioBuffer;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw new Error('Failed to load audio file');
        }
    }

    // Get audio file info (duration, sample rate, channels)
    getAudioInfo(audioBuffer) {
        if (!audioBuffer) return null;
        
        return {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length
        };
    }

    // Convert audio buffer to WAV format
    audioBufferToWav(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);

        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    }

    // Preprocess audio for timbre-only extraction
    async preprocessForTimbre(audioBuffer) {
        try {
            const audioContext = await this.initAudioContext();
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // Create a gain node for volume control
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.8;
            
            // Create a low-pass filter to reduce high-frequency content
            const lowPassFilter = audioContext.createBiquadFilter();
            lowPassFilter.type = 'lowpass';
            lowPassFilter.frequency.value = 2000; // Cut off high frequencies
            
            // Create a high-pass filter to reduce low-frequency content
            const highPassFilter = audioContext.createBiquadFilter();
            highPassFilter.type = 'highpass';
            highPassFilter.frequency.value = 80; // Cut off very low frequencies
            
            // Connect the audio graph
            source.connect(highPassFilter);
            highPassFilter.connect(lowPassFilter);
            lowPassFilter.connect(gainNode);
            
            // Create a new buffer for the processed audio
            const processedBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            // For now, we'll just copy the original buffer
            // In a real implementation, you'd apply more sophisticated processing
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const processedData = processedBuffer.getChannelData(channel);
                processedData.set(originalData);
            }
            
            return processedBuffer;
        } catch (error) {
            console.error('Error preprocessing audio:', error);
            return audioBuffer; // Return original if processing fails
        }
    }

    // Extract audio features for analysis
    extractAudioFeatures(audioBuffer) {
        if (!audioBuffer) return null;
        
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        
        // Calculate RMS (Root Mean Square) for volume
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        
        // Calculate zero crossing rate
        let zeroCrossings = 0;
        for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
                zeroCrossings++;
            }
        }
        const zcr = zeroCrossings / channelData.length;
        
        // Calculate spectral centroid (simplified)
        const fftSize = 2048;
        const hopSize = fftSize / 4;
        let spectralCentroidSum = 0;
        let spectralCentroidCount = 0;
        
        for (let i = 0; i < channelData.length - fftSize; i += hopSize) {
            const frame = channelData.slice(i, i + fftSize);
            const fft = this.simpleFFT(frame);
            
            let weightedSum = 0;
            let magnitudeSum = 0;
            
            for (let j = 0; j < fft.length / 2; j++) {
                const magnitude = Math.sqrt(fft[j * 2] ** 2 + fft[j * 2 + 1] ** 2);
                const frequency = (j * sampleRate) / fftSize;
                weightedSum += frequency * magnitude;
                magnitudeSum += magnitude;
            }
            
            if (magnitudeSum > 0) {
                spectralCentroidSum += weightedSum / magnitudeSum;
                spectralCentroidCount++;
            }
        }
        
        const spectralCentroid = spectralCentroidCount > 0 ? spectralCentroidSum / spectralCentroidCount : 0;
        
        return {
            duration,
            sampleRate,
            rms,
            zeroCrossingRate: zcr,
            spectralCentroid,
            isMono: audioBuffer.numberOfChannels === 1,
            isStereo: audioBuffer.numberOfChannels === 2
        };
    }

    // Simple FFT implementation (for basic spectral analysis)
    simpleFFT(real) {
        const N = real.length;
        const fft = new Array(N * 2);
        
        // Copy real part
        for (let i = 0; i < N; i++) {
            fft[i * 2] = real[i];
            fft[i * 2 + 1] = 0; // Imaginary part
        }
        
        // Simple FFT implementation (not optimized)
        this.fft(fft, N);
        
        return fft;
    }

    fft(fft, N) {
        if (N <= 1) return;
        
        const even = new Array(N / 2);
        const odd = new Array(N / 2);
        
        for (let i = 0; i < N / 2; i++) {
            even[i] = fft[i * 2];
            even[i + N / 2] = fft[i * 2 + 1];
            odd[i] = fft[(i + N / 2) * 2];
            odd[i + N / 2] = fft[(i + N / 2) * 2 + 1];
        }
        
        this.fft(even, N / 2);
        this.fft(odd, N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            const tReal = Math.cos(-2 * Math.PI * k / N) * odd[k] - Math.sin(-2 * Math.PI * k / N) * odd[k + N / 2];
            const tImag = Math.sin(-2 * Math.PI * k / N) * odd[k] + Math.cos(-2 * Math.PI * k / N) * odd[k + N / 2];
            
            fft[k * 2] = even[k] + tReal;
            fft[k * 2 + 1] = even[k + N / 2] + tImag;
            fft[(k + N / 2) * 2] = even[k] - tReal;
            fft[(k + N / 2) * 2 + 1] = even[k + N / 2] - tImag;
        }
    }

    // Convert audio buffer to base64 for API calls
    audioBufferToBase64(audioBuffer) {
        const wav = this.audioBufferToWav(audioBuffer);
        const bytes = new Uint8Array(wav);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Create audio element from buffer
    createAudioElement(audioBuffer) {
        const wav = this.audioBufferToWav(audioBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        return { audio, url };
    }
}

// Export for use in other modules
window.AudioProcessor = AudioProcessor;
