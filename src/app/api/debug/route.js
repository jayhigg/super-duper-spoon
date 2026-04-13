import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
   try {
       const userAuth = await auth();
       return NextResponse.json({ 
           status: "online",
           env_clerk_publishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
           env_clerk_secret: !!process.env.CLERK_SECRET_KEY,
           env_stripe_secret: !!process.env.STRIPE_SECRET_KEY,
           userId: userAuth?.userId || "NULL",
       });
   } catch(e) {
       return NextResponse.json({ error: e.message, stack: e.stack });
   }
}
