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

export const Route = createFileRoute('/_protected/_layout/')({
	component: Home,
});

function Home() {
	return <div className='p-4 overflow-auto'>Dashboard</div>;
}
