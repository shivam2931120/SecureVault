'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/vault');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <div className="text-text-secondary text-xs">
        <span className="text-primary">$</span> redirecting to /vault...
        <span className="cursor-blink"></span>
      </div>
    </div>
  );
}
