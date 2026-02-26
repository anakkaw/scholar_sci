import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Cached version of auth() — deduplicates the JWT decode so layout + page
 * components within the same request share one result instead of decoding twice.
 */
export const getSession = cache(() => auth());
