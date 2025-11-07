import { ApiResponse } from '@interfaces/index';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@utils/constants';

/**
 * Response Helper Functions
 * Standardize API response formatting
 */

/**
 * Create a success response
 */
export const createSuccessResponse = <
  T = Record<string, string | number | boolean> | string | number,
>(
  message: string = RESPONSE_MESSAGES.SUCCESS,
  data?: T
): ApiResponse => ({
  success: true,
  message,
  ...(data !== undefined && { data }),
});

/**
 * Create an error response
 */
export const createErrorResponse = (
  message: string = RESPONSE_MESSAGES.SERVER_ERROR,
  error?: string,
  statusCode?: number
): ApiResponse => ({
  success: false,
  message,
  ...(error && { error }),
});

/**
 * Create a validation error response
 */
export const createValidationErrorResponse = (errors: string[]): ApiResponse => ({
  success: false,
  message: RESPONSE_MESSAGES.VALIDATION_ERROR,
  errors,
});

/**
 * Create a paginated response
 */
export const createPaginatedResponse = <T = Record<string, string | number | boolean>>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully'
): ApiResponse => ({
  success: true,
  message,
  data: {
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  },
});

/**
 * Create an authentication error response
 */
export const createAuthErrorResponse = (
  message: string = RESPONSE_MESSAGES.ACCESS_DENIED
): ApiResponse => ({
  success: false,
  message,
  error: 'Authentication required',
});
