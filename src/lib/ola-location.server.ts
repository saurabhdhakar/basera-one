const paths = { autocomplete: '/places/v1/autocomplete', details: '/places/v1/details', reverse: '/places/v1/reverse-geocode' } as const;

export const OLA_BASE = 'https://api.olamaps.io';

export function olaKey(): string | undefined {
  return process.env['OLA_MAPS_API_KEY'] || undefined;
}

export async function requestOla(kind: keyof typeof paths, params: Record<string, string>, key: string): Promise<unknown> {
  const url = new URL(paths[kind], OLA_BASE);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set('api_key', key);
  // Never log a URL, upstream body or exception: they may include credentials.
  const response = await fetch(url, { headers: { 'X-Request-Id': crypto.randomUUID() }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Location service is unavailable. Please try again.');
  return response.json();
}
