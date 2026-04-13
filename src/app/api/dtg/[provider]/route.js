import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import gelatoProducts from '@/data/gelatoProducts.json';

// ============================================
// TOP 5 DEMO CATALOG (Free Tier)
// Curated bestsellers shown as a product demo
// ============================================
const FREE_DEMO = {
  printful: [
    { id: 'cc1717',   label: 'Comfort Colors® 1717 Garment-Dyed Tee',      base: 15.29, shipping: { usa: 4.75, canada: 8.29,  europe: 4.79, worldwide: 11.99 } },
    { id: 'bc3001',   label: 'Bella + Canvas 3001 Unisex Jersey Tee',        base: 12.95, shipping: { usa: 4.75, canada: 8.29,  europe: 4.79, worldwide: 11.99 } },
    { id: 'g5000',    label: 'Gildan 5000 Heavy Cotton Tee',                  base: 9.50,  shipping: { usa: 4.75, canada: 8.29,  europe: 4.79, worldwide: 11.99 } },
    { id: 'g18000',   label: 'Gildan 18000 Heavy Blend Crewneck Sweatshirt', base: 19.50, shipping: { usa: 8.49, canada: 10.19, europe: 6.99, worldwide: 16.99 } },
    { id: 'g18500',   label: 'Gildan 18500 Heavy Blend Hooded Sweatshirt',   base: 24.50, shipping: { usa: 8.49, canada: 10.19, europe: 6.99, worldwide: 16.99 } },
  ],
  printify: [
    { id: 'cc1717',   label: 'Comfort Colors 1717 Garment-Dyed Tee',         base: 12.41, shipping: { usa: 4.75, canada: 8.50,  europe: 6.00, worldwide: 10.00 } },
    { id: 'bc3001',   label: 'Bella+Canvas 3001 Unisex Jersey Tee',           base: 9.38,  shipping: { usa: 4.75, canada: 8.50,  europe: 6.00, worldwide: 10.00 } },
    { id: 'g5000',    label: 'Gildan 5000 Heavy Cotton Tee',                  base: 6.65,  shipping: { usa: 4.75, canada: 8.50,  europe: 6.00, worldwide: 10.00 } },
    { id: 'g18000',   label: 'Gildan 18000 Heavy Blend Crewneck Sweatshirt', base: 14.50, shipping: { usa: 8.50, canada: 11.50, europe: 8.50, worldwide: 13.00 } },
    { id: 'g18500',   label: 'Gildan 18500 Heavy Blend Hooded Sweatshirt',   base: 17.95, shipping: { usa: 8.50, canada: 11.50, europe: 8.50, worldwide: 13.00 } },
  ],
  gelato: [
    { id: 'premium-tee',    label: 'Premium Unisex T-Shirt (Bella+Canvas eqv)',       base: 10.50, shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'classic-tee',    label: 'Classic Unisex T-Shirt (Gildan 5000 eqv)',         base: 8.00,  shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 } },
    { id: 'heavy-tee',      label: 'Heavyweight T-Shirt (Comfort Colors 1717 eqv)',    base: 14.25, shipping: { usa: 5.00, canada: 7.00, europe: 5.00, worldwide: 9.00  } },
    { id: 'classic-sweat',  label: 'Classic Crewneck Sweatshirt',                      base: 16.50, shipping: { usa: 7.00, canada: 9.50, europe: 6.50, worldwide: 11.00 } },
    { id: 'premium-hoodie', label: 'Premium Pullover Hoodie',                          base: 22.00, shipping: { usa: 7.50, canada: 10.00,europe: 7.00, worldwide: 12.00 } },
  ],
};

export async function GET(request, { params }) {
  const paramsResolved = await params;
  const provider = paramsResolved.provider;

  const PRINTFUL_KEY = process.env.PRINTFUL_API_KEY;
  const PRINTIFY_KEY = process.env.PRINTIFY_API_KEY;
  const GELATO_KEY   = process.env.GELATO_API_KEY;

  try {
    // ============================================
    // SAAS ENTITLEMENT GATE (Pro vs Free)
    // ============================================
    const { userId } = await auth();

    let isPro = false;
    let totalCatalogSize = 0;

    if (userId) {
      const client = await clerkClient();
      const user   = await client.users.getUser(userId);
      isPro = user.publicMetadata?.isPro === true;
    }

    // ---- FREE TIER: return curated top-5 demo ----
    if (!isPro) {
      const demo = FREE_DEMO[provider];
      if (!demo) return NextResponse.json({ fallback: true, message: 'Invalid provider' });
      return NextResponse.json({
        fallback: false,
        isDemo: true,
        catalog: demo,
        demoCount: demo.length,
        message: `Showing top ${demo.length} products. Upgrade to Pro to unlock the full catalog.`,
      });
    }

    // ============================================
    // GELATO — bundled local JSON (Pro)
    // ============================================
    if (provider === 'gelato') {
      if (!GELATO_KEY) return NextResponse.json({ fallback: true, message: 'Missing GELATO_API_KEY' });
      if (gelatoProducts && gelatoProducts.length > 0) {
        return NextResponse.json({ fallback: false, isDemo: false, catalog: gelatoProducts });
      }
      return NextResponse.json({ fallback: true, message: 'Gelato database is empty' });
    }

    // ============================================
    // PRINTFUL — live API (Pro)
    // ============================================
    if (provider === 'printful') {
      if (!PRINTFUL_KEY) return NextResponse.json({ fallback: true, message: 'Missing PRINTFUL_API_KEY' });
      try {
        const response = await fetch('https://api.printful.com/products', {
          headers: { 'Authorization': `Bearer ${PRINTFUL_KEY}` },
        });
        if (!response.ok) throw new Error('Printful fetch failed');
        const data = await response.json();
        const mappedCatalog = data.result.map(item => ({
          id: item.id.toString(),
          label: `[${item.brand || 'Apparel'}] ${item.model || ''} - ${item.title || item.name}`.trim(),
          base: 13.95,
          shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 },
        }));
        return NextResponse.json({ fallback: false, isDemo: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: 'Printful error: ' + err.message });
      }
    }

    // ============================================
    // PRINTIFY — live API (Pro)
    // ============================================
    if (provider === 'printify') {
      if (!PRINTIFY_KEY) return NextResponse.json({ fallback: true, message: 'Missing PRINTIFY_API_KEY' });
      try {
        const response = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
          headers: { 'Authorization': `Bearer ${PRINTIFY_KEY}` },
        });
        if (!response.ok) throw new Error('Printify fetch failed');
        const blueprints = await response.json();
        const mappedCatalog = blueprints.map(item => ({
          id: item.id.toString(),
          label: `[${item.brand || 'Brand'}] ${item.model || ''} ${item.title}`.trim(),
          base: 10.00,
          shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 },
        }));
        return NextResponse.json({ fallback: false, isDemo: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: 'Printify error: ' + err.message });
      }
    }

    return NextResponse.json({ fallback: true, message: 'Invalid provider' });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', message: error.message, fallback: true }, { status: 500 });
  }
}
