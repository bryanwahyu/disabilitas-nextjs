import { createFileRoute } from '@tanstack/react-router';
import LocationManager from '@/components/admin/LocationManager';
import MasterLokasiManager from '@/components/admin/MasterLokasiManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/admin/dashboard/lokasi/')({
  component: LokasiPage,
});

function LokasiPage() {
  return (
    <div className="p-6">
      <Tabs defaultValue="lokasi">
        <TabsList className="mb-4">
          <TabsTrigger value="lokasi">Lokasi Terapi</TabsTrigger>
          <TabsTrigger value="master">Master Lokasi</TabsTrigger>
        </TabsList>
        <TabsContent value="lokasi"><LocationManager /></TabsContent>
        <TabsContent value="master"><MasterLokasiManager /></TabsContent>
      </Tabs>
    </div>
  );
}
