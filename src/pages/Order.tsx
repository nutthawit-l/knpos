import { useState, useEffect } from 'react';
import {
  Search,
  Scan,
  Plus,
  Minus,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import MascotLogo from '../components/MascotLogo';
import PaymentModal from '../components/PaymentModal';
import EventCurrencyIndicator from '../components/EventCurrencyIndicator';
import CategoryFilter from '../components/CategoryFilter';
import { useOrderStore } from '../store/useOrderStore';
import { type Product } from '../components/SwipeableProductRow';

export interface OrderProps {
  readonly onNavigate?: (tab: string) => void;
  readonly onMenuClick?: () => void;
}

export default function Order({ onNavigate }: OrderProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    quantities,
    selectedCurrency,
    incrementItem: handleIncrement,
    decrementItem: handleDecrement,
    clearOrder,
    activeEventId,
  } = useOrderStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

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
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const getPrice = (product: Product, currencyCode: string) => {
    const val = product.prices?.[currencyCode];
    return typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) : 0);
  };

  const filteredProducts = products.filter((product) => {
    const category = product.category_name || 'General';
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCount = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const totalCost = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    return sum + getPrice(product, selectedCurrency.code) * qty;
  }, 0);

  return (
    <>
      {isConfirmModalOpen && (
        <PaymentModal
          isOpen={isConfirmModalOpen}
          items={products
            .filter((p) => (quantities[p.id] || 0) > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              quantity: quantities[p.id],
              pricePerUnit: getPrice(p, selectedCurrency.code),
            }))}
          currencySymbol={selectedCurrency.symbol}
          isLoading={isConfirming}
          onCancel={() => {
            clearOrder();
            setIsConfirmModalOpen(false);
          }}
          onEdit={() => setIsConfirmModalOpen(false)}
          onConfirm={async () => {
            setIsConfirming(true);
            const orderItems = products
              .filter((p) => quantities[p.id] > 0)
              .map((p) => ({
                product_id: p.id,
                quantity: quantities[p.id],
                price_per_unit: getPrice(p, selectedCurrency.code),
              }));

            try {
              const response = await fetch('/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  currency_code: selectedCurrency.code,
                  total_income: totalCost,
                  total_product_sold: totalCount,
                  event_id: activeEventId,
                  items: orderItems,
                }),
              });

              if (response.ok) {
                clearOrder();
                onNavigate?.('transactions');
                setIsConfirmModalOpen(false);
              } else {
                let errorMsg = 'Unknown error';
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  try {
                    const errJson = await response.json() as { error?: string };
                    errorMsg = errJson.error || errorMsg;
                  } catch {
                    // Fallback if parsing fails
                  }
                } else {
                  errorMsg = await response.text();
                }
                console.error('Checkout failed:', errorMsg);
                alert(`Checkout failed: ${errorMsg}`);
              }
            } catch (err) {
              console.error('Checkout error:', err);
              alert('A network error occurred. Please check your connection and try again.');
            } finally {
              setIsConfirming(false);
            }
          }}
        />
      )}

      {/* Main Content Scrollable Area Wrapper (renders inside MainLayout scroll container) */}
      <div className="flex flex-col min-h-0 h-full space-y-4">
        {/* Search Bar */}
        <section className="shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant-warm group-focus-within:text-[#805062] transition-colors" />
            <input
              type="text"
              placeholder="Find treats, toys, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-12 bg-[#f6ebed] rounded-full border-none focus:ring-2 focus:ring-brand-pink/50 text-[14px] font-medium text-text-brown placeholder:text-outline-variant-warm/60 outline-none"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant-warm hover:text-[#805062] transition-colors bg-transparent border-none cursor-pointer p-1"
              aria-label="Scan barcode"
            >
              <Scan className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Categories header with Currency switcher */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-brown opacity-60 pl-2">Categories</span>
          <EventCurrencyIndicator />
        </div>

        {/* Category tabs */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Products List/Grid Scroll Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-4 pb-32">
          {/* Products List/Grid */}
          <section className="pb-4">
            {isLoading ? (
              <div className="p-8 text-center text-[14px] text-text-brown font-medium">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-outline-variant-warm mb-3" />
                <p className="text-[14px] text-outline-variant-warm font-bold">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const qty = quantities[product.id] || 0;
                  const isSelected = qty > 0;
                  const price = getPrice(product, selectedCurrency.code);

                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-[20px] p-3 shadow-[0_4px_12px_rgba(78,52,46,0.05)] transition-all duration-200 flex flex-col border ${isSelected
                          ? 'border-2 border-brand-pink ring-4 ring-brand-pink/10'
                          : 'border-outline-warm/40'
                        }`}
                    >
                      {/* Product Image */}
                      <div className="aspect-square rounded-xl bg-peach-container/40 relative overflow-hidden mb-3 flex items-center justify-center p-2 border border-outline-warm/15">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-[14px] text-text-brown leading-tight mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="font-bold text-[14px] text-[#805062] mb-3">
                        {selectedCurrency.symbol}{price.toFixed(2)}
                      </p>

                      {/* Action / Controls */}
                      <div className="mt-auto">
                        {isSelected ? (
                          <div className="flex items-center justify-between bg-brand-pink/20 rounded-full p-1 border border-brand-pink/30">
                            <button
                              type="button"
                              onClick={() => handleDecrement(product.id)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#805062] hover:bg-brand-pink/10 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-text-brown text-sm">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrement(product.id)}
                              className="w-7 h-7 rounded-full bg-[#805062] flex items-center justify-center text-white hover:bg-[#805062]/90 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleIncrement(product.id)}
                              className="w-8 h-8 rounded-full bg-[#ffd9e4] text-[#805062] hover:bg-brand-pink/30 active:scale-90 transition-transform flex items-center justify-center shadow-sm cursor-pointer border-none"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Empty state mascot illustration */}
          <div className="flex flex-col items-center justify-center py-8 opacity-60">
            <div className="relative">
              <MascotLogo sizeClassName="w-20 h-20" className="border-4 border-white shadow-md floating-animation mb-3" />
              <div className="absolute -bottom-1 -right-1 bg-[#805062] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">CHARNI</div>
            </div>
            <p className="font-bold text-[14px] text-text-brown">Need help finding something?</p>
          </div>
        </div>
      </div>

      {/* Bottom Docked Summary Bar */}
      {!isConfirmModalOpen && (
        <div className="absolute bottom-20 left-0 w-full px-5 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 shadow-2xl pointer-events-auto border border-outline-warm/40 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[12px] text-text-brown/60 font-bold">Items: {totalCount}</span>
                <span className="text-[20px] font-bold text-text-brown leading-none mt-1">
                  {selectedCurrency.symbol}{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                disabled={totalCount === 0}
                onClick={() => setIsConfirmModalOpen(true)}
                className="h-12 px-6 bg-brand-pink hover:bg-brand-pink-hover text-text-brown font-bold uppercase rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none"
              >
                <span>PROCESS PAYMENT</span>
                <CreditCard className="w-5 h-5 text-text-brown" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
