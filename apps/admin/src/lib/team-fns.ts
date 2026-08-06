import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db";
import { ensureSession } from "./auth-fns";


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
