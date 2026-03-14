import "server-only";

import type { Metadata } from "next";
import { buildAlternatesForPath } from "./routing";
import { getRequestLocale } from "./server";

type BasicPageMetadata = Pick<Metadata, "title" | "description">;

export async function withLocalizedAlternates(
  metadata: BasicPageMetadata,
  pathname: string,
): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    ...metadata,
    alternates: buildAlternatesForPath(pathname, locale),
  };
}
