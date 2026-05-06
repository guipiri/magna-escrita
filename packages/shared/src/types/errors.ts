export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  requestId?: string;
  errors?: Array<{ field: string; messages: string[] }>;
}
