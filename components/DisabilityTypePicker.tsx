
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DISABILITY_TYPES,
  DISABILITY_GROUP_LABELS,
  type DisabilityGroup,
  toCanonicalSlugs,
  toDisabilityCSV,
} from '@/lib/disability';

interface DisabilityTypePickerProps {
  /** Nilai CSV dari API. Istilah lama otomatis dipetakan ke ragam yang sesuai. */
  value: string;
  /** Dipanggil dengan CSV slug kanonik. */
  onChange: (csv: string) => void;
  /** Prefix id checkbox — wajib unik kalau ada dua picker dalam satu halaman. */
  idPrefix?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const GROUP_ORDER: DisabilityGroup[] = [
  'fisik',
  'sensorik',
  'intelektual',
  'mental',
  'ganda',
  'umum',
];

/**
 * Pemilih ragam disabilitas. Menggantikan input teks bebas supaya nilai yang
 * tersimpan selalu cocok dengan yang dipakai filter pencarian.
 */
export function DisabilityTypePicker({
  value,
  onChange,
  idPrefix = 'disability',
  label = 'Ragam Disabilitas',
  description,
  disabled,
}: DisabilityTypePickerProps) {
  const selected = toCanonicalSlugs(value);

  const toggle = (slug: string, checked: boolean) => {
    const next = checked
      ? [...selected, slug]
      : selected.filter((s) => s !== slug);
    onChange(toDisabilityCSV(next));
  };

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium leading-none">{label}</legend>
      {description && <p className="text-xs text-gray-600">{description}</p>}

      <div className="space-y-3 rounded-md border p-3">
        {GROUP_ORDER.map((group) => {
          const types = DISABILITY_TYPES.filter((t) => t.group === group);
          if (types.length === 0) return null;
          return (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {DISABILITY_GROUP_LABELS[group]}
              </p>
              {types.map((t) => {
                const id = `${idPrefix}-${t.slug}`;
                return (
                  <div key={t.slug} className="flex items-start gap-2">
                    <Checkbox
                      id={id}
                      checked={selected.includes(t.slug)}
                      onCheckedChange={(checked) => toggle(t.slug, checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor={id} className="cursor-pointer font-normal leading-tight">
                      <span className="block text-sm">{t.label}</span>
                      <span className="block text-xs text-gray-500">{t.description}</span>
                    </Label>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
