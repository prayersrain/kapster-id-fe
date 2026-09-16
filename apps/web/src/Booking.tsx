import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, bookingLink, Catalog, Entity, today } from './api';
import { bookingMaxDate } from './bookingRules';
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

/** Customer self-booking. Cashier walk-ins use the separate WalkIn screen. */
function Booking({
  catalog,
  initialOutlet = '',
  loadError = '',
}: {
  catalog?: Catalog;
  initialOutlet?: string;
  loadError?: string;
}) {
  const [error, setError] = useState(''),
    [step, setStep] = useState(0);
  const [outletId, setOutlet] = useState(initialOutlet),
    [serviceId, setService] = useState(''),
    [barberId, setBarber] = useState('');
  const [date, setDate] = useState(today()),
    [time, setTime] = useState(''),
    [slots, setSlots] = useState<string[]>([]),
    [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' }),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!outletId || !serviceId || !barberId) return;
    const controller = new AbortController();
    setTime('');
    setSlots([]);
    setLoading(true);
    setError('');
    api<{ slots: string[] }>(
      `public/slots?${new URLSearchParams({ outletId, serviceId, barberId, date })}`,
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
  }, [outletId, serviceId, barberId, date]);
  return (
    <BookingScreen
      catalog={catalog ?? null}
      step={step}
      error={error || loadError}
      outletId={outletId}
      serviceId={serviceId}
      barberId={barberId}
      date={date}
      maxDate={bookingMaxDate()}
      time={time}
      slots={slots}
      loading={loading}
      busy={busy}
      customer={customer}
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
      onConfirm={async () => {
        setBusy(true);
        setError('');
        try {
          const data = await api('public/bookings', {
            outletId,
            serviceId,
            barberId,
            date,
            time,
            ...customer,
          });
          navigate(`/booking/status/${data.token}`);
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
