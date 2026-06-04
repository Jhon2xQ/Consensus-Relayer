export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

export function ok<T>(message: string, data: T): ApiResponse<T> {
  return { success: true, message, data, timestamp: Date.now() };
}

export function fail(message: string, data: unknown = null, _code?: number): ApiResponse<null> {
  return { success: false, message, data, timestamp: Date.now() };
}

export function notFound(message: string = "Not Found"): ApiResponse<null> {
  return fail(message);
}
