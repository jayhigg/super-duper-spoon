"use client";
import { useMemo } from 'react';

// Provider data (same as your main calculator)
const dtgData = {
  printful: [
    { id: 'cc17', label: 'Comfort Colors 17', base: 15.29, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'bc3001', label: 'Bella+Canvas 3001', base: 12.95, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'g5', label: 'Gildan 5000', base: 9.50, shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 } },
    { id: 'g18', label: 'Gildan 18 Sweatshirt', base: 19.50, shipping: { usa: 8.49, canada: 10.19, europe: 6.99, worldwide: 16.99 } },
    { id: 'mug', label: 'White Mug 11oz', base: 7.95, shipping: { usa: 6.49, canada: 7.79, europe: 5.19, worldwide: 11.99 } },
    { id: 'poster', label: 'Matte Poster', base: 10.50, shipping: { usa: 4.99, canada: 5.69, europe: 5.79, worldwide: 11.99 } }
  ],
  printify: [
    { id: 'cc17', label: 'Comfort Colors 17', base: 12.41, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'bc3001', label: 'Bella+Canvas 3001', base: 9.38, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'g5', label: 'Gildan 5000', base: 6.65, shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 } },
    { id: 'g18', label: 'Gildan 18 Sweatshirt', base: 14.50, shipping: { usa: 8.50, canada: 11.50, europe: 8.50, worldwide: 13.00 } },
    { id: 'mug', label: 'White Mug 11oz', base: 4.50, shipping: { usa: 6.00, canada: 9.50, europe: 6.50, worldwide: 11.50 } },
    { id: 'poster', label: 'Matte Poster', base: 7.50, shipping: { usa: 4.90, canada: 5.90, europe: 4.90, worldwide: 7.90 } }
  ],
  gelato: [
    { id: 'cc17', label: 'Comfort Colors 17', base: 14.25, shipping: { usa: 5.00, canada: 7.00, europe: 5.00, worldwide: 9.00 } },
    { id: 'bc3001', label: 'Bella+Canvas 3001', base: 10.50, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'g5', label: 'Gildan 5000', base: 8.00, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'g18', label: 'Gildan 18 Sweatshirt', base: 16.50, shipping: { usa: 7.00, canada: 9.50, europe: 6.50, worldwide: 11.00 } },
    { id: 'mug', label: 'White Mug 11oz', base: 5.50, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'poster', label: 'Matte Poster', base: 7.50, shipping: { usa: 4.90, canada: 5.90, europe: 4.90, worldwide: 7.90 } }
  ]
};

export default function ProviderComparison({ 
  selectedProduct, 
  shippingRegion = 'usa',
  printifyPremium = false,
  gelatoPlus = false,
  onSelectProvider 
}) {
  const comparison = useMemo(() => {
    if (!selectedProduct) return [];
    
    // Find matching product in each provider
    const results = ['printful', 'printify', 'gelato'].map(provider => {
      const product = dtgData[provider]?.find(p => p.id === selectedProduct || p.label.toLowerCase().includes(selectedProduct.toLowerCase()));
      if (!product) return null;
      
      let baseCost = product.base;
      // Apply discounts
      if (provider === 'printify' && printifyPremium) baseCost *= 0.8;
      if (provider === 'gelato' && gelatoPlus) baseCost *= 0.85;
      
      const shipping = product.shipping[shippingRegion] || product.shipping.usa;
      const total = baseCost + shipping;
      
      return {
        provider,
        label: product.label,
        base: baseCost,
        shipping,
        total,
        savings: 0 // Will calculate below
      };
    }).filter(Boolean);
    
    // Sort by total cost
    results.sort((a, b) => a.total - b.total);
    
    // Calculate savings vs most expensive
    const maxCost = Math.max(...results.map(r => r.total));
    results.forEach(r => {
      r.savings = maxCost - r.total;
    });
    
    return results;
  }, [selectedProduct, shippingRegion, printifyPremium, gelatoPlus]);

  if (!selectedProduct || comparison.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
      border: '1px solid #7dd3fc',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2em' }}>⚡</span> 
        Provider Comparison for "{selectedProduct}"
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {comparison.map((item, index) => (
          <div 
            key={item.provider}
            onClick={() => onSelectProvider?.(item.provider)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: index === 0 ? '#dcfce7' : 'white',
              border: index === 0 ? '2px solid #22c55e' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{item.provider}</span>
              {index === 0 && (
                <span style={{ 
                  background: '#22c55e', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  CHEAPEST
                </span>
              )}
            </div>
            
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base:</span>
                <span>${item.base.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping:</span>
                <span>${item.shipping.toFixed(2)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                borderTop: '1px solid #e2e8f0',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                <span>Total:</span>
                <span style={{ color: index === 0 ? '#16a34a' : '#1e293b' }}>
                  ${item.total.toFixed(2)}
                </span>
              </div>
              {item.savings > 0 && index > 0 && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  Save ${item.savings.toFixed(2)} vs {comparison[comparison.length - 1].provider}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <p style={{ 
        marginTop: '1rem', 
        fontSize: '0.85rem', 
        color: '#64748b',
        textAlign: 'center' 
      }}>
        💡 Click on a provider to select it for your calculation
      </p>
    </div>
  );
}
