from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# Product Model
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    price: int
    category: str
    image: str
    badge: str = "Aynı Gün Teslimat"
    is_bestseller: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    description: str = ""
    price: int
    category: str
    image: str
    badge: str = "Aynı Gün Teslimat"
    is_bestseller: bool = False


# Category Model
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: str = ""
    icon: str = ""


# Banner Model
class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image: str
    title: str = ""
    link: str = ""
    order: int = 0


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "ÇiçekZamanı API"}


# Status Routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    bestseller: Optional[bool] = Query(None, description="Filter bestsellers"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    query = {}
    if category:
        query["category"] = category
    if bestseller is not None:
        query["is_bestseller"] = bestseller
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    product_dict = input.model_dump()
    product_obj = Product(**product_dict)
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    _ = await db.products.insert_one(doc)
    return product_obj


# Category Routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.get("/categories/{slug}")
async def get_category(slug: str):
    category = await db.categories.find_one({"slug": slug}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    return category


# Banner Routes
@api_router.get("/banners", response_model=List[Banner])
async def get_banners():
    banners = await db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(10)
    return banners


# Search Route
@api_router.get("/search")
async def search_products(q: str = Query(..., min_length=2)):
    # Text search on title and description
    products = await db.products.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).limit(20).to_list(20)
    return products


