export const HOUR_PX = 48;
const MIN_CARD_PX = 40;
export const cardHeight = (duration: number) => Math.max(MIN_CARD_PX, (duration / 60) * HOUR_PX - 2);

export type Placed<T> = { b: T; lane: number; count: number };

/**
 * Assigns side-by-side lanes to bookings in one day column. Two cards share a lane only when they
 * do not overlap on screen: a short booking still draws a minimum-height card that can reach past
 * the start of the next booking even though the times do not conflict.
 * Items are API bookings: `starts`/`ends` in epoch ms (ends includes the buffer), `duration` in minutes.
 */
export function calendarLanes<T extends Record<string, any>>(items: T[]): Placed<T>[] {
  const bottom = (b: T) => Math.max(b.ends, b.starts + (cardHeight(b.duration) / HOUR_PX) * 3_600_000);
  const placed: Placed<T>[] = [];
  let cluster: Placed<T>[] = [],
    clusterEnd = 0,
    ends: number[] = [];
  const flush = () => cluster.forEach((p) => (p.count = ends.length));
  for (const b of [...items].sort((x, y) => x.starts - y.starts)) {
    if (b.starts >= clusterEnd) {
      flush();
      cluster = [];
      ends = [];
    }
    let lane = ends.findIndex((end) => end <= b.starts);
    if (lane === -1) lane = ends.push(0) - 1;
    ends[lane] = bottom(b);
    clusterEnd = Math.max(clusterEnd, bottom(b));
    const item = { b, lane, count: 1 };
    cluster.push(item);
    placed.push(item);
  }
  flush();
  return placed;
}
