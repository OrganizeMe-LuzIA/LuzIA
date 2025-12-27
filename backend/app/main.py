from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LuzIA Backend",
    description="API para o sistema de questionários de saúde mental",
    version="0.1.0"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de teste
@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do LuzIA"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
