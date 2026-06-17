import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { type Product } from '../components/SwipeableProductRow';
import { useInventoryStore } from '../store/useInventoryStore';
import BottomNavigation from '../components/BottomNavigation';
import CategoryFilter from '../components/CategoryFilter';

export interface InventoryProps {
  readonly onNavigate?: (tab: string) => void;
  readonly onEditProduct?: (product: Product) => void;
}

export default function Inventory({ onNavigate, onEditProduct }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  const { stocks, incrementStock, decrementStock, initializeStocks } = useInventoryStore();

  useEffect(() => {
    fetch('/api/product')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          initializeStocks(data.map((p) => p.id));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setIsLoading(false);
      });
  }, [initializeStocks]);

  const handleDeleteProduct = async (id: number, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/product?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during deletion.');
    }
  };

  // Helper mappings for categories and SKUs
  const getProductCategory = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('treat') || n.includes('bite') || n.includes('beef') || n.includes('snack') || n.includes('food')) {
      return 'ขนมสุนัข';
    }
    if (n.includes('toy') || n.includes('rope') || n.includes('doll') || n.includes('hat') || n.includes('badge') || n.includes('stand') || n.includes('keyring') || n.includes('resin')) {
      return 'ของเล่น';
    }
    if (n.includes('bow') || n.includes('collar') || n.includes('ribbon') || n.includes('band') || n.includes('tie') || n.includes('clip')) {
      return 'ปลอกคอ';
    }
    if (n.includes('balm') || n.includes('paw') || n.includes('organic') || n.includes('groom') || n.includes('cherry') || n.includes('flower')) {
      return 'กรูมมิ่ง';
    }
    return 'ปลอกคอ'; // default fallback category
  };

  const getProductSku = (id: number, category: string): string => {
    let prefix = 'GEN';
    if (category === 'ปลอกคอ') prefix = 'ACC';
    else if (category === 'ขนมสุนัข') prefix = 'FOD';
    else if (category === 'ของเล่น') prefix = 'TOY';
    else if (category === 'กรูมมิ่ง') prefix = 'GRO';
    return `${prefix}-${String(id).padStart(3, '0')}`;
  };

  // Unique categories for filtering
  const categories = ['ทั้งหมด', 'ขนมสุนัข', 'ของเล่น', 'ปลอกคอ', 'กรูมมิ่ง'];

  // Filtered products list
  const filteredProducts = products.filter((product) => {
    const category = getProductCategory(product.name);
    const sku = getProductSku(product.id, category);
    
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'ทั้งหมด' || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="mr-4 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-[#805062]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">
            Inventory
          </h1>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto px-5 pb-28 pt-4 space-y-4 no-scrollbar">
          {/* Search Bar */}
          <section className="shrink-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant-warm group-focus-within:text-[#805062] transition-colors" />
              <input
                type="text"
                placeholder="ค้นหาสินค้าหรือ SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[#f6ebed] rounded-full border-none focus:ring-2 focus:ring-brand-pink/50 text-[14px] font-medium text-text-brown placeholder:text-outline-variant-warm/60 outline-none"
              />
            </div>
          </section>

          {/* Category Tabs (Horizontal Scroll) */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Product List */}
          <section className="flex flex-col gap-4">
            {isLoading ? (
              <div className="p-8 text-center text-[14px] text-[#504447] font-medium">
                Loading inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-[14px] text-outline-variant-warm font-medium">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const category = getProductCategory(product.name);
                const sku = getProductSku(product.id, category);
                const stock = stocks[product.id] !== undefined ? stocks[product.id] : 0;

                // Determine stock indicator dot color
                let dotColorClass = 'bg-[#FF8A80]'; // Out of stock
                if (stock >= 10) {
                  dotColorClass = 'bg-emerald-400'; // High stock
                } else if (stock > 0) {
                  dotColorClass = 'bg-amber-400'; // Low stock
                }

                return (
                  <div
                    key={product.id}
                    className="product-card p-4 bg-white rounded-[20px] shadow-[0_4px_12px_rgba(78,52,46,0.05)] border border-outline-warm/40 flex gap-4 items-center relative overflow-hidden transition-all duration-200"
                  >
                    {/* Clickable Area for Editing */}
                    <div
                      onClick={() => onEditProduct?.(product)}
                      className="flex-grow flex gap-4 items-center min-w-0 cursor-pointer"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-[#FFF0F5] rounded-2xl overflow-hidden flex-shrink-0 border border-outline-warm/20">
                        <img
                          alt={product.name}
                          className="w-full h-full object-cover"
                          src={product.image_url}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-[14px] text-text-brown truncate">
                          {product.name}
                        </h3>
                        <p className="text-[12px] text-outline-variant-warm font-medium mb-1">
                          SKU: {sku} • {category}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`}></span>
                          <span className="text-[12px] text-[#504447] font-medium">
                            คลังสินค้า:{' '}
                            <span
                              className={`font-bold ${
                                stock === 0 ? 'text-[#FF8A80]' : 'text-[#805062]'
                              }`}
                            >
                              {stock}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Adjustment Controls & Delete Action */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex flex-col items-center gap-1.5 bg-[#fcf1f2] rounded-full p-1 border border-outline-warm/20 shrink-0">
                        <button
                          onClick={() => incrementStock(product.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#805062] shadow-sm active:scale-90 transition-transform cursor-pointer border-none"
                          aria-label="Add stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => decrementStock(product.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#805062] shadow-sm active:scale-90 transition-transform cursor-pointer border-none"
                          aria-label="Remove stock"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-1 hover:text-red-500 text-outline-variant-warm transition-colors cursor-pointer border-none bg-transparent"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Floating Action Button (FAB) for Add Product */}
        <button
          onClick={() => onNavigate?.('add-product')}
          className="fixed right-6 bottom-24 w-14 h-14 bg-[#805062] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-50 cursor-pointer border-none hover:bg-[#805062]/95"
          aria-label="Add new product"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab="products" onNavigate={onNavigate} />
      </div>
    </div>
  );
}
