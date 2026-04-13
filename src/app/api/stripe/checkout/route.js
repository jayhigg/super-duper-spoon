import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
  try {
    // Determine the user initiating the checkout
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Must log in." }, { status: 401 });
    }

    // Determine absolute origin for redirects (localhost vs production domain)
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    // Create a robust Checkout Session using Stripe's native UI
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          // User's True Margin Premium Subscription
          price: 'price_1TLZ44CgWSPev0TVNTs3KDZj', 
          quantity: 1,
        },
      ],
      success_url: `${origin}/calculator?success=true`,
      cancel_url: `${origin}/calculator?canceled=true`,
      // WE INJECT THE CLERK JWT ID HERE. This maps the anonymous Stripe payment back to the Next.js database invisibly.
      client_reference_id: userId,
      subscription_data: {
        metadata: {
            clerkUserId: userId
        }
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Checkout Execution Error", message: error.message, stack: error.stack }, { status: 500 });
  }
}
