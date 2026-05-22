import { ethers } from 'ethers'

export const BADGE_CONTRACT = import.meta.env.VITE_BADGE_CONTRACT || null

export const BADGES = [
  { id: 'pioneer', emoji: '🚀', name: 'GasFree Pioneer', desc: 'First gasless tx on GasFree Pay', color: '#7c6dfa' },
  { id: 'merchant', emoji: '🛍️', name: 'Verified Merchant', desc: 'Listed a product on the platform', color: '#2dd4bf' },
  { id: 'contributor', emoji: '⭐', name: 'Top Contributor', desc: 'Completed 5+ transactions', color: '#f59e0b' },
  { id: 'builder', emoji: '🔧', name: 'Hackathon Builder', desc: 'Built on UGF testnet', color: '#22c55e' },
  { id: 'early-user', emoji: '🌱', name: 'Early User', desc: 'Joined during the first public test', color: '#84cc16' },
  { id: 'no-eth', emoji: '💳', name: 'No ETH Needed', desc: 'Completed an action with credits', color: '#06b6d4' },
  { id: 'checkout-pro', emoji: '🧾', name: 'Checkout Pro', desc: 'Tried a credits-powered checkout', color: '#ec4899' },
  { id: 'ux-champion', emoji: '✨', name: 'UX Champion', desc: 'Made Web3 feel simple', color: '#a855f7' }
]

export const BADGE_ABI = [
  'function hasClaimed(address to, string badgeId) view returns (bool)'
]

export async function getClaimedBadges(address, provider) {
  if (!address || !provider || !BADGE_CONTRACT) return []
  const contract = new ethers.Contract(BADGE_CONTRACT, BADGE_ABI, provider)
  const badges = await Promise.all(
    BADGES.map(async badge => ({
      ...badge,
      claimed: await contract.hasClaimed(address, badge.id)
    }))
  )
  return badges.filter(badge => badge.claimed)
}
