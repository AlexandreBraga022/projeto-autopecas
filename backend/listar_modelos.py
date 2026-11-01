import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Erro: GEMINI_API_KEY não encontrada no .env")
else:
    client = genai.Client(api_key=api_key)
    print("Modelos suportados pela sua chave de API:")
    
    for model in client.models.list():
        print(f"- {model.name}")

# Este código serve apenas para verificar as versões de API compatíveis para a chave no .env