import { getPublicSiteUrl } from "./runtime-env";

export function getSiteUrl(): URL {
  return new URL(getPublicSiteUrl());
}
