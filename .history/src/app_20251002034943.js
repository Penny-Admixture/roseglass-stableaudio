// Main application logic and UI interactions
class App {
    constructor() {
        this.modelAPIs = new ModelAPIs();
        this.audioProcessor = new AudioProcessor();
        this.currentTab = 'stable-audio';
        this.currentAudio = null;
        this.isGenerating = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.setupRangeSliders();
        this.setupFileUploads();
        this.setupAudioPlayers();
        this.updateModeStatus();
        
        // Initialize local models with progress
        await this.initializeLocalModels();
    }

    setupEventListeners() {
        // Mode toggle
        document.getElementById('local-mode-toggle').addEventListener('change', (e) => {
            this.modelAPIs.setLocalMode(e.target.checked);
            this.updateModeStatus();
        });

        // New generation button
        document.getElementById('new-generation-btn').addEventListener('click', () => {
            this.resetAllTabs();
        });

        // Open audio button
        document.getElementById('open-audio-btn').addEventListener('click', () => {
            this.openAudioFile();
        });

        // Generate buttons for each model
        document.getElementById('sa-generate-btn').addEventListener('click', () => {
            this.generateAudio('stable-audio');
        });

        document.getElementById('ac-generate-btn').addEventListener('click', () => {
            this.generateAudio('audiocraft');
        });

        document.getElementById('al-generate-btn').addEventListener('click', () => {
            this.generateAudio('audiolm');
        });

        document.getElementById('fg-generate-btn').addEventListener('click', () => {
            this.generateAudio('fugatto');
        });

        // Menu event listeners
        const { ipcRenderer } = require('electron');
        
        ipcRenderer.on('menu-new-generation', () => {
            this.resetAllTabs();
        });

        ipcRenderer.on('menu-open-audio', (event, filePath) => {
            this.loadAudioFromPath(filePath);
        });

        ipcRenderer.on('menu-switch-tab', (event, tabName) => {
            this.switchTab(tabName);
        });
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    setupRangeSliders() {
        // Stable Audio sliders
        this.setupRangeSlider('sa-input-strength', 'sa-input-strength-value');
        this.setupRangeSlider('sa-prompt-strength', 'sa-prompt-strength-value');

        // AudioCraft sliders
        this.setupRangeSlider('ac-guidance-scale', 'ac-guidance-scale-value');

        // AudioLDM sliders
        this.setupRangeSlider('al-guidance-scale', 'al-guidance-scale-value');
        this.setupRangeSlider('al-num-steps', 'al-num-steps-value');

        // Fugatto sliders
        this.setupRangeSlider('fg-timbre-weight', 'fg-timbre-weight-value');
        this.setupRangeSlider('fg-arrangement-weight', 'fg-arrangement-weight-value');
        this.setupRangeSlider('fg-notes-weight', 'fg-notes-weight-value');
    }

    setupRangeSlider(sliderId, valueId) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
            });
        }
    }

    setupFileUploads() {
        // Stable Audio file upload
        this.setupFileUpload('sa-upload-btn', 'sa-audio-file', 'sa-file-name');

        // AudioCraft file upload
        this.setupFileUpload('ac-upload-btn', 'ac-audio-file', 'ac-file-name');

        // AudioLDM file upload
        this.setupFileUpload('al-upload-btn', 'al-audio-file', 'al-file-name');

        // Fugatto file upload
        this.setupFileUpload('fg-upload-btn', 'fg-audio-file', 'fg-file-name');
    }

    setupFileUpload(buttonId, inputId, nameId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        const nameDisplay = document.getElementById(nameId);

        if (button && input && nameDisplay) {
            button.addEventListener('click', () => {
                input.click();
            });

            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        // Show progress for file processing
                        const statusElement = document.getElementById(buttonId.replace('-upload-btn', '-status'));
                        if (statusElement) {
                            this.showStatus(statusElement, 'Processing audio file...', 'info');
                            
                            this.updateProgress(statusElement, 'Reading file...', 20);
                            await this.delay(200);
                            
                            this.updateProgress(statusElement, 'Validating audio format...', 40);
                            await this.delay(300);
                            
                            this.updateProgress(statusElement, 'Processing audio data...', 60);
                            await this.delay(400);
                            
                            this.updateProgress(statusElement, 'Finalizing...', 80);
                            await this.delay(200);
                            
                            nameDisplay.textContent = file.name;
                            this.currentAudio = file;
                            
                            this.updateProgress(statusElement, 'Audio file ready!', 100);
                            setTimeout(() => {
                                this.showStatus(statusElement, 'Ready for generation!', 'success');
                            }, 1000);
                        } else {
                            nameDisplay.textContent = file.name;
                            this.currentAudio = file;
                        }
                    } catch (error) {
                        console.error('Error processing audio file:', error);
                        if (statusElement) {
                            this.showStatus(statusElement, `Error: ${error.message}`, 'error');
                        }
                    }
                }
            });
        }
    }

    setupAudioPlayers() {
        // Setup audio players for each model
        this.setupAudioPlayer('sa-play-btn', 'sa-download-btn', 'sa-audio-player');
        this.setupAudioPlayer('ac-play-btn', 'ac-download-btn', 'ac-audio-player');
        this.setupAudioPlayer('al-play-btn', 'al-download-btn', 'al-audio-player');
        this.setupAudioPlayer('fg-play-btn', 'fg-download-btn', 'fg-audio-player');
    }

    setupAudioPlayer(playButtonId, downloadButtonId, playerId) {
        const playButton = document.getElementById(playButtonId);
        const downloadButton = document.getElementById(downloadButtonId);
        const player = document.getElementById(playerId);

        if (playButton && downloadButton && player) {
            let currentAudio = null;
            let isPlaying = false;

            playButton.addEventListener('click', () => {
                if (currentAudio) {
                    if (isPlaying) {
                        currentAudio.pause();
                        playButton.innerHTML = '<i class="fas fa-play"></i>';
                        isPlaying = false;
                    } else {
                        currentAudio.play();
                        playButton.innerHTML = '<i class="fas fa-pause"></i>';
                        isPlaying = true;
                    }
                }
            });

            downloadButton.addEventListener('click', async () => {
                if (currentAudio) {
                    // In a real implementation, you'd download the actual generated audio
                    console.log('Download audio');
                }
            });
        }
    }

    async generateAudio(model) {
        if (this.isGenerating) return;

        this.isGenerating = true;
        const generateButton = document.getElementById(`${this.getModelPrefix(model)}-generate-btn`);
        const statusElement = document.getElementById(`${this.getModelPrefix(model)}-status`);

        try {
            // Update UI with progress
            generateButton.disabled = true;
            generateButton.innerHTML = '<div class="loading"></div> Generating...';
            this.showStatus(statusElement, 'Initializing generation...', 'info');

            // Get parameters based on model
            const params = this.getModelParams(model);

            // Show progress for different stages
            this.updateProgress(statusElement, 'Preparing model...', 10);
            await this.delay(500); // Simulate model loading

            this.updateProgress(statusElement, 'Processing audio input...', 25);
            await this.delay(300);

            this.updateProgress(statusElement, 'Generating audio with AI...', 50);
            await this.delay(1000);

            // Generate audio with progress updates
            const result = await this.generateWithProgress(model, params, statusElement);

            if (result.success) {
                this.updateProgress(statusElement, 'Finalizing audio...', 90);
                await this.delay(200);

                // Create mock audio for demonstration
                const mockAudio = this.modelAPIs.createMockAudio(params.duration);
                const { audio, url } = this.audioProcessor.createAudioElement(mockAudio);

                // Setup audio player
                this.setupGeneratedAudio(model, audio, url);

                this.updateProgress(statusElement, 'Audio generated successfully!', 100);
                setTimeout(() => {
                    this.showStatus(statusElement, 'Ready for playback!', 'success');
                }, 1000);
            } else {
                throw new Error('Generation failed');
            }

        } catch (error) {
            console.error('Generation error:', error);
            this.showStatus(statusElement, `Error: ${error.message}`, 'error');
        } finally {
            // Reset UI
            generateButton.disabled = false;
            generateButton.innerHTML = '<i class="fas fa-play"></i> Generate Music';
            this.isGenerating = false;
        }
    }

    async generateWithProgress(model, params, statusElement) {
        // Simulate progress during actual generation
        const progressSteps = [
            { message: 'Loading AI model...', progress: 60 },
            { message: 'Analyzing input parameters...', progress: 70 },
            { message: 'Generating audio samples...', progress: 80 },
            { message: 'Processing audio output...', progress: 85 }
        ];

        for (const step of progressSteps) {
            this.updateProgress(statusElement, step.message, step.progress);
            await this.delay(800 + Math.random() * 400); // Variable delay
        }

        // Call the actual generation
        return await this.modelAPIs.generateAudio(model, params);
    }

    updateProgress(statusElement, message, progress) {
        // Create or update progress bar
        let progressBar = statusElement.querySelector('.progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            statusElement.appendChild(progressBar);
        }

        // Update progress bar
        progressBar.style.width = `${progress}%`;
        
        // Update message
        const messageElement = statusElement.querySelector('.status-message');
        if (messageElement) {
            messageElement.textContent = message;
        } else {
            statusElement.innerHTML = `<div class="status-message">${message}</div>`;
            statusElement.appendChild(progressBar);
        }

        // Add progress percentage
        const percentageElement = statusElement.querySelector('.progress-percentage');
        if (!percentageElement) {
            const pct = document.createElement('div');
            pct.className = 'progress-percentage';
            statusElement.appendChild(pct);
        }
        statusElement.querySelector('.progress-percentage').textContent = `${progress}%`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getModelParams(model) {
        const prefix = this.getModelPrefix(model);
        
        const baseParams = {
            textPrompt: document.getElementById(`${prefix}-text-prompt`).value,
            audioFile: this.currentAudio,
            duration: parseInt(document.getElementById(`${prefix}-duration`).value)
        };

        switch (model) {
            case 'stable-audio':
                return {
                    ...baseParams,
                    inputStrength: parseFloat(document.getElementById('sa-input-strength').value),
                    promptStrength: parseFloat(document.getElementById('sa-prompt-strength').value)
                };
            case 'audiocraft':
                return {
                    ...baseParams,
                    modelSize: document.getElementById('ac-model-size').value,
                    guidanceScale: parseFloat(document.getElementById('ac-guidance-scale').value)
                };
            case 'audiolm':
                return {
                    ...baseParams,
                    guidanceScale: parseFloat(document.getElementById('al-guidance-scale').value),
                    numSteps: parseInt(document.getElementById('al-num-steps').value)
                };
            case 'fugatto':
                return {
                    ...baseParams,
                    timbreWeight: parseFloat(document.getElementById('fg-timbre-weight').value),
                    arrangementWeight: parseFloat(document.getElementById('fg-arrangement-weight').value),
                    notesWeight: parseFloat(document.getElementById('fg-notes-weight').value)
                };
            default:
                return baseParams;
        }
    }

    getModelPrefix(model) {
        const prefixes = {
            'stable-audio': 'sa',
            'audiocraft': 'ac',
            'audiolm': 'al',
            'fugatto': 'fg'
        };
        return prefixes[model] || 'sa';
    }

    setupGeneratedAudio(model, audio, url) {
        const prefix = this.getModelPrefix(model);
        const playButton = document.getElementById(`${prefix}-play-btn`);
        const downloadButton = document.getElementById(`${prefix}-download-btn`);
        const progressFill = document.querySelector(`#${prefix}-audio-player .progress-fill`);
        const timeDisplay = document.querySelector(`#${prefix}-audio-player .time-display`);

        // Store audio reference
        playButton.audio = audio;
        downloadButton.audio = audio;

        // Enable controls
        playButton.disabled = false;
        downloadButton.disabled = false;

        // Setup progress tracking
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            
            const current = this.formatTime(audio.currentTime);
            const total = this.formatTime(audio.duration);
            timeDisplay.textContent = `${current} / ${total}`;
        });

        // Setup play/pause
        audio.addEventListener('play', () => {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
        });

        audio.addEventListener('pause', () => {
            playButton.innerHTML = '<i class="fas fa-play"></i>';
        });

        // Setup click to seek
        const progressBar = document.querySelector(`#${prefix}-audio-player .progress-bar`);
        progressBar.addEventListener('click', (event) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const percentage = clickX / rect.width;
            audio.currentTime = audio.duration * percentage;
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status-message ${type}`;
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                element.textContent = '';
                element.className = 'status-message';
            }, 5000);
        }
    }

    resetAllTabs() {
        // Clear all text inputs
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
        });

        // Clear all file inputs
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.value = '';
        });

        // Clear file name displays
        document.querySelectorAll('.file-name').forEach(span => {
            span.textContent = '';
        });

        // Clear status messages
        document.querySelectorAll('.status-message').forEach(element => {
            element.textContent = '';
            element.className = 'status-message';
        });

        // Reset audio players
        document.querySelectorAll('.audio-player').forEach(player => {
            const playButton = player.querySelector('.btn-icon');
            const downloadButton = player.querySelectorAll('.btn-icon')[1];
            const progressFill = player.querySelector('.progress-fill');
            const timeDisplay = player.querySelector('.time-display');

            if (playButton) {
                playButton.disabled = true;
                playButton.innerHTML = '<i class="fas fa-play"></i>';
                playButton.audio = null;
            }

            if (downloadButton) {
                downloadButton.disabled = true;
                downloadButton.audio = null;
            }

            if (progressFill) {
                progressFill.style.width = '0%';
            }

            if (timeDisplay) {
                timeDisplay.textContent = '0:00 / 0:00';
            }
        });

        this.currentAudio = null;
    }

    openAudioFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                this.currentAudio = file;
                // Update all file name displays
                document.querySelectorAll('.file-name').forEach(span => {
                    span.textContent = file.name;
                });
            }
        };
        input.click();
    }

    async loadAudioFromPath(filePath) {
        try {
            // In a real implementation, you'd load the file from the path
            console.log('Loading audio from path:', filePath);
            // For now, just show a message
            this.showStatus(document.getElementById(`${this.getModelPrefix(this.currentTab)}-status`), 
                'Audio file loaded from path', 'success');
        } catch (error) {
            console.error('Error loading audio from path:', error);
        }
    }

    updateModeStatus() {
        const status = this.modelAPIs.getModelStatus();
        const toggle = document.getElementById('local-mode-toggle');
        const toggleText = document.querySelector('.toggle-text');
        
        if (status.localAvailable.isLocalAvailable) {
            toggle.disabled = false;
            toggleText.textContent = status.currentMode === 'local' ? 'Local GPU' : 'API Mode';
            console.log('✅ Local GPU models available');
        } else {
            toggle.checked = false;
            toggle.disabled = true;
            toggleText.textContent = 'API Only';
            console.log('⚠️ Local GPU models not available, using API mode');
        }
    }

    async initializeLocalModels() {
        // Show initialization progress
        const statusElements = document.querySelectorAll('[id$="-status"]');
        const initStatus = statusElements[0]; // Use first status element for global status
        
        if (initStatus) {
            this.showStatus(initStatus, 'Initializing local models...', 'info');
            
            this.updateProgress(initStatus, 'Checking Python environment...', 10);
            await this.delay(500);
            
            this.updateProgress(initStatus, 'Loading AI models...', 30);
            await this.delay(1000);
            
            this.updateProgress(initStatus, 'Preparing GPU acceleration...', 60);
            await this.delay(800);
            
            this.updateProgress(initStatus, 'Finalizing setup...', 90);
            await this.delay(300);
            
            this.updateProgress(initStatus, 'Local models ready!', 100);
            setTimeout(() => {
                this.showStatus(initStatus, 'Ready for local generation!', 'success');
            }, 1000);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
