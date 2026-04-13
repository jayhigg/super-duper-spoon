import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request) {
  try {
    // Determine the host for successful return routing
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // In a production environment, this email or ID is retrieved natively from your Auth provider (Clerk)
    const { userId, email } = await request.json().catch(() => ({}));

    // Generate a Checkout Session for the $9/mo Pro Tier
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email, // Auto-fills the checkout form
      // We embed the user's ID into the session so the Webhook knows who paid
      client_reference_id: userId || 'test_user_id',
      line_items: [
        {
          // Replace this placeholder with your actual Stripe Price ID from your dashboard
          price: process.env.STRIPE_PRO_PRICE_ID || 'price_placeholder', 
          quantity: 1,
        },
      ],
      success_url: `${origin}/calculator?upgraded=true`,
      cancel_url: `${origin}/calculator?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }
}
