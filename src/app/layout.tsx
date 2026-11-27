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
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased text-[#1e293b] bg-[#eaedf1]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
