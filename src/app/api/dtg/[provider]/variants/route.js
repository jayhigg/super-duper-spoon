import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const paramsResolved = await params;
  const provider = paramsResolved.provider;

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId query param' }, { status: 400 });
  }

  try {
    // Pro gate — variants are a Pro-only feature
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isPro = user.publicMetadata?.isPro === true;

    if (!isPro) {
      return NextResponse.json({ variants: [], isDemo: true });
    }

    // ============================================
    // PRINTFUL — Catalog Product Variants
    // GET /products/{id} returns all size/color variants
    // ============================================
    if (provider === 'printful') {
      const PRINTFUL_KEY = process.env.PRINTFUL_API_KEY;
      if (!PRINTFUL_KEY) return NextResponse.json({ error: 'Missing PRINTFUL_API_KEY' }, { status: 500 });

      const res = await fetch(`https://api.printful.com/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${PRINTFUL_KEY}` }
      });
      if (!res.ok) {
        return NextResponse.json({ variants: [], error: 'Printful product not found' });
      }
      const data = await res.json();
      const rawVariants = data.result?.variants || [];

      // De-duplicate by name (size+color combos) and format
      const seen = new Set();
      const variants = [];
      for (const v of rawVariants) {
        const label = v.name || v.size || 'Default';
        if (!seen.has(label)) {
          seen.add(label);
          variants.push({
            id: String(v.id),
            label: label,
            price: parseFloat(v.retail_price || v.price || 0)
          });
        }
      }

      return NextResponse.json({ variants });
    }

    // ============================================
    // PRINTIFY — Blueprint Variants (cheapest provider)
    // ============================================
    if (provider === 'printify') {
      const PRINTIFY_KEY = process.env.PRINTIFY_API_KEY;
      if (!PRINTIFY_KEY) return NextResponse.json({ error: 'Missing PRINTIFY_API_KEY' }, { status: 500 });

      // Step 1: Get print providers for this blueprint
      const providersRes = await fetch(
        `https://api.printify.com/v1/catalog/blueprints/${productId}/print_providers.json`,
        { headers: { 'Authorization': `Bearer ${PRINTIFY_KEY}` } }
      );
      if (!providersRes.ok) return NextResponse.json({ variants: [], error: 'Blueprint not found' });
      const providers = await providersRes.json();
      if (!providers || providers.length === 0) return NextResponse.json({ variants: [] });

      // Use the first available provider (Printify sorts by relevance)
      const bestProvider = providers[0];

      // Step 2: Get variants for that provider
      const variantsRes = await fetch(
        `https://api.printify.com/v1/catalog/blueprints/${productId}/print_providers/${bestProvider.id}/variants.json`,
        { headers: { 'Authorization': `Bearer ${PRINTIFY_KEY}` } }
      );
      if (!variantsRes.ok) return NextResponse.json({ variants: [] });
      const variantsData = await variantsRes.json();
      const rawVariants = variantsData.variants || [];

      const variants = rawVariants.map(v => ({
        id: String(v.id),
        label: [v.title, v.options?.map(o => o.value).join(' / ')].filter(Boolean).join(' — '),
        price: parseFloat((v.cost / 100).toFixed(2)) // cost is in cents
      }));

      return NextResponse.json({ variants, providerName: bestProvider.title });
    }

    // ============================================
    // GELATO — Live Product Variant Pricing
    // ============================================
    if (provider === 'gelato') {
      const GELATO_KEY = process.env.GELATO_API_KEY;
      if (!GELATO_KEY) return NextResponse.json({ error: 'Missing GELATO_API_KEY' }, { status: 500 });

      // productId here is the productUid from gelatoProducts.json
      // Determine which catalog this product belongs to by its UID prefix
      const catalogGuess = productId.includes('apparel') ? 't-shirts'
        : productId.includes('hoodie') ? 'hoodies'
        : productId.includes('sweat') ? 'sweatshirts'
        : productId.includes('mug') ? 'mugs'
        : productId.includes('phone') ? 'phone-cases'
        : productId.includes('poster') ? 'posters'
        : null;

      // Try direct product fetch
      const productRes = await fetch(`https://product.gelatoapis.com/v3/products/${productId}`, {
        headers: { 'X-API-KEY': GELATO_KEY }
      });

      if (productRes.ok) {
        const productData = await productRes.json();
        const rawVariants = productData.variants || productData.products || [];

        if (rawVariants.length > 0) {
          const variants = rawVariants.map(v => ({
            id: String(v.productUid || v.id || productId),
            label: v.title || v.attributes?.Size || v.name || 'Default',
            price: parseFloat(v.price || v.basePriceExclVat || 0)
          }));
          return NextResponse.json({ variants });
        }
      }

      // Gelato pricing isn't always available via product endpoint — return empty
      // so the UI gracefully falls back to the base price from the catalog
      return NextResponse.json({ variants: [] });
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

  } catch (error) {
    console.error('Variants fetch error:', error.message);
    return NextResponse.json({ variants: [], error: error.message });
  }
}
