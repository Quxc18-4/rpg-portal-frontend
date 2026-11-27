export class ApiClientError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message || 'UNKNOWN_API_ERROR');
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

export function normalizeApiError(error) {
  if (error?.response) {
    const { status, data } = error.response;
    const message = data?.message || `HTTP_${status}`;
    return new ApiClientError(message, status, data);
  }
  if (error?.request) {
    return new ApiClientError('NETWORK_UNREACHABLE', 0, null);
  }
  return new ApiClientError(error?.message || 'REQUEST_SETUP_ERROR', 0, null);
}