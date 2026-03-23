export function sendResponse(res, { data, message, statusCode = 200 }) {
  const response = { success: true };
  if (message !== undefined) response.message = message;
  if (data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
}

export function sendPaginatedResponce(res, data, pagination) {
  return res.status(200).json({ success: true, data, pagination });
}
