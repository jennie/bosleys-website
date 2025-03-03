import { connectToDatabase } from '~/server/utils/mongodb';
import { GuestbookEntry } from '~/server/models/GuestbookEntry';
import { BosleyInteraction } from '~/server/models/BosleyInteraction';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  await connectToDatabase();
  
  // Create new guestbook entry
  const entry = new GuestbookEntry({
    name: body.name,
    message: body.message,
    photoUrl: body.photoUrl,
    interaction: body.interaction || 'none'
  });

  await entry.save();
  
  // Update interaction counts if an interaction was selected
  if (body.interaction && body.interaction !== 'none') {
    try {
      // Find or create the interaction document
      let interactionDoc = await BosleyInteraction.findOne({ name: 'bosley-interactions' });
      
      if (!interactionDoc) {
        interactionDoc = new BosleyInteraction({
          name: 'bosley-interactions',
          treats: 0,
          tummyRubs: 0,
          chinScritches: 0
        });
      }
      
      // Update the appropriate counter
      if (body.interaction === 'treat') {
        interactionDoc.treats += 1;
      } else if (body.interaction === 'tummyRub') {
        interactionDoc.tummyRubs += 1;
      } else if (body.interaction === 'chinScritch') {
        interactionDoc.chinScritches += 1;
      }
      
      interactionDoc.lastUpdated = new Date();
      await interactionDoc.save();
    } catch (error) {
      console.error('Error updating interaction counts:', error);
      // We'll still return success for the guestbook entry
    }
  }
  
  return { success: true, entry };
});