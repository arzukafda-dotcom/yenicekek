import json
import time
import random
import requests
import os
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Güvenli isim fonksiyonları
def safe_name(name):
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    name = re.sub(r'\s+', ' ', name).strip()
    if len(name) > 100:
        name = name[:100]
    return name

def get_unique_folder(parent_path, base_folder_name):
    folder_name = base_folder_name
    folder_path = os.path.join(parent_path, folder_name)
    counter = 2
    while os.path.exists(folder_path):
        folder_name = f"{base_folder_name} ({counter})"
        folder_path = os.path.join(parent_path, folder_name)
        counter += 1
    os.makedirs(folder_path, exist_ok=True)
    return folder_path, folder_name

# Session oluştur
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
})

# Kategoriler
categories = [
    {"url": "https://www.ciceksepeti.vip/cicek/kokina/", "name": "Kokina"},
    {"url": "https://www.ciceksepeti.vip/cicek/dogum-gunu-cicekleri/", "name": "Dogum_Gunu_Cicekleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/sevgiliye-cicek/", "name": "Sevgiliye_Cicek"},
    {"url": "https://www.ciceksepeti.vip/cicek/cicek-buketleri/", "name": "Cicek_Buketleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/saksi-cicekleri/", "name": "Saksi_Cicekleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/yeni-ise-cicek/", "name": "Yeni_Ise_Cicek"},
    {"url": "https://www.ciceksepeti.vip/cicek/orkide/", "name": "Orkide"},
    {"url": "https://www.ciceksepeti.vip/cicek/gecmis-olsun-cicekleri/", "name": "Gecmis_Olsun_Cicekleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/gul/", "name": "Gul"},
    {"url": "https://www.ciceksepeti.vip/cicek/acilis-toren-cicekleri/", "name": "Acilis_Toren_Cicekleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/yeni-bebek-cicekleri/", "name": "Yeni_Bebek_Cicekleri"},
    {"url": "https://www.ciceksepeti.vip/cicek/aycicegi/", "name": "Aycicegi"},
    {"url": "https://www.ciceksepeti.vip/cicek/papatya-gerbera/", "name": "Papatya_Gerbera"},
    {"url": "https://www.ciceksepeti.vip/cicek/antoryum/", "name": "Antoryum"},
    {"url": "https://www.ciceksepeti.vip/cicek/husnuyusuf/", "name": "Husnuyusuf"},
    {"url": "https://www.ciceksepeti.vip/cicek/tasarim-cicekler/", "name": "Tasarim_Cicekler"},
    {"url": "https://www.ciceksepeti.vip/cicek/kirmizi-gul/", "name": "Kirmizi_Gul"},
    {"url": "https://www.ciceksepeti.vip/cicek/beyaz-gul/", "name": "Beyaz_Gul"},
    {"url": "https://www.ciceksepeti.vip/cicek/nikah-dugun-cicekleri/", "name": "Nikah_Dugun_Cicekleri"}
]

# Ana images klasörü
if not os.path.exists("images"):
    os.makedirs("images")

all_products = []

