<template>
  <header class="text-center mb-8 font-['Courier_New']">
    <!-- Retro welcome banner -->
    <div class="mb-4 bg-black p-2 text-white text-center">
      WELCOME TO BOSLEY'S HOMEPAGE
    </div>
    
    
    <!-- Retro text styles with marquee effect -->
    <div class="overflow-hidden whitespace-nowrap">
      <div class="">
        <h1 class="text-4xl font-bold text-white my-2">*** BOSLEY.DOG ***</h1>
      </div>
    </div>
    
    
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const pet = ref(null);
const profileImage = ref(null);
const loading = ref(true);

// Fetch pet data from the API
onMounted(async () => {
  try {
    const response = await fetch('/api/tractive');
    const data = await response.json();
    pet.value = data.pet;
    loading.value = false;
  } catch (error) {
    console.error('Error fetching pet data:', error);
    loading.value = false;
  }
});

// Handle profile image loading error
function handleImageError() {
  console.log('Profile image failed to load, trying cover picture');
  if (pet.value && pet.value.coverPictureUrl && profileImage.value) {
    profileImage.value.src = pet.value.coverPictureUrl;
  }
}

// Handle fallback image loading error
function handleFallbackError() {
  console.log('Cover picture also failed to load, using emoji fallback');
  // Will automatically show the emoji fallback div
}
</script>

<style scoped>
.animate-marquee {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 10s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>