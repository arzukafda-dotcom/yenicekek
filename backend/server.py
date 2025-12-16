from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File
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
import json
import httpx


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


# Pagination Response Model
class PaginatedProducts(BaseModel):
    products: List[Product]
    total: int
    page: int
    per_page: int
    total_pages: int


# Product Routes
@api_router.get("/products")
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    bestseller: Optional[bool] = Query(None, description="Filter bestsellers"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(24, ge=1, le=100, description="Items per page")
):
    query = {}
    if category:
        query["category"] = category
    if bestseller is not None:
        query["is_bestseller"] = bestseller
    
    # Get total count
    total = await db.products.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = (total + per_page - 1) // per_page  # Ceiling division
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(per_page).to_list(per_page)
    
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

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


# ===== IMPORT ENDPOINTS =====

# Kategori slug mapping (scraper format -> site format)
CATEGORY_MAPPING = {
    "Kokina": "kokina",
    "Dogum_Gunu_Cicekleri": "dogum-gunu",
    "Sevgiliye_Cicek": "sevgi-ask",
    "Cicek_Buketleri": "cicek-buketleri",
    "Saksi_Cicekleri": "saksi-cicekleri",
    "Yeni_Ise_Cicek": "yeni-is-terfi",
    "Orkide": "orkide",
    "Gecmis_Olsun_Cicekleri": "gecmis-olsun",
    "Gul": "gul",
    "Acilis_Toren_Cicekleri": "acilis-kutlama",
    "Yeni_Bebek_Cicekleri": "dogum-yeni-bebek",
    "Aycicegi": "aycicegi",
    "Papatya_Gerbera": "papatya-gerbera",
    "Antoryum": "antoryum",
    "Husnuyusuf": "husnuyusuf",
    "Tasarim_Cicekler": "tasarim",
    "Kirmizi_Gul": "kirmizi-gul",
    "Beyaz_Gul": "beyaz-gul",
    "Nikah_Dugun_Cicekleri": "nikah-dugun",
}

class ImportProductItem(BaseModel):
    product_code: str = ""
    name: str
    price: str
    url: str = ""
    category: str = ""
    folder: str = ""
    local_images: List[str] = []
    all_images: List[str] = []
    contents: List[str] = []
    description: str = ""

class ImportRequest(BaseModel):
    products: List[ImportProductItem]
    category_name: str = ""  # Opsiyonel - JSON dosya adından kategori


@api_router.post("/import/products")
async def import_products(data: ImportRequest):
    """
    Scraper'dan gelen JSON formatında ürünleri içe aktar.
    """
    imported = 0
    skipped = 0
    errors = []
    
    for item in data.products:
        try:
            # Kategori belirle
            category_slug = ""
            if item.category:
                category_slug = CATEGORY_MAPPING.get(item.category, item.category.lower().replace("_", "-"))
            elif data.category_name:
                category_slug = CATEGORY_MAPPING.get(data.category_name, data.category_name.lower().replace("_", "-"))
            
            # Fiyat parse et (örn: "599,00 TL" -> 599)
            price_str = item.price.replace("TL", "").replace(",00", "").replace(".", "").strip()
            try:
                price = int(price_str)
            except:
                price = 0
            
            # Görsel URL seç (ilk görseli kullan)
            image_url = ""
            if item.all_images:
                image_url = item.all_images[0]
            elif item.local_images:
                # Local image path'i URL'e çevir (gerekirse)
                image_url = f"/images/{item.local_images[0]}"
            
            # Badge belirle
            badges = ["Aynı Gün Teslimat", "Hızlı Teslimat", "Özel Fiyat", "Yeni"]
            import random
            badge = random.choice(badges)
            
            # Ürün oluştur
            product_doc = {
                "id": str(uuid.uuid4()),
                "title": item.name,
                "description": item.description or f"{item.name} - Özenle hazırlanmış taze çiçekler",
                "price": price,
                "category": category_slug,
                "image": image_url,
                "badge": badge,
                "is_bestseller": random.random() < 0.15,  # %15 bestseller
                "product_code": item.product_code,
                "source_url": item.url,
                "all_images": item.all_images,
                "contents": item.contents,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Veritabanına ekle
            await db.products.insert_one(product_doc)
            imported += 1
            
        except Exception as e:
            errors.append({"name": item.name, "error": str(e)})
            skipped += 1
    
    return {
        "message": "İçe aktarma tamamlandı",
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:10]  # İlk 10 hata
    }


