import Tiptap from "@morgan-wrestling/ui/components/text-editor";
import { Button } from "@morgan-wrestling/ui/components/ui/button";
import { Card, CardAction, CardContent } from "@morgan-wrestling/ui/components/ui/card";
import { mergeForm, useForm, useSelector, useTransform } from "@tanstack/react-form-start";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { newTeamFormOpts } from "#/form-options/teams";
import { getFormDataFromServer } from "#/lib/team-fns";


export const Route = createFileRoute("/_protected/")({
  loader: async () => ({
    state: await getFormDataFromServer()
  }),
  component: Home
});

function Home() {
  const { state } = Route.useLoaderData();
  const form = useForm({
    ...newTeamFormOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state), [state])
  })

  const formErrors = useSelector(form.store, (formState) => formState.errors)

  return (
    <form action={handleForm.url} method='post' encType={'multipart/form-data'}>

    </form>
  )

  // return (
  //   <div className="p-8">
  //     <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
  //     {/*<Tiptap />*/}
  //   </div>
  // );
}
