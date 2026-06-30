import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AuthLayout from '../components/AuthLayout';
import MascotLogo from '../components/MascotLogo';
import AuthButton from '../components/AuthButton';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const verifyUser = useAuthStore((state) => state.verifyUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMsg('No invitation token found in link.');
      return;
    }

    const processInvitation = async () => {
      try {
        const response = await fetch('/api/members/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to accept invitation');
        }

        setStatus('success');
        await verifyUser();
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'An unexpected error occurred.');
      }
    };

    processInvitation();
  }, [token, isAuthenticated, navigate, verifyUser]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <MascotLogo className="mb-4" />
        <h1 className="text-[28px] leading-[36px] font-bold text-text-brown tracking-tight">
          Shop Invitation
        </h1>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-text-brown text-[16px]">
            Accepting invitation and logging you in...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-3 p-5 bg-red-50 border border-red-100 rounded-3xl text-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <h3 className="font-bold text-[16px] text-red-700">Invitation Error</h3>
            <p className="text-[14px] text-red-600 font-medium leading-normal">
              {errorMsg}
            </p>
          </div>

          <div className="pt-2">
            <AuthButton
              icon={ArrowRight}
              onClick={() => navigate('/login')}
              type="button"
              variant="primary"
            >
              Go to Login
            </AuthButton>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default AcceptInvite;
