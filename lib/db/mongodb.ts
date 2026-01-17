import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI || ""
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

export default clientPromise

export async function getDatabase(): Promise<Db | null> {
  if (!clientPromise) {
    return null
  }
  const client = await clientPromise
  return client.db("bug-tracker")
}

export function isMongoDBAvailable(): boolean {
  return !!uri && !!clientPromise
}
