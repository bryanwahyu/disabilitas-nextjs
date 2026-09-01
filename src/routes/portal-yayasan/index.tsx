import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

/**
 * Akar portal yayasan.
 *
 * Tetap di klien (bukan `beforeLoad`) karena penentunya token di
 * `localStorage`, yang tidak ada di server. Tujuan ditulis dengan prefix penuh
 * `/portal-yayasan/...` karena rewrite host tidak lagi dipakai.
 */
export const Route = createFileRoute('/portal-yayasan/')({
  component: RootPage,
});

function RootPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({
      replace: true,
      to: localStorage.getItem('yayasan_token')
        ? '/portal-yayasan/dashboard'
        : '/portal-yayasan/auth',
    });
  }, [navigate]);
  return null;
}
