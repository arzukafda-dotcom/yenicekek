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

// ===== HAMBURGER ICON =====
const HamburgerIcon = () => (
  <div className="flex flex-col gap-1.5">
    <span className="w-6 h-0.5 bg-white rounded"></span>
    <span className="w-6 h-0.5 bg-white rounded"></span>
    <span className="w-6 h-0.5 bg-white rounded"></span>
  </div>
);

// ===== MOBILE LOGO (Red hearts for green header) =====
const MobileLogo = () => (
  <Link to="/" className="flex items-center gap-1" data-testid="mobile-logo-link">
    <div className="flex">
      <svg viewBox="0 0 32 32" className="w-6 h-6 text-red-500 fill-current">
        <path d="M16 28l-1.8-1.6C6.4 19.2 2 15.2 2 10.4 2 6.4 5.2 3.2 9.2 3.2c2.2 0 4.4 1 5.8 2.6L16 7l1-1.2C18.4 4.2 20.6 3.2 22.8 3.2 26.8 3.2 30 6.4 30 10.4c0 4.8-4.4 8.8-12.2 16L16 28z"/>
      </svg>
      <svg viewBox="0 0 32 32" className="w-6 h-6 text-red-500 fill-current -ml-1">
        <path d="M16 28l-1.8-1.6C6.4 19.2 2 15.2 2 10.4 2 6.4 5.2 3.2 9.2 3.2c2.2 0 4.4 1 5.8 2.6L16 7l1-1.2C18.4 4.2 20.6 3.2 22.8 3.2 26.8 3.2 30 6.4 30 10.4c0 4.8-4.4 8.8-12.2 16L16 28z"/>
      </svg>
    </div>
    <span className="text-lg font-bold text-white">çiçekçiBurada</span>
  </Link>
);

// ===== MAIN HEADER =====
const MainHeader = ({ onMenuToggle }) => {
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
    <>
      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="w-full px-4 py-3 flex items-center gap-6">
          <Logo />
          
          <form onSubmit={handleSearch} className="flex-1">
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
        </div>
      </div>

      {/* Mobile Header - Green Bar */}
      <div className="md:hidden bg-green-500">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={onMenuToggle}
            className="p-2"
            data-testid="mobile-menu-btn"
          >
            <HamburgerIcon />
          </button>
          
          <MobileLogo />
          
          <button className="p-2 text-white" data-testid="mobile-search-btn">
            <SearchIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </>
  );
};

