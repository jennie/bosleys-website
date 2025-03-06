<template>
  <div class="min-h-screen bg-black text-white font-['Courier_New']">
    <!-- Make the container narrower with max-width -->
    <div class="container mx-auto px-4 py-8 text-white max-w-2xl">
      <BosleyHeader />
      
      <!-- Main content area with single-column layout -->
      <div class="flex flex-col gap-8">
        <!-- Daily stats -->
        <DailyStats :stats="tractiveStats" />
        
        <!-- Guestbook (now below Daily Stats) -->
        <div class="guestbook-container">
          <Guestbook :entries="guestbookEntries" @add-entry="addGuestbookEntry" />
        </div>
        
        <!-- Visit counter - retro web element -->
        <div class="text-center">
          <div class="text-white inline-block border border-white px-4 py-2">
            YOU ARE VISITOR #{{ Math.floor(Math.random() * 10000) + 1 }}
          </div>
        </div>
      </div>
      
      <!-- Footer with retro web elements -->
      <div class="text-center mt-8">
        <div class="text-white">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
        
      </div>
    </div>
  </div>
</template>


<script setup>
const tractiveStats = ref({ 
  dailyStats: { sleepHours: 0 },
  sleepHours: 0, 
});
const guestbookEntries = ref([]);
const apiError = ref('');

// Fetch Tractive stats
const fetchTractiveStats = async () => {
  try {
    const data = await $fetch('/api/tractive');
    
    // Log the full response for debugging
    console.log('Tractive API response:', data);
    
    if (data.error) {
      // If there's an error message, show it
      apiError.value = `Tractive API Error: ${data.error}`;
      
      // Still use the fallback data that came with the error
      tractiveStats.value = data;
    } else {
      // Clear any previous error
      apiError.value = '';
      
      // Store the full data structure
      tractiveStats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch Tractive stats:', error);
    apiError.value = `Failed to load Tractive data: ${error.message}`;
    
    // Set fallback data
    tractiveStats.value = {
      pet: {
        name: 'Bosley',
        breed: 'Unknown Breed'
      },
      dailyStats: {
        sleepHours: 12,
        walkingDistance: 2.5
      },
      tracker: {
        batteryLevel: 85,
        lastUpdate: new Date().toISOString()
      }
    };
  }
};

// Fetch guestbook entries
const fetchGuestbookEntries = async () => {
  try {
    guestbookEntries.value = await $fetch('/api/guestbook');
  } catch (error) {
    console.error('Failed to fetch guestbook entries:', error);
  }
};

// Add new guestbook entry
const addGuestbookEntry = async (entry) => {
  try {
    await $fetch('/api/guestbook/post', {
      method: 'POST',
      body: entry
    });
    await fetchGuestbookEntries();
  } catch (error) {
    console.error('Failed to add guestbook entry:', error);
  }
};

// Fetch data on page load
onMounted(() => {
  fetchTractiveStats();
  fetchGuestbookEntries();
});
</script>