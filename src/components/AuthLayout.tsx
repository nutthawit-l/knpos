import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface AuthLayoutProps {
  readonly children: ReactNode;
  readonly showHeader?: boolean;
  readonly onBack?: () => void;
  readonly headerTitle?: string;
}

export default function AuthLayout({
  children,
  showHeader = false,
  onBack,
  headerTitle = 'Charni POS',
}: AuthLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger entry animation
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    // Parallax background blobs
    const handleMouseMove = (e: MouseEvent) => {
      const f1 = document.getElementById('float-1');
      const f2 = document.getElementById('float-2');
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      if (f1) {
        f1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      }
      if (f2) {
        f2.style.transform = `translate(${-x * 50}px, ${-y * 50}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="bg-surface min-h-screen flex flex-col font-quicksand overflow-hidden relative text-text-brown">
      {/* Floating Atmosphere Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 bg-pink-container rounded-full blur-3xl transition-transform duration-300 ease-out"
          id="float-1"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-container rounded-full blur-3xl transition-transform duration-300 ease-out"
          id="float-2"
        />
      </div>

      {/* Top App Bar (Optional Header) */}
      {showHeader && (
        <header className="w-full bg-background flex items-center px-4 h-16 max-w-7xl mx-auto z-40 relative">
          <button
            className="transition-transform duration-200 active:scale-95 text-text-brown p-2 rounded-full hover:bg-surface-variant-custom/10 flex items-center justify-center focus:outline-none"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-4 text-[28px] leading-[36px] font-bold text-text-brown">
            {headerTitle}
          </h1>
        </header>
      )}

      {/* Main Centered Shell */}
      <div className="flex-1 flex items-center justify-center px-6 z-10 relative">
        <div className="bg-white/40 backdrop-blur-md flex flex-col w-full max-w-md relative shadow-2xl rounded-[32px] border border-outline-warm/30 overflow-hidden">
          <main
            className={`w-full p-8 flex flex-col transition-all duration-700 ease-out ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
