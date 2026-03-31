"use client";

import { createContext, useContext } from "react";
import type { Organization, Profile } from "@/types";

type OrganizationContextValue = {
  organization: Organization | null;
  profile: Profile | null;
};

export const OrganizationContext = createContext<OrganizationContextValue>({
  organization: null,
  profile: null,
});

export function useOrganization() {
  return useContext(OrganizationContext);
}
