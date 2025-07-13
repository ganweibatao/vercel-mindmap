import type { Metadata } from "next";
import "./globals.css";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";

export const metadata: Metadata = {
  title: "Tail",
  description: "尾巴干",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <StagewiseToolbar 
          config={{
            plugins: [ReactPlugin]
          }}
        />
      </body>
    </html>
  );
}
