export function sendResponse(res, { data, message, statusCode = 200 }) {
  const response = { success: true };
  if (message) response.message;
  if (data) response.data;
  return res.status(statusCode).json(response);
}

export function sendPaginatedResponce(res, data, { total, page, limit }) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}
