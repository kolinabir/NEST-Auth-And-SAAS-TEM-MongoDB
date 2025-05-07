import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('SaaS Template API')
    .setDescription('The API documentation for SaaS Template with Authentication and Subscription Management')
    .setVersion('1.0')
    .addTag('users', 'User management operations')
    .addTag('auth', 'Authentication operations')
    .addTag('subscriptions', 'Subscription management')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
    })
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Add custom examples and improve schema
  document.components.schemas = {
    ...document.components.schemas,
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
        subscriptionTier: { 
          type: 'string', 
          enum: ['free', 'starter', 'professional', 'enterprise'], 
          example: 'starter' 
        },
        emailVerified: { type: 'boolean', example: true },
        lastLogin: { type: 'string', format: 'date-time', example: '2023-05-07T12:00:00Z' },
        profile: {
          type: 'object',
          properties: {
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            bio: { type: 'string', example: 'Software Engineer with 5+ years experience' },
            company: { type: 'string', example: 'Tech Solutions Inc.' },
          }
        },
      }
    },
    AuthResponse: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/User' },
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      }
    }
  };
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SaaS API Documentation',
  });
}
