import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";
import StoreHydrator from "@/providers/StoreHydrator";
import Header from "@/components/organisms/Header/Header";
import { tokens } from "@/lib/theme/tokens";
import styles from "./layout.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dots",
  description: "Record a Simon-style memory game",
};

export const viewport: Viewport = {
  // Matches the page background so mobile browser chrome doesn't render a
  // white bar above a dark app.
  themeColor: tokens.bg.surface.fill,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <StoreHydrator />
          <div className={styles.shell}>
            <Header />
            {children}
          </div>
        </ThemeRegistry>
      </body>
    </html>
  );
}
