import { z } from 'zod/v4';
import { NonRetryableError } from '../../utils/errors.js';

export const type = 'log';

export const schema = z.object({
  message: z.string().min(1, 'message must be a non-empty string'),
});

const logHandler = async (config) => {
  if (!config?.message) {
    throw new NonRetryableError('log handler requires config.message');
  }
  return { logged: config.message, at: new Date() };
};

export default logHandler;
