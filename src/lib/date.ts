const INDIA_TIME_ZONE = "Asia/Kolkata";

function getDatePart(
  part: Intl.DateTimeFormatPartTypes,
  date: Date,
  timeZone: string
) {
  const value = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .find((entry) => entry.type === part)?.value;

  if (!value) {
    throw new Error(`Unable to derive "${part}" for timezone ${timeZone}.`);
  }

  return value;
}

export function getIsoDateForTimezone(
  date = new Date(),
  timeZone = INDIA_TIME_ZONE
) {
  const year = getDatePart("year", date, timeZone);
  const month = getDatePart("month", date, timeZone);
  const day = getDatePart("day", date, timeZone);

  return `${year}-${month}-${day}`;
}

export function getIndianTodayIsoDate(date = new Date()) {
  return getIsoDateForTimezone(date, INDIA_TIME_ZONE);
}

export function getIndianCurrentYear(date = new Date()) {
  return Number(getDatePart("year", date, INDIA_TIME_ZONE));
}

export function isIsoDateOnOrBefore(date: string, otherDate: string) {
  return date.localeCompare(otherDate) <= 0;
}

export function isIsoDateOnOrAfter(date: string, otherDate: string) {
  return date.localeCompare(otherDate) >= 0;
}
