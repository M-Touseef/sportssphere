# Shared Constants and Validation Schemas

This directory contains code shared between client and server:

- **constants/**: Shared constants (user roles, payment statuses, tournament categories)
- **validation/**: Validation schemas for common data structures
- **types/**: TypeScript type definitions (if using TypeScript)
- **utils/**: Utility functions used by both frontend and backend

## Example Structure:

```
shared/
├── constants/
│   ├── roles.js
│   ├── tournamentCategories.js
│   └── paymentStatuses.js
├── validation/
│   ├── userSchema.js
│   └── tournamentSchema.js
└── utils/
    ├── dateUtils.js
    └── formatters.js
```

## Usage:

Import shared code in both client and server:

```javascript
// In server
const { USER_ROLES } = require('../shared/constants/roles');

// In client (if using same repo)
import { USER_ROLES } from '../../shared/constants/roles';
```
