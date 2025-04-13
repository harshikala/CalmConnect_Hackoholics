from flask import Flask, request, jsonify, send_from_directory
import requests
import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, static_folder=BASE_DIR, template_folder=BASE_DIR)

# Load environment variables
load_dotenv()
SPOTIFY_CLIENT_ID = os.getenv("2034e13492e147c19aa4fd12745e4e13")
SPOTIFY_CLIENT_SECRET = os.getenv("e564bfbe6ecc416bb1cb3797a2e6586a")

# Get Spotify access token
def get_spotify_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET
    }
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

# Serve front-end
@app.route("/")
def serve_frontend():
    return send_from_directory(app.static_folder, "index.html")

# Analyze form data
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    scores = calculate_anxiety_score(data)
    recommendations = get_recommendations(scores)
    return jsonify({
        "anxietyScore": scores["anxietyScore"],
        "emotionalScore": scores["emotionalScore"],
        "sleepScore": scores["sleepScore"],
        "mindfulnessScore": scores["mindfulnessScore"],
        "recommendations": recommendations
    })

# Fetch Spotify playlist
@app.route("/spotify/playlist", methods=["GET"])
def spotify_playlist():
    score = float(request.args.get("score", 50))
    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Failed to get Spotify token"}), 500

    # Mock playlist selection based on score
    query = "calming piano" if score > 70 else "chill acoustic" if score > 30 else "happy vibes"
    url = f"https://api.spotify.com/v1/search?q={query}&type=playlist&limit=1"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        playlists = response.json()["playlists"]["items"]
        if playlists:
            return jsonify({
                "playlist_name": playlists[0]["name"],
                "playlist_url": playlists[0]["external_urls"]["spotify"]
            })
        return jsonify({"error": "No playlists found"}), 404
    return jsonify({"error": "Spotify API error"}), response.status_code

# Helper functions
def calculate_anxiety_score(data):
    emotional_total, sleep_total, mindfulness_total = 0, 0, 0
    emotional_count, sleep_count, mindfulness_count = 0, 0, 0

    for key, value in data.items():
        if key.startswith("likert-"):
            value = int(value)
            index = int(key.split("-")[1])
            if index < 10:  # Emotional
                emotional_total += value
                emotional_count += 1
            elif index < 23:  # Sleep
                sleep_total += value
                sleep_count += 1
            else:  # Mindfulness
                mindfulness_total += value
                mindfulness_count += 1

    emotional_score = emotional_count and (emotional_total / (emotional_count * 5)) * 100 or 0
    sleep_score = sleep_count and (sleep_total / (sleep_count * 5)) * 100 or 0
    mindfulness_score = mindfulness_count and (mindfulness_total / (mindfulness_count * 5)) * 100 or 0
    anxiety_score = (emotional_score * 0.5) + (sleep_score * 0.3) + (mindfulness_score * 0.2)

    return {
        "anxietyScore": round(anxiety_score, 2),
        "emotionalScore": round(emotional_score, 2),
        "sleepScore": round(sleep_score, 2),
        "mindfulnessScore": round(mindfulness_score, 2)
    }

def get_recommendations(scores):
    recommendations = []
    if scores["anxietyScore"] > 70:
        recommendations.append("Consider connecting with a psychologist.")
    if scores["sleepScore"] < 50:
        recommendations.append("Try a calming playlist!")
    if scores["mindfulnessScore"] < 50:
        recommendations.append("Check out mindfulness exercises.")
    return recommendations or ["Keep up the good work!"]

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, ssl_context=("localhost.crt", "localhost.key"))