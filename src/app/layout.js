import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

export const metadata = {
  title: "Velorah® | Where dreams rise",
  description: "Digital architecture that allows the world's most ambitious ideas to finally breathe.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
