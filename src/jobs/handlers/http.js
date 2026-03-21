import { z } from 'zod/v4';
import axios from 'axios';
import { RetryableError, NonRetryableError } from '../../utils/errors.js';

export const type = 'http';

export const schema = z.object({
  url: z.string().url('url must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.int().positive('timeout must be a positive integer ms').default(30_000),
  body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
});

const httpHandler = async (config) => {
  if (!config?.url) {
    throw new NonRetryableError('http handler requires config.url');
  }

  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = config;

  try {
    const response = await axios({
      url,
      method: method.toUpperCase(),
      headers,
      data: body,
      timeout,
    });

    return { status: response.status, data: response.data };

  } catch (err) {
    if (!err.response) {
      throw new RetryableError(`Network error calling ${url}: ${err.message}`);
    }

    const { status } = err.response;

    if (status === 429) throw new RetryableError(`Rate limited by ${url} (429)`);
    if (status >= 500) throw new RetryableError(`Server error from ${url}: ${status}`);
    if (status >= 400) throw new NonRetryableError(`Client error from ${url}: ${status} — ${JSON.stringify(err.response.data)}`);

    throw new RetryableError(`Unexpected error from ${url}: ${err.message}`);
  }
};

export default httpHandler;
