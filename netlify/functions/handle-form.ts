import type { Handler } from '@netlify/functions'
import { connectToDatabase } from '../../server/utils/mongodb'
import { GuestbookEntry } from '../../server/models/GuestbookEntry'
import { BosleyInteraction } from '../../server/models/BosleyInteraction'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const formData = event.body ? JSON.parse(event.body) : {}
    
    // Connect to database
    await connectToDatabase()
    
    // Create new guestbook entry
    const entry = new GuestbookEntry({
      name: formData.name,
      message: formData.message,
      photoUrl: formData.photo, // Netlify will store the file and provide a URL
      interaction: formData.interaction || 'none'
    })

    await entry.save()
    
    // Update interaction counts if an interaction was selected
    if (formData.interaction && formData.interaction !== 'none') {
      try {
        // Find or create the interaction document
        let interactionDoc = await BosleyInteraction.findOne({ name: 'bosley-interactions' })
        
        if (!interactionDoc) {
          interactionDoc = new BosleyInteraction({
            name: 'bosley-interactions',
            treats: 0,
            tummyRubs: 0,
            chinScritches: 0
          })
        }
        
        // Update the appropriate counter
        if (formData.interaction === 'treat') {
          interactionDoc.treats += 1
        } else if (formData.interaction === 'tummyRub') {
          interactionDoc.tummyRubs += 1
        } else if (formData.interaction === 'chinScritch') {
          interactionDoc.chinScritches += 1
        }
        
        interactionDoc.lastUpdated = new Date()
        await interactionDoc.save()
      } catch (error) {
        console.error('Error updating interaction counts:', error)
        // We'll still return success for the guestbook entry
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, entry })
    }
  } catch (error) {
    console.error('Error processing form submission:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process form submission' })
    }
  }
} 