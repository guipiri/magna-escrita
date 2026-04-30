# `Turborepo` Vite starter

This is a community-maintained example. If you experience a problem, please submit a pull request with a fix. GitHub Issues will be closed.

## Using this example

Run the following command:

```sh
npx create-turbo@latest -e with-vite-react
```

## What's inside?

This Turborepo includes the following packages and apps:

### Apps and Packages

- `web`: react [vite](https://vitejs.dev) ts app
- `@repo/ui`: a stub component library shared by `web` application
- `@repo/eslint-config`: shared `eslint` configurations
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Diagrama ER gerado a partir do schema Prisma

Abaixo está um diagrama Mermaid (ER) representando as entidades e relacionamentos definidos em `apps/api/prisma/schema.prisma`.

```mermaid
erDiagram
	ORDER ||--o{ ORDER_ITEM : has
	ORDER_ITEM }o--|| BOOK : refers_to
	BOOK }o--|| PRICE : priced_by
	PRICE ||--o{ BOOK : has
	BOOK ||--o{ PAGE : contains
	STUDENT ||--o{ ENROLLMENT : enrolls
	BOOK ||--o{ ENROLLMENT : has_enrollments
	ENROLLMENT }o--|| GRADE : in_grade
	GRADE }o--|| UNIT : part_of
	UNIT }o--|| SCHOOL : belongs_to
	AUTHOGRAPHS_EVENT ||--o{ AUTHOGRAPHS_EVENT_TIMELINE : has_timeline
	AUTHOGRAPHS_EVENT }o--|| UNIT : in_unit

	ORDER {
		string id PK
		string mpId
		string status
		string paymentMethodId
		decimal totalAmount
		string email
		string token
		int installments
	}

	ORDER_ITEM {
		string orderId FK
		string bookId FK
		int quantity
		decimal amount
	}

	BOOK {
		string id PK
		string title
		string author
		string description
		string priceId FK
	}

	PRICE {
		string id PK
		decimal amount
	}

	PAGE {
		int number PK
		string content
		string drawImageUrl
		string bookId FK
	}

	STUDENT {
		string id PK
		string name
	}

	ENROLLMENT {
		string id PK
		string studentId FK
		string bookId FK
		string schoolYear
		string gardeId FK
	}

	GRADE {
		string id PK
		string name
		string unitId FK
	}

	UNIT {
		string id PK
		string name
		string schoolId FK
	}

	SCHOOL {
		string id PK
		string name
	}

	AUTHOGRAPHS_EVENT {
		string id PK
		string name
		datetime date
		string schoolYear
		string unitId FK
	}

	AUTHOGRAPHS_EVENT_TIMELINE {
		string id PK
		datetime date
		string details
		string eventId FK
	}
```
