import re
import nltk
import string
from nltk.corpus import stopwords

def download_nltk_resources():
    """Download required NLTK data"""
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)

def get_custom_stopwords():
    """Get stopwords but keep negation words: not, no, never"""
    download_nltk_resources()
    stop_words = set(stopwords.words('english'))
    
    # Remove negation words from stopwords
    negations = {'not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nor'}
    custom_stopwords = stop_words - negations
    
    return custom_stopwords

def clean_text(text, stopwords_set):
    """
    Clean and preprocess text
    """
    if pd.isna(text):
        return ""
    
    # Convert to lowercase
    text = str(text).lower()
    
    # Replace contractions with 'not'
    text = re.sub(r"\b\w+'t\b", lambda m: m.group()[:-2] + " not", text)
    
    # Remove special characters and digits, keep only letters and spaces
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    
    # Remove words with length < 3
    text = ' '.join([word for word in text.split() if len(word) >= 3])
    
    # Remove stopwords (except negations)
    text = ' '.join([word for word in text.split() if word not in stopwords_set])
    
    return text.strip()

# Import pandas for isna check
import pandas as pd