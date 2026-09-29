export const SiteFooter = () => {
	return (
		<footer className='border-border border-t'>
			{/* Matches the header's `max-w-6xl` — see the note there. */}
			<div className='mx-auto w-full max-w-6xl px-4 py-6 text-muted-foreground text-sm sm:px-6 lg:px-8'>
				&copy; {new Date().getFullYear()} Morgan Wrestling
			</div>
		</footer>
	);
};
