/**
 * The rule the admin app uses to write `teams.normalized_name`
 * (`apps/admin/src/lib/team-fns.ts`), and therefore the rule this site has to
 * agree with.
 *
 * Team slugs come out of that column, so they never pass through here. Page
 * slugs do: `team_pages` has no slug column, so `/teams/$teamSlug/$pageSlug`
 * derives one from the title at read time — option B in §6 of the README. It
 * lives in its own module because both the nav that emits those links and the
 * server function that resolves them have to derive them identically; a URL
 * this function did not produce is a 404, not a near miss.
 *
 * It trims, which the admin's rule does not. That only affects derived page
 * slugs — a title stored as `' Schedule '` should be `/schedule`, not
 * `/-schedule-` — and never team slugs, which are read back verbatim.
 *
 * A title that is nothing but whitespace slugs to `''`, which cannot be a path
 * segment; callers drop those rather than emit an unreachable link.
 */
export const toSlug = (value: string): string =>
	value.trim().toLowerCase().replace(/\s+/g, '-');
