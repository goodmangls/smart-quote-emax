# BACKEND_SECURITY_NOTES.md

## Scope

Backend security follow-up for the `smart-quote-main` review.

This document captures backend-only findings discovered while validating the frontend security review and checking whether server-side authorization actually exists for the endpoints the frontend depends on.

## Backend Repos Found

Two separate Rails API repositories were found:

- `/Users/jaehong/Developer/Projects/smart-quote-main/smart-quote-api`
- `/Users/jaehong/Developer/Projects/smart-quote-api`

## Primary Risk: Canonical Backend Is Unclear

The frontend contract does not fully match either backend repository.

Examples:
- Frontend expects `PUT /api/v1/auth/password`
- Frontend expects `POST /api/v1/notifications/slack`
- The nested backend does not define `auth/password`
- Neither inspected backend defines `notifications/slack`

Impact:
- Security review can be performed against the wrong codebase
- Fixes may land in the wrong repository
- Production authorization assumptions may be incorrect

Required decision:
- Determine which backend repo is the actual source of truth for `VITE_API_URL`

## Confirmed Finding 1: Password Update Auth Gap

In the standalone backend:
- Route exists: `/Users/jaehong/Developer/Projects/smart-quote-api/config/routes.rb`
- Controller action exists: `/Users/jaehong/Developer/Projects/smart-quote-api/app/controllers/api/v1/auth_controller.rb`

Issue:
- `update_password` does not call `authenticate_user!`
- `current_user` is used without explicit JWT auth population

Impact:
- Broken authentication boundary
- Endpoint behavior depends on nil `current_user` instead of explicit auth enforcement
- Missing explicit guard makes the security model brittle and misleading

Required fix:
- Add `before_action :authenticate_user!, only: [ :update_password, :me ]`

## Confirmed Finding 2: Missing Slack Notification Endpoint

Frontend calls:
- `POST /api/v1/notifications/slack`

Search result:
- No matching route/controller was found in either inspected backend repo

Impact:
- Frontend and backend are out of sync
- No auditable server-side authorization or payload handling exists in the inspected code
- Slack notification flow cannot be security-reviewed until the real endpoint is identified

Required fix:
- Either add this endpoint to the canonical backend
- Or remove/replace the frontend integration if obsolete

## What Looks Acceptable

The quote authorization model appears materially correct in both inspected backends:

- `quotes/calculate` is public
- other quote endpoints require authentication
- quote access is scoped by `current_user`
- admin users can access all quotes
- regular users appear limited to their own records

JWT error handling also appears reasonable:
- invalid token -> `401`
- expired token -> `401`
- no decode details are exposed in the response body

## Open Questions

1. Which backend repo is deployed in production?
2. Where is the real implementation of `/api/v1/notifications/slack`?
3. Does production expose `auth/promote`, and under what operational controls?
4. Is there any backend logout/revocation mechanism, or are JWTs only time-based?

## Verification Blocker

Runtime request-spec verification could not be completed locally because Bundler is missing the version pinned by `Gemfile.lock`.

Observed error:
- `Could not find 'bundler' (2.6.9) required by Gemfile.lock`

Impact:
- Code-level review was possible
- Runtime verification of auth/authorization behavior remains incomplete

## Immediate Backend Actions

1. Decide the canonical backend repository
2. Patch `PUT /api/v1/auth/password` to require `authenticate_user!`
3. Add request specs for password update authentication cases
4. Locate or implement `POST /api/v1/notifications/slack`
5. Install the required Bundler version and rerun request specs

## Recommended Request Spec Coverage

For `PUT /api/v1/auth/password`:
- no token -> `401`
- invalid token -> `401`
- expired token -> `401`
- wrong current password -> `401`
- mismatched confirmation -> `422`
- valid token + valid current password -> `200`

For admin-sensitive APIs:
- unauthenticated -> `401`
- authenticated non-admin -> `403`
- authenticated admin -> success

## Bottom Line

The backend review did not uncover an obvious quote authorization bypass. The bigger risks are:

- repository drift between two backend codebases
- a concrete authentication defect in the standalone password update endpoint
- a missing Slack notification endpoint relative to the frontend contract

These must be resolved before the overall security posture can be considered stable.
