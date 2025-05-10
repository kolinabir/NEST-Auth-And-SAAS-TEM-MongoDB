import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminActivity, AdminActivityDocument } from '../entities/admin-activity.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminActivityService {
  private readonly logToConsole: boolean;

  constructor(
    @InjectModel(AdminActivity.name)
    private readonly adminActivityModel: Model<AdminActivityDocument>,
    private readonly configService: ConfigService,
  ) {
    // Get configuration for console logging (default to false)
    this.logToConsole = this.configService.get<boolean>('admin.logActivityToConsole', false);
  }

  async logActivity(activityData: {
    adminId: string;
    action: string;
    details?: Record<string, any>;
    ip?: string;
    userAgent?: string;
    responseTime?: number;
  }): Promise<AdminActivityDocument> {
    // Optionally log to console based on configuration
    if (this.logToConsole) {
      console.log('[Admin Activity]', activityData);
    }

    // Create and save the activity log to the database
    const activity = new this.adminActivityModel(activityData);
    return activity.save();
  }

  async getActivityLogs(page = 1, limit = 20): Promise<{
    data: AdminActivityDocument[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.adminActivityModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'email firstName lastName')
        .exec(),
      this.adminActivityModel.countDocuments(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
