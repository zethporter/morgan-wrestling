import Tiptap from '@morgan-wrestling/ui/components/text-editor';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
} from '@morgan-wrestling/ui/components/ui/card';
import {
	mergeForm,
	useForm,
	useSelector,
	useTransform,
} from '@tanstack/react-form-start';
import { createFileRoute } from '@tanstack/react-router';
// import { newTeamFormOps } from "#/form-options/teams";
// import { getFormDataFromServer } from "#/lib/team-fns";

export const Route = createFileRoute('/_protected/_layout/')({
	// loader: async () => ({
	//   state: await getFormDataFromServer()
	// }),
	component: Home,
});

function Home() {
	// const { state } = Route.useLoaderData();
	// const form = useForm({
	//   ...newTeamFormOps,
	//   transform: useTransform((baseForm) => mergeForm(baseForm, state), [state])
	// })

	// const formErrors = useSelector(form.store, (formState) => formState.errors)

	return <div>main stuff</div>;

	// return (
	//   <div className="p-8">
	//     <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
	//     {/*<Tiptap />*/}
	//   </div>
	// );
}
