import type { Metadata } from "next";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

import { TRPCProvider } from "@/trpc/client";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ecom Home - La Batita Presumida",
  description: "La Batita Presumida ERP",
};

export default async function RootLayout({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <TRPCProvider>
          <NextThemesProvider {...props} attribute="class">
            <Toaster richColors position="bottom-center" />
            {children}
          </NextThemesProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
