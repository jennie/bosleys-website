<template>
  <div class="mb-6 p-3 border-2 border-white bg-[#292524]">
    <h3 class="text-lg font-bold mb-2 text-center text-white">
      *** BOSLEY'S PAWPULARITY ***
    </h3>

    <!-- Retro divider -->
    <div class="text-center text-white text-xs mb-3">
      ~~~~~~~~~~~~~~~~~~~~~~~~
    </div>

    <div class="grid grid-cols-3 gap-2">
      <!-- Treats -->
      <div class="text-center p-2 border border-white">
        <div class="text-xl font-bold text-white">{{ stats.treats }}</div>
        <div class="text-2xl">🦴</div>
        <div class="text-xs mt-1 text-white">TREATS</div>
      </div>

      <!-- Tummy Rubs -->
      <div class="text-center p-2 border border-white">
        <div class="text-xl font-bold text-white">{{ stats.tummyRubs }}</div>
        <div class="text-2xl">✋</div>
        <div class="text-xs mt-1 text-white">RUBS</div>
      </div>

      <!-- Chin Scritches -->
      <div class="text-center p-2 border border-white">
        <div class="text-xl font-bold text-white">
          {{ stats.chinScritches }}
        </div>
        <div class="text-2xl">👆</div>
        <div class="text-xs mt-1 text-white">SCRITCHES</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

// Stats will track interaction counts
const stats = ref({
  treats: 0,
  tummyRubs: 0,
  chinScritches: 0,
});

// Fetch interaction stats
const fetchStats = async () => {
  try {
    const response = await $fetch("/api/interactions");
    if (response.success) {
      stats.value = response.interactions;
    } else {
      console.error("Failed to fetch interaction stats:", response.error);
    }
  } catch (error) {
    console.error("Error fetching interaction stats:", error);
  }
};

// Fetch stats when component is mounted
onMounted(() => {
  fetchStats();
});

// Expose method to refresh stats
defineExpose({
  refresh: fetchStats,
});
</script>

<style scoped>
/* Removed blinking animation */
</style>
