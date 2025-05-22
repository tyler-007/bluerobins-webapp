import Sidebar from "@/components/siderbar";
import { createContext, useContext } from "react";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-row min-h-screen max-h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 overflow-auto bg-gradient-primary">
        {children}
      </main>
    </div>
  );
}
