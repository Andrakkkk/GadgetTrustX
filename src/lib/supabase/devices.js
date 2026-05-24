import { dummyDevices } from '@/data/dummyDevices';

const fallbackSellers = new Map(dummyDevices.map((device) => [device.id, device.seller]));

export function mapDeviceRow(row) {
  const fallbackSeller = fallbackSellers.get(row.id);

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    stock: row.stock,
    condition: row.condition,
    ram: row.ram,
    storage: row.storage,
    chipset: row.chipset,
    description: row.description,
    image: row.image,
    verifiedByTrustX: row.verified_by_trustx,
    isTradeIn: row.is_trade_in,
    isCustomOffer: row.is_custom_offer,
    offerBuyerId: row.offer_buyer_id,
    seller: {
      id: row.profiles?.email || fallbackSeller?.id || '',
      profileId: row.profiles?.id || null,
      name: row.profiles?.store_name || row.profiles?.name || fallbackSeller?.name || 'Unknown Seller',
      reputationScore: fallbackSeller?.reputationScore ?? 100,
      verified: row.profiles?.is_verified ?? fallbackSeller?.verified ?? false,
      badges: row.profiles?.badges || [],
      transactions: fallbackSeller?.transactions ?? 0,
    },
  };
}
