import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminActivityService } from '../services/admin-activity.service';

@Injectable()
export class AdminActivityInterceptor implements NestInterceptor {
  constructor(private readonly adminActivityService: AdminActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;

        // Only log if we have a valid admin user
        if (user && user.id) {
          this.adminActivityService.logActivity({
            adminId: user.id,
            action: `${method} ${url}`,
            details: {
              path: url,
              method,
              body: this.sanitizeRequestBody(request.body),
              query: request.query,
            },
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            responseTime,
          });
        }
      }),
    );
  }

  // Helper method to remove sensitive data from request body
  private sanitizeRequestBody(body: any): any {
    if (!body) return {};
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
