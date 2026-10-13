import type { ErrorCode, ProblemDetails } from "@/shared/types/api";

/** Codes the client adds for failures that never reached the API. */
export type ClientErrorCode = "NETWORK_ERROR" | "UNKNOWN_ERROR";

/**
 * The only error type pages need to handle. Wraps the API's ProblemDetails,
 * or describes a network failure (status 0).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | ClientErrorCode;
  /** Field errors from a 400 VALIDATION_ERROR response. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    code: ErrorCode | ClientErrorCode,
    message: string,
    fieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static fromProblem(problem: ProblemDetails): ApiError {
    return new ApiError(
      problem.status,
      problem.code,
      problem.detail ?? problem.title,
      problem.errors ?? {},
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
