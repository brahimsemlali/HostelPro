"use client";

import { OrganizationContext } from "@/lib/hooks/useOrganization";
import type { Organization, Profile } from "@/types";

type OrganizationProviderProps = {
  children: React.ReactNode;
  organization: Organization | null;
  profile: Profile | null;
};

export function OrganizationProvider({
  children,
  organization,
  profile,
}: OrganizationProviderProps) {
  return (
    <OrganizationContext.Provider value={{ organization, profile }}>
      {children}
    </OrganizationContext.Provider>
  );
}
