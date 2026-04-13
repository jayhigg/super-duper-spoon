import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature');

  let event;

  try {
    // Verifies the webhook securely originates from Stripe (Requires STRIPE_WEBHOOK_SECRET)
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_placeholder'
    );
  } catch (error) {
    console.error("Webhook Signature Verification Failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Handle successful subscriptions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract the Clerk JWT ID we embedded into the checkout session originally
    const userId = session.client_reference_id || (session.subscription_data?.metadata?.clerkUserId);
    const subscriptionId = session.subscription;

    if (userId) {
      console.log(`[Stripe Webhook] Success: Upgrading User ID: ${userId} to PRO status.`);
      
      try {
        const { clerkClient } = require('@clerk/nextjs/server');
        // Native DB bypass: Upgrading the Clerk JSON Web Token safely on the backend
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: { 
                isPro: true,
                stripeSubId: subscriptionId
            }
        });
      } catch (err) {
         console.error("Clerk Metadata Upgrade Failed:", err);
      }
    }
  }

  // Handle subscription cancellations
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    console.log(`[Stripe Webhook] Cancellation: Removing PRO access for sub ${subscription.id}`);
    
    try {
        // We have to query Clerk to find the user via this sub ID, or simply clear based on ID
        // For production, usually we pass clerkUserIds directly onto the Subscription metadata as well.
        console.warn("User cancellation event caught. Must implement lookup by sub UUID in Clerk to demote.");
    } catch(err) {
        console.error("Clerk Metadata Demotion Failed:", err);
    }
  }

  return new NextResponse('Webhook Received', { status: 200 });
}
