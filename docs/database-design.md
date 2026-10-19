# Database design

The runtime database is PostgreSQL using Drizzle ORM. The core schemas should cover users, employees, roles, permissions, branches, departments, applications, customer records, documents, and audit log tables.

## Core principles

- UUID primary keys for most entities.
- Soft deletion for records that should remain historically valid.
- Indexes for status, branch, employee, and application lookup fields.
- Transactional writes for loan approval, correction handling, and sensitive updates.
- Secure storage of sensitive identifiers using encryption or masking-aware storage patterns.
