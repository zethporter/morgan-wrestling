import { type CivilMonth, isCivilMonth } from './calendar-month';

/**
 * `month` is optional in the *type* so that a `Link to='/calendar'` does not
 * have to pass one, but always present in the *value* — see below.
 */
export type MonthSearch = {
	month?: CivilMonth;
};

/**
 * The `?month=YYYY-MM` search param the calendar routes navigate by.
 *
 * Anything unparseable is dropped rather than rejected: a hand-edited or
 * truncated URL should show the current month, not an error page. Dropping it
 * (instead of substituting today's month) also keeps one canonical URL for
 * "now" — an absent param — so the edge is not asked to cache the same page
 * twice.
 *
 * **`month` comes back explicitly `undefined`, never omitted.** A route's
 * search is merged over its parents', and `_layout` has no validator of its
 * own, so the raw `?month=bogus` is already in the object this result merges
 * into — returning `{}` leaves the bad value in place and it reaches the
 * loader. That is not theoretical: `/calendar?month=bogus` used to 500 out of
 * the server function's own validator, which is the layer that caught it.
 *
 * Written by hand rather than with a zod adapter because this is the whole
 * requirement, and `validateSearch` wants the parsed object back, not a schema.
 */
export const monthSearchSchema = (
	search: Record<string, unknown>,
): MonthSearch => ({
	month: isCivilMonth(search.month) ? search.month : undefined,
});
