export const bookingLink = (orgSlug: string, outletSlug?: string) =>
  `/booking/${orgSlug}${outletSlug ? `/${outletSlug}` : ''}`;

/**
 * Turns whatever a customer pastes (a slug, a full local link, or a future booking.kapster.id link)
 * into an app path, keeping the outlet segment so multi-outlet shops open the right branch.
 */
export function parseBookingLink(input: string) {
  const text = input.trim().toLowerCase();
  const tail = text.includes('/booking/')
    ? text.slice(text.indexOf('/booking/') + '/booking/'.length)
    : text.replace(/^(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?\//, '');
  const [shop = '', outlet = ''] = tail
    .split(/[?#]/)[0]
    .split('/')
    .map((part) => part.replace(/[^a-z0-9-]/g, ''));
  // "status" belongs to private booking tickets, never to a shop.
  if (!shop || shop === 'status') return '';
  return bookingLink(shop, outlet || undefined);
}
