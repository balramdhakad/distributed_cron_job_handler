import { CronExpressionParser } from "cron-parser";

export function getNextRunAt(cronExpression, timezone = 'UTC', from = new Date()) {
  const interval = CronExpressionParser.parse(cronExpression, {
    currentDate: from,
    tz: timezone,
  });

  return interval.next().toDate();
}


export function isValidCron(cronExpression) {
  try {
    CronExpressionParser.parse(cronExpression);
    return true;
  } catch {
    return false;
  }
}
