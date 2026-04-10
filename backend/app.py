from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import joblib
from utils import get_custom_stopwords, clean_text
import numpy as np

app = Flask(__name__)
CORS(app) 

# Global variables
model = None
stopwords_set = None

def load_model():
    """Load trained model and pipeline"""
    global model, stopwords_set
    try:
        print("🔄 Loading model pipeline...")
        # Load the complete pipeline (contains both TF-IDF and LogReg)
        with open('model/model.pkl', 'rb') as f:
            model = pickle.load(f)
        
        stopwords_set = get_custom_stopwords()
        print("✅ Model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return False

@app.route('/')
def home():
    return jsonify({"status": "running", "endpoint": "/predict"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded."}), 500
        
        data = request.get_json()
        review_text = data.get('text', '').strip()
        
        if not review_text:
            return jsonify({"sentiment": "neutral", "confidence": 0.33, "top_words": []})
        
        # Clean text
        cleaned_text = clean_text(review_text, stopwords_set)
        if not cleaned_text:
            return jsonify({"sentiment": "neutral", "confidence": 0.33, "top_words": []})
        
        # Predict
        prediction = model.predict([cleaned_text])[0]
        probabilities = model.predict_proba([cleaned_text])[0]
        confidence = float(max(probabilities))
        
        # --- EXPLAINABILITY (XAI) ---
        top_words = []
        try:
            # Extract components from the pipeline
            tfidf_step = model.named_steps['tfidf']
            clf_step = model.named_steps['clf']
            
            # Get TF-IDF vector for this specific text
            vec_text = tfidf_step.transform([cleaned_text])
            feature_names = tfidf_step.get_feature_names_out()
            nonzero_indices = vec_text.nonzero()[1]
            
            if len(nonzero_indices) > 0:
                # Coef_[0] contains weights for the positive class
                coefficients = clf_step.coef_[0]
                word_impacts = []
                
                for idx in nonzero_indices:
                    word = feature_names[idx]
                    tfidf_val = vec_text[0, idx]
                    coef_val = coefficients[idx]
                    # Impact = how much this specific word shifted the prediction
                    impact = float(tfidf_val * coef_val)
                    word_impacts.append({"word": word, "impact": impact})
                
                # Sort by absolute impact (highest magnitude first)
                word_impacts.sort(key=lambda x: abs(x["impact"]), reverse=True)
                top_words = word_impacts[:5] # Send top 5 most impactful words
        except Exception as e:
            print(f"⚠️ Explainability error: {e}")

        return jsonify({
            "sentiment": prediction,
            "confidence": confidence,
            "top_words": top_words
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """Endpoint for processing large CSV files"""
    try:
        if model is None:
            return jsonify({"error": "Model not loaded."}), 500
            
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({"error": "No texts provided"}), 400

        # Clean all texts
        cleaned_texts = [clean_text(t, stopwords_set) for t in texts]
        
        # Predict all at once (Massively faster than a loop)
        predictions = model.predict(cleaned_texts)
        probabilities = model.predict_proba(cleaned_texts)
        
        results = []
        positive_count = 0
        negative_count = 0
        
        for i in range(len(texts)):
            conf = float(max(probabilities[i]))
            sentiment = predictions[i]
            
            if sentiment == 'positive':
                positive_count += 1
            else:
                negative_count += 1
                
            results.append({
                "id": i + 1,
                "text": texts[i][:150] + "..." if len(texts[i]) > 150 else texts[i], # Truncate for UI
                "sentiment": sentiment,
                "confidence": conf
            })
            
        return jsonify({
            "results": results,
            "summary": {
                "total": len(texts),
                "positive": positive_count,
                "negative": negative_count
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    if load_model():
        print("🚀 Flask API Ready on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)