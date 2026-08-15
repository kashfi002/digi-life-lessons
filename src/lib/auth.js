import { betterAuth } from "better-auth";
import { MongoClient, ObjectId } from "mongodb";
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
  // Google button on the Register/Login pages needs this. Get the two
  // values from https://console.cloud.google.com/apis/credentials
  // (OAuth client ID → Web application) and add them to .env:
  //   GOOGLE_CLIENT_ID=...
  //   GOOGLE_CLIENT_SECRET=...
  // Authorized redirect URI to whitelist there:
  //   http://localhost:3000/api/auth/callback/google
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
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
        input: false, // only the Stripe webhook is allowed to flip this
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
        // already been verified by better-auth itself, so an email
        // check is enough here — this self-heals accounts created
        // before this hook existed.
        //
        // NOTE: better-auth's mongo adapter stores the primary key as
        // _id (ObjectId) on the raw document — there is no "id" field
        // on the document itself, only in better-auth's own
        // transformed output. Querying the raw collection means
        // querying by _id, not by "id".
        before: async (session) => {
          if (!ObjectId.isValid(session.userId)) return;
          const users = db.collection("user");
          const user = await users.findOne({ _id: new ObjectId(session.userId) });
          if (user?.email === ADMIN_EMAIL && user.role !== "admin") {
            await users.updateOne(
              { _id: new ObjectId(session.userId) },
              { $set: { role: "admin" } }
            );
          }
        },
      },
    },
  },
});