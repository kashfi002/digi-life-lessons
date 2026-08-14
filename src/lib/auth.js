import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("digital-life-lessons");

// The one hardcoded admin account for this project. Only THIS exact
// email+password pair gets promoted to role: "admin" at signup;
// everyone else — including someone who signs up with this email but
// a different password — keeps the normal "user" default.
const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "Admin12345";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  database: mongodbAdapter(db, {
    client,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // client can never set this on signup/update
      },
      isPremium: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Fires once, at signup. ctx.body has the raw request body —
        // email + plaintext password — before it's hashed away.
        before: async (user, ctx) => {
          const passwordMatches = ctx?.body?.password === ADMIN_PASSWORD;
          if (user.email === ADMIN_EMAIL && passwordMatches) {
            return { data: { ...user, role: "admin" } };
          }
        },
      },
    },
    session: {
      create: {
        // Fires on every login. By this point the password has
        // already been verified by better-auth itself — that's what
        // "session created" means — so an email check here is enough:
        // self-heals accounts created before this hook existed.
        before: async (session) => {
          const users = db.collection("user");
          const user = await users.findOne({ id: session.userId });
          if (user?.email === ADMIN_EMAIL && user.role !== "admin") {
            await users.updateOne(
              { id: session.userId },
              { $set: { role: "admin" } }
            );
          }
        },
      },
    },
  },
});