import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuickLinks } from './quick-links';

describe('QuickLinks', () => {
	it('opens off-site links in a new tab, and same-site links in place', () => {
		render(
			<QuickLinks
				links={[
					{
						id: 1,
						title: 'Track Wrestling',
						url: 'https://trackwrestling.com',
					},
					{ id: 2, title: 'Roster', url: '/teams/varsity' },
				]}
			/>,
		);

		const external = screen.getByRole('link', { name: /Track Wrestling/ });
		expect(external.getAttribute('target')).toBe('_blank');
		expect(external.getAttribute('rel')).toBe('noopener noreferrer');

		const internal = screen.getByRole('link', { name: 'Roster' });
		expect(internal.getAttribute('target')).toBeNull();
	});

	it('renders nothing when nothing is published', () => {
		const { container } = render(<QuickLinks links={[]} />);
		expect(container.firstChild).toBeNull();
	});
});
