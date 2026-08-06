import { createServerFn } from "@tanstack/react-start";
import { nanoid } from 'nanoid';
import { db, teamInsertSchema, teams } from "#/db";

// import { ensureSession } from "./auth-fns";


// export const createPost = createServerFn({ method: "POST" })
//   .inputValidator((data: { title: string }) => data)
//   .handler(async ({ data }) => {
//     const session = await ensureSession();
//     const post = await db.posts.create({
//       title: data.title,
//       authorId: session.user.id,
//     });

//     return post;
//   });

const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');


export const createTeam = createServerFn({ method: 'POST' })
  .inputValidator(teamInsertSchema.omit({ normalizedName: true, id: true }))
  .handler(async ({ data }) => {
    // const session
    const team = await db.insert(teams).values({ ...data, id: nanoid(), normalizedName: normalizeName(data.name) })
    return team;
  });

// need better error handling?? should probably add some created info and stuff on teams?
