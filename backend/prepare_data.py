import pandas as pd
import os
from utils import get_custom_stopwords, clean_text

def main():
    print("🔄 Loading Amazon Fine Food Reviews dataset...")
    
    # Load dataset (user needs to download Reviews.csv from Kaggle)
    try:
        df = pd.read_csv('Reviews.csv')
        print(f"✅ Dataset loaded successfully! Shape: {df.shape}")
    except FileNotFoundError:
        print("❌ Reviews.csv not found!")
        print("📥 Download from: https://www.kaggle.com/datasets/snap/amazon-fine-food-reviews")
        print("📁 Place Reviews.csv in the project root folder")
        return
    
    # Select only required columns
    df = df[['Summary', 'Text', 'Score']].copy()
    print(f"📊 Selected columns: Summary, Text, Score")
    
    # Combine Summary + Text
    print("🔗 Combining Summary + Text into 'review' column...")
    df['review'] = (df['Summary'].fillna('') + ' ' + df['Text'].fillna('')).str.strip()
    
    # Convert Score to sentiment labels
    print("🎯 Converting Score to sentiment labels...")
    def score_to_sentiment(score):
        if score <= 2:
            return 'negative'
        elif score == 3:
            return 'neutral'
        else:  # score 4-5
            return 'positive'
    
    df['sentiment'] = df['Score'].apply(score_to_sentiment)
    
    print("📈 Sentiment distribution before balancing:")
    print(df['sentiment'].value_counts())
    
    # Balance dataset - take equal samples from each class
    print("⚖️ Balancing dataset...")
    min_samples = df['sentiment'].value_counts().min()
    print(f"📊 Taking {min_samples} samples from each class")
    
    balanced_df = df.groupby('sentiment').head(min_samples).reset_index(drop=True)
    
    print("📈 Sentiment distribution after balancing:")
    print(balanced_df['sentiment'].value_counts())
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    # Save cleaned dataset
    output_path = 'data/cleaned_reviews.csv'
    balanced_df[['review', 'sentiment']].to_csv(output_path, index=False)
    
    print(f"💾 Cleaned dataset saved to: {output_path}")
    print(f"✅ Data preparation completed! Shape: {balanced_df.shape}")

if __name__ == "__main__":
    main()