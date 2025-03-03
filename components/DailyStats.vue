<template>
  <section class="p-4">
    
    <div class="flex justify-center">
      <!-- Spots Visited Today -->
      <div class="border-2 border-white p-3 text-center bg-black w-full max-w-xs">
        <div class="text-3xl text-white font-bold">{{ stats.dailyStats?.spotsVisitedToday || 0 }}</div>
        <div class="text-xs uppercase text-white mt-1">SPOTS SNIFFED TODAY (so far)</div>
      </div>
    </div>
    
    <div class="mt-4 text-center text-white">
      <div class="inline-block  px-2 py-1">
        <div class="text-xs">LAST UPDATED: {{ formatDate(stats.tracker?.lastUpdate || stats.lastUpdate) }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({ 
      dailyStats: { 
        spotsVisitedToday: 0,
        currentStatus: 'unknown'
      }
    })
  }
});

// Create a reactive reference to props.stats 
const stats = computed(() => props.stats);

// Format date helper function
function formatDate(dateString) {
  if (!dateString) return 'UNKNOWN';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  }).toUpperCase();
}

// Handle image loading errors
function handleImageError(e) {
  console.error('Failed to load profile image:', e.target.src);
  
  // Try to use the cover picture as fallback if available
  if (stats.value.pet?.coverPictureUrl && !e.target.src.includes(stats.value.pet.coverPictureUrl)) {
    console.log('Trying cover picture instead:', stats.value.pet.coverPictureUrl);
    e.target.src = stats.value.pet.coverPictureUrl;
    return;
  }
  
  // If no valid picture, hide the image and show emoji
  e.target.style.display = 'none';
  const parent = e.target.parentNode;
  const fallback = document.createElement('div');
  fallback.className = 'w-24 h-24 bg-black border border-white flex items-center justify-center';
  fallback.innerHTML = '<span class="text-4xl">🐾</span>';
  parent.appendChild(fallback);
}
</script>

