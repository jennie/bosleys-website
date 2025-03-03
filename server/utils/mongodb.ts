import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const config = useRuntimeConfig();
  const connection = await mongoose.connect(config.mongodbUri);

  cachedConnection = connection;
  return connection;
}