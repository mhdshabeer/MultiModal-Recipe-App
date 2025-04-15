
document.addEventListener('DOMContentLoaded', function() {
    const gestureControlBtn = document.getElementById('gestureControlBtn');
    const gestureControlStatus = document.getElementById('gestureControlStatus');
    const videoContainer = document.getElementById('video-container');
    const webcamElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('gesture-canvas');
    
    let isGestureControlActive = false;
    let videoStream = null;
    let canvasContext = null;
    let isTracking = false;
    let gestureTimeout = null;
    let handPoseDetection = null;
    
    // Initialize MediaPipe
    async function initializeMediaPipe() {
        try {
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            hands.onResults(onHandResults);
            return hands;
        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            return null;
        }
    }
    
    // Handle MediaPipe results
    function onHandResults(results) {
        if (!isGestureControlActive) return;
        
        if (canvasContext && results.multiHandLandmarks) {
            canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasContext.drawImage(webcamElement, 0, 0, canvasElement.width, canvasElement.height);
            
            if (results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];
                drawHand(landmarks);
                analyzeGesture(landmarks);
            }
        }
    }
    
    // Draw hand landmarks
    function drawHand(landmarks) {
        canvasContext.fillStyle = '#FF0000';
        landmarks.forEach(landmark => {
            canvasContext.beginPath();
            canvasContext.arc(
                landmark.x * canvasElement.width,
                landmark.y * canvasElement.height,
                3, 0, 2 * Math.PI
            );
            canvasContext.fill();
        });
    }
    
    // Analyze hand gesture
    function analyzeGesture(landmarks) {
        if (isTracking) return;
        
        // Calculate hand openness
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const palmBase = landmarks[0];
        
        // Calculate average finger extension
        const fingerExtension = [
            thumbTip.y - palmBase.y,
            indexTip.y - palmBase.y,
            middleTip.y - palmBase.y,
            ringTip.y - palmBase.y,
            pinkyTip.y - palmBase.y
        ].reduce((a, b) => a + b) / 5;
        
        // Detect horizontal movement
        const handX = palmBase.x;
        if (!lastX) {
            lastX = handX;
            return;
        }
        
        const movement = handX - lastX;
        lastX = handX;
        
        // Detect gestures
        if (Math.abs(movement) > 0.15) {
            isTracking = true;
            if (movement > 0) {
                triggerGestureAction('swipe-right');
            } else {
                triggerGestureAction('swipe-left');
            }
            setTimeout(() => {
                isTracking = false;
                lastX = null;
            }, 1000);
        } else if (!isTracking) {
            // Detect open/closed hand
            if (fingerExtension < -0.1) {
                triggerGestureAction('closed-fist');
                isTracking = true;
                setTimeout(() => isTracking = false, 1000);
            } else if (fingerExtension > 0.15) {
                triggerGestureAction('open-hand');
                isTracking = true;
                setTimeout(() => isTracking = false, 1000);
            }
        }
    }
    
    // Toggle gesture control
    async function toggleGestureControl() {
        if (isGestureControlActive) {
            stopGestureControl();
        } else {
            startGestureControl();
        }
    }
    
    // Start gesture control
    async function startGestureControl() {
        try {
            handPoseDetection = await initializeMediaPipe();
            if (!handPoseDetection) {
                throw new Error('Failed to initialize MediaPipe');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 }
            });
            
            videoStream = stream;
            webcamElement.srcObject = stream;
            videoContainer.classList.remove('d-none');
            
            webcamElement.onloadedmetadata = async () => {
                isGestureControlActive = true;
                gestureControlBtn.classList.add('active');
                gestureControlStatus.textContent = 'Gesture On';
                
                // Start detection loop
                const detectFrame = async () => {
                    if (isGestureControlActive) {
                        await handPoseDetection.send({ image: webcamElement });
                        requestAnimationFrame(detectFrame);
                    }
                };
                detectFrame();
            };
        } catch (error) {
            console.error('Error starting gesture control:', error);
            stopGestureControl();
            gestureControlStatus.textContent = 'Error';
        }
    }
    
    // Stop gesture control
    function stopGestureControl() {
        isGestureControlActive = false;
        gestureControlBtn.classList.remove('active');
        gestureControlStatus.textContent = 'Gesture Off';
        
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        
        if (videoContainer) {
            videoContainer.classList.add('d-none');
        }
        
        if (canvasContext) {
            canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        
        if (gestureTimeout) {
            clearTimeout(gestureTimeout);
            gestureTimeout = null;
        }
        
        lastX = null;
        isTracking = false;
    }
    
    // Function to perform actions based on detected gestures
    function triggerGestureAction(gesture) {
        console.log('Gesture detected:', gesture);
        
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
            if (gesture === 'swipe-right' || gesture === 'swipe-left') {
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
    
    // Initialize canvas context
    if (canvasElement) {
        canvasContext = canvasElement.getContext('2d');
    }
    
    // Check if required APIs are available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        gestureControlBtn.disabled = false;
        gestureControlBtn.addEventListener('click', toggleGestureControl);
    } else {
        gestureControlBtn.disabled = true;
        gestureControlStatus.textContent = 'Not Supported';
        console.error('Webcam access not supported in this browser.');
    }
});
