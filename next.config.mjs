/** @type {import('next').NextConfig} */

// The one address the memorial lives at. Every other host (the *.vercel.app
// address, a missing "www") is sent here with a permanent redirect, so search
// engines and shared links agree on a single URL. Override with CANONICAL_HOST.
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'www.abelolaniyifatokunmemorial.vip';
const IS_PROD_BUILD = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy, shipped as REPORT-ONLY first (as the brief asks):
 * the browser logs anything it would have blocked but blocks nothing, so a
 * missed origin can never break the memorial. After a week of clean reports,
 * set CSP_ENFORCE=1 in Vercel to switch the same policy to enforcing.
 *
 * 'unsafe-inline' for scripts is required today because Next.js emits inline
 * bootstrap scripts; moving to nonces needs a middleware change and is
 * tracked as a follow-up rather than risked here.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://apis.google.com https://www.gstatic.com" + (IS_PROD_BUILD ? '' : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com https://*.public.blob.vercel-storage.com https://i.ytimg.com https://img.youtube.com https://lh3.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com",
  "media-src 'self' blob: https://storage.googleapis.com https://firebasestorage.googleapis.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com https://maps.google.com https://challenges.cloudflare.com https://*.firebaseapp.com https://accounts.google.com",
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Popup sign-in with Google needs "allow-popups".
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()' },
  ...(IS_PROD_BUILD
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
  {
    key: process.env.CSP_ENFORCE === '1' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    value: csp,
  },
];

const nextConfig = {
  // Only hosts this site really loads pictures from. A "**" wildcard would let
  // anyone use our image optimiser as a free proxy for any website.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.firebasestorage.app' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,

  async redirects() {
    // Production only, so local development and preview deployments still work.
    if (!IS_PROD_BUILD || process.env.VERCEL_ENV === 'preview' || process.env.DISABLE_CANONICAL_REDIRECT === '1') return [];
    return [
      // Any host that is not the canonical one -> canonical, same path and query.
      // The negative look-ahead means the canonical host itself never matches (no loop).
      {
        source: '/:path*',
        has: [{ type: 'host', value: '^(?!www\\.abelolaniyifatokunmemorial\\.vip$)(?!localhost)(?!127\\.0\\.0\\.1).+$' }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // Admin and API responses must never be cached or indexed.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};
export default nextConfig;
