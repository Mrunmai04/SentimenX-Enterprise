import requests
import json

tests = [
    "This is amazing! Love it!",
    "Worst product ever, terrible!",
    "It's okay, nothing special.",
    "DO NOT BUY! Complete waste!",
    "Pretty good, works fine."
]

for text in tests:
    response = requests.post(
        "http://localhost:5000/predict",
        json={"text": text}
    )
    print(f"Input:  {text}")
    print(f"Output: {response.json()}\n")