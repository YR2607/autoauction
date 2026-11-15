import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "AutoAuction — Premium Car Auctions", template: "%s · AutoAuction" },
  description:
    "Premium automotive marketplace. Bid in live auctions or buy instantly at a fixed price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demoMode = process.env.DEMO_MODE === "1";
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        {demoMode && (
          <div className="bg-amber-500/90 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-black">
            STAGING DEMO — synthetic data only, not a production marketplace
          </div>
        )}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
