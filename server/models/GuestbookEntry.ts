import mongoose from 'mongoose';

const GuestbookEntrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  photoUrl: {
    type: String,
    required: false
  },
  interaction: {
    type: String,
    enum: ['treat', 'tummyRub', 'chinScritch', 'none'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check if model already exists before creating
export const GuestbookEntry = mongoose.models.GuestbookEntry ||
  mongoose.model('GuestbookEntry', GuestbookEntrySchema);