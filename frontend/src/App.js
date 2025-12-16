import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ===== LOGO COMPONENT =====
const Logo = () => (
  <svg viewBox="0 0 520 64" xmlns="http://www.w3.org/2000/svg" className="h-12 md:h-14 w-auto max-w-[280px] md:max-w-[320px]">
    <title>ÇiçekZamanı</title>
    <g fill="#FFFFFF" transform="translate(104,0)">
      <path d="M14.5 28.4L6 21.2C2.6 18.3 1.9 13.2 4.6 9.8c2.5-3 7-3.4 10-.9 1 .8 1.8 1.8 2.4 3 .6-1.2 1.4-2.2 2.4-3 3-2.5 7.5-2.1 10 .9 2.7 3.4 2 8.5-2 11.4l-8.5 7.2c-1 .9-2.4 .9-3.4 0z"/>
      <path transform="translate(22,0)" d="M14.5 28.4L6 21.2C2.6 18.3 1.9 13.2 4.6 9.8c2.5-3 7-3.4 10-.9 1 .8 1.8 1.8 2.4 3 .6-1.2 1.4-2.2 2.4-3 3-2.5 7.5-2.1 10 .9 2.7 3.4 2 8.5-2 11.4l-8.5 7.2c-1 .9-2.4 .9-3.4 0z"/>
    </g>
    <text x="50%" y="38" textAnchor="middle" fontFamily="Poppins, Segoe UI, Nunito, Arial, sans-serif" fontWeight="700" fontSize="28" fill="#FFFFFF">
      ÇiçekZamanı
    </text>
    <g fill="#FFFFFF" transform="translate(365,0)">
      <path d="M14.5 28.4L6 21.2C2.6 18.3 1.9 13.2 4.6 9.8c2.5-3 7-3.4 10-.9 1 .8 1.8 1.8 2.4 3 .6-1.2 1.4-2.2 2.4-3 3-2.5 7.5-2.1 10 .9 2.7 3.4 2 8.5-2 11.4l-8.5 7.2c-1 .9-2.4 .9-3.4 0z"/>
      <path transform="translate(22,0)" d="M14.5 28.4L6 21.2C2.6 18.3 1.9 13.2 4.6 9.8c2.5-3 7-3.4 10-.9 1 .8 1.8 1.8 2.4 3 .6-1.2 1.4-2.2 2.4-3 3-2.5 7.5-2.1 10 .9 2.7 3.4 2 8.5-2 11.4l-8.5 7.2c-1 .9-2.4 .9-3.4 0z"/>
    </g>
  </svg>
);

