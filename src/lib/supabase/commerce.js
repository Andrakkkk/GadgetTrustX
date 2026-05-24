import { mapDeviceRow } from '@/lib/supabase/devices';

export const deviceSelect = `
  id,
  name,
  brand,
  category,
  price,
  stock,
  condition,
  ram,
  storage,
  chipset,
  description,
  image,
  verified_by_trustx,
  is_trade_in,
  is_custom_offer,
  offer_buyer_id,
  profiles:seller_id (
    id,
    email,
    name,
    store_name,
    is_verified,
    badges
  )
`;

export function formatDateLabel(value) {
  return new Date(value).toLocaleDateString('id-ID');
}

export function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function mapCartRow(row) {
  return {
    ...mapDeviceRow(row.devices),
    cartItemId: row.id,
    cartQty: row.quantity,
    selected: true,
  };
}

export function mapReviewRow(row) {
  return {
    id: row.id,
    deviceId: row.devices?.id || row.device_id,
    deviceName: row.devices?.name || 'Unknown Device',
    sellerEmail: row.seller?.email || '',
    buyerEmail: row.buyer?.email || '',
    buyerName: row.buyer_name || row.buyer?.name || 'Buyer',
    rating: row.rating,
    comment: row.comment || '',
    image: row.image || null,
    orderId: row.order_id || null,
    orderItemId: row.order_item_id || null,
    date: formatDateLabel(row.created_at),
  };
}

export function mapWtbRow(row) {
  const parsed = safeParseDescription(row.description);

  return {
    id: row.id,
    authorEmail: row.profiles?.email || '',
    authorName: row.profiles?.name || 'Buyer',
    date: formatDateLabel(row.created_at),
    device: row.title,
    budget: row.budget ?? '',
    condition: parsed.condition || 'Any',
    notes: parsed.notes || '',
  };
}

export function mapChatRow(row) {
  return {
    id: row.id,
    buyerId: row.buyer?.email || '',
    buyerName: row.buyer?.name || 'Buyer',
    sellerId: row.seller?.email || '',
    sellerName: row.seller?.store_name || row.seller?.name || 'Seller',
    buyerLastSeenAt: row.buyer?.last_seen_at || null,
    sellerLastSeenAt: row.seller?.last_seen_at || null,
    messages: (row.chat_messages || []).map(mapMessageRow),
  };
}

export function mapMessageRow(row) {
  const metadata = row.metadata || {};

  return {
    id: row.id,
    senderId: row.sender?.email || '',
    type: row.message_type,
    text: row.body || '',
    read: row.is_read,
    timestamp: formatTimeLabel(row.created_at),
    ...(metadata.product ? { product: metadata.product } : {}),
    ...(metadata.catalog ? { catalog: metadata.catalog } : {}),
    ...(metadata.imageUrl ? { imageUrl: metadata.imageUrl } : {}),
    ...(metadata.originalCatalog ? { originalCatalog: metadata.originalCatalog } : {}),
    ...(metadata.counterPrice !== undefined ? { counterPrice: metadata.counterPrice } : {}),
    ...(metadata.finalPrice !== undefined ? { finalPrice: metadata.finalPrice } : {}),
  };
}

export function buildDescriptionPayload({ condition, notes }) {
  return JSON.stringify({
    condition: condition || 'Any',
    notes: notes || '',
  });
}

function safeParseDescription(value) {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return { notes: value };
  }
}
