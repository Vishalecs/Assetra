# API documentation

Base URL: http://localhost:5000/api/v1

## Authentication

- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/refresh
- POST /auth/forgot-password
- POST /auth/reset-password

## Employees

- GET /employees
- GET /employees/:id
- POST /employees
- PATCH /employees/:id
- PATCH /employees/:id/status

## Roles and permissions

- GET /roles
- GET /permissions
- GET /users/:id/permissions
- PATCH /users/:id/permissions
- PATCH /users/:id/role

## Loan applications

- GET /loan-applications
- POST /loan-applications
- GET /loan-applications/:id
- PATCH /loan-applications/:id
- POST /loan-applications/:id/submit
- POST /loan-applications/:id/review
- POST /loan-applications/:id/approve
- POST /loan-applications/:id/reject
