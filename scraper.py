import json
import time
import random
import requests
import os
import re
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import *

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

# Her kategori için ayrı driver
for cat_idx, cat in enumerate(categories):
    cat_url = cat["url"]
    cat_name = cat["name"]
    cat_folder = os.path.join("images", cat_name)
    if not os.path.exists(cat_folder):
        os.makedirs(cat_folder)

    print(f"\n=== {cat_idx+1}/{len(categories)} Kategori: {cat_name} ===")

    # Yeni driver başlat
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_argument("--headless=new")  # Headless mod aktif

    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => false});")

        driver.get(cat_url)
        time.sleep(6 + random.uniform(1, 3))

        # Ürünleri bul
        try:
            product_cards = WebDriverWait(driver, 20).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.o-productCard > a.o-productCard__link"))
            )
        except:
            product_cards = driver.find_elements(By.CSS_SELECTOR, "div.o-productCard > a.o-productCard__link")

        print(f"{len(product_cards)} ürün bulundu.")
        products_data = []

        for index, card in enumerate(product_cards):
            try:
                product_name = card.find_element(By.CSS_SELECTOR, "strong.o-productCard__name").text.strip()
                product_link = card.get_attribute("href")
                try:
                    price_text = card.find_element(By.CSS_SELECTOR, "span.o-productCard__priceContent--value").text.strip()
                    price = price_text + ",00 TL"
                except:
                    price = "Fiyat bulunamadı"

                print(f"[{index+1}/{len(product_cards)}] İşleniyor: {product_name}")

                driver.execute_script("window.open('');")
                driver.switch_to.window(driver.window_handles[1])
                driver.get(product_link)

                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h1.o-productDetail__title"))
                )
                time.sleep(3 + random.uniform(1, 3))

                soup = BeautifulSoup(driver.page_source, "html.parser")

                # Ürün detayları (aynı kalıyor)
                title = soup.select_one("h1.o-productDetail__title").text.strip() if soup.select_one("h1.o-productDetail__title") else product_name
                product_code = "Bilinmiyor"
                code_elem = soup.find("span", string=lambda t: t and "Çiçek Sepeti Kodu:" in t)
                if code_elem:
                    product_code = code_elem.find_next("span").text.strip()

                # Görselleri topla
                all_images = set()
                for img in soup.select("div.gallery-top img"):
                    src = img.get("src") or img.get("data-src") or ""
                    if src and "cdn.ciceksepeti.vip" in src:
                        full = "https:" + src if src.startswith("//") else src
                        all_images.add(full)

                for thumb in soup.select("div.gallery-thumbs div.swiper-slide"):
                    style = thumb.get("style") or ""
                    if "background-image" in style:
                        try:
                            src = style.split('url("')[1].split('")')[0]
                            big_src = src.replace("/s/", "/l/")
                            full = "https:" + big_src if big_src.startswith("//") else big_src
                            all_images.add(full)
                        except:
                            pass

                all_images = sorted(list(all_images))

                # Klasör oluştur
                base_folder = safe_name(title)
                product_folder_path, folder_name = get_unique_folder(cat_folder, base_folder)
                print(f"   Klasör: {cat_name}/{folder_name}")

                # Görselleri indir
                downloaded_images = []
                headers = {"User-Agent": "Mozilla/5.0", "Referer": product_link}
                for i, img_url in enumerate(all_images):
                    try:
                        response = requests.get(img_url, headers=headers, timeout=20)
                        response.raise_for_status()
                        filename = f"{i+1}.jpg"
                        path = os.path.join(product_folder_path, filename)
                        with open(path, "wb") as f:
                            f.write(response.content)
                        downloaded_images.append(os.path.join(cat_name, folder_name, filename))
                        print(f"   İndirildi ({i+1}/{len(all_images)}): {filename}")
                    except Exception as e:
                        print(f"   İndirilemedi ({i+1}): {e}")

                # Açıklama vb.
                description = soup.select_one("div.m-productContent__info").get_text(strip=True, separator="\n") if soup.select_one("div.m-productContent__info") else ""
                contents = [li.get_text(strip=True) for li in soup.select("div.m-productContent__info ul li")]

                products_data.append({
                    "product_code": product_code,
                    "name": title,
                    "price": price,
                    "url": product_link,
                    "folder": os.path.join(cat_name, folder_name),
                    "local_images": downloaded_images,
                    "all_images": all_images,
                    "contents": contents,
                    "description": description
                })

                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                time.sleep(4 + random.uniform(2, 5))

            except Exception as e:
                print(f"   Ürün atlandı (hata): {e}")
                try:
                    if len(driver.window_handles) > 1:
                        driver.close()
                        driver.switch_to.window(driver.window_handles[0])
                except:
                    pass
                time.sleep(5)

        # Kategori JSON
        json_file = f"{cat_name.lower()}_urunler.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(products_data, f, ensure_ascii=False, indent=2)
        print(f"{cat_name} tamamlandı! {len(products_data)} ürün.")

    except Exception as e:
        print(f"Kategori hatası ({cat_name}): {e}")

    finally:
        try:
            driver.quit()
        except:
            pass

    time.sleep(10)  # Kategoriler arası dinlenme

print("\nTüm kategoriler tamamlandı! 🎉")
