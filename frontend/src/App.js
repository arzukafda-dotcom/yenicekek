import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ===== LOGO COMPONENT (Pink Hearts Style) =====
const Logo = () => (
  <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
    <div className="flex">
      <svg viewBox="0 0 32 32" className="w-8 h-8 text-pink-500 fill-current">
        <path d="M16 28l-1.8-1.6C6.4 19.2 2 15.2 2 10.4 2 6.4 5.2 3.2 9.2 3.2c2.2 0 4.4 1 5.8 2.6L16 7l1-1.2C18.4 4.2 20.6 3.2 22.8 3.2 26.8 3.2 30 6.4 30 10.4c0 4.8-4.4 8.8-12.2 16L16 28z"/>
      </svg>
      <svg viewBox="0 0 32 32" className="w-8 h-8 text-pink-500 fill-current -ml-2">
        <path d="M16 28l-1.8-1.6C6.4 19.2 2 15.2 2 10.4 2 6.4 5.2 3.2 9.2 3.2c2.2 0 4.4 1 5.8 2.6L16 7l1-1.2C18.4 4.2 20.6 3.2 22.8 3.2 26.8 3.2 30 6.4 30 10.4c0 4.8-4.4 8.8-12.2 16L16 28z"/>
      </svg>
    </div>
    <span className="text-2xl font-bold">
      <span className="text-pink-500">Çiçekçi</span>
      <span className="text-green-600">Burada</span>
    </span>
  </Link>
);

// ===== SEARCH ICON =====
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8L20 20.5 21.5 19 16.5 14zM6.5 11a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0z"/>
  </svg>
);

