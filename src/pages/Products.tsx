import { useState, useEffect } from 'react';
import { Filter, LayoutDashboard, Package, ReceiptText } from 'lucide-react';
import Header from '../components/Header';
import { currencies, type Currency } from '../types/currency';
import CurrencySortControls from '../components/CurrencySortControls';
import SwipeableProductRow, { type Product } from '../components/SwipeableProductRow';

interface ProductsProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
  onEditProduct?: (product: Product) => void;
}

export default function Products({ onNavigate, onMenuClick, onEditProduct }: ProductsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies.find((c) => c.code === 'THB') || currencies[0],
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openRowId, setOpenRowId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const getPrice = (product: Product, currencyCode: string) => {
    const map: Record<string, string> = {
      'JPY': 'jpn_price', 'THB': 'tha_price', 'SGD': 'sgp_price',
      'USD': 'deu_price', 'EUR': 'deu_price', 'KRW': 'kor_price',
      'IDR': 'idn_price', 'CNY': 'chn_price', 'TWD': 'twn_price'
    };
    const key = map[currencyCode] || 'tha_price';
    const val = product[key as keyof Product];
    return typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) : 0);
  };

  const handleDeleteProduct = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (openRowId === id) {
          setOpenRowId(null);
        }
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during deletion.');
    }
  };

  return (
    <div 
      className='bg-[#f9fafb] h-dvh overflow-hidden flex justify-center'
      onClick={() => setOpenRowId(null)}
    >
      <div className='bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        <Header
          onMenuClick={onMenuClick}
          onImportClick={() => console.log('Import CSV')}
          onAddClick={() => onNavigate?.('add-product')}
        />

        {/* Content */}
        <div className='flex-1 flex flex-col overflow-hidden px-5 pb-24 bg-white'>
          {/* Categories */}

          {/* Product Table Data */}
          <div className='flex-1 border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0'>
              <h2 className='font-semibold text-foreground text-[14px]'>
                Product Table Data
              </h2>
              <CurrencySortControls
                selectedCurrency={selectedCurrency}
                onSelectCurrency={setSelectedCurrency}
              />
            </div>

            {/* Column Labels */}
            <div className='flex items-center px-4 py-2 bg-[#f9fafb] border-b border-gray-100 shrink-0'>
              <div className='flex-1 flex items-center gap-1'>
                <span className='text-[12px] font-medium text-gray-500'>
                  Product Info
                </span>
                <Filter className='w-2.5 h-2.5 text-gray-400' />
              </div>
              <span className='text-[12px] font-medium text-gray-500'>
                Price ({selectedCurrency.symbol})
              </span>
            </div>

            {/* List Items */}
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {isLoading ? (
                <div className="p-4 text-center text-[13px] text-gray-500 font-medium">
                  Loading products...
                </div>
              ) : products.map((product, index) => (
                <SwipeableProductRow
                  key={product.id}
                  product={product}
                  selectedCurrency={selectedCurrency}
                  price={getPrice(product, selectedCurrency.code)}
                  onEdit={() => onEditProduct?.(product)}
                  onDelete={() => handleDeleteProduct(product.id)}
                  isOpen={openRowId === product.id}
                  onOpen={() => setOpenRowId(product.id)}
                  onClose={() => {
                    if (openRowId === product.id) {
                      setOpenRowId(null);
                    }
                  }}
                  isLast={index === products.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className='absolute bottom-0 w-full max-w-[400px] bg-white border-t border-gray-100 flex items-center justify-between pb-safe z-10'>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Dashboard
            </span>
          </button>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('order')}
          >
            <Package className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Order
            </span>
          </button>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('transactions')}
          >
            <ReceiptText className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Transactions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
