#!/usr/bin/env bash
#
# Phase 1 Cloudflare provisioning.
#
# Run this from the repo root in your own terminal, then paste the three
# database ids back. It creates the D1 databases and R2 buckets named in
# wrangler.jsonc and applies the migrations to the remote staging database.
#
# Nothing here touches production. scripts/seed-admin.mjs exits non-zero
# when ENVIRONMENT=production, and this script never sets it.
#
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the
# environment, or an interactive `wrangler login` beforehand.

set -euo pipefail

echo "==> 1/5 Authenticating"
pnpm wrangler whoami

echo
echo "==> 2/5 Creating D1 databases"
# Each command prints a database_id. Record all three.
pnpm wrangler d1 create mma-db
pnpm wrangler d1 create mma-db-staging
pnpm wrangler d1 create mma-db-production

echo
echo "==> 3/5 Creating R2 buckets"
pnpm wrangler r2 bucket create mma-media
pnpm wrangler r2 bucket create mma-media-staging
pnpm wrangler r2 bucket create mma-media-production

cat <<'EOF'

==> 4/5 Paste the three database ids into apps/api/wrangler.jsonc

  the default env  -> REPLACE_WITH_D1_DATABASE_ID
  the staging env  -> REPLACE_WITH_STAGING_D1_DATABASE_ID
  the production env -> REPLACE_WITH_PRODUCTION_D1_DATABASE_ID

  Then come back and run:  ./scripts/provision.sh --migrate

EOF

if [[ "${1:-}" != "--migrate" ]]; then
  exit 0
fi

echo "==> 5/5 Applying migrations to the remote staging database"
cd apps/api
pnpm exec wrangler d1 migrations apply DB --remote --env staging
pnpm exec wrangler d1 migrations list DB --remote --env staging

echo
echo "==> Seeding the staging database (reference data only)"
cd ../..
set -a
# shellcheck disable=SC1091
source apps/api/.dev.vars
set +a

ENVIRONMENT=staging pnpm db:seed:admin
cd apps/api
pnpm exec wrangler d1 execute DB --remote --env staging --file=../../database/seed/0001_reference.sql
pnpm exec wrangler d1 execute DB --remote --env staging --file=../../database/seed/0002_admin.sql
pnpm exec wrangler d1 execute DB --remote --env staging \
  --command "SELECT (SELECT COUNT(*) FROM promotions) AS promotions, (SELECT COUNT(*) FROM divisions) AS divisions, (SELECT COUNT(*) FROM users) AS users"

echo
echo "==> Expect promotions=4, divisions=32, users=1"
echo "==> Production is intentionally left empty."
