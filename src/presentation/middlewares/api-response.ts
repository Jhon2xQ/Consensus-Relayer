export class ApiResponse {
  static success<T>(message: string, data: T) {
    return { success: true, message, data, timestamp: Date.now() };
  }

  static error(message: string, data: unknown = null) {
    return { success: false, message, data, timestamp: Date.now() };
  }
}
