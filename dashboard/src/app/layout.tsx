import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "fin — Personal Finance",
  description: "Jacob & Thalya's money dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 p-6">
            <SidebarTrigger className="mb-4" />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
