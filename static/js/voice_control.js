document.addEventListener('DOMContentLoaded', function() {
    // Voice recognition setup
    const voiceControlBtn = document.getElementById('voiceControlBtn');
    const voiceControlStatus = document.getElementById('voiceControlStatus');
    const feedbackToast = document.getElementById('feedback-toast');
    const feedbackMessage = document.getElementById('feedback-message');
    
    let recognition = null;
    let isListening = false;
    let toast = null;
    
    // Initialize toast
    if (feedbackToast) {
        toast = new bootstrap.Toast(feedbackToast, {
            autohide: true,
            delay: 3000
        });
    }
    
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Voice control button is enabled
        voiceControlBtn.disabled = false;
        
        // Set up voice control button click event
        voiceControlBtn.addEventListener('click', toggleVoiceControl);
        
        // Set up recognition events
        recognition.onstart = function() {
            isListening = true;
            voiceControlStatus.textContent = 'Listening...';
            voiceControlBtn.classList.add('active');
        };
        
        recognition.onend = function() {
            if (isListening) {
                // Restart recognition if it was stopped but we want to keep listening
                recognition.start();
            } else {
                voiceControlStatus.textContent = 'Voice Off';
                voiceControlBtn.classList.remove('active');
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech') {
                // This is a common error that happens when no speech is detected
                // We don't need to display this to the user
                return;
            }
            
            showFeedback(`Error: ${event.error}`);
            
            // If there's a fatal error, stop listening
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isListening = false;
                voiceControlStatus.textContent = 'Voice Off';
                voiceControlBtn.classList.remove('active');
            }
        };
        
        recognition.onresult = function(event) {
            const result = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            console.log('Voice command:', result);
            
            showFeedback(`I heard: "${result}"`);
            processVoiceCommand(result);
        };
    } else {
        // Browser doesn't support speech recognition
        voiceControlBtn.disabled = true;
        voiceControlStatus.textContent = 'Not Supported';
        console.error('Speech recognition not supported in this browser.');
    }
    
    // Function to toggle voice control on/off
    function toggleVoiceControl() {
        if (isListening) {
            isListening = false;
            recognition.stop();
        } else {
            isListening = true;
            recognition.start();
        }
    }
    
    // Function to show feedback to the user
    function showFeedback(message) {
        if (feedbackMessage && toast) {
            feedbackMessage.textContent = message;
            toast.show();
        }
    }
    
    // Function to process voice commands
    function processVoiceCommand(command) {
        // Check what page we're on by checking for page-specific elements
        const isRecipePage = document.querySelector('.recipe-detail') !== null;
        const isHomePage = document.querySelector('#recipe-container') !== null;
        
        // Common commands
        if (command.includes('go back') || command.includes('go home') || command.includes('back to home')) {
            window.location.href = '/';
            return;
        }
        
        // Homepage-specific commands
        if (isHomePage) {
            // Search for a recipe by name
            if (command.includes('show recipe for') || command.includes('find recipe for')) {
                const query = command.replace(/show recipe for|find recipe for/gi, '').trim();
                if (query) {
                    document.getElementById('searchInput').value = query;
                    document.getElementById('searchButton').click();
                    showFeedback(`Searching for "${query}" recipes...`);
                }
            }
            
            // Filter by category
            else if (command.includes('show all') && command.includes('recipes')) {
                const category = command.replace(/show all|recipes/gi, '').trim();
                if (category) {
                    const select = document.getElementById('categoryFilter');
                    // Find the option that contains the category name (case insensitive)
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].text.toLowerCase().includes(category.toLowerCase())) {
                            select.selectedIndex = i;
                            select.dispatchEvent(new Event('change'));
                            showFeedback(`Showing ${select.options[i].text} recipes`);
                            break;
                        }
                    }
                }
            }
        }
        
        // Recipe page-specific commands
        else if (isRecipePage) {
            const readInstructionsBtn = document.getElementById('readInstructionsBtn');
            const pauseInstructionsBtn = document.getElementById('pauseInstructionsBtn');
            const nextStepBtn = document.getElementById('nextStepBtn');
            const prevStepBtn = document.getElementById('prevStepBtn');
            
            // Start reading instructions
            if (command.includes('read recipe') || command.includes('start reading') || 
                command.includes('read instructions') || command.includes('continue reading')) {
                if (readInstructionsBtn && !readInstructionsBtn.classList.contains('d-none')) {
                    readInstructionsBtn.click();
                    showFeedback('Starting to read recipe instructions');
                }
            }
            
            // Pause reading
            else if (command.includes('pause') || command.includes('stop reading')) {
                if (pauseInstructionsBtn && !pauseInstructionsBtn.classList.contains('d-none')) {
                    pauseInstructionsBtn.click();
                    showFeedback('Pausing recipe instructions');
                }
            }
            
            // Next step
            else if (command.includes('next step') || command.includes('next instruction')) {
                if (nextStepBtn && !nextStepBtn.disabled) {
                    nextStepBtn.click();
                    showFeedback('Moving to next step');
                } else {
                    showFeedback('Already at the last step');
                }
            }
            
            // Previous step
            else if (command.includes('previous step') || command.includes('go back one step')) {
                if (prevStepBtn && !prevStepBtn.disabled) {
                    prevStepBtn.click();
                    showFeedback('Moving to previous step');
                } else {
                    showFeedback('Already at the first step');
                }
            }
            
            // Repeat step
            else if (command.includes('repeat step') || command.includes('repeat instruction')) {
                const synth = window.speechSynthesis;
                if (synth.speaking) {
                    synth.cancel();
                }
                
                setTimeout(() => {
                    const currentStepText = document.querySelector('.active-step .step-text');
                    if (currentStepText) {
                        const currentStepNumber = document.querySelector('.active-step').dataset.step;
                        const utterance = new SpeechSynthesisUtterance(`Step ${currentStepNumber}: ${currentStepText.textContent}`);
                        synth.speak(utterance);
                        showFeedback('Repeating current step');
                    }
                }, 100);
            }
        }
    }
});
