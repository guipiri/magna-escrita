# General Instructions

- Avoid using literal strings for types or statuses (e.g., `PageType`, `BookStatus`). Instead, prefer using enums. If enum doesen´t exist, create it in the appropiate folder in the shared package.
  - Wrong: `const isBookReadyForSale = book.status === 'READY_FOR_SALE';`
  - Right: `const isBookReadyForSale = book.status === BookStatusEnum.READY_FOR_SALE;`

# API Project Instructions

- Use `yarn` for all package manager operations.
- Do not run database migrations or reset commands.
- When creating a new service/controller, use if already exists or create the types/interfaces for the request and response in the shared package. Make sure the dtos implements interfaces in the shared package. If the service will be used by the web app, make sure the request and response types/interfaces are in the shared package.
- Explicitly define the return type of all service methods.
- Always possible, use class validator for os requests dtos.
- To throw an error, create a custom exception that extends the built-in NestJS exceptions. Do not throw plain Error objects or NestJs built-in exceptions. Remember to add the error key to the shared package errors enum.
- Sempre que adicionar alguma variável de ambiente, adicione também na constante validationSchema em `src/config/validation.ts`

# Web/backoffice Project Instructions

- Use `yarn` for all package manager operations.
- Always use TanStack Query for data fetching and mutations in React code.
- When creating a new service, use if already exists or create the types/interfaces in the shared package.
- Always use the design system components and styles from the ui folder.
- When creating a new page or component, always use the same design system and styles as already implemented.
- Always create responsive components.
