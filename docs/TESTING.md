# StockPilot Testing Guide

Comprehensive testing documentation for the StockPilot platform.

---

## Table of Contents

- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Getting Started](#getting-started)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing](#e2e-testing)
- [Mock Data Factories](#mock-data-factories)
- [CI/CD Integration](#cicd-integration)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

---

## Overview

StockPilot uses a multi-layered testing strategy:

| Layer | Framework | Scope |
|-------|-----------|-------|
| Unit Tests | Jest + ts-jest | Individual functions, services |
| Integration Tests | Jest + Supertest | API endpoints, module interactions |
| Component Tests | React Testing Library | UI components |
| E2E Tests | Jest + Puppeteer | Full user flows |

---

## Test Architecture

```
StockPilot/
├── src/__tests__/                    # Frontend tests
│   ├── components/                   # Component tests
│   │   ├── inventory-table.test.tsx
│   │   └── dashboard-metrics.test.tsx
│   ├── integration/                  # Frontend integration tests
│   │   ├── auth-flow.test.tsx
│   │   └── inventory-management.test.tsx
│   ├── e2e/                          # E2E test examples
│   │   └── user-journey.test.tsx
│   ├── mocks/                        # Shared mock factories
│   │   └── factories.ts
│   ├── hooks/                        # Hook tests
│   │   └── use-inventory.test.ts
│   └── lib/                          # Utility tests
│       └── api.test.ts
├── backend/
│   ├── src/                          # Backend unit tests (*.spec.ts)
│   │   ├── auth/auth.service.spec.ts
│   │   ├── inventory/inventory.service.spec.ts
│   │   ├── stock/stock.service.spec.ts
│   │   └── analytics/analytics.service.spec.ts
│   └── test/                         # Backend E2E/integration tests
│       ├── auth.e2e-spec.ts
│       ├── inventory.e2e-spec.ts
│       └── analytics.e2e-spec.ts
├── jest.config.js                    # Frontend Jest config
└── .github/workflows/test.yml        # CI test pipeline
```

---

## Getting Started

### Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Frontend only
npm install

# Backend only
cd backend && npm install
```

### Run Tests

```bash
# Run all frontend tests
npm test

# Run frontend tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run backend tests
cd backend && npm test

# Run backend E2E tests
cd backend && npm run test:e2e

# Run backend with coverage
cd backend && npm run test:cov
```

---

## Backend Testing

### Unit Tests

Backend unit tests use NestJS testing utilities with mocked dependencies.

**Pattern:** `*.spec.ts` files alongside source code.

```typescript
// Example: auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Backend integration tests verify full request/response cycles.

**Pattern:** `*.e2e-spec.ts` files in `backend/test/`.

```typescript
// Example: auth.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'Pass123!' })
      .expect(201);
  });
});
```

---

## Frontend Testing

### Component Tests

Use React Testing Library for component-level tests.

```typescript
// Example: inventory-table.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('InventoryTable', () => {
  it('renders inventory items', () => {
    render(<InventoryTable items={mockItems} />);
    expect(screen.getByText('Widget A')).toBeInTheDocument();
  });

  it('handles item click', async () => {
    const onSelect = jest.fn();
    render(<InventoryTable items={mockItems} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Widget A'));
    expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
  });
});
```

### Hook Tests

Test custom hooks using `renderHook` from React Testing Library.

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useInventory } from '@/hooks/use-inventory';

describe('useInventory', () => {
  it('fetches inventory items', async () => {
    const { result } = renderHook(() => useInventory());
    await waitFor(() => {
      expect(result.current.items).toHaveLength(3);
    });
  });
});
```

---

## E2E Testing

End-to-end tests simulate real user interactions.

```typescript
describe('User Journey', () => {
  it('completes full inventory workflow', async () => {
    // 1. Login
    // 2. Navigate to inventory
    // 3. Add new item
    // 4. Verify item appears
    // 5. Update stock
    // 6. Verify stock updated
    // 7. Delete item
    // 8. Verify removal
  });
});
```

---

## Mock Data Factories

Use the factory pattern for consistent test data:

```typescript
// src/__tests__/mocks/factories.ts
export const createMockUser = (overrides = {}) => ({
  _id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'staff',
  isActive: true,
  ...overrides,
});

export const createMockItem = (overrides = {}) => ({
  _id: 'item-123',
  name: 'Test Widget',
  quantity: 100,
  category: 'Electronics',
  lowStockThreshold: 10,
  unitPrice: 29.99,
  ...overrides,
});
```

---

## CI/CD Integration

Tests run automatically on every push via GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run install:all
      - run: npm test -- --coverage
      - run: cd backend && npm test -- --coverage
```

---

## Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| Backend Services | 70% |
| Backend Controllers | 60% |
| Frontend Hooks | 70% |
| Frontend Components | 60% |
| Overall | 65% |

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use factories** - Create mock data with factory functions
3. **Isolate tests** - Each test should be independent
4. **Mock external dependencies** - Database, APIs, WebSocket
5. **Write descriptive test names** - `should return 401 when token is expired`
6. **Follow AAA pattern** - Arrange, Act, Assert
7. **Keep tests fast** - Mock heavy operations, avoid real DB in unit tests
8. **Test edge cases** - Empty arrays, null values, error states
9. **Maintain test data** - Keep factories updated with schema changes
10. **Run tests before commits** - Use pre-commit hooks
