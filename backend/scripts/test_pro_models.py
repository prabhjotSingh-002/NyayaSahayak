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

def test_model(model_name):
    print(f"\n--- 🚀 Testing Model: {model_name} ---")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Explain the difference between Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS) in exactly 1 short sentence."
        )
        print(f"✅ SUCCESS! This model is working perfectly on your key.")
        print(f"🤖 AI Response: {response.text.strip()}")
    except Exception as e:
        print(f"❌ FAILED! This model is restricted or not working.")
        print(f"Error details: {str(e)}")

if __name__ == "__main__":
    print("Test shuru ho raha hai... Dekhte hain Pro models chalte hain ya nahi!\n")
    test_model("gemini-3.1-pro-preview")
    test_model("gemini-2.5-pro")
