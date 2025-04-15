# Hands-Free Recipe App

A multimodal recipe application with voice and gesture controls, built with Flask backend and HTML/CSS/JS frontend. This app features 20 recipes with hands-free navigation to provide a seamless cooking experience.

## Features

- **Voice Control**: Navigate and control the app using natural voice commands
- **Gesture Control**: Use hand gestures captured via webcam to control the interface
- **Recipe Database**: 20 detailed recipes with step-by-step instructions
- **Responsive Design**: Works on various screen sizes
- **Hands-Free Experience**: Perfect for cooking when your hands are busy or messy

## Voice Commands

- "Show recipe for [food]" - Search for a specific recipe
- "Show all [category] recipes" - Filter recipes by category
- "Go back to home" - Return to the homepage
- "Read recipe" - Start reading the current recipe instructions
- "Pause reading" - Pause the reading
- "Next step" - Move to the next instruction
- "Previous step" - Go back to the previous instruction

## Gesture Controls

- **Swipe Right**: Next step
- **Swipe Left**: Previous step
- **Open Hand**: Start/continue reading
- **Closed Fist**: Pause reading

## Tech Stack

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **APIs**: Web Speech API, MediaDevices API

## Setup

1. Clone the repository
2. Install the requirements: `pip install -r requirements.txt`
3. Run the application: `gunicorn --bind 0.0.0.0:5000 main:app`
4. Open your browser and navigate to `http://localhost:5000`

## Browser Compatibility

This app works best in Chrome as it has the most complete implementation of the Web Speech API and MediaDevices API.