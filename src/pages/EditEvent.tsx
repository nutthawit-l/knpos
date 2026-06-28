import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import EventForm from '../components/EventForm';

export default function EditEvent() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setIsLoading(true);
    fetch(`/api/event?id=${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
      })
      .then((data) => {
        setEventData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#805062]" />
        <p className="text-sm font-medium text-text-brown">Loading event details...</p>
      </div>
    );
  }

  if (!eventData) {
    return <div className="p-8 text-center text-text-brown">Event not found.</div>;
  }

  return <EventForm mode="edit" initialData={eventData} />;
}
