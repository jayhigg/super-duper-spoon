import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import gelatoProducts from '@/data/gelatoProducts.json';

export async function GET(request, { params }) {
  const paramsResolved = await params;
  const provider = paramsResolved.provider;

  const PRINTFUL_KEY = process.env.PRINTFUL_API_KEY;
  const PRINTIFY_KEY = process.env.PRINTIFY_API_KEY;
  const GELATO_KEY = process.env.GELATO_API_KEY;

  try {
    // ============================================
    // SAAS ENTITLEMENT GATE (Pro vs Free)
    // ============================================
    const { userId } = await auth();

    let isPro = false;

    if (userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      isPro = user.publicMetadata?.isPro === true;
    }

    if (!isPro) {
      return NextResponse.json({
        fallback: true,
        message: "Free Plan: Please upgrade to Pro to unlock live catalog."
      });
    }

    // ============================================
    // GELATO API (served from bundled local JSON)
    // ============================================
    if (provider === 'gelato') {
      if (!GELATO_KEY) return NextResponse.json({ fallback: true, message: "Missing GELATO_API_KEY" });

      if (gelatoProducts && gelatoProducts.length > 0) {
        return NextResponse.json({ fallback: false, catalog: gelatoProducts });
      } else {
        return NextResponse.json({ fallback: true, message: "Gelato database is empty" });
      }
    }

    // ============================================
    // PRINTFUL API
    // ============================================
    if (provider === 'printful') {
      if (!PRINTFUL_KEY) return NextResponse.json({ fallback: true, message: "Missing PRINTFUL_API_KEY" });

      try {
        const response = await fetch('https://api.printful.com/products', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${PRINTFUL_KEY}` }
        });
        if (!response.ok) throw new Error("Printful Fetch Failed");
        const data = await response.json();

        const mappedCatalog = data.result.map(item => {
          const parsedLabel = `[${item.brand || 'Apparel'}] ${item.model || ''} - ${item.title || item.name}`;
          return {
            id: item.id.toString(),
            label: parsedLabel.trim(),
            base: 13.95,
            shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 }
          };
        });

        return NextResponse.json({ fallback: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: "Printful execution error: " + err.message });
      }
    }

    // ============================================
    // PRINTIFY API
    // ============================================
    if (provider === 'printify') {
      if (!PRINTIFY_KEY) return NextResponse.json({ fallback: true, message: "Missing PRINTIFY_API_KEY" });

      try {
        const response = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${PRINTIFY_KEY}` }
        });
        if (!response.ok) throw new Error("Printify Fetch Failed");
        const blueprints = await response.json();

        const mappedCatalog = blueprints.map(item => {
          const parsedLabel = `[${item.brand || 'Brand'}] ${item.model || ''} ${item.title}`;
          return {
            id: item.id.toString(),
            label: parsedLabel.trim(),
            base: 10.00,
            shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 }
          };
        });

        return NextResponse.json({ fallback: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: "Printify execution error: " + err.message });
      }
    }

    return NextResponse.json({ fallback: true, message: "Invalid Provider" });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error", message: error.message, fallback: true }, { status: 500 });
  }
}
