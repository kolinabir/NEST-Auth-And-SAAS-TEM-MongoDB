import { SubscriptionTier } from '../users/schemas/user.schema';

export const SubscriptionFeatures = {
  [SubscriptionTier.FREE]: {
    projects: 1,
    storage: 100, // MB
    apiCalls: 100, // per day
    teamMembers: 0,
    support: 'community',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: ['Basic features', 'Community support', 'Single project'],
  },
  [SubscriptionTier.STARTER]: {
    projects: 3,
    storage: 1000, // MB
    apiCalls: 1000, // per day
    teamMembers: 2,
    support: 'email',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    features: [
      'All FREE features',
      'Email support',
      'Up to 3 projects',
      '2 team members',
      '1GB storage',
    ],
  },
  [SubscriptionTier.PROFESSIONAL]: {
    projects: 10,
    storage: 10000, // MB
    apiCalls: 10000, // per day
    teamMembers: 5,
    support: 'priority',
    price: {
      monthly: 29.99,
      yearly: 299.99,
    },
    features: [
      'All STARTER features',
      'Priority support',
      'Up to 10 projects',
      '5 team members',
      '10GB storage',
      'Advanced analytics',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    projects: 'unlimited',
    storage: 100000, // MB
    apiCalls: 'unlimited', // per day
    teamMembers: 'unlimited',
    support: 'dedicated',
    price: {
      monthly: 99.99,
      yearly: 999.99,
    },
    features: [
      'All PROFESSIONAL features',
      'Dedicated support',
      'Unlimited projects',
      'Unlimited team members',
      '100GB storage',
      'Custom integrations',
      'SLA guarantees',
    ],
  },
};
