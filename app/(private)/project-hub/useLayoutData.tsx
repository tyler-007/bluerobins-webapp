"use client"; // Required for React hooks

import { createContext, useContext } from "react";

// Create the context
const LayoutDataContext = createContext(null);

// Provider to wrap children with the data
export function LayoutDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: any;
}) {
  return (
    <LayoutDataContext.Provider value={value}>
      {children}
    </LayoutDataContext.Provider>
  );
}

// Hook to use the context
export function useLayoutData() {
  const context = useContext(LayoutDataContext);
  if (!context) throw new Error("Use layout data is outside context");
  return context;
}