# Seed Data Route (for initial setup)
@api_router.post("/seed")
async def seed_database():
    # Check if data already exists
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Veritabanı zaten dolu", "products_count": existing_products}
    
    # Categories
    categories_data = [
        {"id": str(uuid.uuid4()), "name": "Orkide", "slug": "orkide", "description": "Şık, zarif ve kalıcı hediye", "icon": "🌸"},
        {"id": str(uuid.uuid4()), "name": "Gül", "slug": "gul", "description": "Aşkın en klasik hali", "icon": "🌹"},
        {"id": str(uuid.uuid4()), "name": "Papatya / Gerbera", "slug": "papatya-gerbera", "description": "Neşeli ve canlı çiçekler", "icon": "🌼"},
        {"id": str(uuid.uuid4()), "name": "Saksı Çiçekleri", "slug": "saksi-cicekleri", "description": "Kalıcı saksı bitkileri", "icon": "🪴"},
        {"id": str(uuid.uuid4()), "name": "Lilyum", "slug": "lilyum", "description": "Muhteşem kokulu çiçekler", "icon": "🌷"},
        {"id": str(uuid.uuid4()), "name": "Ayçiçeği", "slug": "aycicegi", "description": "Güneş gibi parlak", "icon": "🌻"},
        {"id": str(uuid.uuid4()), "name": "Hüsnüyusuf", "slug": "husnuyusuf", "description": "Romantik ve zarif", "icon": "💜"},
        {"id": str(uuid.uuid4()), "name": "Karanfil", "slug": "karanfil", "description": "Geleneksel ve zarif", "icon": "🌺"},
        {"id": str(uuid.uuid4()), "name": "Geçmiş Olsun", "slug": "gecmis-olsun", "description": "Sevdiklerinize şifa dileyin", "icon": "💐"},
        {"id": str(uuid.uuid4()), "name": "Yeni İş / Terfi", "slug": "yeni-is-terfi", "description": "Başarıları kutlayın", "icon": "🎊"},
        {"id": str(uuid.uuid4()), "name": "Doğum / Yeni Bebek", "slug": "dogum-yeni-bebek", "description": "Yeni hayatı kutlayın", "icon": "👶"},
        {"id": str(uuid.uuid4()), "name": "Yıl Dönümü", "slug": "yil-donumu", "description": "Özel günlerinizi kutlayın", "icon": "💕"},
        {"id": str(uuid.uuid4()), "name": "Tasarım Çiçekler", "slug": "tasarim", "description": "Özel aranjmanlar ve butik işler", "icon": "🎨"},
        {"id": str(uuid.uuid4()), "name": "Çiçek Buketleri", "slug": "cicek-buketleri", "description": "Her ocasyon için buketler", "icon": "💐"},
        {"id": str(uuid.uuid4()), "name": "Antoryum", "slug": "antoryum", "description": "Egzotik ve şık", "icon": "❤️"},
        {"id": str(uuid.uuid4()), "name": "Kokina", "slug": "kokina", "description": "Yeni yılın gözdesi", "icon": "🎄"},
    ]
    await db.categories.insert_many(categories_data)
    
    # Banners
    banners_data = [
        {"id": str(uuid.uuid4()), "image": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=400&fit=crop", "title": "Yaz Koleksiyonu", "link": "/kategori/tasarim", "order": 1},
        {"id": str(uuid.uuid4()), "image": "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1200&h=400&fit=crop", "title": "Güller Festivali", "link": "/kategori/gul", "order": 2},
        {"id": str(uuid.uuid4()), "image": "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1200&h=400&fit=crop", "title": "Orkide Şıklığı", "link": "/kategori/orkide", "order": 3},
    ]
    await db.banners.insert_many(banners_data)
    
    # Products - Güller
    gul_products = [
        {"id": str(uuid.uuid4()), "title": "Kırmızı Gül Buketi", "description": "11 adet kırmızı gülden oluşan romantik buket", "price": 599, "category": "gul", "image": "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Pembe Gül Aranjmanı", "description": "21 adet pembe gül özel vazo içinde", "price": 899, "category": "gul", "image": "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Beyaz Gül Buketi", "description": "15 adet beyaz gül zarif ambalajda", "price": 749, "category": "gul", "image": "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Karışık Renkli Güller", "description": "25 adet karışık renkli gül sepeti", "price": 1099, "category": "gul", "image": "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sarı Gül Buketi", "description": "9 adet sarı gül dostluk buketi", "price": 449, "category": "gul", "image": "https://images.unsplash.com/photo-1586968304848-f29e3c95cb2c?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Lüks Gül Kutusu", "description": "50 adet premium gül özel kutuda", "price": 2499, "category": "gul", "image": "https://images.unsplash.com/photo-1548586196-aa5803b77379?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Premium", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Orkideler
    orkide_products = [
        {"id": str(uuid.uuid4()), "title": "Beyaz Orkide", "description": "Tek dallı beyaz orkide seramik saksıda", "price": 799, "category": "orkide", "image": "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Mor Orkide", "description": "Çift dallı mor orkide premium saksıda", "price": 1299, "category": "orkide", "image": "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Pembe Orkide", "description": "Tek dallı pembe orkide zarif ambalajda", "price": 849, "category": "orkide", "image": "https://images.unsplash.com/photo-1566873535350-a3f5d4a804b7?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sarı Orkide", "description": "Nadir sarı orkide özel seramik saksıda", "price": 999, "category": "orkide", "image": "https://images.unsplash.com/photo-1612363148951-15f16817648f?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "İkili Orkide Set", "description": "2 adet tek dallı orkide şık kutuda", "price": 1599, "category": "orkide", "image": "https://images.unsplash.com/photo-1590755726405-6c2e1f9a7dfe?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Premium", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Tasarım
    tasarim_products = [
        {"id": str(uuid.uuid4()), "title": "Butik Aranjman", "description": "Mevsim çiçeklerinden özel tasarım", "price": 699, "category": "tasarim", "image": "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Pastel Rüya", "description": "Pastel tonlarda özel aranjman", "price": 899, "category": "tasarim", "image": "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Tropikal Esen", "description": "Egzotik çiçeklerle tropikal tasarım", "price": 1199, "category": "tasarim", "image": "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Premium", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Vintage Şıklık", "description": "Klasik tarzda nostaljik buket", "price": 799, "category": "tasarim", "image": "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Modern Minimalist", "description": "Sade ve şık modern aranjman", "price": 649, "category": "tasarim", "image": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Papatya
    papatya_products = [
        {"id": str(uuid.uuid4()), "title": "Papatya Buketi", "description": "Taze papatyalardan neşeli buket", "price": 399, "category": "papatya-gerbera", "image": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Gerbera Aranjmanı", "description": "Renkli gerberalardan canlı aranjman", "price": 549, "category": "papatya-gerbera", "image": "https://images.unsplash.com/photo-1518882605630-8eb573696572?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    all_products = gul_products + orkide_products + tasarim_products + papatya_products
    await db.products.insert_many(all_products)
    
    return {
        "message": "Veritabanı başarıyla dolduruldu",
        "categories_count": len(categories_data),
        "banners_count": len(banners_data),
        "products_count": len(all_products)
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
