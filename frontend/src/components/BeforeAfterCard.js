import { useState } from 'react';

export function BeforeAfterCard({ beforeUrl, afterUrl, stylistName, serviceDescription, couponCode, discountPercent = 15, expiresAt }) {
  const [showAfter, setShowAfter] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (couponCode && navigator.clipboard) {
      navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-xl max-w-sm w-full">
      {/* Photo slider */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {beforeUrl && afterUrl ? (
          <>
            <img
              src={showAfter ? afterUrl : beforeUrl}
              alt={showAfter ? 'After' : 'Before'}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute top-3 left-3 right-3 flex justify-between">
              <button
                onClick={() => setShowAfter(false)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  !showAfter ? 'bg-white text-black' : 'bg-black/50 text-white backdrop-blur-sm'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  showAfter ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white backdrop-blur-sm'
                }`}
              >
                After ✨
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">No photos available</span>
          </div>
        )}

        {/* Onda watermark */}
        <div className="absolute bottom-3 right-3">
          <span className="text-xs text-white/40 font-serif italic tracking-wider">ONDA</span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Styled by</p>
            <p className="text-foreground font-semibold">{stylistName || 'Onda Stylist'}</p>
          </div>
          {serviceDescription && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {serviceDescription}
            </span>
          )}
        </div>

        {couponCode && (
          <div className="bg-gradient-to-r from-primary/15 to-amber-500/15 border border-primary/20 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Use code for</p>
                <p className="text-primary font-bold text-lg">{discountPercent}% OFF</p>
              </div>
              <button
                onClick={handleCopy}
                className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-2 rounded-lg transition text-sm font-mono font-bold tracking-wider"
              >
                {copied ? 'Copied!' : couponCode}
              </button>
            </div>
            {expiresAt && (
              <p className="text-xs text-gray-500 mt-1">
                Expires {new Date(expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BeforeAfterGallery({ cards = [] }) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📸</div>
        <p className="text-gray-400">No transformations yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <BeforeAfterCard key={card.coupon_code || i} {...card} />
      ))}
    </div>
  );
}
