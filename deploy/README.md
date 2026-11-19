# SafeLine verification bridge

The frontend opens `<API_URL>/safeline-verify` after a confirmed HTTP 468. The visitor completes SafeLine verification in the iframe or the external window. The origin bridge then sends only the `sl-challenge-jwt` WAF cookie to the frontend, which stores a separate HttpOnly cookie for server-rendered API requests.

The bridge must remain behind the same SafeLine site and rules as the API. No WAF exception is needed. The response CSP and postMessage target in `safeline-verification.conf` must match the public frontend origin (currently `https://sevtinge.com`). Frontend API environment variables must point to that protected API.

Current origin include: `/www/server/panel/vhost/nginx/extension/blog.sevtinge.cc/shiro-safeline-verification.conf`. Validate with `nginx -t` before a graceful nginx reload. The bridge is already installed on this server; the frontend changes need their normal deployment.

Public content uses anonymous requests and checks projected article IDs against the published post list. Socket events invalidate public caches immediately. A foreground-only 15-second reconciliation catches updates that were sent only to individual article rooms. Admin queries retain their existing permissions.

Regression tests (Node 24):

```powershell
node --import ./scripts/register-test-types.mjs --test src/lib/publication.test.mjs src/lib/public-posts.test.mjs src/lib/safeline-challenge.test.mjs src/components/layout/header/internal/published-preview.test.mjs
```
