import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBookingLink } from '../apps/web/src/links.ts';
import { calendarLanes, cardHeight, HOUR_PX } from '../apps/web/src/calendarLanes.ts';

test('pasted booking links keep the outlet segment', () => {
  const cases = [
    ['garasi-barber', '/booking/garasi-barber'],
    ['  Garasi-Barber ', '/booking/garasi-barber'],
    ['http://127.0.0.1:5173/booking/garasi-barber/tebet', '/booking/garasi-barber/tebet'],
    ['/booking/garasi-barber/tebet?ref=instagram#top', '/booking/garasi-barber/tebet'],
    ['booking.kapster.id/garasi-barber/tebet', '/booking/garasi-barber/tebet'],
    ['https://booking.kapster.id/garasi-barber', '/booking/garasi-barber'],
    ['/booking/status/abc123', ''],
    ['', ''],
  ];
  for (const [input, expected] of cases) assert.equal(parseBookingLink(input), expected, input);
});

const minute = 60_000;
// Bookings store the service duration plus the 10 minute buffer in `ends`.
const booking = (id, start, duration) => ({
  id,
  starts: start * minute,
  ends: (start + duration + 10) * minute,
  duration,
});

test('short back-to-back bookings get separate lanes because their cards overlap on screen', () => {
  const [first, second] = calendarLanes([booking('a', 0, 15), booking('b', 25, 15)]);
  assert.equal(first.b.ends, second.b.starts, 'times do not conflict');
  const firstBottom = (cardHeight(15) / HOUR_PX) * 60;
  assert.ok(firstBottom > 25, 'the first card still reaches past the second start');
  assert.notEqual(first.lane, second.lane);
  assert.equal(first.count, 2);
  assert.equal(second.count, 2);
});

test('long bookings that end before the next one share a lane', () => {
  const placed = calendarLanes([booking('a', 0, 60), booking('b', 70, 60), booking('c', 140, 45)]);
  assert.deepEqual(
    placed.map((p) => [p.b.id, p.lane, p.count]),
    [
      ['a', 0, 1],
      ['b', 0, 1],
      ['c', 0, 1],
    ],
  );
});

test('overlapping bookings sit side by side and separate clusters reset the lane count', () => {
  const placed = calendarLanes([
    booking('a', 0, 45),
    booking('b', 10, 45),
    booking('c', 20, 45),
    booking('d', 300, 45),
  ]);
  const byId = Object.fromEntries(placed.map((p) => [p.b.id, p]));
  assert.deepEqual([byId.a.lane, byId.b.lane, byId.c.lane], [0, 1, 2]);
  assert.deepEqual([byId.a.count, byId.b.count, byId.c.count], [3, 3, 3]);
  assert.deepEqual([byId.d.lane, byId.d.count], [0, 1]);
});
