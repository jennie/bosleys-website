<template>
  <div v-if="isLoading" class="ascii-loading text-center my-4">
    <div class="text-lg font-mono">{{ frames[currentFrame] }}</div>
    <div class="text-sm mt-2">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'Fetching Bosley data...'
  }
});

// ASCII animation frames
const frames = [
  '⠋  ⠋',
  '⠙  ⠙',
  '⠹  ⠹',
  '⠸  ⠸',
  '⠼  ⠼',
  '⠴  ⠴',
  '⠦  ⠦',
  '⠧  ⠧',
  '⠇  ⠇',
  '⠏  ⠏'
];

const currentFrame = ref(0);
let animationInterval = null;

onMounted(() => {
  if (props.isLoading) {
    startAnimation();
  }
});

onUnmounted(() => {
  stopAnimation();
});

function startAnimation() {
  animationInterval = setInterval(() => {
    currentFrame.value = (currentFrame.value + 1) % frames.length;
  }, 100);
}

function stopAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
}

// Watch for isLoading changes
watch(() => props.isLoading, (newValue) => {
  if (newValue) {
    startAnimation();
  } else {
    stopAnimation();
  }
});
</script>

<style scoped>
.ascii-loading {
  font-family: monospace;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 1rem;
  border: 1px solid white;
}
</style> 