import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// We distinctly protect the `/calculator` route since it represents the core value proposition of True Margin.
const isProtectedRoute = createRouteMatcher(["/calculator(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // Forces redirect to sign-in page if not authenticated
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
