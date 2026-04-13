import { NextResponse } from 'next/server';

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
    const { auth, clerkClient } = require('@clerk/nextjs/server');
    const { userId } = await auth();
    
    let isPro = false;
    
    // We explicitly query the Clerk API to guarantee we have the absolute latest payment state
    // immediately after a webhook fires, rather than waiting for JWT cookie rotation.
    if (userId) {
        const user = await clerkClient.users.getUser(userId);
        isPro = user.publicMetadata?.isPro === true;
    }

    if (!isPro) {
      // If the user isn't subscribed, block the live API calls to save server costs 
      // and forcefully drop them into the offline mock database.
      return NextResponse.json({ 
        fallback: true, 
        message: "Free Plan Limit: Please upgrade to Pro to unlock the live API catalog." 
      });
    }

    // ============================================
    // GELATO API
    // ============================================
    if (provider === 'gelato') {
      if (!GELATO_KEY) return NextResponse.json({ fallback: true, message: "Missing GELATO_API_KEY" });

      try {
        // We bypass live REST API pagination limits by serving the highly optimized local dictionary.
        // On Vercel, fs.readFileSync fails to find static files due to Serverless architecture isolating cwd.
        // Using `require` natively forces Next.js Webpack to bundle the full JSON directly into the server chunk.
        const mappedCatalog = require('@/data/gelatoProducts.json');
        
        if (mappedCatalog && mappedCatalog.length > 0) {
            return NextResponse.json({ fallback: false, catalog: mappedCatalog });
        } else {
            return NextResponse.json({ fallback: true, message: "Database empty" });
        }
      } catch (err) {
        return NextResponse.json({ fallback: true, message: "Gelato execution error" });
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
          // Stitch brand and model cleanly into label (e.g. "[Gildan] 18000 Heavy Blend...")
          const parsedLabel = `[${item.brand || 'Apparel'}] ${item.model || ''} - ${item.title || item.name}`;
          return {
            id: item.id.toString(),
            label: parsedLabel.trim(),
            base: 13.95, // estimation
            shipping: { usa: 4.75, canada: 8.29, europe: 4.79, worldwide: 11.99 }
          }
        });

        return NextResponse.json({ fallback: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: "Printful execution error" });
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
          // Printify uses specific brand and model schema 
          const parsedLabel = `[${item.brand || 'Brand'}] ${item.model || ''} ${item.title}`;
          return {
            id: item.id.toString(),
            label: parsedLabel.trim(),
            base: 10.00, // Blueprint lowest provider estimation
            shipping: { usa: 4.75, canada: 8.50, europe: 6.00, worldwide: 10.00 }
          }
        });

        return NextResponse.json({ fallback: false, catalog: mappedCatalog });
      } catch (err) {
        return NextResponse.json({ fallback: true, message: "Printify execution error" });
      }
    }

    return NextResponse.json({ fallback: true, message: "Invalid Provider" });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error", fallback: true }, { status: 500 });
  }
}
