import { formOptions } from '@tanstack/react-form-start';
// import { teamInsertSchema } from '#/db';

/***
 * Example for when we actually need to fetch real data.
 */
// export const newTeamFormOpts = (defaultValues?: { name: string; homeContent: string; homeContentMetadata: string; }) => formOptions({
//   defaultValues: defaultValues ?? {
//     name: '',
//     homeContent: '',
//     homeContentMetadata: '',
//   },
//   // validators: {
//   //   onSubmit: teamInsertSchema.omit({ id: true, normalizedName: true, defaultCalendarId: true })
//   // }
// })

export const newTeamFormOps = formOptions({
  defaultValues: {
    name: '',
    homeContent: '',
    homeContentMetadata: '',
  }
})
