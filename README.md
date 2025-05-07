# SaaS Template with Authentication and MongoDB

A comprehensive starter template for building SaaS applications with NestJS, MongoDB, and Stripe integration.

## Features

- 🔐 **Authentication System**

  - Email/Password authentication
  - JWT-based sessions with refresh tokens
  - OAuth integration (Google, GitHub, Facebook)
  - Role-based access control

- 💰 **Subscription Management**

  - Tiered subscription model
  - Usage limitations based on subscription
  - Stripe payment integration
  - Webhook handling

- 👤 **User Management**

  - Complete user profile system
  - Email verification
  - Password reset functionality
  - Admin user management

- 🛠️ **Admin Dashboard**

  - User administration
  - Subscription management
  - Analytics and reporting
  - System configuration

- 📊 **API & Documentation**
  - Comprehensive API with Swagger documentation
  - Rate limiting
  - Request validation
  - Error handling

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB
- pnpm (recommended) or npm
- Stripe account for payment processing

### Installation

1. Clone the repository

```bash
git clone https://github.com/kolinabir/NEST-Auth-And-SAAS-TEM-MongoDB.git
cd NEST-Auth-And-SAAS-TEM-MongoDB
```

2. Install dependencies

```bash
pnpm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration details.

4. Start the development server

```bash
pnpm start:dev
```

5. Access the Swagger documentation at http://localhost:4000/api/docs

## Environment Variables

| Variable                       | Description                          | Example                                            |
| ------------------------------ | ------------------------------------ | -------------------------------------------------- |
| `NODE_ENV`                     | Environment (development/production) | `development`                                      |
| `PORT`                         | Port to run the server on            | `4000`                                             |
| `MONGODB_URI`                  | MongoDB connection string            | `mongodb://localhost:27017/saas-template`          |
| `JWT_ACCESS_SECRET`            | Secret for JWT access tokens         | `your_access_token_secret`                         |
| `JWT_ACCESS_EXPIRATION`        | Expiration time for access tokens    | `15m`                                              |
| `JWT_REFRESH_SECRET`           | Secret for JWT refresh tokens        | `your_refresh_token_secret`                        |
| `JWT_REFRESH_EXPIRATION`       | Expiration time for refresh tokens   | `7d`                                               |
| `FRONTEND_URL`                 | URL of the frontend application      | `http://localhost:3000`                            |
| `OAUTH_GOOGLE_ENABLED`         | Enable Google OAuth                  | `true`                                             |
| `OAUTH_GOOGLE_CLIENT_ID`       | Google OAuth client ID               | `your-google-client-id.apps.googleusercontent.com` |
| `OAUTH_GOOGLE_CLIENT_SECRET`   | Google OAuth client secret           | `your-google-client-secret`                        |
| `OAUTH_GOOGLE_CALLBACK_URL`    | Google OAuth callback URL            | `http://localhost:4000/auth/google/callback`       |
| `OAUTH_FACEBOOK_ENABLED`       | Enable Facebook OAuth                | `false`                                            |
| `OAUTH_FACEBOOK_CLIENT_ID`     | Facebook OAuth client ID             | `your_facebook_client_id`                          |
| `OAUTH_FACEBOOK_CLIENT_SECRET` | Facebook OAuth client secret         | `your_facebook_client_secret`                      |
| `OAUTH_FACEBOOK_CALLBACK_URL`  | Facebook OAuth callback URL          | `http://localhost:4000/auth/facebook/callback`     |
| `OAUTH_GITHUB_ENABLED`         | Enable GitHub OAuth                  | `false`                                            |
| `OAUTH_GITHUB_CLIENT_ID`       | GitHub OAuth client ID               | `your_github_client_id`                            |
| `OAUTH_GITHUB_CLIENT_SECRET`   | GitHub OAuth client secret           | `your_github_client_secret`                        |
| `OAUTH_GITHUB_CALLBACK_URL`    | GitHub OAuth callback URL            | `http://localhost:4000/auth/github/callback`       |
| `STRIPE_SECRET_KEY`            | Stripe API secret key                | `sk_test_...`                                      |
| `STRIPE_WEBHOOK_SECRET`        | Stripe webhook signing secret        | `whsec_...`                                        |
| `STRIPE_CURRENCY`              | Default currency for payments        | `usd`                                              |
| `STRIPE_PUBLISHABLE_KEY`       | Stripe publishable key for frontend  | `pk_test_...`                                      |
| `STRIPE_PAYMENT_SUCCESS_URL`   | URL to redirect after payment        | `http://localhost:3000/subscription/success`       |
| `STRIPE_PAYMENT_CANCEL_URL`    | URL to redirect if payment canceled  | `http://localhost:3000/subscription/cancel`        |

