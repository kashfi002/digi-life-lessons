import { betterAuth } from "better-auth";
import { MongoClient, ObjectId } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("digital-life-lessons");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
        input: false, // only the Stripe webhook is allowed to flip this
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
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
  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: user.role,
        }),
      },
    }),
  ],
});