import { ArrowLeft, Calendar, Store, PlaneTakeoff, Hotel, Utensils, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateEventForm } from '../hooks/useCreateEventForm';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import MascotLogo from '../components/MascotLogo';

export interface CreateEventProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function CreateEvent({ onNavigate }: CreateEventProps) {
  const navigate = useNavigate();
  const {
    eventName,
    setEventName,
    country,
    setCountry,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    boothRental,
    setBoothRental,
    travel,
    setTravel,
    accommodation,
    setAccommodation,
    foodAllowance,
    setFoodAllowance,
    isLoading,
    isSuccess,
    activeCurrencyCode,
    handleCreateEventSubmit,
  } = useCreateEventForm({ onNavigate });

  const countries = ['Thailand', 'Singapore', 'USA', 'Japan'] as const;

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <button
            onClick={handleBack}
            className="mr-4 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-[#805062]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">
            Create Event
          </h1>
        </header>

        {/* Content */}
        <form
          className="flex-1 overflow-y-auto px-6 pb-28 pt-6 space-y-6 no-scrollbar"
          onSubmit={handleCreateEventSubmit}
        >
          {/* Mascot Banner */}
          <section className="relative bg-brand-blue/30 rounded-[24px] p-5 flex items-center overflow-hidden border border-brand-blue/20">
            <div className="flex-1 z-10">
              <h2 className="font-bold text-[#154d5f] text-[14px] leading-tight mb-1">
                Let's track our costs!
              </h2>
              <p className="font-medium text-text-brown opacity-80 text-[12px] leading-normal">
                Let's log our setup expenses for this event.
              </p>
            </div>
            <div className="relative w-16 h-16 flex-shrink-0 z-10 floating-animation">
              <MascotLogo sizeClassName="w-16 h-16" />
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-pink/30 rounded-full"></div>
          </section>

          {/* Section 1: Event Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-[#805062]">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold text-[12px] tracking-wider uppercase">
                Event Details
              </h3>
            </div>

            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-outline-warm/30 space-y-4">
              <FormInput
                id="eventName"
                label="Event Name"
                placeholder="e.g. Pop-up Craft Fair 2026"
                required
                value={eventName}
                onChange={setEventName}
              />

              <FormSelect
                id="country"
                label="Country"
                options={countries}
                value={country}
                onChange={setCountry}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  id="startDate"
                  label="Start Date"
                  required
                  type="date"
                  value={startDate}
                  onChange={setStartDate}
                />
                <FormInput
                  id="endDate"
                  label="End Date"
                  required
                  type="date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Expense Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-[#805062]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-[12px] tracking-wider uppercase">
                Expense Tracking
              </h3>
            </div>

            <div className="space-y-4">
              {/* Booth Rental */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-outline-warm/30 transition-all hover:border-brand-pink duration-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-text-brown text-[14px] flex items-center gap-2" htmlFor="boothRental">
                    <Store className="w-4 h-4 text-[#805062] opacity-70" />
                    <span>Booth Rental</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="boothRental"
                    className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={boothRental}
                    onChange={(e) => setBoothRental(e.target.value)}
                  />
                  <span className="absolute right-6 font-bold text-[14px] text-[#805062] opacity-60 cursor-default">
                    {activeCurrencyCode}
                  </span>
                </div>
              </div>

              {/* Travel */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-outline-warm/30 transition-all hover:border-brand-pink duration-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-text-brown text-[14px] flex items-center gap-2" htmlFor="travel">
                    <PlaneTakeoff className="w-4 h-4 text-[#805062] opacity-70" />
                    <span>Travel</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="travel"
                    className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={travel}
                    onChange={(e) => setTravel(e.target.value)}
                  />
                  <span className="absolute right-6 font-bold text-[14px] text-[#805062] opacity-60 cursor-default">
                    {activeCurrencyCode}
                  </span>
                </div>
              </div>

              {/* Accommodation */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-outline-warm/30 transition-all hover:border-brand-pink duration-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-text-brown text-[14px] flex items-center gap-2" htmlFor="accommodation">
                    <Hotel className="w-4 h-4 text-[#805062] opacity-70" />
                    <span>Accommodation</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="accommodation"
                    className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={accommodation}
                    onChange={(e) => setAccommodation(e.target.value)}
                  />
                  <span className="absolute right-6 font-bold text-[14px] text-[#805062] opacity-60 cursor-default">
                    {activeCurrencyCode}
                  </span>
                </div>
              </div>

              {/* Food Allowance */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-outline-warm/30 transition-all hover:border-brand-pink duration-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-text-brown text-[14px] flex items-center gap-2" htmlFor="foodAllowance">
                    <Utensils className="w-4 h-4 text-[#805062] opacity-70" />
                    <span>Food Allowance</span>
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="foodAllowance"
                    className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={foodAllowance}
                    onChange={(e) => setFoodAllowance(e.target.value)}
                  />
                  <span className="absolute right-6 font-bold text-[14px] text-[#805062] opacity-60 cursor-default">
                    {activeCurrencyCode}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Primary Action Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
                  <span>Processing...</span>
                </>
              ) : isSuccess ? (
                <>
                  <span>Event Started! 🎉</span>
                </>
              ) : (
                <>
                  <span>START EVENT</span>
                  <Sparkles className="w-5 h-5 text-text-brown" />
                </>
              )}
            </button>
            <p className="text-center mt-4 text-[12px] leading-normal text-surface-variant-custom opacity-70 font-medium px-4">
              Confirm all details before starting.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
