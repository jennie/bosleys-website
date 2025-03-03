import { connectToDatabase } from '~/server/utils/mongodb';
import { BosleyInteraction } from '~/server/models/BosleyInteraction';

export default defineEventHandler(async (event) => {
  try {
    await connectToDatabase();
    
    // Get or create the interaction record
    let interactions = await BosleyInteraction.findOne({ name: 'bosley-interactions' });
    
    if (!interactions) {
      // Create default interaction record if it doesn't exist
      interactions = await BosleyInteraction.create({
        name: 'bosley-interactions',
        treats: 0,
        tummyRubs: 0,
        chinScritches: 0
      });
    }
    
    return {
      success: true,
      interactions: {
        treats: interactions.treats || 0,
        tummyRubs: interactions.tummyRubs || 0,
        chinScritches: interactions.chinScritches || 0
      }
    };
  } catch (error) {
    console.error('Error fetching interaction stats:', error);
    return {
      success: false,
      error: 'Failed to fetch interaction stats'
    };
  }
}); 