// ===== HAMBURGER ICON =====
const HamburgerIcon = ({ isOpen }) => (
  <div className="relative w-6 h-4">
    <span className={`absolute left-0 right-0 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? 'top-[7px] rotate-45' : 'top-0'}`} />
    <span className={`absolute left-0 right-0 h-0.5 bg-white rounded transition-all duration-300 top-[7px] ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
    <span className={`absolute left-0 right-0 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? 'top-[7px] -rotate-45' : 'bottom-0'}`} />
  </div>
);

// ===== SEARCH ICON =====
const SearchIcon = ({ isX }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    {isX ? (
      <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/>
    ) : (
      <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8L20 20.5 21.5 19 16.5 14zM6.5 11a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0z"/>
    )}
  </svg>
);

// ===== CHEVRON ICON =====
const ChevronIcon = ({ isOpen }) => (
  <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ===== HEADER =====
const Header = ({ onMenuToggle, onSearchToggle, isMenuOpen, isSearchOpen }) => (
  <header className="h-16 bg-brand-green text-white sticky top-0 z-50 shadow-lg">
    <div className="h-full grid grid-cols-[44px_1fr_44px] items-center px-3 gap-2">
      <button 
        onClick={onMenuToggle} 
        className="w-11 h-11 flex items-center justify-center bg-transparent border-0 cursor-pointer"
        data-testid="menu-toggle-btn"
        aria-label="Menü"
      >
        <HamburgerIcon isOpen={isMenuOpen} />
      </button>
      
      <Link to="/" className="justify-self-center" data-testid="logo-link">
        <Logo />
      </Link>
      
      <button 
        onClick={onSearchToggle} 
        className="w-11 h-11 flex items-center justify-center bg-transparent border-0 cursor-pointer text-white"
        data-testid="search-toggle-btn"
        aria-label="Ara"
      >
        <SearchIcon isX={isSearchOpen} />
      </button>
    </div>
  </header>
);

// ===== SEARCH BAR =====
const SearchBar = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/ara?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery("");
    }
  };

  return (
    <div className={`fixed left-0 right-0 top-16 p-2 z-50 transition-all duration-200 ${
      isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
    }`}>
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-xl p-2.5">
        <div className="flex items-center bg-gray-200 rounded-xl overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            placeholder="Çiçek, hediye ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-white px-4 py-3.5 text-base text-gray-700 outline-none min-w-0"
            data-testid="search-input"
          />
          <button 
            type="submit" 
            className="w-14 h-12 flex items-center justify-center bg-gray-300 border-0 cursor-pointer"
            data-testid="search-submit-btn"
          >
            <SearchIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== OVERLAY =====
const Overlay = ({ isVisible, onClick }) => (
  <div 
    className={`fixed inset-0 top-16 bg-black/45 z-40 transition-all duration-300 ${
      isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
    }`}
    onClick={onClick}
    data-testid="overlay"
  />
);

// ===== SIDE MENU =====
const SideMenu = ({ isOpen, onClose, categories }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: "🏠 Anasayfa", path: "/" },
  ];

  return (
    <aside className={`fixed top-16 bottom-0 left-0 w-[clamp(220px,70vw,300px)] bg-brand-green text-white z-50 shadow-xl p-4 transition-transform duration-300 rounded-r-xl overflow-auto ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="text-sm font-bold tracking-wider opacity-90 mb-2 ml-1.5">MENÜ</div>
      <ul className="list-none m-0 p-0">
        {menuItems.map((item) => (
          <li key={item.path} className="mt-1">
            <Link 
              to={item.path} 
              onClick={onClose}
              className={`block px-3 py-2.5 rounded-lg text-white text-[15px] font-medium transition-colors hover:bg-white/10 ${
                location.pathname === item.path ? 'bg-black/20 font-bold' : ''
              }`}
              data-testid={`menu-item-${item.path.replace('/', 'home')}`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="h-px bg-white/20 my-2.5 rounded-full" />

      <div className="text-sm font-bold tracking-wider opacity-90 mb-2 ml-1.5">KATEGORİLER</div>
      <ul className="list-none m-0 p-0">
        {categories.map((cat) => (
          <li key={cat.slug} className="mt-1">
            <Link 
              to={`/kategori/${cat.slug}`} 
              onClick={onClose}
              className={`block px-3 py-2.5 rounded-lg text-white text-[15px] font-medium transition-colors hover:bg-white/10 ${
                location.pathname === `/kategori/${cat.slug}` ? 'bg-black/20 font-bold' : ''
              }`}
              data-testid={`menu-category-${cat.slug}`}
            >
              {cat.icon} {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// ===== HERO SLIDER =====
const HeroSlider = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (banners.length === 0 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setCurrentIndex((prev) => (prev + (dx < 0 ? 1 : -1) + banners.length) % banners.length);
    }
    setIsPaused(false);
  };

  if (banners.length === 0) {
    return (
      <div className="w-full h-[clamp(220px,50vh,420px)] md:h-[clamp(260px,56vh,520px)] bg-gradient-to-r from-brand-green/20 to-brand-green/40 flex items-center justify-center">
        <div className="text-brand-green text-xl font-semibold">🌸 ÇiçekZamanı</div>
      </div>
    );
  }

  return (
    <section 
      className="relative w-full h-[clamp(220px,50vh,420px)] md:h-[clamp(260px,56vh,520px)] overflow-hidden bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="hero-slider"
    >
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <Link 
            key={banner.id} 
            to={banner.link || '#'}
            className="flex-shrink-0 w-full h-full bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${banner.image})` }}
            data-testid={`hero-slide-${idx}`}
          />
        ))}
      </div>
      
      <div className="absolute left-1/2 bottom-2.5 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full cursor-pointer border-0 transition-colors ${
              idx === currentIndex ? 'bg-gray-900' : 'bg-black/25'
            }`}
            data-testid={`hero-dot-${idx}`}
            aria-label={`Banner ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

// ===== PRODUCT CARD =====
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/urun/${product.id}`)}
      className="flex-shrink-0 w-[clamp(200px,65vw,260px)] scroll-snap-start bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      data-testid={`product-card-${product.id}`}
    >
      <div 
        className="w-full aspect-square bg-gray-100 rounded-t-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${product.image})` }}
      />
      <div className="p-3 flex flex-col gap-2 text-center">
        <div className="text-[15px] font-semibold text-gray-900 leading-tight min-h-[2.6em] flex items-start justify-center">
          {product.title}
        </div>
        <div className="flex justify-center items-start gap-1 font-bold text-gray-900 flex-wrap">
          <span className="text-xl leading-tight">{product.price}</span>
          <span className="text-xs mt-0.5 leading-tight">,00</span>
          <span className="text-[10px] mt-1 text-gray-600 leading-tight">TL</span>
        </div>
        <div className="h-px bg-gray-200 mx-auto w-full max-w-[180px] my-1" />
        <div className="text-[10px] text-gray-400 leading-tight">(KDV Dahil)</div>
        <div className="mt-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 w-max mx-auto">
          {product.badge}
        </div>
      </div>
    </div>
  );
};

// ===== PRODUCT SLIDER =====
const ProductSlider = ({ title, subtitle, products, viewAllLink, viewAllText = "Tümünü Gör" }) => (
  <section className="mt-8" data-testid={`product-slider-${title.replace(/\s+/g, '-').toLowerCase()}`}>
    <div className="flex items-end justify-between flex-wrap gap-2 mb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-[600px]">{subtitle}</p>}
      </div>
      {viewAllLink && (
        <Link 
          to={viewAllLink}
          className="text-sm font-semibold text-brand-green bg-green-50 rounded-lg px-3 py-2 border border-green-200 hover:bg-green-100 transition-colors"
          data-testid={`view-all-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {viewAllText}
        </Link>
      )}
    </div>
    
    <div className="flex gap-4 overflow-x-auto pb-4 scroll-snap-x scrollbar-hide">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);

// ===== FOOTER ACCORDION =====
const FooterAccordion = ({ title, items, isOpen, onToggle }) => (
  <div className="border-b border-gray-200">
    <button 
      onClick={onToggle}
      className="w-full bg-white border-0 text-left py-4 px-2 text-xl font-bold cursor-pointer flex items-center justify-between text-black"
      aria-expanded={isOpen}
      data-testid={`footer-accordion-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {title}
      <ChevronIcon isOpen={isOpen} />
    </button>
    <div className={`overflow-hidden transition-all duration-250 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
      <ul className="list-none p-0 px-2 pb-4">
        {items.map((item, idx) => (
          <li key={idx} className="py-2 text-lg text-gray-900">
            <Link to={item.link} className="text-inherit no-underline hover:text-brand-green transition-colors">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
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
    <footer className="border-t border-gray-200 bg-white mt-8 text-black" data-testid="footer">
      <div className="max-w-5xl mx-auto px-4">
        {footerSections.map((section, idx) => (
          <FooterAccordion
            key={idx}
            title={section.title}
            items={section.items}
            isOpen={openAccordion === idx}
            onToggle={() => setOpenAccordion(openAccordion === idx ? null : idx)}
          />
        ))}
        <div className="text-center py-5 pb-12 text-sm text-gray-600">
          © {new Date().getFullYear()} ÇiçekZamanı. Tüm hakları saklıdır.
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-4 bottom-5 w-12 h-12 border-0 rounded-xl bg-brand-green text-white grid place-items-center text-xl cursor-pointer z-50 shadow-lg transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      data-testid="back-to-top-btn"
      aria-label="Yukarı çık"
    >
      ↑
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
      <HeroSlider banners={banners} />
      
      <main className="max-w-6xl mx-auto px-4">
        {bestsellers.length > 0 && (
          <ProductSlider 
            title="En Çok Satılanlar" 
            subtitle="Bu hafta en çok tercih edilen çiçekler ve tasarımlar"
            products={bestsellers}
            viewAllLink="/kategori/tumu"
          />
        )}
        
        {orkideProducts.length > 0 && (
          <ProductSlider 
            title="Orkideler" 
            subtitle="Şık, zarif ve kalıcı hediye"
            products={orkideProducts}
            viewAllLink="/kategori/orkide"
            viewAllText="Tüm Orkideler"
          />
        )}
        
        {gulProducts.length > 0 && (
          <ProductSlider 
            title="Güller" 
            subtitle="Aşkın en klasik hali"
            products={gulProducts}
            viewAllLink="/kategori/gul"
            viewAllText="Tüm Güller"
          />
        )}
        
        {tasarimProducts.length > 0 && (
          <ProductSlider 
            title="Tasarım" 
            subtitle="Özel aranjmanlar ve butik işler"
            products={tasarimProducts}
            viewAllLink="/kategori/tasarim"
            viewAllText="Tüm Tasarım Çiçekler"
          />
        )}
      </main>
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
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="category-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {category ? `${category.icon} ${category.name}` : slug === 'tumu' ? '🌸 Tüm Ürünler' : 'Kategori'}
        </h1>
        {category?.description && (
          <p className="text-gray-500 mt-1">{category.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">{filteredProducts.length} ürün bulundu</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
  );
};

// ===== PRODUCT DETAIL PAGE =====
const ProductDetailPage = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center" data-testid="product-not-found">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="product-detail-page">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 bg-transparent border-0 cursor-pointer text-base"
        data-testid="back-btn"
      >
        ← Geri Dön
      </button>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div 
          className="aspect-square rounded-2xl bg-cover bg-center bg-gray-100"
          style={{ backgroundImage: `url(${product.image})` }}
          data-testid="product-image"
        />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" data-testid="product-title">
            {product.title}
          </h1>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-gray-900" data-testid="product-price">{product.price}</span>
            <span className="text-lg">,00 TL</span>
            <span className="text-sm text-gray-400">(KDV Dahil)</span>
          </div>
          
          <div className="inline-block px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold border border-green-200 mb-6">
            {product.badge}
          </div>
          
          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6" data-testid="product-description">
              {product.description}
            </p>
          )}
          
          <button 
            className="w-full bg-brand-green text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
            data-testid="add-to-cart-btn"
          >
            Sepete Ekle
          </button>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
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
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="search-results-page">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        "{query}" için arama sonuçları
      </h1>
      <p className="text-gray-500 mb-6">{results.length} ürün bulundu</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
  );
};

// ===== ABOUT PAGE =====
const AboutPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-12" data-testid="about-page">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
    <div className="prose prose-lg text-gray-600">
      <p className="mb-4">
        ÇiçekZamanı, 2024 yılında kurulmuş online çiçek sipariş platformudur. 
        Türkiye'nin dört bir yanına aynı gün teslimat garantisi ile en taze çiçekleri ulaştırıyoruz.
      </p>
      <p className="mb-4">
        Misyonumuz, her özel anınızı çiçeklerle daha da güzelleştirmek. 
        Doğum günleri, yıldönümleri, sevgililer günü ve diğer tüm özel günlerinizde yanınızdayız.
      </p>
      <p>
        Kaliteli çiçekler, profesyonel aranjmanlar ve güvenilir teslimat hizmeti ile 
        müşteri memnuniyetini en üst düzeyde tutmayı hedefliyoruz.
      </p>
    </div>
  </div>
);

// ===== MAIN LAYOUT =====
const Layout = ({ children, categories }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Close all panels on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => {
          setIsSearchOpen(false);
          setIsMenuOpen(!isMenuOpen);
        }}
        onSearchToggle={() => {
          setIsMenuOpen(false);
          setIsSearchOpen(!isSearchOpen);
        }}
        isMenuOpen={isMenuOpen}
        isSearchOpen={isSearchOpen}
      />
      
      <SearchBar isOpen={isSearchOpen} onClose={closeAll} />
      <Overlay isVisible={isMenuOpen || isSearchOpen} onClick={closeAll} />
      <SideMenu isOpen={isMenuOpen} onClose={closeAll} categories={categories} />
      
      {children}
      
      <Footer />
      <BackToTop />
    </div>
  );
};

// ===== APP =====
function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // First, try to seed the database
      try {
        await axios.post(`${API}/seed`);
      } catch (e) {
        // Ignore seed errors (might already be seeded)
      }

      // Fetch all data
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
          <div className="text-4xl mb-4">🌸</div>
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
