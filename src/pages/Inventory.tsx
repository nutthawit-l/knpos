import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { type Product } from '../components/SwipeableProductRow';
import { useInventoryStore } from '../store/useInventoryStore';
import CategoryFilter from '../components/CategoryFilter';

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isSavingStock, setIsSavingStock] = useState(false);

  const { stocks, incrementStock, decrementStock, initializeStocks, hasStockChanges, saveStockChanges } = useInventoryStore();

  useEffect(() => {
    // Load categories
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(['All', ...data.map((c) => c.name)]);
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err));

    // Load products
    fetch('/api/product')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          initializeStocks(data);
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

  const getProductSku = (id: number, category: string): string => {
    let prefix = 'GEN';
    if (category === 'Frame card') prefix = 'FRM';
    else if (category === 'Hat') prefix = 'HAT';
    else if (category === 'Head band') prefix = 'BD';
    else if (category === 'Flower') prefix = 'FLW';
    return `${prefix}-${String(id).padStart(3, '0')}`;
  };

  // Filtered products list
  const filteredProducts = products.filter((product) => {
    const category = product.category_name || 'General';
    const sku = getProductSku(product.id, category);
    
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSaveStock = async () => {
    setIsSavingStock(true);
    const success = await saveStockChanges();
    setIsSavingStock(false);
    if (success) {
      alert('Stock changes saved successfully.');
    } else {
      alert('Failed to save stock changes.');
    }
  };

  return (
    <>
      <div className="space-y-4 pb-20">
          {/* Search Bar */}
          <section className="shrink-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant-warm group-focus-within:text-[#805062] transition-colors" />
              <input
                type="text"
                placeholder="Search products or SKU..."
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
                const category = product.category_name || 'General';
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
                    <div
                      onClick={() => navigate('/add-product', { state: { productToEdit: product } })}
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
                            Stock:{' '}
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

      {/* Floating Save Stock Changes bar */}
      {hasStockChanges() && (
        <div className="absolute bottom-20 left-0 right-0 px-6 z-50 animate-bounce">
          <div className="bg-white/90 backdrop-blur-md border border-outline-warm/30 px-5 py-4 rounded-3xl shadow-xl flex items-center justify-between">
            <span className="text-[13px] font-bold text-text-brown">Unsaved stock changes</span>
            <button
              onClick={handleSaveStock}
              disabled={isSavingStock}
              className="bg-brand-pink text-text-brown font-bold text-[12px] px-5 py-2.5 rounded-full hover:bg-brand-pink-hover active:scale-95 transition-all shadow-sm border-none cursor-pointer disabled:opacity-50"
            >
              {isSavingStock ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Add Product */}
      <button
        onClick={() => navigate('/add-product')}
        className="absolute right-6 bottom-24 w-14 h-14 bg-[#805062] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50 cursor-pointer border-none hover:bg-[#805062]/95"
        aria-label="Add new product"
      >
        <Plus className="w-8 h-8" />
      </button>
    </>
  );
}
