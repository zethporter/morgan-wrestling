import Tiptap from '@morgan-wrestling/ui/components/text-editor';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
} from '@morgan-wrestling/ui/components/ui/card';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	mergeForm,
	useForm,
	useSelector,
	useTransform,
} from '@tanstack/react-form-start';
import { createFileRoute } from '@tanstack/react-router';
import { SquareKanbanIcon } from 'lucide-react';

export const Route = createFileRoute('/_protected/_layout/')({
	component: Home,
});

function Home() {
	return (
		<div className='p-4 overflow-auto'>
			<h1 className='text-2xl font-bold flex flex-row justify-start gap-2 items-center'>
				<SquareKanbanIcon /> Dashboard
			</h1>
			<p>Coming soon...</p>
		</div>
	);
}
