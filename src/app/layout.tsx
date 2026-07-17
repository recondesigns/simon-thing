import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";
import { tokens } from "@/lib/theme/tokens";
import styles from "./layout.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake Name",
  description: "A Simon-style memory game",
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
          <div className={styles.shell}>{children}</div>
        </ThemeRegistry>
      </body>
    </html>
  );
}
