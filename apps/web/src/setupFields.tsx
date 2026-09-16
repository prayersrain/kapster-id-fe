import { ReactNode } from 'react';
import { Entity } from './api';
import { dayNames, FieldSpec } from './ui';

/** Field definitions shared by dashboard dialogs and onboarding, so both validate the same way. */
type Values = Record<string, any>;
export type Option = { value: string; label: string };

export const moneyField = (
  key: string,
  label: string,
  value = 0,
  extra: Partial<FieldSpec> = {},
): FieldSpec => ({ key, label, type: 'money', min: 0, max: 100000000, value, ...extra });

export const outletPicker = (options: Option[], value?: string): FieldSpec => ({
  key: 'outletId',
  label: 'Outlet',
  options,
  value: value ?? options[0]?.value,
});

export const outletFields = (outlet?: Entity): FieldSpec[] => [
  {
    key: 'name',
    label: 'Nama outlet',
    value: outlet?.name,
    minLength: 2,
    placeholder: 'Contoh: Garasi Barber Kemang',
    wide: true,
  },
  {
    key: 'address',
    label: 'Alamat',
    type: 'textarea',
    value: outlet?.address,
    minLength: 2,
    placeholder: 'Jalan, nomor, kecamatan, kota',
  },
];

export const serviceFields = (service?: Entity, outletField?: FieldSpec): FieldSpec[] => [
  ...(outletField ? [outletField] : []),
  {
    key: 'name',
    label: 'Nama layanan',
    value: service?.name,
    minLength: 2,
    placeholder: 'Contoh: Haircut + Wash',
  },
  moneyField('price', 'Harga', service?.price ?? 0),
  {
    key: 'duration',
    label: 'Durasi',
    type: 'duration',
    min: 5,
    max: 240,
    value: service?.duration ?? 45,
    wide: true,
  },
  ...(service
    ? [
        {
          key: 'active',
          label: 'Layanan aktif',
          type: 'checkbox',
          value: !!service.active,
          help: 'Layanan nonaktif tidak bisa dipilih di booking baru.',
        } as FieldSpec,
      ]
    : []),
];

export const barberFields = (barber?: Entity, outletField?: FieldSpec): FieldSpec[] => [
  ...(outletField ? [outletField] : []),
  {
    key: 'name',
    label: 'Nama kapster',
    value: barber?.name,
    minLength: 2,
    placeholder: 'Contoh: Raka Pratama',
  },
  {
    key: 'start',
    label: 'Mulai kerja',
    type: 'clock',
    value: barber?.start ?? '09:00',
    presets: [
      { label: '09–18', values: { start: '09:00', end: '18:00' } },
      { label: '10–20', values: { start: '10:00', end: '20:00' } },
      { label: '10–22', values: { start: '10:00', end: '22:00' } },
    ],
  },
  { key: 'end', label: 'Selesai kerja', type: 'clock', value: barber?.end ?? '18:00' },
  {
    key: 'days',
    label: 'Hari kerja',
    type: 'days',
    value: barber ? JSON.parse(barber.days) : [1, 2, 3, 4, 5, 6],
  },
  ...(barber
    ? [
        {
          key: 'active',
          label: 'Kapster aktif',
          type: 'checkbox',
          value: !!barber.active,
          help: 'Kapster nonaktif tidak muncul di booking baru.',
        } as FieldSpec,
      ]
    : []),
];

export const inviteFields = (outletField: FieldSpec): FieldSpec[] => [
  { key: 'name', label: 'Nama', minLength: 2 },
  { key: 'email', label: 'Email', type: 'email' },
  { ...outletField, wide: true },
];

const workHours = (v: Values) => {
  const span =
    Number(v.end.slice(0, 2)) * 60 +
    Number(v.end.slice(3)) -
    (Number(v.start.slice(0, 2)) * 60 + Number(v.start.slice(3)));
  return span > 0
    ? `${Math.floor(span / 60)} jam${span % 60 ? ` ${span % 60} menit` : ''} per hari`
    : 'Jam belum valid';
};
export const schedulePreview = (v: Values): ReactNode =>
  v.days.length ? (
    <span className="preview-ok">
      {dayNames(v.days)} · {v.start}–{v.end} WIB · {workHours(v)}
    </span>
  ) : (
    <span className="preview-warn">Belum ada hari kerja dipilih</span>
  );
