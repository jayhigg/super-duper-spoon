import { useState, useEffect } from 'react';

const dtgData = {
  printful: [
    { id: 'cc1717', label: 'Comfort Colors® 1717', base: 15.29, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'bc3001', label: 'Bella + Canvas 3001', base: 12.95, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'g5000', label: 'Gildan 5000', base: 9.50, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'g18000', label: 'Gildan 18000 Sweatshirt', base: 19.50, shipping: { usa: 8.49, canada: 10.19, europe: 6.99, worldwide: 16.99 } },
    { id: 'poster', label: 'Enhanced Matte Paper Poster (12×18)', base: 10.50, shipping: { usa: 4.99, canada: 5.69, europe: 5.79, worldwide: 11.99 } },
    { id: 'mug', label: 'White Glossy Mug (11oz)', base: 7.95, shipping: { usa: 6.49, canada: 7.79, europe: 5.19, worldwide: 11.99 } }
  ],
  printify: [
    { id: 'cc1717', label: 'Comfort Colors 1717', base: 12.41, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'bc3001', label: 'Bella+Canvas 3001', base: 9.38, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'g5000', label: 'Gildan 5000', base: 6.65, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'g18000', label: 'Gildan 18000 Sweatshirt', base: 14.50, shipping: { usa: 8.50, canada: 11.50, europe: 8.50, worldwide: 13.00 } },
    { id: 'laney', label: 'Lane Seven LS14001', base: 13.91, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'mug', label: 'White Ceramic Mug 11oz', base: 4.50, shipping: { usa: 6.00, canada: 9.50, europe: 6.50, worldwide: 11.50 } }
  ],
  gelato: [
    { id: 'classic-tee', label: 'Classic Unisex T-Shirt (G5000 eqv)', base: 8.00, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'premium-tee', label: 'Premium Unisex T-Shirt (BC3001 eqv)', base: 10.50, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'heavy-tee', label: 'Heavyweight T-Shirt (CC1717 eqv)', base: 14.25, shipping: { usa: 5.00, canada: 7.00, europe: 5.00, worldwide: 9.00 } },
    { id: 'classic-sweat', label: 'Classic Sweatshirt', base: 16.50, shipping: { usa: 7.00, canada: 9.50, europe: 6.50, worldwide: 11.00 } },
    { id: 'poster', label: 'Classic Matte Poster (30x45cm)', base: 7.50, shipping: { usa: 4.90, canada: 5.90, europe: 4.90, worldwide: 7.90 } },
    { id: 'mug', label: 'White Mug 11oz', base: 5.50, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } }
  ]
};

