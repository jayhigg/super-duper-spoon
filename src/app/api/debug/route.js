import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { userId } = await auth();

    let metadata = null;
    let isPro = false;

    if (userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      metadata = user.publicMetadata;
      isPro = metadata?.isPro === true;
    }

    return NextResponse.json({
      status: "online",
      env_clerk_publishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      env_clerk_secret: !!process.env.CLERK_SECRET_KEY,
      env_stripe_secret: !!process.env.STRIPE_SECRET_KEY,
      env_stripe_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      userId: userId || "NULL",
      publicMetadata: metadata,
      isPro,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
