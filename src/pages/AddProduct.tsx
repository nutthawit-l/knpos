import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Plus, Loader2, X } from 'lucide-react';
import { type Product } from '../components/SwipeableProductRow';
import { currencies } from '../types/currency';
import { ADD_PRODUCT_DATA } from '../data/mockData';
import FormInput from '../components/FormInput';
import MascotLogo from '../components/MascotLogo';

export interface AddProductProps {
  readonly productToEdit?: Product;
}

export default function AddProduct({
  productToEdit: propsProductToEdit,
}: AddProductProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const productToEdit = propsProductToEdit || (location.state as { productToEdit?: Product } | null | undefined)?.productToEdit;

  const handleBack = () => {
    if (productToEdit) {
      navigate('/products');
    } else {
      navigate('/dashboard');
    }
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    productToEdit ? productToEdit.image_url : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(productToEdit ? productToEdit.name : '');
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    if (!productToEdit || !productToEdit.prices) return {};
    const priceMap: Record<string, string> = {};
    Object.entries(productToEdit.prices).forEach(([currency, value]) => {
      priceMap[currency] = value !== null && value !== undefined ? String(value) : '';
    });
    return priceMap;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Local UI categories loaded from API
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stock, setStock] = useState<string>(
    productToEdit && 'stock' in productToEdit ? String((productToEdit as any).stock) : '0'
  );
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const names = data.map((c) => c.name);
          setCategories(names);
          if (productToEdit && 'category_name' in productToEdit && (productToEdit as any).category_name) {
            setSelectedCategory((productToEdit as any).category_name);
          } else if (names.length > 0) {
            setSelectedCategory(names[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, [productToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePriceChange = (currency: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [currency]: value,
    }));
  };

  const handleAddCategory = () => {
    setNewCategoryName('');
    setIsAddCategoryModalOpen(true);
  };

  const handleConfirmAddCategory = () => {
    if (newCategoryName && newCategoryName.trim()) {
      const trimmed = newCategoryName.trim();
      if (!categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
      setSelectedCategory(trimmed);
      setIsAddCategoryModalOpen(false);
    } else {
      alert('Category name cannot be empty.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Product Name is required.');
      return;
    }
    if (!selectedCategory) {
      alert('Category is required.');
      return;
    }
    if (stock.trim() === '' || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      alert('Stock Quantity must be a valid non-negative number.');
      return;
    }
    if (!prices['THB'] || isNaN(parseFloat(prices['THB']))) {
      alert('Thai Price (THB) is required.');
      return;
    }
    if (!imageFile && !productToEdit) {
      alert('Product image is required.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category_name', selectedCategory.trim());
      formData.append('stock', parseInt(stock, 10).toString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (productToEdit) {
        formData.append('image_url', productToEdit.image_url);
      }

      // Build prices dictionary to send to API
      const parsedPrices: Record<string, number | null> = {};
      Object.entries(prices).forEach(([currency, val]) => {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
          parsedPrices[currency] = parsed;
        } else {
          parsedPrices[currency] = null;
        }
      });
      formData.append('prices', JSON.stringify(parsedPrices));

      const url = productToEdit
        ? `/api/product?id=${productToEdit.id}`
        : '/api/product';
      const method = productToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        handleBack();
      } else {
        const errorText = await res.text();
        alert('Failed to save product: ' + errorText);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the product.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort currencies: THB, USD, SGD first, then the rest
  const sortedCurrencies = [...currencies].sort((a, b) => {
    const priority: Record<string, number> = { THB: 1, USD: 2, SGD: 3 };
    const pA = priority[a.code] || 99;
    const pB = priority[b.code] || 99;
    return pA - pB;
  });

  return (
    <div className="space-y-6 pb-6">
          {/* Image Upload Area */}
          <section
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-full aspect-square rounded-[20px] bg-gradient-to-br from-[#FFE0B2] to-[#FFCC80] border-4 border-white flex flex-col items-center justify-center relative shadow-md transition-transform active:scale-[0.98] overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="bg-white/40 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-10 h-10 text-text-brown" />
                  </div>
                  <p className="font-bold text-[14px] text-text-brown">
                    {ADD_PRODUCT_DATA.tapPhotoText}
                  </p>
                </>
              )}
            </div>

            {/* Mascot Sticker Corner */}
            <div className="absolute -bottom-4 -right-2 z-10 transform rotate-12 transition-transform group-hover:rotate-0 duration-300">
              <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-outline-warm relative flex items-center">
                <MascotLogo
                  sizeClassName="w-14 h-14 shrink-0"
                  className="rounded-full border border-pink-container"
                />
                <span className="absolute -top-2 -right-2 bg-[#805062] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                  {productToEdit ? "Let's update!" : ADD_PRODUCT_DATA.mascotSpeech}
                </span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </section>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Product Name */}
            <FormInput
              id="product_name"
              label={ADD_PRODUCT_DATA.productNameLabel}
              placeholder={ADD_PRODUCT_DATA.productNamePlaceholder}
              value={name}
              onChange={setName}
              required
            />

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-[14px] leading-[20px] font-bold text-text-brown pl-4">
                Category
              </label>
              <div className="flex flex-wrap gap-2 items-center pl-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2 rounded-full font-bold text-[14px] transition-all duration-200 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F7FA] text-[#37697d] border-2 border-transparent shadow-sm'
                          : 'bg-[#F5F5F5] text-text-brown border-2 border-outline-warm/30 hover:bg-[#eae0e1]/30'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-9 h-9 rounded-full bg-peach-container text-text-brown flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
                  aria-label="Add Category"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stock Quantity */}
            <FormInput
              id="stock_quantity"
              label="Stock Quantity"
              placeholder="0"
              value={stock}
              onChange={setStock}
              type="number"
              required
            />

            {/* Pricing Section */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-[14px] text-text-brown ml-4 uppercase tracking-wider">
                Pricing (Multi-Currency)
              </h3>
              <div className="space-y-4">
                {sortedCurrencies.map((currency) => (
                  <div className="space-y-2" key={currency.code}>
                    <label
                      className="text-[14px] leading-[20px] font-bold text-text-brown pl-4"
                      htmlFor={`price_${currency.code}`}
                    >
                      Price ({currency.code} {currency.symbol}){' '}
                      {currency.code === 'THB' && <span className="text-[#ef4444]">*</span>}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-5 font-bold text-[#805062] text-[16px] pointer-events-none">
                        {currency.symbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        id={`price_${currency.code}`}
                        placeholder="0.00"
                        required={currency.code === 'THB'}
                        value={prices[currency.code] || ''}
                        onChange={(e) => handlePriceChange(currency.code, e.target.value)}
                        className="w-full h-14 pl-12 pr-6 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown shadow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>
                    {productToEdit
                      ? ADD_PRODUCT_DATA.saveChangesButtonText
                      : ADD_PRODUCT_DATA.saveButtonText}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Add Category Modal */}
          {isAddCategoryModalOpen && (
            <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5 animate-fade-in">
              <div className="bg-white w-full max-w-[335px] rounded-[24px] border-2 border-outline-warm flex flex-col overflow-hidden relative shadow-2xl p-6 gap-5 font-quicksand">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-text-brown">Add New Category</h2>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(false)}
                    className="p-1 text-[#805062] hover:opacity-80 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-left">
                  <label htmlFor="new_cat_input" className="text-[13px] font-bold text-text-brown pl-2">
                    Category Name
                  </label>
                  <input
                    id="new_cat_input"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Frame card"
                    className="w-full h-12 px-5 rounded-full border-2 border-outline-warm focus:border-brand-pink focus:outline-none text-[14px] font-medium text-text-brown shadow-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border-2 border-outline-warm text-[13px] font-bold text-text-brown bg-transparent cursor-pointer hover:bg-outline-warm/10 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddCategory}
                    className="px-5 py-2.5 rounded-full bg-brand-pink text-text-brown text-[13px] font-bold border-none cursor-pointer hover:bg-brand-pink-hover active:scale-95 transition-all shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
