/**
 * Today's date in the resort's own timezone (Asia/Manila), as YYYY-MM-DD.
 *
 * Without this, the model has no way to resolve relative dates ("today",
 * "tomorrow", "this weekend") into the absolute YYYY-MM-DD the checkAvailability
 * tool requires — it would either skip calling the tool for follow-up questions
 * phrased relatively, or guess a date, both of which can report false
 * availability. Computed fresh per call (not cached) so it's always correct
 * across day boundaries; the server's own timezone is irrelevant since this
 * always asks for Asia/Manila explicitly.
 */
export function getResortTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

/**
 * Adds `days` calendar days to a YYYY-MM-DD date string, returning the result
 * in the same format. Used for the STRAIGHT_PM stay type, which spans into
 * the next calendar date (7pm(D)–5pm(D+1)) — this is pure calendar-date
 * arithmetic done in code rather than left to the model, the same fix
 * applied to "today"/"tomorrow" resolution. Parses/formats in UTC so the
 * server's local timezone and DST transitions can never shift the result by
 * a day.
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
