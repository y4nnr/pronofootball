import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import ChangePasswordForm from '../components/ChangePasswordForm';

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if user needs to change password
      fetch('/api/auth/check-password-change')
        .then(res => res.json())
        .then(data => {
          if (!data.needsPasswordChange) {
            router.push('/dashboard');
          } else {
            setNeedsPasswordChange(true);
          }
        })
        .catch(() => {
          router.push('/dashboard');
        });
    }
  }, [status, router]);

  if (status === 'loading' || !needsPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Change Your Password</h1>
          <p className="mt-2 text-gray-600">
            For security reasons, you must change your password before continuing.
          </p>
        </div>
        <ChangePasswordForm
          onSuccess={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
} 