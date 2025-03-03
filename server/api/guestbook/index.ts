import { connectToDatabase } from '~/server/utils/mongodb';
import { GuestbookEntry } from '~/server/models/GuestbookEntry';

export default defineEventHandler(async (event) => {
  await connectToDatabase();
  const entries = await GuestbookEntry.find().sort({ createdAt: -1 }).limit(20);
  return entries;
});