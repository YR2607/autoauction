import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: { default: "AutoAuction: Live Online Car Auctions", template: "%s · AutoAuction" },
  description:
    "Live vehicle auctions, salvage and clean title vehicles, real-time bidding, and fixed price purchase options.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demoMode = process.env.DEMO_MODE === "1";
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased text-[#1e293b] bg-[#eaedf1]">
        {demoMode && (
          <div className="bg-[#f59e0b] px-4 py-1 text-center text-xs font-bold tracking-wider text-[#0f172a] uppercase border-b border-[#d97706]">
            STAGING DEMO: synthetic data only, not a production marketplace
          </div>
        )}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
