import { safeUrl } from './sanitize-html';

export type QuickLink = {
	id: number;
	title: string;
	url: string;
};

/**
 * Turns a stored quick-link URL into an href, or `null` if it cannot safely
 * be one.
 *
 * The admin's quick-link form takes a free-text URL and does not require a
 * scheme, and editors type bare hostnames — `trackwrestling.com` is in the
 * database today. A browser reads that as a *relative* path, so rendering it
 * as-is sends visitors to `morganwrestling.org/trackwrestling.com`. Quick
 * links are links off the site, so a scheme-less value whose first segment
 * looks like a hostname gets `https://`.
 *
 * The heuristic is a dot in the first segment, which is what an address bar
 * does. It would misread a relative `about.html`, but quick links are always
 * external destinations, and guessing wrong there is no worse than the 404
 * the unprefixed value already produces.
 */
export const toQuickLinkHref = (stored: string): string | null => {
	const url = safeUrl(stored.trim());
	if (!url) return null;

	const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url);
	const isRooted = /^[/#?]/.test(url);
	if (isAbsolute || isRooted) return url;

	const [host] = url.split(/[/?#]/, 1);
	return host?.includes('.') ? `https://${url}` : url;
};
