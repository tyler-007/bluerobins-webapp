import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Nunito, Lora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Link from "next/link";
import "./globals.css";
import { ReactQueryProvider } from "./react-query-provider";
import { Toaster } from "@/components/ui/toaster";
import { MobileRestriction } from "@/components/mobile-restriction";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "BlueRobins",
  description: "BlueRobins",
};

const nunitoSans = Nunito({
  display: "swap",
  subsets: ["latin"],
});

const lora = Lora({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.className} suppressHydrationWarning>
      <head>
        <style>{`
          h1, h2, h3 {
            font-family: ${lora.style.fontFamily};
          }
        `}</style>
      </head>
      <body className="bg-background text-foreground">
        <NuqsAdapter>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <MobileRestriction>
                <main className="min-h-screen flex flex-col items-center">
                  <div className="flex-1 w-full flex flex-col items-center">
                    {/* <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                    <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                      <div className="flex gap-5 items-center font-semibold">
                        <Link href={"/"}>BlueRobins</Link>
                      </div>
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>
                  </nav> */}
                    {/* <div className="flex flex-col gap-20 w-full max-w-5xl p-5"> */}
                    <div className="flex flex-col gap-20 w-full">
                      {children}
                    </div>
                  </div>
                </main>
              </MobileRestriction>
              <Toaster />
            </ThemeProvider>
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
