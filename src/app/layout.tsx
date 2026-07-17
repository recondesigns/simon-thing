import type { Metadata } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";
import styles from "./layout.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simon thing",
  description: "A Simon-style memory game",
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
