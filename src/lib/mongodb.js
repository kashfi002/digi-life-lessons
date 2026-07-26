import { MongoClient } from "mongodb";

/**
 * Shared Mongo client for app data (lessons, favorites, etc.) — separate
 * from the client instantiated inside auth.js, which better-auth owns
 * for its own collections. Cached on `global` so hot-reload in dev
 * doesn't open a new connection on every request.
 */

let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(process.env.MONGODB_URI);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("digital-life-lessons");
}