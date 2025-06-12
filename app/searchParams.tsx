import { parseAsBoolean, createLoader } from "nuqs/server";

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const testSearchParams = {
  test: parseAsBoolean.withDefault(false),
};

export const loadSearchParams = createLoader(testSearchParams);
