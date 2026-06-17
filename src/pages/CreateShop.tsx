import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useCreateShopForm } from '../hooks/useCreateShopForm';
import { CREATE_SHOP_DATA } from '../data/mockData';
import FormInput from '../components/FormInput';
import BottomNavigation from '../components/BottomNavigation';

export interface CreateShopProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function CreateShop({ onNavigate }: CreateShopProps) {
  const {
    shopName,
    setShopName,
    description,
    setDescription,
    isLoading,
    handleCreateShopSubmit,
  } = useCreateShopForm({ onNavigate });

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
            Create Your Shop
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 pt-6 space-y-6 no-scrollbar">
          {/* Charni the Clerk Mascot Section */}
          <section className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <div className="absolute -top-3 -right-8 bg-white p-3 rounded-2xl rounded-bl-none border-2 border-outline-warm shadow-sm max-w-[160px] z-10">
                <p className="font-bold text-text-brown text-[13px] leading-snug">
                  {CREATE_SHOP_DATA.mascotSpeech}
                </p>
              </div>
              <img
                alt={CREATE_SHOP_DATA.mascotAlt}
                className="w-full h-full object-cover rounded-full border-4 border-pink-container shadow-sm"
                src={CREATE_SHOP_DATA.mascotUrl}
              />
            </div>
          </section>

          {/* Shop Creation Form */}
          <form className="space-y-5" onSubmit={handleCreateShopSubmit}>
            {/* Shop Name */}
            <FormInput
              id="shopName"
              label={CREATE_SHOP_DATA.shopNameLabel}
              placeholder={CREATE_SHOP_DATA.shopNamePlaceholder}
              required
              value={shopName}
              onChange={setShopName}
            />

            {/* Description */}
            <div className="space-y-2">
              <label
                className="text-[14px] leading-[20px] font-bold text-text-brown pl-4"
                htmlFor="description"
              >
                {CREATE_SHOP_DATA.descriptionLabel}
              </label>
              <textarea
                id="description"
                className="w-full p-5 bg-white border-2 border-outline-warm rounded-[20px] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown custom-shadow resize-none"
                placeholder={CREATE_SHOP_DATA.descriptionPlaceholder}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Create Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>{CREATE_SHOP_DATA.createButtonText}</span>
                    <Sparkles className="w-5 h-5 text-text-brown" />
                  </>
                )}
              </button>
              <p className="text-center mt-4 text-[12px] leading-normal text-surface-variant-custom opacity-70 font-medium px-4">
                {CREATE_SHOP_DATA.termsText}
              </p>
            </div>
          </form>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation onNavigate={onNavigate} />
      </div>
    </div>
  );
}
