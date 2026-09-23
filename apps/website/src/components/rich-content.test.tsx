import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichContent } from './rich-content';

describe('RichContent', () => {
	it('renders authored html inside a prose container', () => {
		const { container } = render(
			<RichContent html='<h2 class="text-3xl">Schedule</h2><p>Daily.</p>' />,
		);

		expect(screen.getByRole('heading', { name: 'Schedule' })).toBeDefined();
		expect(container.querySelector('article')?.className).toContain('prose');
	});

	it('renders nothing when there is no content', () => {
		const { container } = render(<RichContent html='   ' />);
		expect(container.firstChild).toBeNull();
	});
});
