from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from gtts import gTTS
import base64
import io
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load FAQ data
with open('faq_data.json', 'r', encoding='utf-8') as f:
    faq_data = json.load(f)['faqs']

# Create a list of all questions for TF-IDF
all_questions = []
question_to_answer = {}
for faq in faq_data:
    for question in faq['questions']:
        all_questions.append(question.lower())
        question_to_answer[question.lower()] = faq['answer']

# Initialize TF-IDF vectorizer
vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(all_questions)

def find_best_match(query):
    query_vector = vectorizer.transform([query.lower()])
    similarities = cosine_similarity(query_vector, tfidf_matrix)[0]
    best_match_index = np.argmax(similarities)
    
    if similarities[best_match_index] < 0.3:  # Threshold for minimum similarity
        return None
        
    return all_questions[best_match_index]

def text_to_speech(text, lang):
    try:
        tts = gTTS(text=text, lang=lang)
        audio_bytes = io.BytesIO()
        tts.write_to_fp(audio_bytes)
        audio_bytes.seek(0)
        audio_base64 = base64.b64encode(audio_bytes.read()).decode()
        return audio_base64
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def handle_query(request: dict):
    query = request.get("query")
    lang = request.get("language", "en")
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
        
    if lang not in ["en", "hi", "te", "kn"]:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    # Find the best matching question
    best_match = find_best_match(query)
    if not best_match:
        response = {
            "text": {
                "en": "I'm sorry, I couldn't find a relevant answer to your question.",
                "hi": "क्षमा करें, मैं आपके प्रश्न का प्रासंगिक उत्तर नहीं ढूंढ पाया।",
                "te": "క్షమించండి, మీ ప్రశ్నకు సంబంధించిన సమాధానం కనుగొనలేకపోయాను.",
                "kn": "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಉತ್ತರವನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
            }
        }
    else:
        response = {
            "text": question_to_answer[best_match]
        }
    
    # Generate audio if requested
    if request.get("audio", False):
        response["audio"] = text_to_speech(response["text"][lang], lang)
    
    return response

@app.get("/health")
async def health_check():
    return {"status": "ok"}