import os
from google import genai
from dotenv import load_dotenv
import sys

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("[Error] GEMINI_API_KEY is missing in your .env file!")
    exit(1)

client = genai.Client(api_key=api_key)

def list_all_models():
    print("🚀 Fetching all working models available for your API key...\n")
    try:
        available_models = client.models.list()
        count = 0
        
        print("Here are the models you can use:")
        print("-" * 50)
        
        for model in available_models:
            # We print the model name
            print(f"✅ {model.name}")
            count += 1
            
        print("-" * 50)
        print(f"🎯 Total Working Models Available: {count}")
        
    except Exception as e:
        print(f"\n[Error] Failed to fetch models: {str(e)}")

if __name__ == "__main__":
    list_all_models()
