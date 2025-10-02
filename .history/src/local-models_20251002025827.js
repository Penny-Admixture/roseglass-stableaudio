// Local model manager for GPU-based audio generation
class LocalModels {
    constructor() {
        this.audioProcessor = new AudioProcessor();
        this.pythonProcess = null;
        this.modelPaths = {
            'audiocraft': './models/audiocraft/',
            'musicgen': './models/musicgen/',
            'audiolm': './models/audiolm/',
            'stable-audio': './models/stable-audio/'
        };
        this.isLocalAvailable = false;
        this.checkLocalAvailability();
    }

    async checkLocalAvailability() {
        try {
            // Check if Python and required packages are available
            const { spawn } = require('child_process');
            const python = spawn('python', ['--version']);
            
            python.on('close', (code) => {
                if (code === 0) {
                    this.isLocalAvailable = true;
                    console.log('✅ Local GPU models available');
                } else {
                    console.log('⚠️ Python not found, falling back to API mode');
                }
            });
        } catch (error) {
            console.log('⚠️ Local models not available, using API fallback');
        }
    }

    // AudioCraft/MusicGen local implementation
    async generateAudioCraftLocal(params) {
        if (!this.isLocalAvailable) {
            throw new Error('Local models not available');
        }

        try {
            const { spawn } = require('child_process');
            const python = spawn('python', [
                './scripts/audiocraft_local.py',
                '--prompt', params.textPrompt,
                '--duration', params.duration.toString(),
                '--model_size', params.modelSize,
                '--guidance_scale', params.guidanceScale.toString(),
                '--output', './temp/audiocraft_output.wav'
            ]);

            if (params.audioFile) {
                const audioBuffer = await this.audioProcessor.loadAudioFile(params.audioFile);
                const wavData = this.audioProcessor.audioBufferToWav(audioBuffer);
                const fs = require('fs');
                fs.writeFileSync('./temp/conditioning_audio.wav', wavData);
                python.stdin.write('--conditioning_audio ./temp/conditioning_audio.wav\n');
            }

            return new Promise((resolve, reject) => {
                python.on('close', (code) => {
                    if (code === 0) {
                        resolve({
                            success: true,
                            audioPath: './temp/audiocraft_output.wav',
                            duration: params.duration,
                            model: 'audiocraft-local'
                        });
                    } else {
                        reject(new Error('AudioCraft generation failed'));
                    }
                });
            });
        } catch (error) {
            throw new Error(`AudioCraft local generation failed: ${error.message}`);
        }
    }

    // AudioLDM local implementation
    async generateAudioLDMLocal(params) {
        if (!this.isLocalAvailable) {
            throw new Error('Local models not available');
        }

        try {
            const { spawn } = require('child_process');
            const python = spawn('python', [
                './scripts/audiolm_local.py',
                '--prompt', params.textPrompt,
                '--duration', params.duration.toString(),
                '--guidance_scale', params.guidanceScale.toString(),
                '--num_steps', params.numSteps.toString(),
                '--output', './temp/audiolm_output.wav'
            ]);

            if (params.audioFile) {
                const audioBuffer = await this.audioProcessor.loadAudioFile(params.audioFile);
                const wavData = this.audioProcessor.audioBufferToWav(audioBuffer);
                const fs = require('fs');
                fs.writeFileSync('./temp/source_audio.wav', wavData);
                python.stdin.write('--source_audio ./temp/source_audio.wav\n');
            }

            return new Promise((resolve, reject) => {
                python.on('close', (code) => {
                    if (code === 0) {
                        resolve({
                            success: true,
                            audioPath: './temp/audiolm_output.wav',
                            duration: params.duration,
                            model: 'audiolm-local'
                        });
                    } else {
                        reject(new Error('AudioLDM generation failed'));
                    }
                });
            });
        } catch (error) {
            throw new Error(`AudioLDM local generation failed: ${error.message}`);
        }
    }

    // Stable Audio local implementation (using diffusers)
    async generateStableAudioLocal(params) {
        if (!this.isLocalAvailable) {
            throw new Error('Local models not available');
        }

        try {
            const { spawn } = require('child_process');
            const python = spawn('python', [
                './scripts/stable_audio_local.py',
                '--prompt', params.textPrompt,
                '--duration', params.duration.toString(),
                '--input_strength', params.inputStrength.toString(),
                '--prompt_strength', params.promptStrength.toString(),
                '--output', './temp/stable_audio_output.wav'
            ]);

            if (params.audioFile) {
                const audioBuffer = await this.audioProcessor.loadAudioFile(params.audioFile);
                const wavData = this.audioProcessor.audioBufferToWav(audioBuffer);
                const fs = require('fs');
                fs.writeFileSync('./temp/input_audio.wav', wavData);
                python.stdin.write('--input_audio ./temp/input_audio.wav\n');
            }

            return new Promise((resolve, reject) => {
                python.on('close', (code) => {
                    if (code === 0) {
                        resolve({
                            success: true,
                            audioPath: './temp/stable_audio_output.wav',
                            duration: params.duration,
                            model: 'stable-audio-local'
                        });
                    } else {
                        reject(new Error('Stable Audio generation failed'));
                    }
                });
            });
        } catch (error) {
            throw new Error(`Stable Audio local generation failed: ${error.message}`);
        }
    }

    // Generic local generation method
    async generateLocal(model, params) {
        switch (model) {
            case 'audiocraft':
                return await this.generateAudioCraftLocal(params);
            case 'audiolm':
                return await this.generateAudioLDMLocal(params);
            case 'stable-audio':
                return await this.generateStableAudioLocal(params);
            default:
                throw new Error(`Local model not supported: ${model}`);
        }
    }

    // Check if local model is available
    isModelAvailable(model) {
        return this.isLocalAvailable && this.modelPaths[model];
    }

    // Get model status
    getModelStatus() {
        return {
            isLocalAvailable: this.isLocalAvailable,
            availableModels: Object.keys(this.modelPaths),
            pythonAvailable: this.isLocalAvailable
        };
    }
}

// Export for use in other modules
window.LocalModels = LocalModels;