for cat_idx, cat in enumerate(categories):
    cat_url = cat["url"]
    cat_name = cat["name"]
    cat_folder = os.path.join("images", cat_name)
    if not os.path.exists(cat_folder):
        os.makedirs(cat_folder)

    print(f"\n=== {cat_idx+1}/{len(categories)} Kategori: {cat_name} ===")
    print(f"URL: {cat_url}")

    try:
        # Kategori sayfasını çek
        response = session.get(cat_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Ürün kartlarını bul
        product_cards = soup.select("div.o-productCard")
        
        if not product_cards:
            # Alternatif selector dene
            product_cards = soup.select("a.o-productCard__link")
        
        print(f"{len(product_cards)} ürün bulundu.")
        products_data = []

        for index, card in enumerate(product_cards):
            try:
                # Ürün bilgilerini çıkar
                link_elem = card.select_one("a.o-productCard__link") or card
                product_link = link_elem.get("href", "")
                if product_link and not product_link.startswith("http"):
                    product_link = urljoin(cat_url, product_link)
                
                name_elem = card.select_one("strong.o-productCard__name")
                product_name = name_elem.text.strip() if name_elem else f"Ürün {index+1}"
                
                price_elem = card.select_one("span.o-productCard__priceContent--value")
                price = price_elem.text.strip() + ",00 TL" if price_elem else "Fiyat bulunamadı"
                
                # Ürün görseli
                img_elem = card.select_one("img")
                image_url = ""
                if img_elem:
                    image_url = img_elem.get("src") or img_elem.get("data-src") or ""
                    if image_url and image_url.startswith("//"):
                        image_url = "https:" + image_url

                print(f"[{index+1}/{len(product_cards)}] {product_name} - {price}")

                # Ürün detay sayfasını çek (opsiyonel - daha fazla görsel için)
                all_images = []
                description = ""
                contents = []
                product_code = "Bilinmiyor"
                
                if product_link:
                    try:
                        time.sleep(random.uniform(1, 2))  # Rate limiting
                        detail_response = session.get(product_link, timeout=30)
                        detail_soup = BeautifulSoup(detail_response.text, "html.parser")
                        
                        # Başlık
                        title_elem = detail_soup.select_one("h1.o-productDetail__title")
                        if title_elem:
                            product_name = title_elem.text.strip()
                        
                        # Ürün kodu
                        code_elem = detail_soup.find("span", string=lambda t: t and "Çiçek Sepeti Kodu:" in t if t else False)
                        if code_elem:
                            next_span = code_elem.find_next("span")
                            if next_span:
                                product_code = next_span.text.strip()
                        
                        # Görseller
                        for img in detail_soup.select("div.gallery-top img, div.swiper-slide img"):
                            src = img.get("src") or img.get("data-src") or ""
                            if src:
                                if src.startswith("//"):
                                    src = "https:" + src
                                if "cdn.ciceksepeti.vip" in src or "ciceksepeti" in src:
                                    all_images.append(src)
                        
                        # Thumbnail'lardan büyük görseller
                        for thumb in detail_soup.select("div.gallery-thumbs div.swiper-slide"):
                            style = thumb.get("style", "")
                            if "background-image" in style:
                                try:
                                    src = style.split('url("')[1].split('")')[0]
                                    src = src.replace("/s/", "/l/")  # Büyük versiyon
                                    if src.startswith("//"):
                                        src = "https:" + src
                                    all_images.append(src)
                                except:
                                    pass
                        
                        # Açıklama
                        desc_elem = detail_soup.select_one("div.m-productContent__info")
                        if desc_elem:
                            description = desc_elem.get_text(strip=True, separator="\n")
                            contents = [li.get_text(strip=True) for li in desc_elem.select("ul li")]
                        
                    except Exception as e:
                        print(f"   Detay sayfası hatası: {e}")
                
                # Eğer detaydan görsel gelemediyse, kart görselini kullan
                if not all_images and image_url:
                    all_images = [image_url]
                
                # Tekrarları kaldır
                all_images = list(dict.fromkeys(all_images))
                
                # Klasör oluştur ve görselleri indir
                downloaded_images = []
                if all_images:
                    base_folder = safe_name(product_name)
                    product_folder_path, folder_name = get_unique_folder(cat_folder, base_folder)
                    
                    for i, img_url in enumerate(all_images[:5]):  # Max 5 görsel
                        try:
                            img_response = session.get(img_url, timeout=20)
                            img_response.raise_for_status()
                            filename = f"{i+1}.jpg"
                            path = os.path.join(product_folder_path, filename)
                            with open(path, "wb") as f:
                                f.write(img_response.content)
                            downloaded_images.append(os.path.join(cat_name, folder_name, filename))
                            print(f"   Görsel {i+1} indirildi")
                        except Exception as e:
                            print(f"   Görsel {i+1} indirilemedi: {e}")
                else:
                    folder_name = safe_name(product_name)

                product_data = {
                    "product_code": product_code,
                    "name": product_name,
                    "price": price,
                    "url": product_link,
                    "category": cat_name,
                    "folder": os.path.join(cat_name, folder_name) if downloaded_images else "",
                    "local_images": downloaded_images,
                    "all_images": all_images,
                    "contents": contents,
                    "description": description
                }
                
                products_data.append(product_data)
                all_products.append(product_data)

            except Exception as e:
                print(f"   Ürün hatası: {e}")
                continue

        # Kategori JSON'u kaydet
        json_file = f"{cat_name.lower()}_urunler.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(products_data, f, ensure_ascii=False, indent=2)
        print(f"✅ {cat_name} tamamlandı! {len(products_data)} ürün kaydedildi.")

    except Exception as e:
        print(f"❌ Kategori hatası ({cat_name}): {e}")

    time.sleep(random.uniform(3, 5))  # Kategoriler arası bekleme

# Tüm ürünleri tek dosyada kaydet
with open("tum_urunler.json", "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Tüm kategoriler tamamlandı!")
print(f"📦 Toplam {len(all_products)} ürün çekildi.")
print(f"📁 Ürünler 'images' klasöründe ve JSON dosyalarında kaydedildi.")
