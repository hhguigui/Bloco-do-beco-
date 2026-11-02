import { apiGet } from "@/lib/api";
import type { CepLookup } from "@/lib/types";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function lookupCep(cep: string): Promise<CepLookup | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    return await apiGet<CepLookup>(`/geocode/cep/${clean}`);
  } catch {
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) return null;
  try {
    return await apiGet<GeocodeResult>(`/geocode?q=${encodeURIComponent(address.trim())}`);
  } catch {
    return null;
  }
}
