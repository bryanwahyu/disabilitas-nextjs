import { createFileRoute } from '@tanstack/react-router';

import ConsultationPartnerSetting from '@/components/admin/ConsultationPartnerSetting';

export const Route = createFileRoute('/admin/dashboard/pengaturan/')({
  component: PengaturanPage,
});


function PengaturanPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-sm text-slate-400">Konfigurasi yang bisa diubah tanpa deploy ulang.</p>
      </div>
      <ConsultationPartnerSetting />
    </div>
  );
}
