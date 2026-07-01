import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Store, PlaneTakeoff, Hotel, Utensils, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { currencies, COUNTRY_CURRENCY_MAP } from '../types/currency';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import MascotLogo from './MascotLogo';

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: number;
    name: string;
    country: string;
    startDate: string;
    endDate: string;
    boothRental: number;
    travel: number;
    accommodation: number;
    foodAllowance: number;
    role?: string | null;
  };
}

export default function EventForm({ mode, initialData }: EventFormProps) {
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [country, setCountry] = useState(initialData?.country || 'Thailand');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  
  const [boothRental, setBoothRental] = useState(initialData?.boothRental?.toString() || '');
  const [travel, setTravel] = useState(initialData?.travel?.toString() || '');
  const [accommodation, setAccommodation] = useState(initialData?.accommodation?.toString() || '');
  const [foodAllowance, setFoodAllowance] = useState(initialData?.foodAllowance?.toString() || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const isReadOnly = mode === 'edit' && initialData?.role !== 'creator';

  const { setCurrency, setHasEvent, setActiveEvent } = useOrderStore();
  const countries = ['Thailand', 'Singapore', 'USA', 'Japan'] as const;
  const activeCurrencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventName.trim() || !startDate || !endDate) return;

    setIsLoading(true);

    try {
      const url = '/api/event';
      const method = mode === 'create' ? 'POST' : 'PUT';
      const body = {
        id: initialData?.id,
        eventName: eventName.trim(),
        country,
        startDate,
        endDate,
        boothRental,
        travel,
        accommodation,
        foodAllowance,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsLoading(false);
        setIsSuccess(true);

        if (mode === 'create') {
          const data = await response.json() as { success: boolean; event: { id: number; name: string } };
          
          // Update currency and active event in the order store
          const currencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';
          const matchedCurrency = currencies.find((c) => c.code === currencyCode);
          if (matchedCurrency) {
            setCurrency(matchedCurrency);
          }
          setHasEvent(true);
          setActiveEvent(data.event.id, data.event.name);

          setTimeout(() => {
            navigate('/order');
          }, 1000);
        } else {
          // If editing the active event, we should also update activeEventName in store
          const activeEventId = useOrderStore.getState().activeEventId;
          if (activeEventId === initialData?.id) {
            setActiveEvent(activeEventId, eventName.trim());
          }
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } else {
        let errorMsg = mode === 'create' ? 'Failed to create event' : 'Failed to update event';
        try {
          const errJson = await response.json() as { error?: string };
          errorMsg = errJson.error || errorMsg;
        } catch {
          // Ignore parse failure
        }
        console.error(errorMsg);
        alert(errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Request error:', err);
      alert('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form
      className="space-y-6 pb-6"
      onSubmit={handleSubmit}
    >
      {/* Mascot Banner */}
      <section className="relative bg-brand-blue/30 rounded-[24px] p-5 flex items-center overflow-hidden border border-brand-blue/20">
        <div className="flex-1 z-10">
          <h2 className="font-bold text-[#154d5f] text-[14px] leading-tight mb-1">
            {mode === 'create' ? "Let's track our costs!" : "Let's update our costs!"}
          </h2>
          <p className="font-medium text-text-brown opacity-80 text-[12px] leading-normal">
            {mode === 'create' ? "Let's log our setup expenses for this event." : "Let's revise our setup expenses for this event."}
          </p>
        </div>
        <div className="relative w-16 h-16 flex-shrink-0 z-10 floating-animation">
          <MascotLogo sizeClassName="w-16 h-16" />
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-pink/30 rounded-full"></div>
      </section>

      {isReadOnly && (
        <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-4 py-3.5 rounded-[20px] text-[12px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>You are viewing this event as a collaborator. Only the creator can edit details.</span>
        </div>
      )}

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
            disabled={isReadOnly}
          />

          <FormSelect
            id="country"
            label="Country"
            options={countries}
            value={country}
            onChange={setCountry}
            disabled={isReadOnly}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="startDate"
              label="Start Date"
              required
              type="date"
              value={startDate}
              onChange={setStartDate}
              disabled={isReadOnly}
            />
            <FormInput
              id="endDate"
              label="End Date"
              required
              type="date"
              value={endDate}
              onChange={setEndDate}
              disabled={isReadOnly}
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
                className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown disabled:opacity-50"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={boothRental}
                onChange={(e) => setBoothRental(e.target.value)}
                disabled={isReadOnly}
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
                className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown disabled:opacity-50"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                disabled={isReadOnly}
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
                className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown disabled:opacity-50"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                disabled={isReadOnly}
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
                className="w-full h-14 pr-16 px-6 py-4 rounded-full border-2 border-outline-warm bg-[#f9fafb] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 font-bold text-xl text-text-brown disabled:opacity-50"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={foodAllowance}
                onChange={(e) => setFoodAllowance(e.target.value)}
                disabled={isReadOnly}
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
          disabled={isLoading || isSuccess || isReadOnly}
          className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer border-none animate-none"
        >
          {isReadOnly ? (
            <span>READ ONLY</span>
          ) : isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
              <span>Processing...</span>
            </>
          ) : isSuccess ? (
            <>
              <span>{mode === 'create' ? 'Event Started! 🎉' : 'Event Updated! 🎉'}</span>
            </>
          ) : (
            <>
              <span>{mode === 'create' ? 'START EVENT' : 'SAVE CHANGES'}</span>
              <Sparkles className="w-5 h-5 text-text-brown" />
            </>
          )}
        </button>
        <p className="text-center mt-4 text-[12px] leading-normal text-surface-variant-custom opacity-70 font-medium px-4">
          {isReadOnly ? 'Collaborators cannot modify event details.' : 'Confirm all details before saving.'}
        </p>
      </div>
    </form>
  );
}