## Project Structure

```
src/
├── admin/            # Admin module for user and subscription management
├── auth/             # Authentication with local and OAuth strategies
│   ├── decorators/   # Custom decorators (Public, Roles)
│   ├── dto/          # Data transfer objects for auth operations
│   ├── guards/       # JWT, role-based guards
│   └── strategies/   # Passport strategies (local, JWT, OAuth)
├── common/           # Shared interfaces, utilities and config
├── config/           # Configuration files (app, database, stripe)
├── payments/         # Stripe payment integration
│   ├── dto/          # Payment-related DTOs
│   └── interfaces/   # Stripe webhook event interfaces
├── subscriptions/    # Subscription management
│   ├── dto/          # Subscription DTOs
│   └── schemas/      # Subscription MongoDB schema
├── users/            # User management
│   ├── dto/          # User-related DTOs
│   └── schemas/      # User MongoDB schema
├── app.module.ts     # Main application module
└── main.ts           # Application entry point
```

## API Documentation

The API documentation is available through Swagger at `/api/docs` when the server is running.

Key endpoints include:

- **Authentication**:

  - `POST /auth/register` - Register a new user
  - `POST /auth/login` - Login with email and password
  - `POST /auth/refresh` - Refresh access token
  - `GET /auth/google` - Google OAuth login
  - `GET /auth/facebook` - Facebook OAuth login
  - `GET /auth/github` - GitHub OAuth login

- **Users**:

  - `GET /users` - List users
  - `GET /users/:id` - Get user profile
  - `PATCH /users/:id` - Update user
  - `DELETE /users/:id` - Delete user

- **Subscriptions**:

  - `GET /subscriptions/tiers` - Get available subscription tiers
  - `GET /subscriptions/user/:userId` - Get user subscriptions
  - `POST /subscriptions/:id/cancel` - Cancel subscription

- **Payments**:

  - `POST /payments/checkout` - Create payment checkout session
  - `POST /payments/webhook` - Handle Stripe webhooks
  - `POST /payments/portal` - Create customer portal session

- **Admin**:
  - `GET /admin/users` - List all users (admin only)
  - `PATCH /admin/users/:id` - Update any user (admin only)
  - `GET /admin/analytics/users` - Get user analytics
  - `GET /admin/analytics/revenue` - Get revenue analytics

## Subscription Tiers

The system includes the following subscription tiers:

- **FREE**: Basic features with limited usage

  - 1 project
  - 100MB storage
  - 100 API calls per day
  - Community support

- **STARTER**: Enhanced features for individuals

  - 3 projects
  - 1GB storage
  - 1,000 API calls per day
  - Email support
  - $9.99/month or $99.99/year

- **PROFESSIONAL**: Full features for professionals

  - 10 projects
  - 10GB storage
  - 10,000 API calls per day
  - Priority support
  - Advanced analytics
  - $29.99/month or $299.99/year

- **ENTERPRISE**: Unlimited features for teams
  - Unlimited projects
  - 100GB storage
  - Unlimited API calls
  - Dedicated support
  - Custom integrations
  - SLA guarantees
  - $99.99/month or $999.99/year

## Development

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Building for Production

```bash
pnpm build
```

## Deployment

For production deployment:

1. Build the application

```bash
pnpm build
```

2. Set environment variables for production

3. Start the application

```bash
pnpm start:prod
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are short-lived and require refresh
- Stripe webhooks verify signatures
- OAuth implementations follow security best practices
- Role-based access control for sensitive operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/kolinabir/NEST-Auth-And-SAAS-TEM-MongoDB).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
