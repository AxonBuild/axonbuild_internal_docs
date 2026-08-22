# Technical Guidance (Obsolete)

> This page is archived. Use [Technical guidance — CLAUDE.md](/p/technical-guidance-claude) for the current guidance.

## Table of Contents

- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Planning/Outlining](#planning-outlining)
- [Code Style and Formatting](#code-style-and-formatting)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Code Duplication](#code-duplication)
- [Constants and Configuration](#constants-and-configuration)
- [Documentation](#documentation)
- [Security Best Practices](#security-best-practices)
- [Performance Considerations](#performance-considerations)
- [Branches and Pull Requests](#branches-and-pull-requests)
- [Code Journey Logging](#code-journey-logging)
- [Code Review Guidelines](#code-review-guidelines)

## Introduction

This guide establishes coding standards and best practices for our development team. Following these guidelines ensures code consistency, maintainability, and collaboration efficiency across all projects.

### Why Code Quality Matters

- **Maintainability**: Clean code is easier to understand and modify
- **Collaboration**: Consistent standards help team members work together effectively
- **Debugging**: Well-structured code makes identifying and fixing issues faster
- **Performance**: Quality code often performs better and uses resources efficiently

## Tech Stack

Our development team uses the following technologies and frameworks. Understanding our tech stack helps ensure consistent implementation and best practices across all projects.

### Frontend Frameworks

- **React**: Component-based UI library for building user interfaces
- **Next.js**: Full-stack React framework with server-side rendering and routing
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### Backend Frameworks

- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Minimalist web framework for Node.js applications
- **FastAPI**: Modern Python web framework for building APIs

### AI and Audio Services

- **OpenAI SDK**: Integration with OpenAI's AI models and services
- **OpenRouter SDK**: Multi-provider AI model routing and access
- **Whisper**: Speech-to-text transcription service
- **ElevenLabs**: Text-to-speech synthesis and voice generation

### Development Guidelines

- Follow framework-specific best practices and conventions
- Use TypeScript with React and Next.js projects for better type safety
- Implement proper error handling for AI service integrations
- Use environment variables for API keys and sensitive configuration
- Follow responsive design principles with Tailwind CSS

## Planning/Outlining

Before diving into code implementation, it's crucial to plan and outline your project architecture and workflow. Using visual diagrams helps clarify the system design and ensures all team members understand the project structure.

### Mermaid Diagrams for System Design

We recommend using **Mermaid** diagrams to visualize system flows, user interactions, and technical architecture. Mermaid is a markdown-based diagramming tool that allows you to create flowcharts, sequence diagrams, and more using simple text syntax.

#### Benefits of Visual Planning

- **Clarity**: Visual representations make complex systems easier to understand
- **Communication**: Diagrams facilitate better discussions with team members and stakeholders
- **Documentation**: Serves as living documentation that can be updated as the system evolves
- **Problem Identification**: Helps identify potential issues before implementation begins

#### Example Diagrams

Here are two examples of mermaid diagrams that demonstrate different aspects of system planning:

##### Session Management Flow

This diagram illustrates a typical session management and authentication flow, showing decision points and user interactions:

![Session Management Flow Diagram](/diagrams/diagram1.png)

##### Conversational AI System

This diagram shows the architecture of a conversational AI system with context management and user interaction loops:

![Conversational AI System Diagram](/diagrams/diagram2.png)

#### Creating Mermaid Diagrams

To create your own mermaid diagrams:

1.  Use the [Mermaid Live Editor](https://mermaid.live) for real-time editing and preview
2.  Include mermaid diagrams in your project documentation (README files, wikis)
3.  Consider using tools like VS Code with Mermaid extensions for local development
4.  Export diagrams as images for presentations and documentation

#### Planning Best Practices

- Start with high-level system architecture before diving into details
- Include all major components, data flows, and decision points
- Review diagrams with the team before beginning implementation
- Update diagrams as the system evolves during development
- Use consistent naming conventions and symbols across all diagrams

## Code Style and Formatting

### General Principles

- Use consistent indentation (2 or 4 spaces, never tabs)
- Keep lines under 80-100 characters
- Use meaningful whitespace to separate logical blocks
- Follow language-specific style guides

### JavaScript/TypeScript Example


```javascript
// ✅ Good
function calculateUserAge(birthDate, currentDate = new Date()) {
  const ageInMilliseconds = currentDate.getTime() - birthDate.getTime();
  const ageInYears = Math.floor(ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000));
  
  return ageInYears;
}

// ❌ Bad
function calculateUserAge(birthDate,currentDate=new Date())
```


### Python Example


```python
# ✅ Good
def process_user_data(users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process a list of user data dictionaries."""
    processed_users = []
    
    for user in users:
        if user.get('active', False):
            processed_user = {
                'id': user['id'],
                'name': user['name'].strip().title(),
                'email': user['email'].lower(),
            }
            processed_users.append(processed_user)
    
    return processed_users

# ❌ Bad
def process_user_data(users):
    processed_users=[]
    for user in users:
        if user.get('active',False):
            processed_user={'id':user['id'],'name':user['name'].strip().title(),'email':user['email'].lower()}
            processed_users.append(processed_user)
    return processed_users
```


## Naming Conventions

### Variables and Functions

- Use descriptive, pronounceable names
- Prefer full words over abbreviations
- Use camelCase for JavaScript/TypeScript, snake_case for Python


```javascript
// ✅ Good
const userAccountBalance = 1500;
const isUserAuthenticated = true;
const calculateMonthlyInterest = (principal, rate) => principal * rate / 12;

// ❌ Bad
const uab = 1500;
const isUsrAuth = true;
const calcMnthlyInt = (p, r) => p * r / 12;
```


### Constants

- Use UPPER_SNAKE_CASE for constants
- Group related constants in objects or enums


```javascript
// ✅ Good
const HTTP_STATUS_CODES = {
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// ❌ Bad
const ok = 200;
const notFound = 404;
const maxRetries = 3;
```


## Error Handling

### Use Proper Error Handling Patterns

- Always handle errors appropriately
- Provide meaningful error messages
- Use try-catch blocks judiciously


```javascript
// ✅ Good
async function fetchUserData(userId) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    logger.error('Failed to fetch user data:', error);
    throw new Error('Unable to retrieve user information');
  }
}

// ❌ Bad
async function fetchUserData(userId) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}
```


## Code Duplication

### Extract Repeated Logic


```javascript
// ✅ Good
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function displayOrderSummary(order) {
  return {
    subtotal: formatCurrency(order.subtotal),
    tax: formatCurrency(order.tax),
    shipping: formatCurrency(order.shipping),
    total: formatCurrency(order.total)
  };
}

// ❌ Bad
function displayOrderSummary(order) {
  return {
    subtotal: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.subtotal),
    tax: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.tax),
    shipping: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.shipping),
    total: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.total)
  };
}
```


### Avoid Repeated Nested Object Access


```javascript
// ✅ Good
function displayUserInfo(chat) {
  const firstName = chat.session.user.firstname;
  const lastName = chat.session.user.lastname;
  const email = chat.session.user.email;
  
  return `Welcome ${firstName} ${lastName}! Your email is ${email}`;
}

// ✅ Even better - destructuring
function displayUserInfo(chat) {
  const { firstname, lastname, email } = chat.session.user;
  
  return `Welcome ${firstname} ${lastname}! Your email is ${email}`;
}

// ❌ Bad - repeated nested access
function displayUserInfo(chat) {
  return `Welcome ${chat.session.user.firstname} ${chat.session.user.lastname}! Your email is ${chat.session.user.email}`;
}
```


## Constants and Configuration

### Use Constants Instead of Hardcoded Values

- Define constants for magic numbers and strings
- Use configuration files for environment-specific values
- Make code more maintainable and less error-prone


```javascript
// ✅ Good
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5
};

const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

const API_ENDPOINTS = {
  USERS: '/api/v1/users',
  ORDERS: '/api/v1/orders',
  PRODUCTS: '/api/v1/products'
};
function getUsersPaginated(page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE) {
  if (pageSize > PAGINATION.MAX_PAGE_SIZE) {
    pageSize = PAGINATION.MAX_PAGE_SIZE;
  }
  
  return fetch(`${API_ENDPOINTS.USERS}?page=${page}&limit=${pageSize}`);
}

// ❌ Bad
function getUsersPaginated(page = 1, pageSize = 20) {
  if (pageSize > 100) {  // Magic number
    pageSize = 100;      // Magic number
  }
  
  return fetch(`/api/v1/users?page=${page}&limit=${pageSize}`);  // Hardcoded URL
}
```


### Environment Configuration


```javascript
// ✅ Good
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
};

// ❌ Bad
function uploadFile(file) {
  if (file.size > 5242880) {  // What is this number?
    throw new Error('File too large');
  }
  
  return fetch('http://localhost:3000/upload', {  // Hardcoded URL
    method: 'POST',
    body: file
  });
}
```


## Documentation

### Code Comments

- Write comments that explain "why", not "what"
- Keep comments up-to-date with code changes
- Use docstrings for function documentation


```javascript
// ✅ Good
/**
 * Calculates the compound interest for an investment.
 * Uses the formula: A = P(1 + r/n)^(nt)
 * 
 * @param {number} principal - Initial investment amount
 * @param {number} rate - Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param {number} compoundingFrequency - Number of times interest is compounded per year
 * @param {number} years - Investment period in years
 * @returns {number} Final amount after compound interest
 */
function calculateCompoundInterest(principal, rate, compoundingFrequency, years) {
  // Using Math.pow for clarity over ** operator for better browser support
  return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years);
}

// ❌ Bad
// This function calculates compound interest
function calculateCompoundInterest(principal, rate, compoundingFrequency, years) {
  // Multiply principal by rate calculation
  return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years);
}
```


### README Files

- Include clear setup instructions
- Document API endpoints and usage
- Provide examples and common use cases

## Security Best Practices

### Secret Management

- Never commit secrets to version control
- Use environment variables for configuration
- Implement proper key rotation


```javascript
// ✅ Good
const config = {
  apiKey: process.env.API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET
};

if (!config.apiKey) {
  throw new Error('API_KEY environment variable is required');
}

// ❌ Bad
const config = {
  apiKey: 'sk-1234567890abcdef', // Never hardcode secrets
  databaseUrl: 'postgres://user:password@localhost/db'
};
```


## Performance Considerations

### Optimize for Readability First

- Write clear code first, optimize later
- Profile before optimizing
- Use appropriate data structures


```javascript
// ✅ Good - Clear and efficient
function findUserById(users, targetId) {
  // Create a Map for O(1) lookup if called frequently
  const userMap = new Map(users.map(user => [user.id, user]));
  return userMap.get(targetId);
}

// ✅ Good - Simple for small datasets
function findUserById(users, targetId) {
  return users.find(user => user.id === targetId);
}

// ❌ Bad - Inefficient for large datasets
function findUserById(users, targetId) {
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) { // Unnecessary nested loop
      if (users[i].id === targetId) {
        return users[i];
      }
    }
  }
}
```


## Branches and Pull Requests

### Branch Naming Conventions

Use descriptive branch names that indicate the type of work:


```bash
# ✅ Good branch names
feature/user-authentication
bugfix/payment-calculation-error
hotfix/security-vulnerability-fix
chore/update-dependencies
docs/api-documentation-update

# ❌ Bad branch names
my-branch
fix
update
temp
branch1
```


### Branch Types

- **feature/**: New features or enhancements
- **bugfix/**: Bug fixes for existing functionality
- **hotfix/**: Critical fixes that need immediate attention
- **chore/**: Maintenance tasks, dependency updates
- **docs/**: Documentation updates
- **refactor/**: Code refactoring without functional changes

### Pull Request Best Practices

#### PR Title and Description


```markdown
# ✅ Good PR Title
Add user role-based access control to admin dashboard

# ✅ Good PR Description
## What
Implements role-based access control for the admin dashboard to restrict access based on user permissions.

## Why
Users currently have unrestricted access to all admin features, which poses security risks.

## How
- Added UserRole enum with ADMIN, MODERATOR, USER levels
- Implemented permission checking middleware
- Updated dashboard components to show/hide features based on roles
- Added unit tests for permission logic

## Testing
- [ ] Manual testing with different user roles
- [ ] All existing tests pass
- [ ] New tests added for permission logic

## Screenshots
[Include relevant screenshots if UI changes]
```


#### PR Size and Scope

- Keep PRs small and focused (< 400 lines of code when possible)
- One feature or fix per PR
- Split large changes into multiple smaller PRs

#### Before Creating a PR

- Code follows style guidelines

- All tests pass

- Documentation updated if needed

- No debugging code left behind

- Self-review completed

## Code Journey Logging

### Document Important Decisions and Changes

Use comments and commit messages to create a trail of why changes were made.

#### Commit Message Best Practices


```bash
# ✅ Good commit messages
feat: add email notification system for order updates

fix: resolve race condition in payment processing
- Added mutex lock to prevent concurrent payment attempts
- Updated error handling for transaction conflicts

refactor: extract user validation logic into separate service
- Improves testability and reusability
- Reduces code duplication across controllers

# ❌ Bad commit messages
fix bug
update code
changes
wip
```


#### Code Journey Comments

Document complex decisions and their reasoning:


```javascript
// ✅ Good journey logging
/**
 * 2025-06-03: Switched from REST to GraphQL for user queries
 * Reason: Frontend team needed flexible data fetching to reduce over-fetching
 * Previous implementation caused performance issues with mobile clients
 * See: TICKET-1234 for performance analysis
 */
function fetchUserData(query) {
  return graphqlClient.query(query);
}

/**
 * 2025-05-15: Added retry logic with exponential backoff
 * Reason: Third-party payment API was experiencing intermittent failures
 * This reduces payment failures from 3% to 0.1%
 * TODO: Remove if API stability improves (review in Q3 2025)
 */
async function processPayment(paymentData) {
  return retryWithBackoff(() => paymentApi.charge(paymentData), MAX_RETRIES);
}
```


#### Change Log Documentation

Maintain a CHANGELOG.md for significant updates:


```markdown
# Changelog

## [2.1.0] - 2025-06-03

### Added
- User role-based access control
- Email notification system
- GraphQL API for flexible data queries

### Changed
- Improved payment processing with retry logic
- Updated authentication flow for better security

### Fixed
- Race condition in concurrent payment processing
- Memory leak in file upload handling

### Removed
- Deprecated REST endpoints (v1 API)
```


## Code Review Guidelines

### What to Look For

1.  **Functionality**: Does the code work as intended?
2.  **Style**: Does it follow our coding standards?
3.  **Performance**: Are there any obvious performance issues?
4.  **Security**: Are there any security vulnerabilities?
5.  **Maintainability**: Is the code easy to understand and modify?

### Review Checklist

- Code follows naming conventions

- No hardcoded values (uses constants instead)

- Error handling is appropriate

- Security best practices are followed

- No code duplication

- Documentation is updated

- No debugging code or console.logs left in

- Performance implications considered

## Conclusion

Following these code quality guidelines will help our team:

- Produce more maintainable code
- Reduce bugs and technical debt
- Improve collaboration and code reviews
- Deliver better products faster

Remember: These are guidelines, not rigid rules. Use your judgment and discuss with the team when you need to deviate from these standards.

------------------------------------------------------------------------

**Questions or Suggestions?** If you have questions about these guidelines or suggestions for improvements, please reach out to us.

*Last updated: June 3, 2025*
