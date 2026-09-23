export const SiteFooter = () => {
	return (
		<footer className='border-border border-t'>
			<div className='mx-auto w-full max-w-4xl px-4 py-6 text-muted-foreground text-sm'>
				&copy; {new Date().getFullYear()} Morgan Wrestling
			</div>
		</footer>
	);
};
