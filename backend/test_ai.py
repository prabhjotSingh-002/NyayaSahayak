import asyncio
from app.ai.router import ai_router
from app.config import settings

async def main():
    print(f"OpenRouter Key: {settings.OPENROUTER_API_KEY[:5]}...")
    print(f"Gemini Key: {settings.GEMINI_API_KEY[:5]}...")
    print(f"Groq Key: {settings.GROQ_API_KEY[:5]}...")
    
    try:
        reply = await ai_router.generate_response(prompt="Hello, who are you?", system_prompt="You are a helpful assistant.", task="chat")
        print("SUCCESS! Reply:", reply)
    except Exception as e:
        print("FAILED:", e)

if __name__ == "__main__":
    asyncio.run(main())
