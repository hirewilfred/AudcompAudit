import { NextResponse } from 'next/server';

/**
 * MSAL popup redirect handler.
 * Returns a bare HTML page that loads MSAL from CDN and calls handleRedirectPromise().
 * MSAL detects it's in a popup (via window.opener), passes the auth code back
 * to the parent window, then closes the popup automatically.
 */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Signing in...</title>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center;
           height: 100vh; font-family: sans-serif; color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <p>Signing in…</p>
  <script src="https://unpkg.com/@azure/msal-browser@5.4.0/lib/msal-browser.min.js"></script>
  <script>
    (async function () {
      try {
        const app = new msal.PublicClientApplication({
          auth: {
            clientId: "${clientId}",
            authority: "https://login.microsoftonline.com/common",
            redirectUri: window.location.origin + "/auth/redirect",
          },
          cache: { cacheLocation: "sessionStorage" },
        });
        await app.initialize();
        await app.handleRedirectPromise();
      } catch (e) {
        // Ignore — parent window will handle timeouts
      } finally {
        window.close();
      }
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
