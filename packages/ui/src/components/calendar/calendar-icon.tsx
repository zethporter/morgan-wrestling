import { cva, type VariantProps } from "class-variance-authority";
import { Calendar } from "lucide-react";
import { cn } from "@morgan-wrestling/ui/lib/utils";

const calendarIconVariants = cva('', {
	variants: {
		color: {
			red: 'text-calendar-red',
			orange: 'text-calendar-orange',
			amber: 'text-calendar-amber',
			yellow: 'text-calendar-yellow',
			lime: 'text-calendar-lime',
			green: 'text-calendar-green',
			emerald: 'text-calendar-emerald',
			teal: 'text-calendar-teal',
			cyan: 'text-calendar-cyan',
			sky: 'text-calendar-sky',
			blue: 'text-calendar-blue',
			indigo: 'text-calendar-indigo',
			violet: 'text-calendar-violet',
			purple: 'text-calendar-purple',
			fuchsia: 'text-calendar-fuchsia',
			pink: 'text-calendar-pink',
			rose: 'text-calendar-rose',
			slate: 'text-calendar-slate',
			mauve: 'text-calendar-mauve',
			mist: 'text-calendar-mist',
			olive: 'text-calendar-olive',
		}
	},
	defaultVariants: {
		color: 'slate'
	}
});

export type CalendarIconProps = VariantProps<typeof calendarIconVariants>;

export function CalendarIcon({ color = 'slate', className }: CalendarIconProps & { className?: string}) {
	return <Calendar className={cn(calendarIconVariants({ color }), className)} />;
}