@api_router.post("/import/json-file")
async def import_json_file(file: UploadFile = File(...)):
    """
    JSON dosyası yükleyerek ürünleri içe aktar.
    Dosya adı kategori adı olarak kullanılır (örn: kokina_urunler.json)
    """
    try:
        content = await file.read()
        products_data = json.loads(content.decode('utf-8'))
        
        # Dosya adından kategori çıkar
        filename = file.filename or ""
        category_name = filename.replace("_urunler.json", "").replace(".json", "")
        
        # ImportRequest oluştur
        import_data = ImportRequest(
            products=[ImportProductItem(**p) for p in products_data],
            category_name=category_name
        )
        
        # Import işlemini çağır
        result = await import_products(import_data)
        result["filename"] = filename
        result["category"] = category_name
        
        return result
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Geçersiz JSON formatı")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İçe aktarma hatası: {str(e)}")


@api_router.delete("/products/clear")
async def clear_all_products():
    """Tüm ürünleri sil (yeni import öncesi kullanılabilir)"""
    result = await db.products.delete_many({})
    return {"message": "Tüm ürünler silindi", "deleted_count": result.deleted_count}


@api_router.get("/import/stats")
async def get_import_stats():
    """Mevcut veritabanı istatistikleri"""
    total_products = await db.products.count_documents({})
    
    # Kategorilere göre ürün sayıları
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_stats = await db.products.aggregate(pipeline).to_list(100)
    
    return {
        "total_products": total_products,
        "categories": category_stats
    }