// ===== CATEGORY NAV BAR (Desktop Only) =====
const CategoryNavBar = ({ categories }) => {
  const [openMenu, setOpenMenu] = useState(null);
  
  const mainCategories = [
    { name: "ÇİÇEKLER", slug: "tumu", icon: "🌸", hasDropdown: true },
    { name: "DOĞUM GÜNÜ", slug: "dogum-gunu", icon: "🎂", hasDropdown: false },
    { name: "SEVGİ & AŞK", slug: "sevgi-ask", icon: "❤️", hasDropdown: false },
    { name: "PREMIUM ÇİÇEKLER", slug: "orkide", icon: "🌸", hasDropdown: false },
    { name: "MEYVE ÇİÇEK", slug: "tasarim", icon: "🍎", hasDropdown: false },
  ];

  const amacaGore = [
    { name: "Geçmiş Olsun", slug: "gecmis-olsun" },
    { name: "Yeni İş / Terfi", slug: "yeni-is-terfi" },
    { name: "Doğum / Yeni Bebek", slug: "dogum-yeni-bebek" },
    { name: "Yıl Dönümü", slug: "yil-donumu" },
    { name: "Tasarım Çiçekler", slug: "tasarim" },
    { name: "Çiçek Buketleri", slug: "cicek-buketleri" },
    { name: "Nikah / Düğün", slug: "nikah-dugun" },
    { name: "Açılış / Kutlama", slug: "acilis-kutlama" },
    { name: "Cenaze Çelenkleri", slug: "celenk" },
    { name: "Ferforje", slug: "ferforje" },
    { name: "Çelenk", slug: "celenk" },
  ];

  const uruneGore = [
    { name: "Orkide", slug: "orkide" },
    { name: "Gül", slug: "gul" },
    { name: "Papatya / Gerbera", slug: "papatya-gerbera" },
    { name: "Saksı Çiçekleri", slug: "saksi-cicekleri" },
    { name: "Lilyum", slug: "lilyum" },
    { name: "Ayçiçeği", slug: "aycicegi" },
    { name: "Hüsnüyusuf", slug: "husnuyusuf" },
    { name: "Karanfil", slug: "karanfil" },
    { name: "Antoryum", slug: "antoryum" },
    { name: "Kokina", slug: "kokina" },
  ];

  return (
    <div className="hidden md:block bg-green-500 text-white relative">
      <div className="w-full px-4">
        <nav className="flex items-center gap-1 py-2">
          {mainCategories.map((cat, idx) => (
            <div 
              key={cat.slug}
              className="relative"
              onMouseEnter={() => cat.hasDropdown && setOpenMenu(idx)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={`/kategori/${cat.slug}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap ${
                  idx === 0 ? 'text-green-500 bg-white' : 'hover:bg-green-600'
                }`}
                data-testid={`nav-category-${cat.slug}`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
              
              {/* Mega Dropdown */}
              {cat.hasDropdown && openMenu === idx && (
                <div 
                  className="absolute top-full left-0 bg-white text-gray-800 shadow-xl rounded-b-lg py-6 px-8 z-50 min-w-[600px]"
                  style={{ marginTop: '0px' }}
                >
                  <div className="grid grid-cols-2 gap-8">
                    {/* AMACA GÖRE */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">AMACA GÖRE</h4>
                      <ul className="space-y-2">
                        {amacaGore.map((item) => (
                          <li key={item.slug}>
                            <Link 
                              to={`/kategori/${item.slug}`}
                              className="text-gray-600 hover:text-green-600 text-sm block py-1"
                              onClick={() => setOpenMenu(null)}
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* ÜRÜNE GÖRE */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">ÜRÜNE GÖRE</h4>
                      <ul className="space-y-2">
                        {uruneGore.map((item) => (
                          <li key={item.slug}>
                            <Link 
                              to={`/kategori/${item.slug}`}
                              className="text-gray-600 hover:text-green-600 text-sm block py-1"
                              onClick={() => setOpenMenu(null)}
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

// ===== CIRCULAR CATEGORY ICONS =====
const CircularCategories = ({ categories }) => {
  const displayCategories = [
    { name: "Kokina", slug: "kokina", image: "https://images.unsplash.com/photo-1512418490979-92798cec1380?w=120&h=120&fit=crop" },
    { name: "Doğum Günü", slug: "dogum-gunu", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=120&h=120&fit=crop" },
    { name: "Sevgi & Aşk", slug: "sevgi-ask", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=120&h=120&fit=crop" },
    { name: "Çiçek Buketleri", slug: "cicek-buketleri", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=120&h=120&fit=crop" },
    { name: "Saksı Çiçekleri", slug: "saksi-cicekleri", image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=120&h=120&fit=crop" },
    { name: "Yeni İş", slug: "yeni-is-terfi", image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=120&h=120&fit=crop" },
    { name: "Orkide", slug: "orkide", image: "https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=120&h=120&fit=crop" },
    { name: "Geçmiş Olsun", slug: "gecmis-olsun", image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=120&h=120&fit=crop" },
    { name: "Gül Çeşitleri", slug: "gul", image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=120&h=120&fit=crop" },
    { name: "Açılış / Kutlama", slug: "acilis-kutlama", image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=120&h=120&fit=crop" },
    { name: "Çelenk", slug: "celenk", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=120&h=120&fit=crop" },
    { name: "Yeni Bebek", slug: "dogum-yeni-bebek", image: "https://images.unsplash.com/photo-1518882605630-8eb573696572?w=120&h=120&fit=crop" },
    { name: "Ayçiçeği", slug: "aycicegi", image: "https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=120&h=120&fit=crop" },
    { name: "Papatyalar", slug: "papatya-gerbera", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=120&h=120&fit=crop" },
    { name: "Antoryum", slug: "antoryum", image: "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=120&h=120&fit=crop" },
    { name: "Hüsnüyusuf", slug: "husnuyusuf", image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=120&h=120&fit=crop" },
    { name: "Tasarım Çiçekler", slug: "tasarim", image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=120&h=120&fit=crop" },
    { name: "Kırmızı Gül", slug: "kirmizi-gul", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=120&h=120&fit=crop" },
    { name: "Beyaz Gül", slug: "beyaz-gul", image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=120&h=120&fit=crop" },
    { name: "Nikah / Düğün", slug: "nikah-dugun", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=120&h=120&fit=crop" },
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
    <div className="bg-white py-4 border-b border-gray-100">
      <div className="w-full px-4">
        {/* Categories - scrollable with touch on mobile */}
        <div 
          ref={scrollRef}
          className="flex items-start gap-6 md:gap-8 overflow-x-auto scrollbar-hide md:justify-center"
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
      </div>
    </div>
  );
};

// ===== HERO SLIDER =====
const HeroSlider = ({ banners }) => {
  return (
    <div className="bg-white">
      {/* Desktop: Grid 2 columns */}
      <div className="hidden md:grid md:grid-cols-2 gap-1">
        <Link
          to="/kategori/tasarim"
          className="relative overflow-hidden h-[420px] group"
          data-testid="hero-banner-0"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_html-spa-converter/artifacts/k4xtaij1_hero.png"
            alt="Kokina - Yeni Yılın Gözdesi"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <Link
          to="/kategori/gul"
          className="relative overflow-hidden h-[420px] group"
          data-testid="hero-banner-1"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_html-spa-converter/artifacts/o8av0npy_kirmizi-gul.png"
            alt="Kırmızı Güller"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Mobile: Stack vertically - full width no gaps */}
      <div className="md:hidden flex flex-col">
        <Link
          to="/kategori/tasarim"
          className="relative block w-full"
          data-testid="hero-banner-mobile-0"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_html-spa-converter/artifacts/k4xtaij1_hero.png"
            alt="Kokina - Yeni Yılın Gözdesi"
            className="w-full h-auto block"
          />
        </Link>

        <Link
          to="/kategori/gul"
          className="relative block w-full"
          data-testid="hero-banner-mobile-1"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_html-spa-converter/artifacts/o8av0npy_kirmizi-gul.png"
            alt="Kırmızı Güller"
            className="w-full h-auto block"
          />
        </Link>
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
    <div className="w-full px-4">
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
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {products.slice(0, 6).map((product) => (
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
      <div className="w-full px-4 py-12">
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
            © {new Date().getFullYear()} Çiçekçi Burada. Tüm hakları saklıdır.
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

// ===== PAGINATION COMPONENT =====
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const pages = [];
    const delta = 2; // Pages to show before/after current
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let start = Math.max(2, currentPage - delta);
    let end = Math.min(totalPages - 1, currentPage + delta);
    
    // Add ellipsis if needed before range
    if (start > 2) pages.push('...');
    
    // Add pages in range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed after range
    if (end < totalPages - 1) pages.push('...');
    
    // Always show last page if more than 1 page
    if (totalPages > 1) pages.push(totalPages);
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8" data-testid="pagination">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-500'
        }`}
        data-testid="prev-page-btn"
      >
        ← Önceki
      </button>

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {getVisiblePages().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-500'
              }`}
              data-testid={`page-btn-${page}`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Mobile: Page indicator */}
      <div className="sm:hidden px-4 py-2 text-gray-600 font-medium">
        Sayfa {currentPage} / {totalPages}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-500'
        }`}
        data-testid="next-page-btn"
      >
        Sonraki →
      </button>
    </div>
  );
};

// ===== HOME PAGE =====
const HomePage = ({ banners, categories }) => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (page) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/products?page=${page}&per_page=24`);
      setProducts(res.data.products);
      setTotalPages(res.data.total_pages);
      setTotalProducts(res.data.total);
      setCurrentPage(res.data.page);
      // Scroll to top of products section
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page);
    }
  };

  return (
    <div data-testid="home-page">
      <CircularCategories categories={categories} />
      <HeroSlider banners={banners} />
      
      <div className="bg-gray-50">
        <div className="py-4">
          <div className="w-full px-4">
            <h2 className="text-xl font-bold text-gray-900">Türkiye Geneline Çiçek Gönder</h2>
          </div>
        </div>
        
        {/* Tüm Çiçekler - Grid with Pagination */}
        <section className="py-6" data-testid="section-tum-cicekler">
          <div className="w-full px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Tüm Çiçekler</h2>
                <p className="text-gray-500 text-sm mt-1">{totalProducts} ürün • Sayfa {currentPage}/{totalPages}</p>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// ===== CATEGORY PAGE =====
const CategoryPage = ({ categories }) => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (page) => {
    try {
      setLoading(true);
      const categoryParam = slug === 'tumu' ? '' : `&category=${slug}`;
      const res = await axios.get(`${API}/products?page=${page}&per_page=24${categoryParam}`);
      setProducts(res.data.products);
      setTotalPages(res.data.total_pages);
      setTotalProducts(res.data.total);
      setCurrentPage(res.data.page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [slug, fetchProducts]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="category-page">
      <div className="w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {category ? `${categoryIcons[slug] || '🌸'} ${category.name}` : slug === 'tumu' ? '🌸 Tüm Ürünler' : 'Kategori'}
          </h1>
          {category?.description && (
            <p className="text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">{totalProducts} ürün bulundu • Sayfa {currentPage}/{totalPages}</p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Bu kategoride henüz ürün bulunmuyor.
          </div>
        )}
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      </div>
    </div>
  );
};

// ===== PRODUCT DETAIL PAGE =====
const ProductDetailPage = ({ categories }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const res = await axios.get(`${API}/products/${id}`);
        setProduct(res.data);
        
        // Fetch related products (bestsellers)
        const relatedRes = await axios.get(`${API}/products?page=1&per_page=6&bestseller=true`);
        setRelatedProducts(relatedRes.data.products.filter(p => p.id !== id));
      } catch (e) {
        console.error('Error fetching product:', e);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [id]);
  
  // State for shipping
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Get category info
  const category = product ? categories.find(c => c.slug === product.category) : null;

  // Date helpers
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  
  const formatDate = (d, opts) => d.toLocaleDateString('tr-TR', opts);
  
  const timeSlots = ['09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00'];
  
  // Location search state - API ile gerçek arama
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // Location search with debounce
  const searchLocation = useCallback(async (query) => {
    if (query.length < 2) {
      setLocationResults([]);
      setLocationLoading(false);
      return;
    }
    
    setLocationLoading(true);
    try {
      const res = await axios.get(`${API}/locations/search?q=${encodeURIComponent(query)}`);
      setLocationResults(res.data?.results || []);
    } catch (e) {
      console.error('Location search error:', e);
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showLocationDropdown && location.length >= 2) {
        searchLocation(location);
      } else {
        setLocationResults([]);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [location, showLocationDropdown, searchLocation]);

  const filteredLocations = locationResults;

  // Calendar rendering
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const days = [];
    
    // Day headers
    const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
    
    // Empty cells before first day
    for (let i = 0; i < startPad; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isPast = date < new Date(today.toDateString());
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => { setSelectedDate(date); setShowCalendar(false); }}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
            isPast ? 'text-gray-300 cursor-not-allowed' :
            isSelected ? 'bg-green-500 text-white' :
            'text-gray-700 hover:bg-green-100'
          }`}
        >
          {d}
        </button>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-xl p-4 absolute top-full left-0 right-0 mt-2 z-20">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalendarMonth(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded">‹</button>
          <span className="font-semibold">{formatDate(calendarMonth, { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCalendarMonth(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(dn => <div key={dn} className="w-8 h-6 text-xs text-gray-500 font-medium flex items-center justify-center">{dn}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const handleOrder = () => {
    if (!location.trim()) return alert('Lütfen gönderim yerini seçiniz.');
    if (!selectedDate) return alert('Lütfen tarih seçiniz.');
    if (!selectedTime) return alert('Lütfen saat aralığı seçiniz.');
    alert(`Sipariş oluşturuldu!\n\nÜrün: ${product.title}\nKonum: ${location}\nTarih: ${formatDate(selectedDate, { day: '2-digit', month: 'long', year: 'numeric' })}\nSaat: ${selectedTime}\nTutar: ${product.price},00 TL`);
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full px-4 py-12 text-center" data-testid="product-not-found">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığınız ürün mevcut değil.</p>
        <button onClick={() => navigate('/')} className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="product-detail-page">
      {/* Detail Header */}
      <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between md:hidden">
        <button onClick={() => navigate(-1)} className="p-2" data-testid="detail-back-btn">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="font-semibold">Çiçekçi Burada</span>
        <button className="p-2"><SearchIcon className="w-6 h-6" /></button>
      </div>

      <div className="w-full px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4 hidden md:block">
          <Link to="/" className="hover:text-green-600">Çiçekçi Burada</Link>
          <span className="mx-2">›</span>
          {category && <><Link to={`/kategori/${category.slug}`} className="hover:text-green-600">{category.name}</Link><span className="mx-2">›</span></>}
          <span className="text-gray-900">{product.title}</span>
        </nav>

        {/* Desktop back button */}
        <button onClick={() => navigate(-1)} className="hidden md:flex items-center gap-2 text-gray-500 hover:text-green-600 mb-4 bg-transparent border-0 cursor-pointer text-sm font-medium">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Geri Dön
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gallery */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative aspect-square">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h1 className="text-white text-xl font-bold">{product.title}</h1>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            {/* Location Input - CicekSepeti Style */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gönderim Yeri</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setShowLocationDropdown(true); }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Gönderim yeri yazın"
                  className="w-full pl-12 pr-4 py-4 border-2 border-red-400 rounded-lg focus:outline-none focus:border-red-500 text-gray-800"
                  data-testid="location-input"
                />
                {showLocationDropdown && (location.length >= 2) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-20 max-h-72 overflow-auto">
                    {locationLoading ? (
                      <div className="px-4 py-4 text-gray-500 text-center flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Aranıyor...
                      </div>
                    ) : filteredLocations.length > 0 ? (
                      filteredLocations.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => { 
                            setLocation(loc.display_name); 
                            setShowLocationDropdown(false);
                            setLocationResults([]);
                          }}
                          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
                        >
                          <span className="text-gray-800">{loc.display_name}</span>
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-gray-500 text-center">
                        Sonuç bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Date Selection */}
            {location.length >= 3 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Teslimat Tarihi</label>
                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { label: 'Bugün', date: today },
                    { label: 'Yarın', date: tomorrow },
                    { label: 'Ertesi Gün', date: dayAfter },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDate(item.date); setShowCalendar(false); }}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedDate?.toDateString() === item.date.toDateString()
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-400'
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs mt-1 opacity-80">{formatDate(item.date, { day: '2-digit', month: 'short' })}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      showCalendar ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-200 hover:border-green-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">Tarih Seç</div>
                    <div className="text-xs mt-1 opacity-80">Takvim</div>
                  </button>
                  {showCalendar && renderCalendar()}
                </div>
              </div>
            )}

            {/* Time Selection */}
            {selectedDate && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 Teslimat Saati</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(slot)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedTime === slot
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {selectedTime && (
                  <div className="mt-3 text-sm text-green-600 font-medium">
                    ✓ Seçim: {formatDate(selectedDate, { day: '2-digit', month: 'short', weekday: 'short' })} • {selectedTime}
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{product.price}</span>
                <span className="text-lg text-gray-500">,00 TL</span>
              </div>
              <div className="text-sm text-gray-400">(KDV Dahil)</div>
            </div>

            {/* Order Button */}
            <button
              onClick={handleOrder}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
              data-testid="order-btn"
            >
              {selectedTime ? 'Seçimle Sipariş Ver →' : 'Sipariş Ver →'}
            </button>

            {/* Product Details */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Çiçek Hakkında Detaylı Bilgi</h3>
              <p className="text-gray-600 text-sm mb-4">
                {product.description || 'Seçtiğiniz aranjman özenle hazırlanır ve aynı gün teslimat seçenekleriyle gönderilir.'}
              </p>
              
              <h3 className="font-bold text-gray-900 mb-2">Ürünün İçeriği</h3>
              <ul className="text-gray-600 text-sm space-y-1 mb-4">
                <li>• Taze çiçekler ve yeşillikler</li>
                <li>• Uygun vazo / saksı</li>
                <li>• Not kartı</li>
              </ul>
              
              <h3 className="font-bold text-gray-900 mb-2">Bu Aranjmanı Özel Kılan Detaylar</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Her ortama yakışan modern tasarım</li>
                <li>• Birçok duruma uygun</li>
                <li>• Doğal ve şık görünüm</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Best Sellers Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">En Çok Satanlar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== SEARCH RESULTS PAGE =====
const SearchResultsPage = () => {
  const loc = useLocation();
  const searchParams = new URLSearchParams(loc.search);
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (e) {
        console.error('Error searching:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="search-results-page">
      <div className="w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          &ldquo;{query}&rdquo; için arama sonuçları
        </h1>
        <p className="text-gray-500 mb-6">{results.length} ürün bulundu</p>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {!loading && results.length === 0 && (
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
          Çiçekçi Burada, 2024 yılında kurulmuş online çiçek sipariş platformudur. 
          Türkiye&apos;nin dört bir yanına aynı gün teslimat garantisi ile en taze çiçekleri ulaştırıyoruz.
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

// ===== MOBILE SIDE MENU =====
const MobileSideMenu = ({ isOpen, onClose, categories }) => {
  const location = useLocation();
  
  const menuCategories = [
    { name: "Orkide", slug: "orkide", icon: "🌸" },
    { name: "Gül", slug: "gul", icon: "🌹" },
    { name: "Papatya / Gerbera", slug: "papatya-gerbera", icon: "🌼" },
    { name: "Saksı Çiçekleri", slug: "saksi-cicekleri", icon: "🪴" },
    { name: "Lilyum", slug: "lilyum", icon: "🌷" },
    { name: "Ayçiçeği", slug: "aycicegi", icon: "🌻" },
    { name: "Hüsnüyusuf", slug: "husnuyusuf", icon: "💜" },
    { name: "Karanfil", slug: "karanfil", icon: "🌺" },
    { name: "Geçmiş Olsun", slug: "gecmis-olsun", icon: "💐" },
    { name: "Yeni İş / Terfi", slug: "yeni-is-terfi", icon: "🎊" },
    { name: "Doğum / Yeni Bebek", slug: "dogum-yeni-bebek", icon: "👶" },
    { name: "Yıl Dönümü", slug: "yil-donumu", icon: "💕" },
    { name: "Tasarım Çiçekler", slug: "tasarim", icon: "🎨" },
    { name: "Çiçek Buketleri", slug: "cicek-buketleri", icon: "💐" },
    { name: "Antoryum", slug: "antoryum", icon: "❤️" },
    { name: "Kokina", slug: "kokina", icon: "🎄" },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <div className={`fixed top-0 left-0 bottom-0 w-72 bg-green-500 z-50 transform transition-transform duration-300 md:hidden overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-400">
          <MobileLogo />
          <button onClick={onClose} className="text-white p-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        {/* Menu Items */}
        <div className="py-4">
          <Link 
            to="/" 
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 text-white font-medium ${
              location.pathname === '/' ? 'bg-green-600' : 'hover:bg-green-600'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span>Anasayfa</span>
          </Link>
          
          <div className="px-4 py-2 text-green-200 text-sm font-semibold uppercase">Kategoriler</div>
          
          {menuCategories.map((cat) => (
            <Link 
              key={cat.slug}
              to={`/kategori/${cat.slug}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-white font-medium ${
                location.pathname === `/kategori/${cat.slug}` ? 'bg-green-600' : 'hover:bg-green-600'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

// ===== MAIN LAYOUT =====
const Layout = ({ children, categories }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />
      <CategoryNavBar categories={categories} />
      <MobileSideMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

// ===== APP =====
function App() {
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

      const [categoriesRes, bannersRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/banners`),
      ]);

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
          <div className="text-lg text-gray-600">Çiçekçi Burada yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Layout categories={categories}>
          <Routes>
            <Route path="/" element={<HomePage banners={banners} categories={categories} />} />
            <Route path="/kategori/:slug" element={<CategoryPage categories={categories} />} />
            <Route path="/urun/:id" element={<ProductDetailPage categories={categories} />} />
            <Route path="/ara" element={<SearchResultsPage />} />
            <Route path="/hakkimizda" element={<AboutPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
