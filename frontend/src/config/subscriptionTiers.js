// frontend/src/config/subscriptionTiers.js
//
// Riot account slots per subscription tier. Mirrors backend/models/User.js's
// SUBSCRIPTION_TIERS — kept here too since the frontend needs the actual
// numeric limits to show "Slots left", not just the tier names.
export const SLOT_LIMITS = {
  free: 10,
  immortal: 50,
  radiant: 500,
};

export const DEFAULT_TIER = 'free';

export function getSlotLimit(tier) {
  return SLOT_LIMITS[tier] ?? SLOT_LIMITS[DEFAULT_TIER];
}