// ===== CHEVRON ICON =====
const ChevronIcon = ({ isOpen, className = "w-5 h-5" }) => (
  <svg className={`${className} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ===== CATEGORY ICONS =====
const categoryIcons = {
  "gul": "🌹",
  "orkide": "🌸",
  "tasarim": "💐",
  "papatya-gerbera": "🌼",
  "karanfil": "🌺",
  "lilyum": "🌷",
  "aycicegi": "🌻",
  "cicek-sepeti": "🧺",
  "saksi-cicekleri": "🪴",
  "dogum-gunu": "🎂",
  "sevgi": "❤️",
  "premium": "⭐",
};

// ===== TOP HEADER (Removed as per request) =====

// ===== MAIN HEADER =====
const MainHeader = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/ara?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        <Logo />
        
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <input
              type="text"
              placeholder="Ürün veya kategori ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border-0 focus:outline-none text-gray-700 text-sm"
              data-testid="header-search-input"
            />
            <button 
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 px-4 border-l border-gray-300 transition-colors"
              data-testid="header-search-btn"
            >
              <SearchIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </form>
        
        <div className="flex items-center">
          {/* Empty space - no login/register buttons */}
        </div>
      </div>
    </div>
  );
};

// ===== CATEGORY NAV BAR =====
const CategoryNavBar = ({ categories }) => {
  const mainCategories = [
    { name: "ÇİÇEKLER", slug: "tumu", icon: "🌸" },
    { name: "DOĞUM GÜNÜ", slug: "dogum-gunu", icon: "🎂" },
    { name: "SEVGİ & AŞK", slug: "gul", icon: "❤️" },
    { name: "PREMİUM ÇİÇEKLER", slug: "orkide", icon: "⭐" },
    { name: "TASARIM", slug: "tasarim", icon: "💐" },
  ];

  return (
    <div className="bg-green-500 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-center gap-2 py-3">
          {mainCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/kategori/${cat.slug}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm whitespace-nowrap"
              data-testid={`nav-category-${cat.slug}`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

// ===== CIRCULAR CATEGORY ICONS =====
const CircularCategories = ({ categories }) => {
  const displayCategories = [
    { name: "Kokina", slug: "tasarim", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=120&h=120&fit=crop" },
    { name: "Doğum Günü", slug: "dogum-gunu", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=120&h=120&fit=crop" },
    { name: "Sevgi & Aşk", slug: "gul", image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=120&h=120&fit=crop" },
    { name: "Çiçek Buketleri", slug: "tasarim", image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=120&h=120&fit=crop" },
    { name: "Saksı Çiçekleri", slug: "orkide", image: "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=120&h=120&fit=crop" },
    { name: "Yeni İş", slug: "tasarim", image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=120&h=120&fit=crop" },
    { name: "Orkide", slug: "orkide", image: "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?w=120&h=120&fit=crop" },
    { name: "Geçmiş Olsun", slug: "papatya-gerbera", image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=120&h=120&fit=crop" },
    { name: "Gül Çeşitleri", slug: "gul", image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=120&h=120&fit=crop" },
  ];

  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white py-4 border-b border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          data-testid="scroll-left-btn"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* Categories */}
        <div 
          ref={scrollRef}
          className="flex items-start gap-8 overflow-x-auto scrollbar-hide px-8"
        >
          {displayCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/kategori/${cat.slug}`}
              className="flex flex-col items-center gap-2 min-w-[70px] group flex-shrink-0"
              data-testid={`circular-category-${idx}`}
            >
              <div className="w-[70px] h-[70px] rounded-full border-2 border-red-300 overflow-hidden bg-gray-100 group-hover:border-red-500 group-hover:shadow-lg transition-all p-0.5">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-xs text-gray-700 text-center font-medium group-hover:text-green-600 transition-colors whitespace-nowrap">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          data-testid="scroll-right-btn"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ===== HERO SLIDER =====
const HeroSlider = ({ banners }) => {
  return (
    <div className="bg-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left Banner - Kokina */}
          <Link
            to="/kategori/tasarim"
            className="relative rounded-lg overflow-hidden h-72 md:h-96 group"
            data-testid="hero-banner-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-800 via-red-700 to-red-900" />
            <img 
              src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=500&h=500&fit=crop"
              alt="Kokina"
              className="absolute left-4 bottom-4 w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg shadow-2xl group-hover:scale-105 transition-transform duration-500"
            />
            {/* Decorative ornaments */}
            <div className="absolute top-4 right-4 text-6xl opacity-30">🎄</div>
            <div className="absolute top-20 right-20 text-4xl opacity-40">🔴</div>
            <div className="absolute bottom-10 right-10 text-3xl opacity-30">🟡</div>
            
            <div className="absolute top-1/2 right-6 -translate-y-1/2 text-right text-white">
              <p className="text-sm opacity-90 font-medium">Yeni Yılın</p>
              <p className="text-sm opacity-90 font-medium">Gözdesi:</p>
              <h3 className="text-4xl md:text-5xl font-black mt-2 tracking-wide">KOKİNA</h3>
            </div>
          </Link>

          {/* Right Banner - Kırmızı Güller */}
          <Link
            to="/kategori/gul"
            className="relative rounded-lg overflow-hidden h-72 md:h-96 group"
            data-testid="hero-banner-1"
          >
            <img 
              src="https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&h=600&fit=crop"
              alt="Kırmızı Güller"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent" />
            <div className="absolute top-1/2 right-6 -translate-y-1/2 text-right text-white">
              <p className="text-xs uppercase tracking-wider opacity-80 font-semibold">Kırmızı Gül</p>
              <p className="text-sm opacity-90 mt-1">Kalpten Kalbe</p>
              <p className="text-sm opacity-90">Giden Yol:</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-2">Kırmızı Güller</h3>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

// ===== PRODUCT CARD =====
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/urun/${product.id}`)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.badge && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {product.badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-green-600">{product.price}</span>
          <span className="text-sm text-gray-500">,00 TL</span>
        </div>
      </div>
    </div>
  );
};

// ===== PRODUCT SECTION =====
const ProductSection = ({ title, subtitle, products, viewAllLink }) => (
  <section className="py-8" data-testid={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="flex items-center gap-1 text-green-600 font-semibold text-sm hover:text-green-700 transition-colors"
          >
            Tümünü Gör
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  </section>
);

// ===== FOOTER =====
const Footer = () => {
  const [openAccordion, setOpenAccordion] = useState(null);
  
  const footerSections = [
    {
      title: "Çiçeğe Dair",
      items: [
        { name: "Şehirlere Çiçek", link: "/" },
        { name: "Çiçek Gönder", link: "/" },
        { name: "Çiçek Market", link: "/" },
        { name: "Çiçekçi", link: "/" },
      ]
    },
    {
      title: "Kurumsal",
      items: [
        { name: "Hakkımızda", link: "/hakkimizda" },
        { name: "Kariyer", link: "/" },
        { name: "Basın Odası", link: "/" },
      ]
    },
    {
      title: "Bize Ulaşın",
      items: [
        { name: "Ödeme Yöntemleri", link: "/" },
        { name: "İşletme Bilgileri", link: "/" },
        { name: "Site Haritası", link: "/" },
      ]
    },
    {
      title: "Politikalarımız",
      items: [
        { name: "Gizlilik Politikası", link: "/" },
        { name: "KVKK Aydınlatma Metni", link: "/" },
        { name: "Çerez Politikası", link: "/" },
      ]
    },
  ];

  return (
    <footer className="bg-gray-100 mt-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Desktop Footer */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-gray-900 mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <Link to={item.link} className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Footer Accordion */}
        <div className="md:hidden space-y-2">
          {footerSections.map((section, idx) => (
            <div key={idx} className="border-b border-gray-200">
              <button
                onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)}
                className="w-full flex items-center justify-between py-4 text-left font-semibold text-gray-900"
              >
                {section.title}
                <ChevronIcon isOpen={openAccordion === idx} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openAccordion === idx ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link to={item.link} className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ÇiçekZamanı. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ===== BACK TO TOP =====
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 bottom-6 w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-all z-50 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      data-testid="back-to-top-btn"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  );
};

// ===== HOME PAGE =====
const HomePage = ({ products, banners, categories }) => {
  const bestsellers = products.filter(p => p.is_bestseller);
  const gulProducts = products.filter(p => p.category === 'gul');
  const orkideProducts = products.filter(p => p.category === 'orkide');
  const tasarimProducts = products.filter(p => p.category === 'tasarim');

  return (
    <div data-testid="home-page">
      <CircularCategories categories={categories} />
      <HeroSlider banners={banners} />
      
      <div className="bg-gray-50">
        <div className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900">Türkiye Geneline Çiçek Gönder</h2>
          </div>
        </div>
        
        {bestsellers.length > 0 && (
          <ProductSection 
            title="En Çok Satılanlar" 
            subtitle="Bu hafta en çok tercih edilen çiçekler"
            products={bestsellers}
            viewAllLink="/kategori/tumu"
          />
        )}
        
        {gulProducts.length > 0 && (
          <ProductSection 
            title="Güller" 
            subtitle="Aşkın en klasik hali"
            products={gulProducts}
            viewAllLink="/kategori/gul"
          />
        )}
        
        {orkideProducts.length > 0 && (
          <ProductSection 
            title="Orkideler" 
            subtitle="Şık, zarif ve kalıcı hediye"
            products={orkideProducts}
            viewAllLink="/kategori/orkide"
          />
        )}
        
        {tasarimProducts.length > 0 && (
          <ProductSection 
            title="Tasarım Çiçekler" 
            subtitle="Özel aranjmanlar ve butik işler"
            products={tasarimProducts}
            viewAllLink="/kategori/tasarim"
          />
        )}
      </div>
    </div>
  );
};

// ===== CATEGORY PAGE =====
const CategoryPage = ({ products, categories }) => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  
  const filteredProducts = slug === 'tumu' 
    ? products 
    : products.filter(p => p.category === slug);

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="category-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {category ? `${categoryIcons[slug] || '🌸'} ${category.name}` : slug === 'tumu' ? '🌸 Tüm Ürünler' : 'Kategori'}
          </h1>
          {category?.description && (
            <p className="text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">{filteredProducts.length} ürün bulundu</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Bu kategoride henüz ürün bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

// ===== PRODUCT DETAIL PAGE =====
const ProductDetailPage = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center" data-testid="product-not-found">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığınız ürün mevcut değil.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-6 bg-transparent border-0 cursor-pointer text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Geri Dön
        </button>
        
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-square">
              <img 
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-green-600">{product.price}</span>
                <span className="text-lg text-gray-500">,00 TL</span>
                <span className="text-sm text-gray-400">(KDV Dahil)</span>
              </div>
              
              {product.badge && (
                <div className="inline-block px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6">
                  {product.badge}
                </div>
              )}
              
              {product.description && (
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>
              )}
              
              <button 
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
                data-testid="add-to-cart-btn"
              >
                Sepete Ekle
              </button>
              
              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <div className="font-semibold text-gray-900">Aynı Gün Teslimat</div>
                    <div className="text-sm">14:00'a kadar verilen siparişler aynı gün teslim edilir</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SEARCH RESULTS PAGE =====
const SearchResultsPage = ({ products }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  const results = products.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="search-results-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          "{query}" için arama sonuçları
        </h1>
        <p className="text-gray-500 mb-6">{results.length} ürün bulundu</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aramanızla eşleşen ürün bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};

// ===== ABOUT PAGE =====
const AboutPage = () => (
  <div className="bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto px-4 py-12" data-testid="about-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <p className="text-gray-600 leading-relaxed mb-4">
          ÇiçekZamanı, 2024 yılında kurulmuş online çiçek sipariş platformudur. 
          Türkiye'nin dört bir yanına aynı gün teslimat garantisi ile en taze çiçekleri ulaştırıyoruz.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Misyonumuz, her özel anınızı çiçeklerle daha da güzelleştirmek. 
          Doğum günleri, yıldönümleri, sevgililer günü ve diğer tüm özel günlerinizde yanınızdayız.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Kaliteli çiçekler, profesyonel aranjmanlar ve güvenilir teslimat hizmeti ile 
          müşteri memnuniyetini en üst düzeyde tutmayı hedefliyoruz.
        </p>
      </div>
    </div>
  </div>
);

// ===== MAIN LAYOUT =====
const Layout = ({ children, categories }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <MainHeader />
    <CategoryNavBar categories={categories} />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
    <BackToTop />
  </div>
);

// ===== APP =====
function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      try {
        await axios.post(`${API}/seed`);
      } catch (e) {
        // Ignore seed errors
      }

      const [productsRes, categoriesRes, bannersRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/banners`),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBanners(bannersRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 32 32" className="w-12 h-12 text-pink-500 fill-current animate-pulse">
              <path d="M16 28l-1.8-1.6C6.4 19.2 2 15.2 2 10.4 2 6.4 5.2 3.2 9.2 3.2c2.2 0 4.4 1 5.8 2.6L16 7l1-1.2C18.4 4.2 20.6 3.2 22.8 3.2 26.8 3.2 30 6.4 30 10.4c0 4.8-4.4 8.8-12.2 16L16 28z"/>
            </svg>
          </div>
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Layout categories={categories}>
          <Routes>
            <Route path="/" element={<HomePage products={products} banners={banners} categories={categories} />} />
            <Route path="/kategori/:slug" element={<CategoryPage products={products} categories={categories} />} />
            <Route path="/urun/:id" element={<ProductDetailPage products={products} />} />
            <Route path="/ara" element={<SearchResultsPage products={products} />} />
            <Route path="/hakkimizda" element={<AboutPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
