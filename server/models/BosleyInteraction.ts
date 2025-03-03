import mongoose from 'mongoose';

// This is a singleton model to store aggregated interaction counts
const BosleyInteractionSchema = new mongoose.Schema({
  // Using 'name' as the identifier field
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'bosley-interactions'
  },
  treats: {
    type: Number,
    default: 0
  },
  tummyRubs: {
    type: Number,
    default: 0
  },
  chinScritches: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Check if model already exists before creating
export const BosleyInteraction = mongoose.models.BosleyInteraction ||
  mongoose.model('BosleyInteraction', BosleyInteractionSchema); 