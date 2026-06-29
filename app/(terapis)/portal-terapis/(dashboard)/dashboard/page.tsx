export const metadata = { title: 'Dashboard Terapis' };

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard Terapis</h1>
      <p className="text-slate-400 text-sm mb-8">Selamat datang di Portal Terapis DisabilitasKu.id</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Appointment Hari Ini', color: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
          { label: 'Pending', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
          { label: 'Selesai Bulan Ini', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
          { label: 'Rating', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-5 ${stat.color}`}>
            <p className="text-xs font-medium opacity-70 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
