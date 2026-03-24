import { Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
  title: "Relish — Order Your Food",
  description: "Scan. Browse. Order. Enjoy your meal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.className} h-full`}>
      <body className="min-h-full bg-white text-gray-900 antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
