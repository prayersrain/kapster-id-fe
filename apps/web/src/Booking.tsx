import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Catalog, Entity, rupiah, today } from './api';
import { BookingScreen, BookingTicket } from './BookingScreen';

export function Booking({
  internal = false,
  catalog: supplied,
  onBooked,
}: {
  internal?: boolean;
  catalog?: Catalog;
  onBooked?: () => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(supplied ?? null),
    [error, setError] = useState(''),
    [step, setStep] = useState(0);
  const [outletId, setOutlet] = useState(''),
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
    if (!supplied)
      api<Catalog>('public/catalog')
        .then(setCatalog)
        .catch((e) => setError(e.message));
  }, [supplied]);
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
      catalog={catalog}
      step={step}
      error={error}
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
        setStep(0);
        setTime('');
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
