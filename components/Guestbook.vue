<template>
  <section class="p-4 border-2 z-20 border-white font-['Courier_New']">
    <h2 class="text-2xl font-bold mb-4 text-white text-center">== PAWBOOK ==</h2>
    <div class="text-center text-white mb-4">===========================</div>
    
    <!-- Interaction Stats - Show the tallies -->
    <InteractionStats ref="interactionStats" />
    
    <!-- Guestbook entries -->
    <div class="mb-6 pr-1">
      <div v-for="entry in entries" :key="entry._id" class="mb-4">
        <!-- Modified entry to be square with consistent aspect ratio -->
        <div 
          class="overflow-hidden relative border-2 border-white"
          :class="entry.photoUrl ? 'min-h-[160px]' : 'bg-transparent'"
          :style="entry.photoUrl ? `background-image: url(${entry.photoUrl}); background-size: cover; background-position: center;` : ''"
        >
          <!-- Visitor indicator for entries with photos - square style -->
          <div v-if="entry.photoUrl" class="absolute top-0 right-0 bg-black border-l-2 border-b-2 border-white p-1">
            <div class="text-xs text-white">VISITOR!</div>
          </div>
          
          <!-- Content overlay with square styling -->
          <div 
            :class="entry.photoUrl ? 'absolute bottom-0 left-0 right-0 bg-white p-3 text-black' : 'text-white p-3'"
          >
            <!-- Header with name and date -->
            <div class="flex justify-between items-center mb-2">
              <div class="font-bold">{{ entry.name }}</div>
              <div :class="entry.photoUrl ? 'text-xs text-black' : 'text-xs text-white'">
                {{ new Date(entry.createdAt).toLocaleDateString() }}
              </div>
            </div>
            
            <!-- Message content -->
            <p :class="entry.photoUrl ? 'text-sm text-black' : 'text-sm text-white'">{{ entry.message }}</p>
            
            <!-- Show interaction if any -->
            <div v-if="entry.interaction && entry.interaction !== 'none'" :class="entry.photoUrl ? 'mt-1 text-xs italic text-black' : 'mt-1 text-xs italic text-white'">
              <span v-if="entry.interaction === 'treat'">🦴 Gave Bosley a treat</span>
              <span v-if="entry.interaction === 'tummyRub'">✋ Gave Bosley a tummy rub</span>
              <span v-if="entry.interaction === 'chinScritch'">👆 Gave Bosley a chin scritch</span>
            </div>
          </div>
        </div>
      </div>
      <p v-if="entries.length === 0" class="text-center text-white py-4">
        &gt;&gt; NO ENTRIES YET &lt;&lt; BE THE FIRST TO SIGN!
      </p>
    </div>
    
    <div class="text-center text-white mb-4">===========================</div>
    
    <!-- Guestbook form -->
    <form @submit.prevent="submitEntry" class="space-y-3">
      <div>
        <label for="name" class="block font-bold mb-1 text-white text-sm uppercase">YOUR NAME:</label>
        <input id="name" v-model="form.name" required
               class="w-full p-2 border-2 border-white bg-transparent text-white text-sm" />
      </div>
      
      <div>
        <label for="message" class="block font-bold mb-1 text-white text-sm uppercase">MESSAGE FOR BOSLEY:</label>
        <textarea id="message" v-model="form.message" required
                  class="w-full p-2 border-2 border-white bg-transparent text-white text-sm" rows="3"></textarea>
      </div>
      
      <!-- Interaction options - more compact layout -->
      <div>
        <label class="block font-bold mb-1 text-white text-sm uppercase">GIVE BOSLEY:</label>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <label class="flex items-center p-1 border-2 border-white cursor-pointer" :class="{ 'bg-white text-black': form.interaction === 'treat' }">
            <input type="radio" v-model="form.interaction" value="treat" class="mr-1" />
            <span>🦴 A Treat</span>
          </label>
          <label class="flex items-center p-1 border-2 border-white cursor-pointer" :class="{ 'bg-white text-black': form.interaction === 'tummyRub' }">
            <input type="radio" v-model="form.interaction" value="tummyRub" class="mr-1" />
            <span>✋ Tummy Rub</span>
          </label>
          <label class="flex items-center p-1 border-2 border-white cursor-pointer" :class="{ 'bg-white text-black': form.interaction === 'chinScritch' }">
            <input type="radio" v-model="form.interaction" value="chinScritch" class="mr-1" />
            <span>👆 Chin Scritch</span>
          </label>
          <label class="flex items-center p-1 border-2 border-white cursor-pointer" :class="{ 'bg-white text-black': form.interaction === 'none' }">
            <input type="radio" v-model="form.interaction" value="none" class="mr-1" />
            <span>Nothing</span>
          </label>
        </div>
      </div>
      
      <div>
        <label for="photo" class="block font-bold mb-1 text-white text-sm uppercase">UPLOAD PICTURE:</label>
        <input id="photo" type="file" accept="image/*" @change="handleFileChange"
               class="w-full p-1 border-2 border-white bg-transparent text-white text-xs" />
        
        <!-- Preview - removed square aspect ratio constraint -->
        <div v-if="photoPreview" class="mt-2 border-2 border-white overflow-hidden relative" style="min-height: 160px;">
          <div class="absolute inset-0" :style="`background-image: url(${photoPreview}); background-size: cover; background-position: center;`"></div>
          <div class="absolute bottom-0 left-0 right-0 bg-white p-2 text-black">
            <div class="text-sm font-bold">Preview: {{ form.name || 'Your Name' }}</div>
            <p class="text-xs">{{ form.message || 'Your message will appear like this' }}</p>
          </div>
        </div>
      </div>
      
      <button type="submit" :disabled="isSubmitting"
              class="w-full bg-white text-black py-2 px-4 border-2 border-white hover:bg-transparent hover:text-white text-sm">
        {{ isSubmitting ? 'SUBMITTING...' : 'SIGN THE GUESTBOOK' }}
      </button>
    </form>
    
    <!-- Under construction element - removed animation -->
    <div class="mt-6 text-center">
      <div class="inline-block border-2 border-white p-2 bg-transparent">
        <div class="text-xs text-white">[UNDER CONSTRUCTION]</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import InteractionStats from '~/components/InteractionStats.vue';

const props = defineProps({
  entries: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['add-entry']);
const interactionStats = ref(null);

const form = ref({
  name: '',
  message: '',
  photoUrl: '',
  interaction: 'none'
});
const photoFile = ref(null);
const photoPreview = ref(null);
const isSubmitting = ref(false);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  photoFile.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const submitEntry = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  
  try {
    // Upload photo if selected
    if (photoFile.value) {
      const formData = new FormData();
      formData.append('photo', photoFile.value);
      
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      form.value.photoUrl = response.url;
    }
    
    // Submit entry
    await emit('add-entry', { ...form.value });
    
    // Refresh interaction stats
    if (interactionStats.value) {
      interactionStats.value.refresh();
    }
    
    // Reset form
    form.value = { name: '', message: '', photoUrl: '', interaction: 'none' };
    photoFile.value = null;
    photoPreview.value = null;
  } catch (error) {
    console.error('Error submitting entry:', error);
    alert('Failed to submit your entry. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>