"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggleSidebar, isMobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
