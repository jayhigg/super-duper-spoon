// To run this script: `node src/scripts/syncGelato.js`
import fs from 'fs';
import path from 'path';

// Extract key manually from .env.local without requiring external `dotenv` package
function getEnvKey() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GELATO_API_KEY=([^\n\r]*)/);
    if (match) return match[1].replace(/['"]/g, '').trim();
  }
  return process.env.GELATO_API_KEY;
}

const GELATO_KEY = getEnvKey();

if (!GELATO_KEY) {
  console.error("FATAL: Missing GELATO_API_KEY in .env.local");
  process.exit(1);
}

// Synthesis function port from Next.js backend
function synthesizeDisplayLabel(item) {
  const attr = item.attributes || {};
  let parsedTitle = "";
  const cap = (s) => (s ? s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "");

  if (attr.GarmentCategory && attr.GarmentCategory !== "none") {
    const isBranded = attr.ApparelManufacturer && attr.ApparelManufacturer !== "none";
    const brand = isBranded ? (attr.ApparelManufacturer === 'comfort-colors' ? 'Comfort Colors' : cap(attr.ApparelManufacturer)) : "";
    const sku = (isBranded && attr.ApparelManufacturerSKU !== "none") ? (attr.ApparelManufacturerSKU || "").toUpperCase() : "";
    
    const weight = cap(attr.GarmentQuality);
    const cut = cap(attr.GarmentCut);
    const subCategory = cap(attr.GarmentSubcategory);
    const category = cap(attr.GarmentCategory);
    
    let descriptiveString = `${weight ? weight + ' ' : ''}${cut ? cut + ' ' : ''}`;
    if (subCategory && subCategory !== 'None') descriptiveString += `${subCategory} `;
    if (category && category !== 'None') descriptiveString += category;
    descriptiveString = descriptiveString.trim();
    
    const brandGrip = `${brand} ${sku}`.trim();
    parsedTitle = brandGrip ? `${brandGrip} | ${descriptiveString}` : `Generic | ${descriptiveString}`;
  } else if (attr.PaperType || attr.PaperFormat) {
    const paper = attr.PaperType ? cap(attr.PaperType).replace(/Lb Cover Coated Silk/g, 'Silk Cover') : 'Standard Paper';
    const size = attr.PaperFormat ? attr.PaperFormat.replace(/-/g, ' ') : '';
    parsedTitle = `${paper} | ${size}`;
  } else if (attr.BagSubCategory) {
    const isBranded = attr.ApparelManufacturer && attr.ApparelManufacturer !== "none";
    const brand = isBranded ? cap(attr.ApparelManufacturer) : "";
    const sku = (isBranded && attr.ApparelManufacturerSKU !== "none") ? (attr.ApparelManufacturerSKU || "").toUpperCase() : "";
    const details = `${cap(attr.BagQuality)} ${cap(attr.BagSubCategory)}`.trim();
    const brandGrip = `${brand} ${sku}`.trim();
    parsedTitle = brandGrip ? `${brandGrip} | ${details}` : `Generic | ${details}`;
  } else if (attr.PhoneBrand && attr.PhoneModel) {
    parsedTitle = `${cap(attr.PhoneBrand)} ${cap(attr.PhoneModel)} | ${cap(attr.PhonecaseFinish)} ${cap(attr.PhonecaseSubstrate)} Case`;
  } else if (attr.MugMaterial || attr.MugSize) {
    parsedTitle = `${cap(attr.MugMaterial)} Mug | ${cap(attr.MugSize)}`;
  } else {
    const rawStr = item.title || item.productUid || "Generic Product";
    const segments = rawStr.split('_');
    const fallbackPiece = segments.length > 2 ? segments.slice(-2).join(' ') : rawStr;
    parsedTitle = cap(fallbackPiece); 
  }

  parsedTitle = parsedTitle.replace(/\s+/g, ' ').trim();
  return parsedTitle ? `[Gelato] ${parsedTitle}` : `[Gelato] Standard Print Resource`;
}

