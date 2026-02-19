from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Badminton knowledge base for AI responses
KNOWLEDGE_BASE = {
    'rules': [
        "Badminton games are played to 21 points with rally scoring. You must win by 2 points, game caps at 30.",
        "In badminton, you score a point when the shuttle lands in your opponent's court or they fault."
    ],
    'technique': [
        "For a powerful smash, hit the shuttle at the highest point with a strong wrist snap.",
        "Good footwork is essential - use the split step and return to center court after each shot."
    ],
    'equipment': [
        "For beginners, get a lightweight racket (85-90g) with a flexible shaft.",
        "Shuttlecocks come in feather (advanced play) and nylon (practice) types."
    ],
    'platform': [
        "On SportSphere, you can book courts, find coaches, register for tournaments, and find sparring partners!",
        "Our platform offers court booking, coach profiles, tournament registration, and intelligent sparring matchmaking."
    ]
}

def generate_response(message):
    """Generate AI response based on message content"""
    message_lower = message.lower()
    
    # Check for keywords
    for category, responses in KNOWLEDGE_BASE.items():
        if category in message_lower:
            import random
            return random.choice(responses)
    
    # Greetings
    if any(word in message_lower for word in ['hi', 'hello', 'hey']):
        return "Hello! I'm your SportSphere assistant. How can I help you with badminton today?"
    
    # Default response
    return f"I can help you with badminton rules, techniques, equipment, and our platform features. What would you like to know?"

@app.route('/api/send_message', methods=['POST'])
def send_message():
    """
    Endpoint for badminton chatbot - receives message and returns AI response
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        context = data.get('context', {})
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Generate AI response
        bot_response = generate_response(user_message)
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'AI Service is running',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"🤖 AI Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
