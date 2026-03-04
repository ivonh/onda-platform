import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600'
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎'
};

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const [loyalty, setLoyalty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLoyaltyData();
  }, [navigate]);

  const fetchLoyaltyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [loyaltyRes, transactionsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/loyalty/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/loyalty/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLoyalty(loyaltyRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points <= 0) {
      setMessage('Please enter a valid number of points');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND_URL}/api/loyalty/redeem`,
        { points },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Successfully redeemed ${points} points for $${res.data.discount_value.toFixed(2)} discount!`);
      setRedeemAmount('');
      fetchLoyaltyData();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to redeem points');
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      setMessage('Please enter a referral code');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND_URL}/api/loyalty/apply-referral/${referralCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setReferralCode('');
      fetchLoyaltyData();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Invalid referral code');
    }
  };

  const copyReferralCode = () => {
    if (loyalty?.referral_code) {
      navigator.clipboard.writeText(loyalty.referral_code);
      setMessage('Referral code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Loyalty Rewards</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Successfully') || message.includes('copied') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {message}
          </div>
        )}

        {loyalty && (
          <>
            <div className={`bg-gradient-to-r ${tierColors[loyalty.tier]} rounded-2xl p-6 mb-8`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Your Tier</p>
                  <p className="text-2xl font-bold capitalize">{tierIcons[loyalty.tier]} {loyalty.tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Tier Discount</p>
                  <p className="text-2xl font-bold">{loyalty.tier_discount_percent}% OFF</p>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-4xl font-bold">{loyalty.total_points.toLocaleString()}</span>
                  <span className="text-sm opacity-80">Available Points</span>
                </div>
                <p className="text-sm opacity-70">Lifetime: {loyalty.lifetime_points.toLocaleString()} points</p>
                
                {loyalty.next_tier && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress to {loyalty.next_tier}</span>
                      <span>{loyalty.points_to_next_tier} points to go</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/50 rounded-full"
                        style={{ width: `${Math.min(100, (1 - loyalty.points_to_next_tier / (loyalty.lifetime_points + loyalty.points_to_next_tier)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Redeem Points</h3>
                <p className="text-sm text-gray-400 mb-4">100 points = $1.00 discount</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="Enter points"
                    className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <button
                    onClick={handleRedeem}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium"
                  >
                    Redeem
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Your Referral Code</h3>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 font-mono text-lg">
                    {loyalty.referral_code}
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-400">Share this code and earn 500 points when friends book!</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h3 className="font-semibold mb-4">Have a Referral Code?</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 font-mono"
                />
                <button
                  onClick={handleApplyReferral}
                  className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No transactions yet. Book a service to earn points!</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.transaction_id} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium">{tx.description || tx.transaction_type}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`font-bold ${tx.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.points >= 0 ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6">
          <h3 className="font-semibold mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-medium">Earn Points</p>
              <p className="text-gray-400">10 points per $1 spent</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎁</div>
              <p className="font-medium">Redeem Rewards</p>
              <p className="text-gray-400">100 points = $1 discount</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="font-medium">Level Up</p>
              <p className="text-gray-400">Higher tiers = bigger discounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
