import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, bookingLink, Catalog, Entity, today } from './api';
import { BookingDirectory, BookingMissing, BookingScreen, BookingTicket } from './BookingScreen';

export function PublicBooking() {
  const { shop = '', outlet: outletSlug } = useParams();
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [missing, setMissing] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setCatalog(null);
    setMissing('');
    api<Catalog>(`public/shops/${encodeURIComponent(shop)}`, undefined, 'GET', controller.signal)
      .then(setCatalog)
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (e instanceof ApiError && e.status === 404) setMissing(e.message);
        else setError(e.message);
      });
    return () => controller.abort();
  }, [shop]);
  if (!shop) return <BookingDirectory />;
  if (missing) return <BookingMissing message={missing} />;
  const preselected =
    catalog?.outlets.find((o) => o.slug === outletSlug) ??
    (catalog?.outlets.length === 1 ? catalog.outlets[0] : undefined);
  if (catalog && outletSlug && !catalog.outlets.some((o) => o.slug === outletSlug))
    return (
      <BookingMissing
        message="Outlet ini tidak tersedia untuk booking online."
        shop={{ name: catalog.org!.name, href: bookingLink(catalog.org!.slug) }}
      />
    );
  return (
    <Booking
      key={`${shop}/${outletSlug ?? ''}/${catalog ? 'ready' : 'loading'}`}
      catalog={catalog ?? undefined}
      loadError={error}
      initialOutlet={preselected?.id}
    />
  );
}

export function Booking({
  internal = false,
  catalog,
  onBooked,
  initialOutlet = '',
  loadError = '',
}: {
  internal?: boolean;
  catalog?: Catalog;
  onBooked?: () => void;
  initialOutlet?: string;
  loadError?: string;
}) {
  const [error, setError] = useState(''),
    // Cashiers work inside one outlet, so they start directly at the service step.
    [step, setStep] = useState(internal && initialOutlet ? 1 : 0);
  const [outletId, setOutlet] = useState(initialOutlet),
    [serviceId, setService] = useState(''),
    [barberId, setBarber] = useState('');
  const [date, setDate] = useState(today()),
    [time, setTime] = useState(''),
    [slots, setSlots] = useState<string[]>([]),
    [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' }),
    [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Entity | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!outletId || !serviceId || !barberId) return;
    const controller = new AbortController();
    setTime('');
    setSlots([]);
    setLoading(true);
    setError('');
    api<{ slots: string[] }>(
      `${internal ? 'app' : 'public'}/slots?${new URLSearchParams({ outletId, serviceId, barberId, date })}`,
      undefined,
      'GET',
      controller.signal,
    )
      .then((data) => setSlots(data.slots))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [outletId, serviceId, barberId, date, internal]);
  const maxDate = new Date(Date.now() + 30 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  return (
    <BookingScreen
      catalog={catalog ?? null}
      step={step}
      firstStep={internal && initialOutlet ? 1 : 0}
      error={error || loadError}
      outletId={outletId}
      serviceId={serviceId}
      barberId={barberId}
      date={date}
      maxDate={maxDate}
      time={time}
      slots={slots}
      loading={loading}
      busy={busy}
      customer={customer}
      result={result}
      internal={internal}
      onStep={(s) => {
        setStep(s);
        setError('');
      }}
      onOutlet={(id) => {
        setOutlet(id);
        setService('');
        setBarber('');
      }}
      onService={(id) => {
        setService(id);
        setBarber('');
      }}
      onBarber={setBarber}
      onDate={setDate}
      onTime={setTime}
      onCustomer={setCustomer}
      onRestart={() => {
        setResult(null);
        setStep(internal && initialOutlet ? 1 : 0);
        setService('');
        setBarber('');
        setTime('');
        setCustomer({ name: '', phone: '' });
      }}
      onConfirm={async () => {
        setBusy(true);
        setError('');
        try {
          const data = await api(`${internal ? 'app' : 'public'}/bookings`, {
            outletId,
            serviceId,
            barberId,
            date,
            time,
            ...customer,
          });
          if (internal) {
            setResult(data);
            onBooked?.();
          } else navigate(`/booking/status/${data.token}`);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function BookingStatus() {
  const { token } = useParams(),
    [data, setData] = useState<Entity | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    const load = () =>
      api(`public/bookings/${token}`)
        .then(setData)
        .catch((e) => setError(e.message));
    void load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);
  return <BookingTicket data={data} error={error} />;
}
