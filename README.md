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
git clone https://github.com/yourusername/saas-template.git
cd saas-template
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

| Variable                | Description                          | Example                                   |
| ----------------------- | ------------------------------------ | ----------------------------------------- |
| `NODE_ENV`              | Environment (development/production) | `development`                             |
| `PORT`                  | Port to run the server on            | `4000`                                    |
| `MONGODB_URI`           | MongoDB connection string            | `mongodb://localhost:27017/saas-template` |
| `JWT_ACCESS_SECRET`     | Secret for JWT access tokens         | `your_access_token_secret`                |
| `JWT_REFRESH_SECRET`    | Secret for JWT refresh tokens        | `your_refresh_token_secret`               |
| `STRIPE_SECRET_KEY`     | Stripe API secret key                | `sk_test_...`                             |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret        | `whsec_...`                               |

## Project Structure
