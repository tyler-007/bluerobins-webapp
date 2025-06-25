"use client"; // Required for React hooks

import React, { createContext, useContext } from "react";

// Create the context
const LayoutDataContext = createContext<any | null>(null);

// Provider to wrap children with the data
export const LayoutDataProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: any;
}) => {
  return (
    <LayoutDataContext.Provider value={value}>
      {children}
    </LayoutDataContext.Provider>
  );
};

// Hook to use the context
export const useLayoutData = () => {
  const context = useContext(LayoutDataContext);
  if (context === undefined) {
    throw new Error("useLayoutData must be used within a LayoutDataProvider");
  }
  return context;
};
