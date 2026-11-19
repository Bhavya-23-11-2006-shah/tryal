export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    hint?: string;
  };
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public hint?: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', hint?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.hint = hint;
  }

  toJSON(): ApiErrorPayload {
    return {
      error: {
        code: this.code,
        message: this.message,
        hint: this.hint
      }
    };
  }
}