// Master Scraper Logic
async function syncGelatoCatalog() {
  console.log("🚀 Starting Gelato Catalog Matrix Synchronization...");
  
  const targetCatalogs = [
    { id: 't-shirts', facet: 'ApparelManufacturerSKU' },
    { id: 'hoodies', facet: 'ApparelManufacturerSKU' },
    { id: 'sweatshirts', facet: 'ApparelManufacturerSKU' },
    { id: 'tank-tops', facet: 'ApparelManufacturerSKU' },
    { id: 'kids-apparel', facet: 'ApparelManufacturerSKU' },
    { id: 'mugs', facet: 'MugSize' },
    { id: 'phone-cases', facet: 'PhoneModel' },
    { id: 'posters', facet: 'PaperFormat' }
  ];

  const globalBaseProducts = new Map();

  for (const catalog of targetCatalogs) {
    console.log(`\n📡 Mining Facets for Catalog: [${catalog.id}] -> Using Anchor: ${catalog.facet}`);
    
    try {
      // 1. Fetch the Facet Aggregations
      const searchReq = await fetch(`https://product.gelatoapis.com/v3/catalogs/${catalog.id}/products:search`, {
        method: 'POST',
        headers: { 'X-API-KEY': GELATO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 })
      });
      const searchRes = await searchReq.json();
      
      let baseAnchors = [];
      if (searchRes.hits && searchRes.hits.attributeHits && searchRes.hits.attributeHits[catalog.facet]) {
        baseAnchors = Object.keys(searchRes.hits.attributeHits[catalog.facet]);
        console.log(`   💎 Found ${baseAnchors.length} base product anchors!`);
      } else {
        console.log(`   ⚠️ Facet Anchor missing. Defaulting to general pagination strategy...`);
        baseAnchors = ["DEFAULT"];
      }

      // 2. Resolve exactly 1 variant per anchor
      const variantRequests = baseAnchors.map(anchor => {
        const payload = { limit: 10 }; // Pull top 10 variations per SKU to ensure accurate subCategory capture
        if (anchor !== "DEFAULT" && anchor !== "none") {
          payload.attributeFilters = { [catalog.facet]: [anchor] };
        }
        
        return fetch(`https://product.gelatoapis.com/v3/catalogs/${catalog.id}/products:search`, {
          method: 'POST',
          headers: { 'X-API-KEY': GELATO_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] }));
      });

      // Execute safely in batches of 10 to avoid 429 rate bounds
      let resolvedVariants = [];
      for (let i = 0; i < variantRequests.length; i += 10) {
        process.stdout.write(`   ↳ Synchronizing variants batch ${i} - ${Math.min(i + 10, variantRequests.length)}...\r`);
        const batchRes = await Promise.all(variantRequests.slice(i, i + 10));
        batchRes.forEach(r => {
            if (r.products) resolvedVariants = resolvedVariants.concat(r.products);
        });
      }
      console.log(`\n   ✅ Synchronization for ${catalog.id} complete. Synthesizing...`);

      // 3. Process the resolved variants into the Synthesizer
      resolvedVariants.forEach(item => {
          if (!item.attributes) return;
          const label = synthesizeDisplayLabel(item);
          if (!globalBaseProducts.has(label)) {
              globalBaseProducts.set(label, {
                  id: item.productUid,
                  label: label,
                  base: 11.50, // Approximation algorithm fallback
                  shipping: { usa: 4.50, canada: 6.50, europe: 4.50, worldwide: 8.50 }
              });
          }
      });
      
    } catch (e) {
      console.error(`   ❌ Failed processing ${catalog.id}:`, e.message);
    }
  }

  // Final Output
  const finalCatalogList = Array.from(globalBaseProducts.values());
  finalCatalogList.sort((a,b) => a.label.localeCompare(b.label));

  console.log(`\n🎉 Matrix Sync Complete! Resolved ${finalCatalogList.length} unique Base Product Templates.`);
  
  // Write to repository cache safely
  const outDir = path.resolve(process.cwd(), 'src/data');
  if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }
  fs.writeFileSync(path.resolve(outDir, 'gelatoProducts.json'), JSON.stringify(finalCatalogList, null, 2));
  console.log("💾 Wrote persistent database to src/data/gelatoProducts.json");
}

syncGelatoCatalog();
