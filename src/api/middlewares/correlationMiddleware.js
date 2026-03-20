import { v7 as uuid } from "uuid";

export const addCorrelationId = (req, res, next) => {
  const incomingId = req.headers["x-correlation-id"];

  const correlationId =
    typeof incomingId === "string" && incomingId.trim() !== ""
      ? incomingId
      : uuid();

  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
};
