import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { currencies } from '../types/currency';
import TextInput from '../components/TextInput';
import MascotLogo from '../components/MascotLogo';

export default function AddProduct() {
  const navigate = useNavigate();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null,);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePriceChange = (currency: string, value: string) => { setPrices((prev) => ({
      ...prev,
      [currency]: value,
    }));
  };

  const handleSave = async () => {
    if (!imageFile) {
      alert('Product image is required.');
      return;
    }
    if (!name.trim()) {
      alert('Product Name is required.');
      return;
    }
    if (!prices['THB'] || isNaN(parseFloat(prices['THB']))) {
      alert('Thai Price (THB) is required.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('image', imageFile);

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

      const url = '/api/product';
      const method = 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        navigate(-1);
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
    <div className="bg-surface h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-100 relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* Header */}
        <header className="bg-[#fff8f8] flex items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-primary-custom"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-[20px] text-primary-custom tracking-tight">
            Add New Product
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 pt-6 space-y-6 no-scrollbar">
          {/* Image Upload Area */}
          <section
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-full aspect-square rounded-[20px] bg-linear-to-br from-brand-peach to-[#FFCC80] border-4 border-white flex flex-col items-center justify-center relative shadow-md transition-transform active:scale-[0.98] overflow-hidden">
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
                    Tap to add product photo
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
                <span className="absolute -top-2 -right-2 bg-primary-custom text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                  Let's add your first product
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
            <TextInput
              id="product_name"
              label="Product Name"
              placeholder="e.g., Frame card fuffy"
              value={name}
              onChange={setName}
              required
            />

            {/* Pricing Section */}
            <div className="space-y-4 pt-2">
              <div className="space-y-4">
                {sortedCurrencies.map((currency) => (
                  <div className="space-y-2" key={currency.code}>
                    <label
                      className="text-[14px] leading-5 font-bold text-text-brown pl-4"
                      htmlFor={`price_${currency.code}`}
                    >
                      Price ({currency.code} {currency.symbol}){' '}
                      {currency.code === 'THB' && <span className="text-destructive">*</span>}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-5 font-bold text-primary-custom text-[16px] pointer-events-none">
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
                        className="w-full h-14 pl-12 pr-6 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-6 placeholder:text-outline-variant-warm font-medium text-text-brown shadow-sm"
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
                    SAVE PRODUCT
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
