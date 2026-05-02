-- Convert transactions.date from DATE to TIMESTAMP(3) so transactions can
-- carry a time-of-day. Existing rows default to noon (12:00) because most
-- bank-receipt scans don't carry an exact time and the user explicitly
-- chose noon as the friendly fallback.
ALTER TABLE "transactions"
  ALTER COLUMN "date" TYPE TIMESTAMP(3)
  USING ("date"::timestamp + INTERVAL '12 hours');