# Seed Data Route (for initial setup)
@api_router.post("/seed")
async def seed_database():
    # Check if data already exists
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Veritabanı zaten dolu", "products_count": existing_products}
    
    # Categories (Scraper kategorileriyle uyumlu)
    categories_data = [
        {"id": str(uuid.uuid4()), "name": "Kokina", "slug": "kokina", "description": "Yeni yılın gözdesi", "icon": "🎄"},
        {"id": str(uuid.uuid4()), "name": "Doğum Günü Çiçekleri", "slug": "dogum-gunu", "description": "Özel günler için", "icon": "🎂"},
        {"id": str(uuid.uuid4()), "name": "Sevgiliye Çiçek", "slug": "sevgi-ask", "description": "Aşkınızı çiçeklerle ifade edin", "icon": "❤️"},
        {"id": str(uuid.uuid4()), "name": "Çiçek Buketleri", "slug": "cicek-buketleri", "description": "Her ocasyon için buketler", "icon": "💐"},
        {"id": str(uuid.uuid4()), "name": "Saksı Çiçekleri", "slug": "saksi-cicekleri", "description": "Kalıcı saksı bitkileri", "icon": "🪴"},
        {"id": str(uuid.uuid4()), "name": "Yeni İşe Çiçek", "slug": "yeni-is-terfi", "description": "Başarıları kutlayın", "icon": "🎊"},
        {"id": str(uuid.uuid4()), "name": "Orkide", "slug": "orkide", "description": "Şık, zarif ve kalıcı hediye", "icon": "🌸"},
        {"id": str(uuid.uuid4()), "name": "Geçmiş Olsun Çiçekleri", "slug": "gecmis-olsun", "description": "Sevdiklerinize şifa dileyin", "icon": "💐"},
        {"id": str(uuid.uuid4()), "name": "Gül", "slug": "gul", "description": "Aşkın en klasik hali", "icon": "🌹"},
        {"id": str(uuid.uuid4()), "name": "Açılış Tören Çiçekleri", "slug": "acilis-kutlama", "description": "Açılış ve kutlamalar için", "icon": "🎉"},
        {"id": str(uuid.uuid4()), "name": "Çelenk", "slug": "celenk", "description": "Cenaze ve anma çelenkleri", "icon": "🕊️"},
        {"id": str(uuid.uuid4()), "name": "Yeni Bebek", "slug": "dogum-yeni-bebek", "description": "Yeni hayatı kutlayın", "icon": "👶"},
        {"id": str(uuid.uuid4()), "name": "Ayçiçeği", "slug": "aycicegi", "description": "Güneş gibi parlak", "icon": "🌻"},
        {"id": str(uuid.uuid4()), "name": "Papatyalar", "slug": "papatya-gerbera", "description": "Neşeli ve canlı çiçekler", "icon": "🌼"},
        {"id": str(uuid.uuid4()), "name": "Antoryum", "slug": "antoryum", "description": "Egzotik ve şık", "icon": "❤️"},
        {"id": str(uuid.uuid4()), "name": "Hüsnüyusuf", "slug": "husnuyusuf", "description": "Romantik ve zarif", "icon": "💜"},
        {"id": str(uuid.uuid4()), "name": "Tasarım Çiçekler", "slug": "tasarim", "description": "Özel aranjmanlar ve butik işler", "icon": "🎨"},
        {"id": str(uuid.uuid4()), "name": "Kırmızı Gül", "slug": "kirmizi-gul", "description": "Aşkın sembolü kırmızı güller", "icon": "🌹"},
        {"id": str(uuid.uuid4()), "name": "Beyaz Gül", "slug": "beyaz-gul", "description": "Saflık ve zarafetin simgesi", "icon": "🤍"},
        {"id": str(uuid.uuid4()), "name": "Nikah / Düğün", "slug": "nikah-dugun", "description": "Mutlu günlerinize özel", "icon": "💒"},
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
    
    # Products - Papatya / Gerbera
    papatya_products = [
        {"id": str(uuid.uuid4()), "title": "Papatya Buketi", "description": "Taze papatyalardan neşeli buket", "price": 399, "category": "papatya-gerbera", "image": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Gerbera Aranjmanı", "description": "Renkli gerberalardan canlı aranjman", "price": 549, "category": "papatya-gerbera", "image": "https://images.unsplash.com/photo-1518882605630-8eb573696572?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Antoryum
    antoryum_products = [
        {"id": str(uuid.uuid4()), "title": "Kırmızı Antoryum", "description": "Tek dallı kırmızı antoryum şık saksıda", "price": 699, "category": "antoryum", "image": "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Beyaz Antoryum", "description": "Zarif beyaz antoryum seramik saksıda", "price": 749, "category": "antoryum", "image": "https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Kokina
    kokina_products = [
        {"id": str(uuid.uuid4()), "title": "Kokina Aranjmanı", "description": "Yeni yıla özel kokina düzenlemesi", "price": 899, "category": "kokina", "image": "https://images.unsplash.com/photo-1512418490979-92798cec1380?w=400&h=400&fit=crop", "is_bestseller": True, "badge": "Yeni Yıl Özel", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Lüks Kokina Sepeti", "description": "Premium kokina sepet aranjmanı", "price": 1299, "category": "kokina", "image": "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Premium", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Lilyum
    lilyum_products = [
        {"id": str(uuid.uuid4()), "title": "Beyaz Lilyum Buketi", "description": "Mis kokulu beyaz lilyumlar", "price": 649, "category": "lilyum", "image": "https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Pembe Lilyum", "description": "Zarif pembe lilyum aranjmanı", "price": 699, "category": "lilyum", "image": "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Ayçiçeği
    aycicegi_products = [
        {"id": str(uuid.uuid4()), "title": "Ayçiçeği Buketi", "description": "Neşeli ayçiçeği buketi", "price": 449, "category": "aycicegi", "image": "https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Güneş Sepeti", "description": "Ayçiçeği ve mevsim çiçekleri sepeti", "price": 599, "category": "aycicegi", "image": "https://images.unsplash.com/photo-1557844352-761f2565b576?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Çiçek Buketleri
    buket_products = [
        {"id": str(uuid.uuid4()), "title": "Karışık Buket", "description": "Mevsim çiçeklerinden renkli buket", "price": 499, "category": "cicek-buketleri", "image": "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Romantik Buket", "description": "Aşka özel romantik çiçek buketi", "price": 699, "category": "cicek-buketleri", "image": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Products - Saksı Çiçekleri
    saksi_products = [
        {"id": str(uuid.uuid4()), "title": "Bonsai Ağacı", "description": "Şık bonsai ağacı seramik saksıda", "price": 899, "category": "saksi-cicekleri", "image": "https://images.unsplash.com/photo-1567331711402-509c12c41959?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sukulent Set", "description": "3'lü sukulent bitki seti", "price": 399, "category": "saksi-cicekleri", "image": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop", "is_bestseller": False, "badge": "Aynı Gün Teslimat", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    # Generate ~1000 products
    import random
    
    images = [
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518882605630-8eb573696572?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1586968304848-f29e3c95cb2c?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1548586196-aa5803b77379?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1566873535350-a3f5d4a804b7?w=400&h=400&fit=crop",
    ]
    
    product_templates = [
        # Güller
        {"names": ["Kırmızı Gül", "Pembe Gül", "Beyaz Gül", "Sarı Gül", "Turuncu Gül", "Mor Gül"], "category": "gul", "suffix": ["Buketi", "Sepeti", "Aranjmanı", "Kutusu"]},
        {"names": ["7'li Gül", "11'li Gül", "21'li Gül", "31'li Gül", "51'li Gül", "101'li Gül"], "category": "gul", "suffix": ["Buketi", "Sepeti"]},
        # Orkide
        {"names": ["Beyaz Orkide", "Mor Orkide", "Pembe Orkide", "Sarı Orkide", "Mini Orkide", "Jumbo Orkide"], "category": "orkide", "suffix": ["Tek Dal", "Çift Dal", "3 Dal", "5 Dal"]},
        # Lilyum
        {"names": ["Beyaz Lilyum", "Pembe Lilyum", "Sarı Lilyum", "Turuncu Lilyum"], "category": "lilyum", "suffix": ["Buketi", "Sepeti", "Aranjmanı"]},
        # Ayçiçeği
        {"names": ["Ayçiçeği", "Güneş Çiçeği"], "category": "aycicegi", "suffix": ["Buketi", "Sepeti", "5'li", "10'lu", "15'li"]},
        # Papatya/Gerbera
        {"names": ["Papatya", "Gerbera", "Renkli Gerbera", "Beyaz Papatya"], "category": "papatya-gerbera", "suffix": ["Buketi", "Sepeti", "Aranjmanı"]},
        # Tasarım
        {"names": ["Tasarım", "Butik", "Özel", "Premium", "Lüks", "Minimalist", "Modern", "Vintage", "Bohem"], "category": "tasarim", "suffix": ["Aranjman", "Buket", "Sepet", "Kutu"]},
        # Saksı
        {"names": ["Orkide Saksı", "Bonsai", "Sukulent", "Kaktüs", "Monstera", "Zamioculcas", "Ficus", "Pothos"], "category": "saksi-cicekleri", "suffix": ["", "Seti", "Koleksiyonu"]},
        # Antoryum
        {"names": ["Kırmızı Antoryum", "Beyaz Antoryum", "Pembe Antoryum"], "category": "antoryum", "suffix": ["", "Aranjmanı", "Saksıda"]},
        # Kokina
        {"names": ["Kokina", "Atatürk Çiçeği"], "category": "kokina", "suffix": ["", "Aranjmanı", "Sepeti", "Mini"]},
        # Karanfil
        {"names": ["Kırmızı Karanfil", "Beyaz Karanfil", "Pembe Karanfil", "Renkli Karanfil"], "category": "karanfil", "suffix": ["Buketi", "Sepeti"]},
        # Hüsnüyusuf
        {"names": ["Hüsnüyusuf", "Leylak"], "category": "husnuyusuf", "suffix": ["Buketi", "Aranjmanı"]},
        # Çiçek Buketleri
        {"names": ["Mevsim Çiçekleri", "Kır Çiçekleri", "Romantik", "Sevgi", "Aşk", "Özel Gün"], "category": "cicek-buketleri", "suffix": ["Buketi", "Sepeti", "Aranjmanı"]},
    ]
    
    badges = ["Aynı Gün Teslimat", "Hızlı Teslimat", "Özel Fiyat", "Çok Satan", "Yeni", "Premium"]
    
    extra_products = []
    product_id = 1
    
    for template in product_templates:
        for name in template["names"]:
            for suffix in template["suffix"]:
                for i in range(5):  # Her kombinasyon için 5 varyasyon
                    title = f"{name} {suffix}".strip()
                    if i > 0:
                        title = f"{title} #{i+1}"
                    
                    price = random.randint(29, 299) * 10 + 9  # 299 - 2999 arası
                    
                    extra_products.append({
                        "id": str(uuid.uuid4()),
                        "title": title,
                        "description": f"{title} - Özenle hazırlanmış taze çiçekler ile sevdiklerinizi mutlu edin",
                        "price": price,
                        "category": template["category"],
                        "image": images[product_id % len(images)],
                        "is_bestseller": random.random() < 0.1,
                        "badge": random.choice(badges),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    product_id += 1
    
    all_products = gul_products + orkide_products + tasarim_products + papatya_products + antoryum_products + kokina_products + lilyum_products + aycicegi_products + buket_products + saksi_products + extra_products
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
