---
description: 'Use when working in apps/api (NestJS backend). Enforce package manager, data-fetching defaults, and database safety rules.'
applyTo: 'apps/api/**'
---

# API Project Instructions

- Use `yarn` for all package manager operations.
- Do not run database migrations or reset commands.
- When creating a new service/controller, use if already exists or create the types/interfaces for the request and response in the shared package. Make sure the dtos implements interfaces in the shared package. If the service will be used by the web app, make sure the request and response types/interfaces are in the shared package.
- Explicitly define the return type of all service methods.
- Always possible, use class validator para os requests dtos.
- To throw an error, create a custom exception that extends the built-in NestJS exceptions. Do not throw plain Error objects. Remenber to add the error key to the shared package errors enum.
- When creating new env var, add it to validationSchema in `src/config/validation.ts`
