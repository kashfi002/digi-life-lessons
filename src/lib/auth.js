import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("digital-life-lessons");

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
      // FIX: needs `type` or better-auth won't register the field at
      // all — that's why it was missing from every user document.
      // FIX: `defaultValue`, not `default` — wrong key name.
      // FIX: default changed "viewer" → "user" to match every role
      // check elsewhere in the app (session.user.role === "admin").
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
});