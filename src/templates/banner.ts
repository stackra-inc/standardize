/**
 * @fileoverview Banner SVG template — generates a clean placeholder banner.
 *
 * Creates a minimal dark-themed banner with the package name and description.
 * Packages with existing banners are never overwritten — this only creates
 * the initial placeholder for new packages.
 *
 * @module @stackra/standardize
 */

import { NPM_SCOPE, ORG_NAME } from "../config.js";

/**
 * Generates a placeholder banner SVG for a package.
 *
 * The banner uses a dark gradient background with the package name
 * prominently displayed. It's designed to look good on GitHub READMEs,
 * npm pages, and Slack notifications.
 *
 * @param packageName - Full npm name (e.g., '@stackra/ts-http')
 * @param description - Package description from package.json
 * @returns SVG string
 */
export function generateBannerSvg(
  packageName: string,
  description: string,
): string {
  /** Extract the short name after the scope (e.g., 'ts-http' from '@stackra/ts-http') */
  const shortName = packageName.replace(`${NPM_SCOPE}/`, "");

  /** Truncate description to fit the banner width */
  const desc =
    description.length > 80 ? description.slice(0, 77) + "..." : description;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3178c6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#818cf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c084fc;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#818cf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c084fc;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#3178c6;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:#3178c6;stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="900" height="280" fill="url(#bg)" rx="12" />

  <!-- Grid pattern -->
  <g opacity="0.04" stroke="#94a3b8" stroke-width="0.5">
    <line x1="0" y1="70" x2="900" y2="70" />
    <line x1="0" y1="140" x2="900" y2="140" />
    <line x1="0" y1="210" x2="900" y2="210" />
    <line x1="225" y1="0" x2="225" y2="280" />
    <line x1="450" y1="0" x2="450" y2="280" />
    <line x1="675" y1="0" x2="675" y2="280" />
  </g>

  <!-- Top accent line -->
  <rect x="0" y="0" width="900" height="3" fill="url(#accent)" rx="2" />
  <!-- Bottom accent line -->
  <rect x="0" y="277" width="900" height="3" fill="url(#accent)" rx="2" />

  <!-- Glow -->
  <circle cx="450" cy="140" r="200" fill="url(#glow)" />

  <!-- Scope -->
  <text x="450" y="100" text-anchor="middle" font-family="'Courier New', monospace" font-size="16" fill="#60a5fa" opacity="0.8" letter-spacing="3">${NPM_SCOPE}</text>

  <!-- Package name -->
  <text x="450" y="150" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="48" font-weight="700" fill="url(#textGrad)">${shortName}</text>

  <!-- Underline -->
  <rect x="300" y="162" width="300" height="3" rx="2" fill="url(#accent)" opacity="0.6" />

  <!-- Description -->
  <text x="450" y="200" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" fill="#94a3b8">${desc}</text>

  <!-- Footer -->
  <text x="450" y="250" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#475569" letter-spacing="1">${ORG_NAME}</text>
</svg>`;
}
