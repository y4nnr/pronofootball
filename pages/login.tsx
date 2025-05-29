import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage where login is now integrated
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-xl text-white animate-pulse">Redirecting...</div>
    </div>
  );
}

