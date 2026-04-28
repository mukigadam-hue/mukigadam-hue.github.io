/**
 * Returns the canonical app domain for auth/email redirects.
 *
 * Android App Links only auto-open the installed app when the link points
 * to a domain that hosts a matching /.well-known/assetlinks.json. For this
 * project that domain is `ndamwesigaapp.store` (see public/.well-known/assetlinks.json
 * and the Despia package `com.despia.biztrack`).
 *
 * Using this for `emailRedirectTo` / `redirectTo` ensures that when the
 * user taps a confirmation or password-reset link from Gmail on Android,
 * the OS opens the installed app directly instead of bouncing into Chrome.
 *
 * In local dev / Lovable preview we fall back to the current origin so
 * developers keep their normal flow.
 */
export const APP_LINK_DOMAIN = 'https://ndamwesigaapp.store';

export function getAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') return APP_LINK_DOMAIN;

  const host = window.location.hostname;

  // In production / inside the installed app shell, always use the
  // App-Links-verified domain so Android opens the installed app directly.
  // Lovable preview/staging and localhost keep the current origin.
  const isPreviewOrLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.lovable.app') ||
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.dev');

  return isPreviewOrLocal ? window.location.origin : APP_LINK_DOMAIN;
}

export function getAuthRedirectUrl(path: string = '/'): string {
  const base = getAuthRedirectOrigin();
  if (!path.startsWith('/')) path = '/' + path;
  return `${base}${path}`;
}
