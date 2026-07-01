import { useState, useEffect } from 'react';
import { Store, Calendar, TrendingUp, PlusCircle, Loader2 } from 'lucide-react';
import { DASHBOARD2_DATA } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export interface DashboardProp {
  readonly onNavigate?: (tab: string) => void;
}

interface EventData {
  id: number;
  shop_id: number;
  name: string;
  country: string;
  startDate: string;
  endDate: string;
  boothRental: number;
  travel: number;
  accommodation: number;
  foodAllowance: number;
  role: 'creator' | 'collaborator' | 'assistant' | null;
  isJoined: number;
  status: 'upcoming' | 'inprogress' | 'ended';
  totalSales: number;
  netProfit: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'Thailand': '฿',
  'Singapore': 'S$',
  'USA': '$',
  'Japan': '¥',
};


export default function Dashboard() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate()

  useEffect(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let active = true;
    setIsLoading(true);

    fetch(`/api/event?today=${todayStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setEvents(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);
  const handleEventClick = (event: EventData) => {
    if (event.status === 'upcoming') {
      navigate(`/edit-event?event_id=${event.id}`);
    } else if (event.status === 'inprogress') {
      navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}`);
    } else if (event.status === 'ended') {
      navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}&disable_order=true`);
    }
  };
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#805062]" />
        <p className="text-[14px] text-text-brown/70 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const hasEndedEvent = events.some((e) => e.status === 'ended');
  const rawDisplayedEvents = hasEndedEvent
    ? events
    : events.filter((e) => e.status === 'inprogress' || e.status === 'upcoming');

  const getGroupPriority = (e: EventData) => {
    if (e.role === 'creator') return 1;
    if (e.role !== 'creator' && e.isJoined === 1) return 2;
    return 3;
  };

  const getStatusPriority = (status: string) => {
    if (status === 'inprogress') return 1;
    if (status === 'upcoming') return 2;
    return 3;
  };

  const displayedEvents = [...rawDisplayedEvents].sort((a, b) => {
    const groupA = getGroupPriority(a);
    const groupB = getGroupPriority(b);
    if (groupA !== groupB) return groupA - groupB;

    const statusA = getStatusPriority(a.status);
    const statusB = getStatusPriority(b.status);
    if (statusA !== statusB) return statusA - statusB;

    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  // Title label for the events list
  const eventsHeaderLabel = hasEndedEvent ? DASHBOARD2_DATA.pastEventsLabel : 'Current & Upcoming Events';

  return (
    <>
      {/* Shop Summary Section (State 2 only: shown if at least one ended event exists) */}
      {hasEndedEvent && (
        <section className="space-y-3">
          <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
            {DASHBOARD2_DATA.headerTitle}
          </h2>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Sales Card */}
            <div className="col-span-2 bg-[#f8bbd0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between min-h-[120px]">
              <div>
                <p className="text-[12px] font-medium text-[#76485a] opacity-80">
                  {DASHBOARD2_DATA.totalSalesLabel}
                </p>
                <h3 className="text-[28px] font-bold text-[#76485a] leading-none mt-1">
                  {DASHBOARD2_DATA.totalSalesValue}
                </h3>
              </div>
              <div className="mt-4 flex items-center text-[#76485a] font-bold text-[12px]">
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                <span>{DASHBOARD2_DATA.totalSalesTrend}</span>
              </div>
            </div>

            {/* Active Shops Card */}
            <div className="bg-[#b5e7fe] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
              <div>
                <Store className="w-5 h-5 text-[#37697d] mb-2" />
                <p className="text-[12px] font-medium text-[#37697d] opacity-80">
                  {DASHBOARD2_DATA.activeShopsLabel}
                </p>
              </div>
              <h3 className="text-[24px] font-bold text-[#37697d] leading-none mt-2">
                {DASHBOARD2_DATA.activeShopsValue}
              </h3>
            </div>

            {/* Events this Year Card */}
            <div className="bg-[#fddeb0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
              <div>
                <Calendar className="w-5 h-5 text-[#68522f] mb-2" />
                <p className="text-[12px] font-medium text-[#68522f] opacity-80">
                  {DASHBOARD2_DATA.eventsYearLabel}
                </p>
              </div>
              <h3 className="text-[24px] font-bold text-[#68522f] leading-none mt-2">
                {DASHBOARD2_DATA.eventsYearValue}
              </h3>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Events Section (reused) */}
      {displayedEvents.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
              {eventsHeaderLabel}
            </h2>
            {hasEndedEvent && (
              <button
                onClick={() => alert('Viewing all events will be supported in the next update! 🐾')}
                className="text-[#805062] font-bold text-[12px] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {DASHBOARD2_DATA.viewAllLabel}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedEvents.map((event) => {
              const currencySym = CURRENCY_SYMBOLS[event.country] || '฿';
              const formattedSales = `${currencySym}${event.totalSales.toLocaleString()}`;

              // Determine Badge styling & text
              const isLoss = event.netProfit < 0;
              const badgeText = event.status === 'inprogress'
                ? 'In Progress'
                : event.status === 'upcoming'
                  ? 'Upcoming'
                  : isLoss
                    ? 'Accumulated Loss'
                    : 'Profit';

              const badgeClass = event.status === 'inprogress'
                ? 'bg-[#d1fae5] text-[#065f46]'
                : event.status === 'upcoming'
                  ? 'bg-[#fef3c7] text-[#92400e]'
                  : isLoss
                    ? 'bg-[#b5e7fe]/90 text-[#37697d]'
                    : 'bg-[#f8bbd0]/90 text-[#76485a]';

              // Format Dates (e.g. "25 Jun 2026")
              const formatDate = (dateStr: string) => {
                try {
                  const parsed = new Date(dateStr);
                  return parsed.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                } catch {
                  return dateStr;
                }
              };

              const dateRange = `${formatDate(event.startDate)} - ${formatDate(event.endDate)} at ${event.country}`;

              // Format Net Profit
              const formattedProfit = isLoss
                ? `-${currencySym}${Math.abs(event.netProfit).toLocaleString()}`
                : `+${currencySym}${event.netProfit.toLocaleString()}`;

              const roleConfig = {
                creator: { text: 'Creator', className: 'bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]/60' },
                collaborator: { text: 'Collaborator', className: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]/60' },
                assistant: { text: 'Assistant', className: 'bg-[#f0f9ff] text-[#075985] border-[#bae6fd]/60' },
              };

              const currentRole = event.role || 'collaborator';
              const roleText = roleConfig[currentRole]?.text || 'Collaborator';
              const roleBadgeClass = roleConfig[currentRole]?.className || 'bg-gray-50 text-gray-600 border border-gray-200';

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] border border-[#E0D0CC]/30 group hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] duration-300"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-[18px] font-bold text-text-brown leading-tight">
                          {event.name}
                        </h4>
                        <p className="text-[12px] text-text-brown/70 mt-0.5">
                          {dateRange}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${badgeClass}`}>
                          {badgeText}
                        </div>
                        {event.isJoined === 1 && (
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${roleBadgeClass}`}>
                            {roleText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-[#E0D0CC]/20">
                      <div>
                        <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                          {DASHBOARD2_DATA.totalSalesLabel}
                        </p>
                        <p className="font-bold text-text-brown text-[16px]">
                          {formattedSales}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                          Net Profit
                        </p>
                        <p className={`font-bold text-[16px] ${isLoss ? 'text-[#326578]' : 'text-[#805062]'}`}>
                          {formattedProfit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Create New Event Button */}
      <section className="pt-2">
        <button
          onClick={() => navigate('/create-event')}
          className="w-full bg-[#fcf1f2] border-2 border-dashed border-[#805062]/30 py-8 px-6 rounded-[20px] group hover:bg-[#ffd9e4]/20 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-[#f8bbd0] flex items-center justify-center text-[#805062] group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <PlusCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[#805062] text-[20px]">
            {DASHBOARD2_DATA.createEventTitle}
          </h3>
          <p className="text-text-brown/80 text-[13px] text-center max-w-[280px]">
            {DASHBOARD2_DATA.createEventSubtitle}
          </p>
        </button>
      </section>
    </>
  );
}
