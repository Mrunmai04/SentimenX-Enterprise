import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from utils import get_custom_stopwords, clean_text
import joblib

def main():
    print("🔄 Loading cleaned dataset...")
    
    # Load cleaned data
    df = pd.read_csv('data/cleaned_reviews.csv')
    print(f"✅ Dataset loaded! Shape: {df.shape}")
    
    # Get custom stopwords
    stopwords_set = get_custom_stopwords()
    
    print("🧹 Cleaning text...")
    # Apply text cleaning
    df['cleaned_review'] = df['review'].apply(lambda x: clean_text(x, stopwords_set))
    
    # Remove empty reviews after cleaning
    df = df[df['cleaned_review'].str.len() > 0].reset_index(drop=True)
    print(f"📊 Dataset after cleaning: {df.shape}")
    
    # Prepare features and labels
    X = df['cleaned_review']
    y = df['sentiment']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"📈 Train set: {X_train.shape}, Test set: {X_test.shape}")
    
    # TF-IDF Vectorizer with specified parameters
    vectorizer = TfidfVectorizer(
        max_features=12000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.9,
        lowercase=False  # Already lowercased in preprocessing
    )
    
    # Logistic Regression model
    model = LogisticRegression(
        max_iter=300,
        class_weight='balanced',
        random_state=42
    )
    
    # Create pipeline
    pipeline = Pipeline([
        ('tfidf', vectorizer),
        ('clf', model)
    ])
    
    print("🚀 Training model...")
    pipeline.fit(X_train, y_train)
    
    # Predictions
    y_pred = pipeline.predict(X_test)
    
    # Evaluation
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n📊 Model Performance:")
    print(f"✅ Accuracy: {accuracy:.4f}")
    print("\n📈 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Create model directory
    os.makedirs('model', exist_ok=True)
    
    # Save model and vectorizer
    model_path = 'model/model.pkl'
    vectorizer_path = 'model/vectorizer.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
    
    # Also save individual components for Flask app
    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(model, 'model/logreg_model.pkl')
    
    print(f"\n💾 Model saved to: {model_path}")
    print(f"💾 Vectorizer saved to: {vectorizer_path}")
    print("✅ Training completed successfully!")

if __name__ == "__main__":
    main()