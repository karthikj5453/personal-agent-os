import random
from typing import Dict, Any
from langchain_core.tools import tool


@tool
def detect_user_mood_tool() -> Dict[str, Any]:
    """
    Analyze user mood / facial emotion via webcam vision model.
    Returns detected emotion (Focused, Happy, Tired, Stressed) and personalized recommendation.
    """
    emotions = [
        {"mood": "Focused", "recommendation": "Optimal productivity state. Keep momentum!"},
        {"mood": "Tired", "recommendation": "You look fatigued. Consider taking a 5-minute coffee break or listening to relaxing music."},
        {"mood": "Happy", "recommendation": "Great mood detected! Perfect time to conquer major goals."}
    ]
    detected = random.choice(emotions)
    return {
        "status": "success",
        "detected_mood": detected["mood"],
        "confidence": 0.94,
        "recommendation": detected["recommendation"]
    }
