# API Project Instructions

- Use `yarn` for all package manager operations.
- Do not run database migrations or reset commands.
- When creating a new service/controller, use if already exists or create the types/interfaces for the request and response in the shared package. Make sure the dtos implements interfaces in the shared package. If the service will be used by the web app, make sure the request and response types/interfaces are in the shared package.
- Explicitly define the return type of all service methods.
- Always possible, use class validator para os requests dtos.

# Web Project Instructions

- Use `yarn` for all package manager operations.
- Always use TanStack Query for data fetching and mutations in React code.
- When creating a new service, use if already exists or create the types/interfaces in the shared package.
- Always use the design system components and styles from the ui folder.
- When creating a new page or component, always use the same design system and styles as already implemented.
- Always create responsive components.