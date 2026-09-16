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
