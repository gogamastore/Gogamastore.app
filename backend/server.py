from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "gogama_store_secret_key_2025"  # In production, use a secure secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Create the main app without a prefix
app = FastAPI(title="Gogama Store API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        user = await db.users.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Models
class UserRegister(BaseModel):
    nama_lengkap: str
    email: EmailStr
    nomor_whatsapp: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    nama_lengkap: str
    email: str
    nomor_whatsapp: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    deskripsi: str
    harga: float
    gambar: str  # base64 image
    kategori: str
    stok: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    gambar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CartItem(BaseModel):
    product_id: str
    nama: str
    harga: float
    gambar: str
    quantity: int = 1

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    total: float = 0.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "id": str(uuid.uuid4()),
        "nama_lengkap": user_data.nama_lengkap,
        "email": user_data.email,
        "nomor_whatsapp": user_data.nomor_whatsapp,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    # Insert user into database
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    # Prepare user response
    user_response = UserResponse(
        id=user_doc["id"],
        nama_lengkap=user_doc["nama_lengkap"],
        email=user_doc["email"],
        nomor_whatsapp=user_doc["nomor_whatsapp"],
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    # Prepare user response
    user_response = UserResponse(
        id=user["id"],
        nama_lengkap=user["nama_lengkap"],
        email=user["email"],
        nomor_whatsapp=user["nomor_whatsapp"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

# Products endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find().to_list(1000)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

# Categories endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories(current_user: dict = Depends(get_current_user)):
    categories = await db.categories.find().to_list(1000)
    return [Category(**category) for category in categories]

@api_router.get("/products/by-category/{category_name}")
async def get_products_by_category(category_name: str, current_user: dict = Depends(get_current_user)):
    products = await db.products.find({"kategori": category_name}).to_list(1000)
    return [Product(**product) for product in products]

# Cart endpoints
@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        # Create empty cart if doesn't exist
        empty_cart = Cart(user_id=current_user["id"])
        await db.carts.insert_one(empty_cart.dict())
        return empty_cart
    return Cart(**cart)

@api_router.post("/cart/add")
async def add_to_cart(product_id: str, quantity: int = 1, current_user: dict = Depends(get_current_user)):
    # Get product details
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        cart = Cart(user_id=current_user["id"]).dict()
        await db.carts.insert_one(cart)
    
    # Check if item already in cart
    item_exists = False
    for item in cart.get("items", []):
        if item["product_id"] == product_id:
            item["quantity"] += quantity
            item_exists = True
            break
    
    if not item_exists:
        new_item = CartItem(
            product_id=product_id,
            nama=product["nama"],
            harga=product["harga"],
            gambar=product["gambar"],
            quantity=quantity
        )
        cart.setdefault("items", []).append(new_item.dict())
    
    # Calculate total
    total = sum(item["harga"] * item["quantity"] for item in cart["items"])
    cart["total"] = total
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart}
    )
    
    return {"message": "Item added to cart", "cart": Cart(**cart)}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Remove item from cart
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    
    # Recalculate total
    total = sum(item["harga"] * item["quantity"] for item in cart["items"])
    cart["total"] = total
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": cart}
    )
    
    return {"message": "Item removed from cart", "cart": Cart(**cart)}

# Profile endpoints
@api_router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        nama_lengkap=current_user["nama_lengkap"],
        email=current_user["email"],
        nomor_whatsapp=current_user["nomor_whatsapp"],
        created_at=current_user["created_at"]
    )

@api_router.put("/profile")
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    # Update allowed fields only
    allowed_fields = ["nama_lengkap", "nomor_whatsapp"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Add some sample data on startup
@app.on_event("startup")
async def startup_event():
    # Create sample categories
    sample_categories = [
        {"id": str(uuid.uuid4()), "nama": "Elektronik", "created_at": datetime.utcnow()},
        {"id": str(uuid.uuid4()), "nama": "Fashion", "created_at": datetime.utcnow()},
        {"id": str(uuid.uuid4()), "nama": "Makanan", "created_at": datetime.utcnow()},
        {"id": str(uuid.uuid4()), "nama": "Kesehatan", "created_at": datetime.utcnow()}
    ]
    
    for category in sample_categories:
        existing = await db.categories.find_one({"nama": category["nama"]})
        if not existing:
            await db.categories.insert_one(category)
    
    # Create sample products
    sample_products = [
        {
            "id": str(uuid.uuid4()),
            "nama": "Smartphone Android",
            "deskripsi": "Smartphone terbaru dengan kamera canggih",
            "harga": 2500000.0,
            "gambar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "kategori": "Elektronik",
            "stok": 50,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nama": "T-Shirt Cotton",
            "deskripsi": "T-Shirt berbahan cotton premium",
            "harga": 150000.0,
            "gambar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "kategori": "Fashion",
            "stok": 100,
            "created_at": datetime.utcnow()
        }
    ]
    
    for product in sample_products:
        existing = await db.products.find_one({"nama": product["nama"]})
        if not existing:
            await db.products.insert_one(product)
    
    logger.info("Startup completed - Sample data loaded")