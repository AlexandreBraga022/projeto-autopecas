from contextlib import asynccontextmanager
from datetime import datetime
import json
import os
from typing import List, Optional, Union

from dotenv import load_dotenv
from engine import TechTurboDashboardEngine
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from pydantic import BaseModel, Field

# ================== CONFIGURAÇÕES E VARIÁVEIS DE AMBIENTE ==================
load_dotenv()

MOCKAPI_URL = os.getenv("MOCKAPI_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
origins_raw = os.getenv("ALLOWED_ORIGINS", "")

if not MOCKAPI_URL or not GEMINI_API_KEY or not origins_raw:
    raise RuntimeError("Erro Crítico: Verifique as variáveis de ambiente no .env")

ALLOWED_ORIGINS = [origin.strip() for origin in origins_raw.split(",") if origin.strip()]

# ================== CICLO DE VIDA E INICIALIZAÇÃO DA API ==================
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(title="TECHTURBO BFF Service", version="3.4.0", lifespan=lifespan)

# ================== MIDDLEWARES ==================
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)

# ================== TRATAMENTO DE EXCEÇÕES ==================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    campos = [str(err.get("loc", [])[-1]) for err in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": f"Preenchimento incorreto nos campos: {', '.join(campos)}."},
    )

# ================== SCHEMAS (PYDANTIC) ==================
class LoginRequest(BaseModel):
    email: str = Field(..., description="E-mail de acesso")
    password: str = Field(..., description="Senha")

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=4)
    cpf: str = Field(..., min_length=11)
    address: str = Field(..., min_length=5)
    admin_tag: Optional[str] = Field(default="")

class ProductRequest(BaseModel):
    name: str = Field(..., min_length=2)
    price: str
    stock: str
    category: str

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None)
    price: Optional[Union[float, str]] = Field(default=None)
    stock: Optional[Union[int, str]] = Field(default=None)
    category: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)

class CartItem(BaseModel):
    id: str
    name: str
    price: str
    quantity: int

class CheckoutRequest(BaseModel):
    user_id: str
    user_name: str
    address: Optional[str] = Field(default="Não informado")
    items: List[CartItem]
    total_price: float

# ================== FUNÇÃO DE INTEGRAÇÃO MOCKAPI ==================
async def fetch_mockapi(client: httpx.AsyncClient, endpoint: str, method: str = "GET", json_data: dict = None):
    url = f"{MOCKAPI_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    try:
        response = await client.request(method, url, json=json_data)
        response.raise_for_status()
        if response.status_code == 204 or not response.content:
            return {"message": "Sucesso"}
        return response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Banco de dados indisponível.")

# ================== ROTAS DE AUTENTICAÇÃO ==================
@app.post("/auth/login")
async def login(data: LoginRequest):
    email_clean = data.email.strip().lower()
    password_clean = str(data.password).strip()

    users = await fetch_mockapi(app.state.http_client, f"users?email={email_clean}")
    if not users or not isinstance(users, list):
        users = await fetch_mockapi(app.state.http_client, "users")

    if isinstance(users, list):
        for user in users:
            if str(user.get("email", "")).strip().lower() == email_clean and str(user.get("password", "")).strip() == password_clean:
                return user
    raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

@app.post("/auth/register", status_code=201)
async def register(data: RegisterRequest):
    ADMIN_SECRET_TAG = "#adm09092026"
    if data.admin_tag and data.admin_tag != ADMIN_SECRET_TAG:
        raise HTTPException(status_code=400, detail="Tag de administrador inválida.")
    
    payload = {
        "name": data.name,
        "email": data.email.strip().lower(),
        "password": str(data.password).strip(),
        "cpf": data.cpf.strip(),
        "address": data.address.strip(),
        "role": "admin" if data.admin_tag == ADMIN_SECRET_TAG else "user",
        "orders": [],
    }
    return await fetch_mockapi(app.state.http_client, "users", method="POST", json_data=payload)

# ================== ROTAS DE PRODUTOS ==================
@app.get("/products")
async def get_products():
    return await fetch_mockapi(app.state.http_client, "products")

@app.post("/products", status_code=201)
async def create_product(data: ProductRequest):
    return await fetch_mockapi(app.state.http_client, "products", method="POST", json_data=data.dict())

@app.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdateRequest):
    payload = {
        k: str(v) if v is not None and k in ["price", "stock"] else v 
        for k, v in data.dict().items() if v is not None
    }
    return await fetch_mockapi(app.state.http_client, f"products/{product_id}", method="PUT", json_data=payload)

@app.delete("/products/{product_id}")
async def delete_product(product_id: str):
    return await fetch_mockapi(app.state.http_client, f"products/{product_id}", method="DELETE")

# ================== ROTA DE CHECKOUT ==================
@app.post("/checkout")
async def checkout(data: CheckoutRequest):
    if data.user_id == "guest" or not data.user_id:
        raise HTTPException(status_code=403, detail="Visitantes não podem realizar compras.")

    for item in data.items:
        product = await fetch_mockapi(app.state.http_client, f"products/{item.id}")
        try:
            current_stock = int(float(str(product.get("stock", 0)).replace(",", ".")))
        except (ValueError, TypeError):
            current_stock = 0

        if current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para '{item.name}'.")

        new_stock = str(max(0, current_stock - item.quantity))
        await fetch_mockapi(app.state.http_client, f"products/{item.id}", method="PUT", json_data={"stock": new_stock})

    new_order = {
        "user_id": data.user_id,
        "user_name": data.user_name,
        "address": data.address,
        "items": [item.dict() for item in data.items],
        "total_price": data.total_price,
        "created_at": datetime.now().isoformat(),
    }

    user = await fetch_mockapi(app.state.http_client, f"users/{data.user_id}")
    user_orders = user.get("orders", [])

    if isinstance(user_orders, str):
        try:
            user_orders = json.loads(user_orders)
        except Exception:
            user_orders = []
    if not isinstance(user_orders, list):
        user_orders = []

    user_orders.append(new_order)
    await fetch_mockapi(app.state.http_client, f"users/{data.user_id}", method="PUT", json_data={"orders": user_orders})
    return {"message": "Compra realizada com sucesso!", "order": new_order}

# ================== ROTA DO DASHBOARD IA ==================
@app.get("/ai/dashboard")
async def get_dashboard():
    raw_products = await fetch_mockapi(app.state.http_client, "products")
    products = raw_products if isinstance(raw_products, list) else []

    orders = []
    raw_users = await fetch_mockapi(app.state.http_client, "users")

    if isinstance(raw_users, list):
        for u in raw_users:
            u_orders = u.get("orders", [])
            if isinstance(u_orders, str):
                try:
                    u_orders = json.loads(u_orders)
                except Exception:
                    u_orders = []
            if isinstance(u_orders, dict):
                u_orders = [u_orders]
            if isinstance(u_orders, list):
                orders.extend(u_orders)

    engine = TechTurboDashboardEngine(products=products, orders=orders, api_key=GEMINI_API_KEY)
    kpis = engine.get_kpis()
    ai_report = engine.generate_ai_report()

    return {
        "metrics": {
            "total_products": kpis["total_products"],
            "total_stock_units": kpis["total_stock_units"],
            "low_stock_count": kpis["low_stock_count"],
            "total_sales_count": kpis["total_orders"],
            "total_revenue": kpis["total_revenue"],
        },
        "low_stock_products": kpis["low_stock_items"],
        "ai_analysis": ai_report,
    }