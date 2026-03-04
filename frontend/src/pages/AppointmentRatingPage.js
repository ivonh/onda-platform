import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const HeartIcon = ({ filled, size = 32 }) => (
  <svg width={size} height={size * 0.88} viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? '#ffb366' : 'rgba(102,102,102,0.2)'}
      stroke={filled ? '#ffb366' : '#666'}
      strokeWidth="1"
      strokeOpacity={filled ? '0.8' : '0.4'}
    />
  </svg>
);

const HeartRating = ({ value, onChange, label }) => (
  <div className="text-center">
    <p className="text-lg text-gray-300 mb-4">{label}</p>
    <div className="flex justify-center gap-3">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-125 active:scale-95"
          type="button"
        >
          <HeartIcon filled={i <= value} size={40} />
        </button>
      ))}
    </div>
    <p className="text-sm text-gray-500 mt-2">
      {value === 0 ? 'Tap a heart' : value <= 2 ? 'Could be better' : value <= 3 ? 'Good' : value === 4 ? 'Great!' : 'Amazing!'}
    </p>
  </div>
);

export default function AppointmentRatingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputBeforeRef = useRef(null);
  const fileInputAfterRef = useRef(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState('');
  const [couponResult, setCouponResult] = useState(null);

  const [beforeAfterRating, setBeforeAfterRating] = useState(0);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [stylistBehavior, setStylistBehavior] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState(null);
  const [whyChoseOnda, setWhyChoseOnda] = useState('');
  const [willPostSocial, setWillPostSocial] = useState(null);
  const [socialPlatform, setSocialPlatform] = useState('');
  const [photoConsent, setPhotoConsent] = useState(false);

  const fetchBookingInfo = useCallback(async () => {
    try {
      const res = await api.get('/feedback/pending');
      const pending = res.data.pending_feedback || [];
      const match = pending.find(f => f.booking_id === bookingId);
      if (match) {
        setBookingInfo(match);
      } else {
        setError('This booking has already been rated or is not available for feedback.');
      }
    } catch (err) {
      setError('Unable to load booking information.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (user) fetchBookingInfo();
  }, [user, fetchBookingInfo]);

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'before') {
        setBeforePhoto(file);
        setBeforePreview(reader.result);
      } else {
        setAfterPhoto(file);
        setAfterPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/portfolio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url || res.data.photo_url;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let beforeUrl = '';
      let afterUrl = '';

      if (beforePhoto) {
        beforeUrl = await uploadPhoto(beforePhoto) || '';
      }
      if (afterPhoto) {
        afterUrl = await uploadPhoto(afterPhoto) || '';
      }

      const res = await api.post('/feedback/submit', {
        booking_id: bookingId,
        before_after_rating: beforeAfterRating || null,
        stylist_behavior_rating: stylistBehavior || null,
        would_book_again: wouldBookAgain,
        why_chose_onda: whyChoseOnda || null,
        will_post_social: willPostSocial,
        social_platform: socialPlatform || null,
        before_photo_url: beforeUrl || beforePreview || null,
        after_photo_url: afterUrl || afterPreview || null,
        photo_consent: photoConsent,
      });

      if (res.data.coupon_code) {
        setCouponResult({
          code: res.data.coupon_code,
          discount: res.data.coupon_discount || 15,
        });
      }
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return beforeAfterRating > 0;
      case 2: return stylistBehavior > 0;
      case 3: return wouldBookAgain !== null;
      case 4: return whyChoseOnda.trim().length > 0;
      case 5: return willPostSocial !== null;
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (error && step !== 6) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const stepContent = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="text-6xl">✨</div>
      <h2 className="text-2xl font-bold text-foreground">How was your experience?</h2>
      <p className="text-gray-400">
        Your appointment with <span className="text-primary font-semibold">{bookingInfo?.stylist_name}</span> is complete!
      </p>
      <p className="text-gray-500 text-sm">
        Take a moment to share your experience. Your feedback helps our community and you'll receive a special reward!
      </p>
      <div className="flex items-center gap-3 justify-center mt-4">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => <HeartIcon key={i} filled size={20} />)}
        </div>
        <span className="text-xs text-gray-500">5 quick questions</span>
      </div>
    </div>,

    // Step 1: Before/After
    <div key="before-after" className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">📸</div>
        <h2 className="text-xl font-bold text-foreground">Before & After</h2>
        <p className="text-gray-400 text-sm mt-1">Share your transformation!</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-2 text-center">Before</p>
          <button
            onClick={() => fileInputBeforeRef.current?.click()}
            className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-600 hover:border-primary flex items-center justify-center overflow-hidden transition-colors"
          >
            {beforePreview ? (
              <img src={beforePreview} alt="Before" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-xs text-gray-500">Tap to add</p>
              </div>
            )}
          </button>
          <input ref={fileInputBeforeRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, 'before')} />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2 text-center">After</p>
          <button
            onClick={() => fileInputAfterRef.current?.click()}
            className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-600 hover:border-primary flex items-center justify-center overflow-hidden transition-colors"
          >
            {afterPreview ? (
              <img src={afterPreview} alt="After" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center p-4">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-xs text-gray-500">Tap to add</p>
              </div>
            )}
          </button>
          <input ref={fileInputAfterRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, 'after')} />
        </div>
      </div>

      <HeartRating
        value={beforeAfterRating}
        onChange={setBeforeAfterRating}
        label="Rate the transformation"
      />
    </div>,

    // Step 2: Stylist Behavior
    <div key="behavior" className="space-y-6 text-center">
      <div className="text-4xl mb-2">💅</div>
      <h2 className="text-xl font-bold text-foreground">How was your stylist?</h2>
      <p className="text-gray-400 text-sm">Rate their professionalism, friendliness, and skill</p>
      <HeartRating
        value={stylistBehavior}
        onChange={setStylistBehavior}
        label="Stylist experience"
      />
    </div>,

    // Step 3: Would Book Again
    <div key="rebook" className="space-y-6 text-center">
      <div className="text-4xl mb-2">🔄</div>
      <h2 className="text-xl font-bold text-foreground">Would you book again?</h2>
      <p className="text-gray-400 text-sm">Would you choose this stylist for your next appointment?</p>
      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={() => setWouldBookAgain(true)}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
            wouldBookAgain === true
              ? 'bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/30'
              : 'bg-card border border-border text-gray-300 hover:border-primary'
          }`}
        >
          Yes! 💛
        </button>
        <button
          onClick={() => setWouldBookAgain(false)}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
            wouldBookAgain === false
              ? 'bg-gray-700 text-white scale-105'
              : 'bg-card border border-border text-gray-300 hover:border-gray-500'
          }`}
        >
          Maybe not
        </button>
      </div>
    </div>,

    // Step 4: Why Chose Onda
    <div key="why-onda" className="space-y-6 text-center">
      <div className="text-4xl mb-2">🌊</div>
      <h2 className="text-xl font-bold text-foreground">Why did you choose Onda?</h2>
      <p className="text-gray-400 text-sm">Help us understand what brought you here</p>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {['Friend recommended', 'Social media', 'Google search', 'Quality stylists', 'Easy booking', 'Good prices', 'Coupon/Offer'].map(reason => (
          <button
            key={reason}
            onClick={() => setWhyChoseOnda(prev => {
              const reasons = prev ? prev.split(', ').filter(Boolean) : [];
              if (reasons.includes(reason)) {
                return reasons.filter(r => r !== reason).join(', ');
              }
              return [...reasons, reason].join(', ');
            })}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              whyChoseOnda.includes(reason)
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-gray-400 hover:border-primary'
            }`}
          >
            {reason}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Tell us more (optional)..."
        value={whyChoseOnda.split(', ').filter(r => !['Friend recommended', 'Social media', 'Google search', 'Quality stylists', 'Easy booking', 'Good prices', 'Coupon/Offer'].includes(r)).join(', ')}
        onChange={e => {
          const chips = whyChoseOnda.split(', ').filter(r => ['Friend recommended', 'Social media', 'Google search', 'Quality stylists', 'Easy booking', 'Good prices', 'Coupon/Offer'].includes(r));
          const custom = e.target.value;
          setWhyChoseOnda([...chips, custom].filter(Boolean).join(', '));
        }}
        className="w-full bg-card border border-border rounded-xl p-4 text-foreground resize-none h-24 focus:outline-none focus:border-primary transition"
      />
    </div>,

    // Step 5: Social Share
    <div key="social" className="space-y-6 text-center">
      <div className="text-4xl mb-2">📱</div>
      <h2 className="text-xl font-bold text-foreground">Share your look!</h2>
      <p className="text-gray-400 text-sm">
        Would you post your transformation on social media? Get <span className="text-primary font-bold">15% off</span> your next booking!
      </p>

      <div className="flex gap-4 justify-center mt-4">
        <button
          onClick={() => { setWillPostSocial(true); setSocialPlatform('instagram'); }}
          className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${
            willPostSocial === true && socialPlatform === 'instagram'
              ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white scale-105 shadow-lg'
              : 'bg-card border border-border text-gray-300 hover:border-pink-400'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span className="text-sm font-medium">Instagram</span>
        </button>

        <button
          onClick={() => { setWillPostSocial(true); setSocialPlatform('tiktok'); }}
          className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${
            willPostSocial === true && socialPlatform === 'tiktok'
              ? 'bg-gradient-to-br from-cyan-500 to-pink-500 text-white scale-105 shadow-lg'
              : 'bg-card border border-border text-gray-300 hover:border-cyan-400'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.42a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.85z"/>
          </svg>
          <span className="text-sm font-medium">TikTok</span>
        </button>

        <button
          onClick={() => { setWillPostSocial(false); setSocialPlatform(''); }}
          className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${
            willPostSocial === false
              ? 'bg-gray-700 text-white scale-105'
              : 'bg-card border border-border text-gray-300 hover:border-gray-500'
          }`}
        >
          <span className="text-2xl">🙈</span>
          <span className="text-sm font-medium">Not now</span>
        </button>
      </div>

      {/* Consent */}
      <div className="mt-6">
        <label className="flex items-start gap-3 text-left cursor-pointer">
          <input
            type="checkbox"
            checked={photoConsent}
            onChange={e => setPhotoConsent(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-600 bg-card accent-primary"
          />
          <span className="text-xs text-gray-400">
            I consent to Onda using my Before & After photos for marketing purposes, including promotional materials and social media content, in accordance with Onda's{' '}
            <a href="/terms" className="text-primary underline" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </span>
        </label>
      </div>
    </div>,
  ];

  // Step 6: Thank You + Coupon Reveal
  if (step === 6) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20 px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-6 animate-fadeIn">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-foreground">Thank you!</h2>
          <p className="text-gray-400">Your feedback helps our community of beauty professionals grow.</p>

          {couponResult && (
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6 space-y-3">
              <p className="text-sm text-primary font-medium uppercase tracking-wider">Your Reward</p>
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-3xl font-bold text-primary tracking-widest">{couponResult.code}</p>
              </div>
              <p className="text-gray-300">
                <span className="text-primary font-bold">{couponResult.discount}% off</span> your next booking!
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(couponResult.code);
                }}
                className="text-sm text-primary underline hover:opacity-80 transition"
              >
                Copy code
              </button>
            </div>
          )}

          {!couponResult && (
            <p className="text-gray-500 text-sm">
              Tip: Next time, consent to photo sharing and get 15% off your next booking!
            </p>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={() => navigate('/browse')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition"
            >
              Browse Stylists
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-card border border-border text-gray-300 rounded-xl font-medium hover:border-primary transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20 pb-12 px-4">
      <div className="max-w-lg w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Step {step + 1} of 6</span>
            <span className="text-xs text-gray-500">{bookingInfo?.stylist_name}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {stepContent[step]}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`px-5 py-2.5 rounded-xl font-medium transition ${
              step === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-foreground'
            }`}
          >
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className={`px-8 py-2.5 rounded-xl font-medium transition ${
                canProceed()
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className={`px-8 py-2.5 rounded-xl font-medium transition ${
                canProceed() && !submitting
                  ? 'bg-gradient-to-r from-primary to-amber-400 text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit & Get Reward'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
