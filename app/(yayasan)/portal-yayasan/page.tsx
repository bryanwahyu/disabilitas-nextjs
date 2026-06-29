'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(localStorage.getItem('yayasan_token') ? '/dashboard' : '/auth');
  }, [router]);
  return null;
}
