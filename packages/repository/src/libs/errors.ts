export class WriteConflictError extends Error {
  constructor(message: string) {
    super(`write conflict, retry operation: error=\`${message}\``);
  }
}

export class DuplicateKeyError extends Error {
  constructor(value: Record<string, unknown>) {
    super(`duplicate key error: ${JSON.stringify(value)}`);
  }
}
