import Stripe from 'stripe';

/**
 * Stripe SDK Initialization
 * This safely exports a singleton Stripe instance for the server.
 * Requires STRIPE_SECRET_KEY in .env.local
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16', // Locked to exact API version for stability
  appInfo: {
    name: 'True Margin Calculator',
    version: '1.0.0',
  },
});
