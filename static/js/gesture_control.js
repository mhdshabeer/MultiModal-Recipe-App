document.addEventListener('DOMContentLoaded', function() {
    // Gesture recognition setup
    const gestureControlBtn = document.getElementById('gestureControlBtn');
    const gestureControlStatus = document.getElementById('gestureControlStatus');
    const videoContainer = document.getElementById('video-container');
    const webcamElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('gesture-canvas');
    
    let isGestureControlActive = false;
    let videoStream = null;
    let canvasContext = null;
    let lastX = 0;
    let isTracking = false;
    let gestureTimeout = null;
    
    // These variables will store the last positions to detect motion
    let lastPositions = [];
    const POSITION_HISTORY = 10; // Number of positions to store
    
    // Check if required APIs are available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        gestureControlBtn.disabled = false;
        
        gestureControlBtn.addEventListener('click', toggleGestureControl);
        
        if (canvasElement) {
            canvasContext = canvasElement.getContext('2d');
        }
    } else {
        gestureControlBtn.disabled = true;
        gestureControlStatus.textContent = 'Not Supported';
        console.error('Webcam access not supported in this browser.');
    }
    
    // Function to toggle gesture control on/off
    function toggleGestureControl() {
        if (isGestureControlActive) {
            stopGestureControl();
        } else {
            startGestureControl();
        }
    }
    
    // Function to start gesture control
    function startGestureControl() {
        isGestureControlActive = true;
        gestureControlBtn.classList.add('active');
        gestureControlStatus.textContent = 'Gesture On';
        
        // Show video container
        if (videoContainer) {
            videoContainer.classList.remove('d-none');
        }
        
        // Start webcam
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            .then(function(stream) {
                videoStream = stream;
                if (webcamElement) {
                    webcamElement.srcObject = stream;
                    // Start gesture detection after camera is ready
                    webcamElement.onloadedmetadata = function() {
                        detectGestures();
                    };
                }
            })
            .catch(function(error) {
                console.error('Error accessing webcam:', error);
                stopGestureControl();
                gestureControlStatus.textContent = 'Webcam Error';
            });
    }
    
    // Function to stop gesture control
    function stopGestureControl() {
        isGestureControlActive = false;
        gestureControlBtn.classList.remove('active');
        gestureControlStatus.textContent = 'Gesture Off';
        
        // Hide video container
        if (videoContainer) {
            videoContainer.classList.add('d-none');
        }
        
        // Stop webcam
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        
        // Clear canvas
        if (canvasContext) {
            canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        
        // Clear any pending timeouts
        if (gestureTimeout) {
            clearTimeout(gestureTimeout);
            gestureTimeout = null;
        }
    }
    
    // Very basic gesture detection using color detection and motion tracking
    function detectGestures() {
        if (!isGestureControlActive || !videoStream) return;
        
        // Clear canvas
        if (canvasContext) {
            canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        
        // Draw video frame to canvas
        if (canvasContext && webcamElement) {
            canvasContext.drawImage(webcamElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // Get image data for analysis
            const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const data = imageData.data;
            
            // Find the brightest point as a very simple way to track hand movement
            let brightestValue = 0;
            let brightestX = 0;
            let brightestY = 0;
            
            // Sample every 4th pixel for performance (adjust as needed)
            for (let y = 0; y < canvasElement.height; y += 4) {
                for (let x = 0; x < canvasElement.width; x += 4) {
                    const index = (y * canvasElement.width + x) * 4;
                    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    
                    if (brightness > brightestValue) {
                        brightestValue = brightness;
                        brightestX = x;
                        brightestY = y;
                    }
                }
            }
            
            // Store position in history
            lastPositions.push({ x: brightestX, y: brightestY });
            if (lastPositions.length > POSITION_HISTORY) {
                lastPositions.shift();
            }
            
            // Draw a circle at the brightest point
            canvasContext.beginPath();
            canvasContext.arc(brightestX, brightestY, 10, 0, 2 * Math.PI);
            canvasContext.strokeStyle = 'red';
            canvasContext.lineWidth = 2;
            canvasContext.stroke();
            
            // Analyze movement if we have enough history
            if (lastPositions.length === POSITION_HISTORY) {
                analyzeGesture();
            }
        }
        
        // Continue detection loop
        requestAnimationFrame(detectGestures);
    }
    
    // Analyze the gesture based on movement
    function analyzeGesture() {
        // Skip if we're already tracking a gesture
        if (isTracking) return;
        
        // Calculate horizontal and vertical movement
        let horizontalMovement = 0;
        let verticalMovement = 0;
        
        for (let i = 1; i < lastPositions.length; i++) {
            horizontalMovement += lastPositions[i].x - lastPositions[i-1].x;
            verticalMovement += lastPositions[i].y - lastPositions[i-1].y;
        }
        
        // Detect rapid horizontal movement (swipe)
        if (Math.abs(horizontalMovement) > 50 && Math.abs(verticalMovement) < 30) {
            isTracking = true;
            
            // Swipe right
            if (horizontalMovement > 0) {
                triggerGestureAction('swipe-right');
            }
            // Swipe left
            else {
                triggerGestureAction('swipe-left');
            }
            
            // Reset tracking after a delay
            gestureTimeout = setTimeout(() => {
                isTracking = false;
                lastPositions = [];
            }, 1000);
        }
        
        // Detect open hand vs closed fist by analyzing the brightness pattern
        // This is a very simplified approach and would need more sophisticated analysis in a real app
        
        // For now, we'll just use a simple random trigger to simulate hand position detection
        // In a real app, you would use a more sophisticated approach like machine learning models
        if (!isTracking && Math.random() < 0.005) { // Only trigger occasionally to avoid constant false positives
            const randomAction = Math.random() > 0.5 ? 'open-hand' : 'closed-fist';
            triggerGestureAction(randomAction);
            
            isTracking = true;
            gestureTimeout = setTimeout(() => {
                isTracking = false;
            }, 2000);
        }
    }
    
    // Function to perform actions based on detected gestures
    function triggerGestureAction(gesture) {
        console.log('Gesture detected:', gesture);
        
        // Check what page we're on
        const isRecipePage = document.querySelector('.recipe-detail') !== null;
        
        if (isRecipePage) {
            const nextStepBtn = document.getElementById('nextStepBtn');
            const prevStepBtn = document.getElementById('prevStepBtn');
            const readInstructionsBtn = document.getElementById('readInstructionsBtn');
            const pauseInstructionsBtn = document.getElementById('pauseInstructionsBtn');
            
            switch (gesture) {
                case 'swipe-right':
                    if (nextStepBtn && !nextStepBtn.disabled) {
                        nextStepBtn.click();
                        showGestureFeedback('Next Step');
                    }
                    break;
                    
                case 'swipe-left':
                    if (prevStepBtn && !prevStepBtn.disabled) {
                        prevStepBtn.click();
                        showGestureFeedback('Previous Step');
                    }
                    break;
                    
                case 'open-hand':
                    if (readInstructionsBtn && !readInstructionsBtn.classList.contains('d-none')) {
                        readInstructionsBtn.click();
                        showGestureFeedback('Start Reading');
                    }
                    break;
                    
                case 'closed-fist':
                    if (pauseInstructionsBtn && !pauseInstructionsBtn.classList.contains('d-none')) {
                        pauseInstructionsBtn.click();
                        showGestureFeedback('Pause Reading');
                    }
                    break;
            }
        } else {
            // Home page gestures
            if (gesture === 'swipe-right' || gesture === 'swipe-left') {
                // Could implement pagination or scrolling between recipe cards
                const direction = gesture === 'swipe-right' ? 'right' : 'left';
                showGestureFeedback(`Swipe ${direction}`);
                window.scrollBy({
                    top: gesture === 'swipe-right' ? 300 : -300,
                    behavior: 'smooth'
                });
            }
        }
    }
    
    // Show feedback for gesture
    function showGestureFeedback(action) {
        const feedbackToast = document.getElementById('feedback-toast');
        const feedbackMessage = document.getElementById('feedback-message');
        
        if (feedbackMessage && feedbackToast) {
            feedbackMessage.textContent = `Gesture detected: ${action}`;
            const toast = new bootstrap.Toast(feedbackToast, {
                autohide: true,
                delay: 1500
            });
            toast.show();
        }
    }
});
