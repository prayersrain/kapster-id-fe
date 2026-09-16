/**
 * Setup readiness shared by the onboarding flow and the dashboard.
 * Mirrors the server: `POST app/approval` needs at least one active outlet and, for every active
 * outlet, one active service and one active kapster; publishing an outlet needs the same per outlet
 * plus an approved business. The server stays the authority; this only explains what is missing.
 */
type Row = Record<string, any>;
export type SetupData = { org: Row; outlets: Row[]; services: Row[]; barbers: Row[]; team: Row[] };

export type OutletReadiness = { outlet: Row; services: number; barbers: number; ready: boolean };

export function outletReadiness(data: SetupData): OutletReadiness[] {
  return data.outlets
    .filter((o) => o.active)
    .map((outlet) => {
      const services = data.services.filter((s) => s.outletId === outlet.id && s.active).length;
      const barbers = data.barbers.filter((b) => b.outletId === outlet.id && b.active).length;
      return { outlet, services, barbers, ready: services > 0 && barbers > 0 };
    });
}

export function setupProgress(data: SetupData) {
  const outlets = outletReadiness(data);
  const profile = !!data.org.name && !!data.org.slug;
  const outlet = outlets.length > 0;
  const services = outlet && outlets.every((o) => o.services > 0);
  const barbers = outlet && outlets.every((o) => o.barbers > 0);
  const cashiers = data.team.some((t) => t.role === 'cashier');
  const missing = [
    ...(outlet ? [] : ['Tambahkan outlet pertama.']),
    ...outlets.filter((o) => !o.services).map((o) => `${o.outlet.name} belum punya layanan aktif.`),
    ...outlets.filter((o) => !o.barbers).map((o) => `${o.outlet.name} belum punya kapster aktif.`),
  ];
  return {
    outlets,
    profile,
    outlet,
    services,
    barbers,
    cashiers,
    /** Everything `POST app/approval` checks. */
    ready: outlet && services && barbers,
    missing,
    canSubmit: ['draft', 'rejected'].includes(data.org.status),
    published: data.outlets.some((o) => o.published),
  };
}

export type SetupProgress = ReturnType<typeof setupProgress>;

/** First required onboarding step still incomplete, or the summary once the required data is in place. */
export function nextSetupStep(progress: SetupProgress) {
  return !progress.outlet
    ? 'outlet'
    : !progress.services
      ? 'layanan'
      : !progress.barbers
        ? 'kapster'
        : 'ringkasan';
}

export type SetupStageState = 'done' | 'active' | 'next';
export type SetupBannerView = {
  tone: 'progress' | 'attention' | 'approved';
  badge: string;
  title: string;
  description: string;
  action: string;
  /** Always an onboarding step: the banner only navigates, it never submits or publishes. */
  to: string;
  stages: { label: string; note: string; state: SetupStageState }[];
};

/**
 * The dashboard's summary of activation: three stages over the six onboarding steps. `null` hides it,
 * both once booking is live and for any status the app does not define, so it never invites an action the
 * server would refuse.
 */
export function setupBanner(data: SetupData): SetupBannerView | null {
  const progress = setupProgress(data);
  const status = data.org.status;
  if (status === 'approved' && progress.published) return null;
  const step = (id: string) => `/owner/onboarding?langkah=${id}`;
  const stages = (active: number, notes: [string, string, string]) =>
    ['Data bisnis', 'Review Admin', 'Publikasi'].map((label, i) => ({
      label,
      note: notes[i],
      state: (i < active ? 'done' : i === active ? 'active' : 'next') as SetupStageState,
    }));
  switch (status) {
    case 'draft':
      return {
        tone: 'progress',
        badge: 'Belum selesai',
        title: 'Siapkan bisnis untuk booking pertama',
        description: 'Lengkapi data bisnis, outlet, layanan, dan jadwal kapster sebelum mengajukan review.',
        action: 'Lanjutkan setup',
        to: step(nextSetupStep(progress)),
        stages: stages(0, [
          progress.ready ? 'Siap diajukan' : 'Lengkapi setup',
          'Belum diajukan',
          'Setelah disetujui',
        ]),
      };
    case 'pending':
      return {
        tone: 'progress',
        badge: 'Menunggu review',
        title: 'Pengajuan Anda sedang ditinjau',
        description:
          'Data bisnis sudah dikirim ke Admin. Setelah disetujui, Anda bisa menerbitkan halaman booking.',
        action: 'Lihat pengajuan',
        to: step('ringkasan'),
        stages: stages(1, ['Sudah dikirim', 'Dalam proses', 'Setelah disetujui']),
      };
    case 'rejected':
      return {
        tone: 'attention',
        badge: 'Perlu revisi',
        title: 'Ada data yang perlu diperbaiki',
        description: 'Baca catatan Admin, perbaiki data yang diminta, lalu kirim ulang pengajuan Anda.',
        action: 'Perbaiki setup',
        to: step(nextSetupStep(progress)),
        stages: stages(0, ['Perlu diperbaiki', 'Ajukan ulang', 'Setelah disetujui']),
      };
    case 'approved':
      return {
        tone: 'approved',
        badge: 'Disetujui',
        title: 'Bisnis siap menerima booking',
        description:
          'Pengajuan Anda telah disetujui. Terbitkan outlet agar halaman booking bisa diakses customer.',
        action: 'Terbitkan booking',
        to: step('ringkasan'),
        stages: stages(2, [
          'Lengkap',
          'Disetujui',
          progress.outlets.some((o) => o.ready) ? 'Siap diterbitkan' : 'Lengkapi outlet dulu',
        ]),
      };
    case 'suspended':
      // Suspension unpublishes every outlet and only Admin can lift it, so there is nothing to publish.
      return {
        tone: 'attention',
        badge: 'Ditangguhkan',
        title: 'Booking publik dihentikan sementara',
        description:
          'Admin menangguhkan bisnis ini sehingga halaman booking tidak bisa diakses customer. Lihat catatan Admin di ringkasan setup.',
        action: 'Lihat status',
        to: step('ringkasan'),
        stages: stages(1, ['Lengkap', 'Ditangguhkan', 'Dihentikan sementara']),
      };
    default:
      return null;
  }
}
