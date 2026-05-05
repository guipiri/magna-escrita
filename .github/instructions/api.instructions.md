---
description: "Use when working in apps/api (NestJS backend). Enforce package manager, data-fetching defaults, and database safety rules."
applyTo: "apps/api/**"
---
# API Project Instructions

- Use `yarn` for all package manager operations.
- Do not run database migrations or reset commands.
- When creating a new service, use if already exists or create the types/interfaces in the shared package. For dtos, make sure they implements interfaces in the shared package. If the service will be used by the web app, make sure the request and response types/interfaces are in the shared package.