function App() {
  // Global Flow Settings
  const [dtgPlatform, setDtgPlatform] = useState('printify');
  const [sellerPlatform, setSellerPlatform] = useState('etsy');

  // Subscription Details
  const [printifyPremium, setPrintifyPremium] = useState(false);
  const [gelatoPlus, setGelatoPlus] = useState(false);

  // Math State
  const [desiredSalePrice, setDesiredSalePrice] = useState(29.99);
  const [discountPercent, setDiscountPercent] = useState(25);
  
  const [shippingRegion, setShippingRegion] = useState('usa');
  const [preset, setPreset] = useState('cc1717');
  
  const [garmentCost, setGarmentCost] = useState(12.41);
  const [shippingCost, setShippingCost] = useState(4.75);

  // Platform specific
  const [offsiteAds, setOffsiteAds] = useState(false);
  const [affiliateCommission, setAffiliateCommission] = useState(16);

  // Reverse Engineer
  const [targetProfit, setTargetProfit] = useState(10);

  // Keep preset valid when changing DTG Platform
  useEffect(() => {
    if (preset !== 'custom') {
      const exists = dtgData[dtgPlatform].find(p => p.id === preset);
      if (!exists) {
        setPreset(dtgData[dtgPlatform][0].id); // default to the first real option
      }
    }
  }, [dtgPlatform]);

  // Auto-Update DTG costs when dependencies change
  useEffect(() => {
    if (preset === 'custom') return;
    
    const data = dtgData[dtgPlatform].find(p => p.id === preset);
    if (data) {
      let calcBase = data.base;
      if (dtgPlatform === 'printify' && printifyPremium) {
        calcBase = calcBase * 0.8;
      }
      if (dtgPlatform === 'gelato' && gelatoPlus) {
        calcBase = calcBase * 0.85;
      }
      setGarmentCost(calcBase.toFixed(2));
      
      const regionShipCost = data.shipping[shippingRegion] || 0;
      setShippingCost(regionShipCost.toFixed(2));
    }
  }, [dtgPlatform, preset, printifyPremium, gelatoPlus, shippingRegion]);

  // Derived state math
  const listingPrice = discountPercent > 0 
    ? desiredSalePrice / (1 - discountPercent / 100) 
    : desiredSalePrice;

  let platformFees = 0;
  let feePercentage = 0;
  let fixedFee = 0;

  if (sellerPlatform === 'etsy') {
    const listingFee = 0.20;
    const transactionFeeRate = 0.065;
    const processingFeeRate = 0.03;
    const processingFixed = 0.25;
    const adsRate = offsiteAds ? 0.15 : 0;

    feePercentage = transactionFeeRate + processingFeeRate + adsRate;
    fixedFee = listingFee + processingFixed;
    
    platformFees = fixedFee + (desiredSalePrice * feePercentage);
  } else if (sellerPlatform === 'tiktok') {
    const referralFeeRate = 0.06;
    const processingFeeRate = 0.0102;
    const affiliateRate = affiliateCommission / 100;
    
    feePercentage = referralFeeRate + processingFeeRate + affiliateRate;
    fixedFee = 0;

    platformFees = desiredSalePrice * feePercentage;
  }

  const takeHomePayout = desiredSalePrice - platformFees;
  const totalCogs = Number(garmentCost) + Number(shippingCost);
  const netProfit = takeHomePayout - totalCogs;
  const marginPercent = desiredSalePrice > 0 ? (netProfit / desiredSalePrice) * 100 : 0;

  // Reverse Engineer Math: desiredSalePrice = (Net Profit + COGS + FixedFee) / (1 - feePercentage)
  const requiredSalePrice = (Number(targetProfit) + totalCogs + fixedFee) / (1 - feePercentage);
  const requiredListingPrice = discountPercent > 0 
      ? requiredSalePrice / (1 - discountPercent / 100) 
      : requiredSalePrice;

  return (
    <div className="app-container">
      <header>
        <h1>True Margin</h1>
        <p>The high-performance profit calculator for POD & DTG sellers.</p>
      </header>

      <main className="layout">
        <div className="left-column">
          
          <div className="card">
            <h2>1. DTG Provider</h2>
            <div className="pill-group">
              <button 
                className={`pill-btn ${dtgPlatform === 'printful' ? 'active' : ''}`}
                onClick={() => setDtgPlatform('printful')}
              >
                Printful
              </button>
              <button 
                className={`pill-btn ${dtgPlatform === 'printify' ? 'active' : ''}`}
                onClick={() => setDtgPlatform('printify')}
              >
                Printify
              </button>
              <button 
                className={`pill-btn ${dtgPlatform === 'gelato' ? 'active' : ''}`}
                onClick={() => setDtgPlatform('gelato')}
              >
                Gelato
              </button>
            </div>

            {dtgPlatform === 'printify' && (
              <div className="form-group toggle-wrapper" style={{ marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="printifyPremium" 
                  checked={printifyPremium}
                  onChange={(e) => setPrintifyPremium(e.target.checked)}
                />
                <label htmlFor="printifyPremium">I have Printify Premium (~20% off base)</label>
              </div>
            )}
            
            {dtgPlatform === 'gelato' && (
              <div className="form-group toggle-wrapper" style={{ marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="gelatoPlus" 
                  checked={gelatoPlus}
                  onChange={(e) => setGelatoPlus(e.target.checked)}
                />
                <label htmlFor="gelatoPlus">I have Gelato+ (~15% off base)</label>
              </div>
            )}
          </div>

          <div className="card">
            <h2>2. Seller Platform</h2>
            <div className="pill-group">
              <button 
                className={`pill-btn ${sellerPlatform === 'etsy' ? 'active' : ''}`}
                onClick={() => setSellerPlatform('etsy')}
              >
                Etsy
              </button>
              <button 
                className={`pill-btn ${sellerPlatform === 'tiktok' ? 'active' : ''}`}
                onClick={() => setSellerPlatform('tiktok')}
              >
                TikTok Shop
              </button>
            </div>

            {sellerPlatform === 'etsy' && (
              <div className="form-group toggle-wrapper" style={{ marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="offsiteAds" 
                  checked={offsiteAds}
                  onChange={(e) => setOffsiteAds(e.target.checked)}
                />
                <label htmlFor="offsiteAds">Include Offsite Ads Penalty (15%)</label>
              </div>
            )}

            {sellerPlatform === 'tiktok' && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Creator Affiliate Commission</label>
                <div className="input-suffix">
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={affiliateCommission}
                    onChange={(e) => setAffiliateCommission(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>3. Product Variables</h2>
            
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Shipping Destination Area</label>
                <select value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)}>
                  <option value="usa">United States</option>
                  <option value="canada">Canada</option>
                  <option value="europe">Europe</option>
                  <option value="worldwide">Rest of World</option>
                </select>
              </div>

              <div className="form-group">
                <label>Garment Preset</label>
                <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                  <option value="custom">Custom Entry (Manual)</option>
                  {dtgData[dtgPlatform].map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label>Garment Cost</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    step="0.01"
                    value={garmentCost}
                    onChange={(e) => {
                      setGarmentCost(e.target.value);
                      setPreset('custom');
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Shipping Cost (to {shippingRegion.toUpperCase()})</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => {
                      setShippingCost(e.target.value);
                      setPreset('custom');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>4. Pricing Strategy</h2>
            
            <div className="grid-2">
              <div className="form-group">
                <label>Desired Sale Price</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    step="0.01"
                    value={desiredSalePrice}
                    onChange={(e) => setDesiredSalePrice(e.target.value)}
                  />
                </div>
                <div className="helper-text">
                  What the customer actually pays
                </div>
              </div>
              
              <div className="form-group">
                <label>Original Listing Price</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    value={listingPrice.toFixed(2)}
                    disabled
                    style={{ backgroundColor: 'var(--color-cream-dark)', fontWeight: 'bold' }}
                  />
                </div>
                <div className="helper-text">
                  To offer a {discountPercent}% sale
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Marketing Discount: {discountPercent}%</label>
              <div className="slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="70" 
                  value={discountPercent} 
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
                <div className="slider-value">{discountPercent}%</div>
              </div>
            </div>
          </div>

          <div className="card accent-box">
            <h2>5. Target Reverse Engineer</h2>
            <p>Know exactly what you want to make? Enter your target net profit to calculate the required price.</p>
            <div className="grid-2">
              <div className="form-group">
                <label>I want to make exactly</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>You must list it at</label>
                <div className="input-prefix">
                  <input 
                    type="number" 
                    value={isFinite(requiredListingPrice) && requiredListingPrice > 0 ? requiredListingPrice.toFixed(2) : '0.00'}
                    disabled
                    style={{ backgroundColor: 'var(--color-cream-dark)', color: 'var(--color-orange-dark)', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="sticky-panel">
            <div className="result-box">
              <h3>Net Profit</h3>
              <div className={`result-value ${netProfit < 0 ? 'negative' : ''}`}>
                ${netProfit.toFixed(2)}
              </div>
              <div className="result-row highlight">
                <span>Profit Margin</span>
                <span>{marginPercent.toFixed(1)}%</span>
              </div>
              <div className="result-row" style={{ marginTop: '1.5rem' }}>
                <span>Take-Home Payout</span>
                <span>${takeHomePayout.toFixed(2)}</span>
              </div>
              <div className="result-row">
                <span>Total Fees Taken</span>
                <span>${platformFees.toFixed(2)}</span>
              </div>
              <div className="result-row">
                <span>Total Expenses (COGS)</span>
                <span>${totalCogs.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
