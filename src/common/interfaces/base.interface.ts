import { Document, Types } from 'mongoose';

// Base interface for all MongoDB documents
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Base response interface for API responses
export interface BaseResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
  timestamp: Date;
}

// Base pagination interface for paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Base repository interface
export interface BaseRepository<T extends BaseDocument> {
  findAll(filter?: any): Promise<T[]>;
  findById(id: string): Promise<T>;
  findOne(filter: any): Promise<T>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<boolean>;
  paginate(page: number, limit: number, filter?: any): Promise<PaginatedResponse<T>>;
}
