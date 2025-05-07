import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from '../../common/interfaces/base.interface';

@Schema({ timestamps: true })
export class AdminActivity {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  adminId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Number })
  responseTime: number;

  createdAt: Date;
  updatedAt: Date;
}

export type AdminActivityDocument = AdminActivity & Document & BaseDocument;
export const AdminActivitySchema = SchemaFactory.createForClass(AdminActivity);
