<template>
  <section class="z-20 font-['Courier_New']">
    <h2 class="text-2xl font-bold mb-4 text-white text-center">
      == PAWBOOK ==
    </h2>
    <div class="text-center text-white mb-4">===========================</div>

    <!-- Interaction Stats - Show the tallies -->
    <InteractionStats ref="interactionStats" />

    <!-- Guestbook entries -->
    <div class="mb-6 pr-1">
      <div v-for="entry in entries" :key="entry._id" class="mb-4">
        <!-- Revised entry design with comment on left, image as square on right -->
        <div
          class="relative border-2 border-white bg-[#292524] overflow-hidden flex">
          <!-- Comment section (always on left, full width without photo, partial with photo) -->
          <div class="p-3 text-white relative z-10 flex-1">
            <!-- Header with name and date -->
            <div class="flex justify-between items-center mb-2">
              <div class="font-bold">{{ entry.name }}</div>
              <div
                class="text-xs text-white min-w-[170px] text-right bg-[#292524] px-2 py-1">
                {{
                  new Date(entry.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                }}
              </div>
            </div>

            <!-- Message content -->
            <p class="text-sm text-white">{{ entry.message }}</p>

            <!-- Show interaction if any -->
            <div
              v-if="entry.interaction && entry.interaction !== 'none'"
              class="mt-1 text-xs italic text-white">
              <span v-if="entry.interaction === 'treat'"
                >🦴 Gave Bosley a treat</span
              >
              <span v-if="entry.interaction === 'tummyRub'"
                >✋ Gave Bosley a tummy rub</span
              >
              <span v-if="entry.interaction === 'chinScritch'"
                >👆 Gave Bosley a chin scritch</span
              >
            </div>
          </div>

          <!-- Image container (only if photo exists) -->
          <div
            v-if="entry.photoUrl"
            class="absolute right-0 top-0 bottom-0 w-[40%] bg-[#292524]">
            <!-- Replace background-image with NuxtImg -->
            <NuxtImg
              :src="entry.photoUrl"
              preset="guestbook"
              loading="lazy"
              class="h-full w-full object-cover"
              alt="Guestbook photo" />
          </div>
        </div>
      </div>
      <p v-if="entries.length === 0" class="text-center text-white py-4">
        &gt;&gt; NO ENTRIES YET &lt;&lt; BE THE FIRST TO SIGN!
      </p>
    </div>

    <div class="text-center text-white mb-4">===========================</div>

    <!-- Guestbook form -->
    <form
      @submit.prevent="submitEntry"
      class="space-y-3"
      data-netlify="true"
      enctype="multipart/form-data"
      name="guestbook">
      <input type="hidden" name="form-name" value="guestbook" />
      <div>
        <label
          for="name"
          class="block font-bold mb-1 text-white text-sm uppercase"
          >YOUR NAME:</label
        >
        <input
          id="name"
          v-model="form.name"
          name="name"
          required
          class="w-full p-2 border-2 border-white bg-[#292524] text-white text-sm" />
      </div>

      <div>
        <label
          for="message"
          class="block font-bold mb-1 text-white text-sm uppercase"
          >MESSAGE FOR BOSLEY:</label
        >
        <textarea
          id="message"
          v-model="form.message"
          name="message"
          required
          class="w-full p-2 border-2 border-white bg-[#292524] text-white text-sm"
          rows="3"></textarea>
      </div>

      <!-- Interaction options - more compact layout -->
      <div>
        <label class="block font-bold mb-1 text-white text-sm uppercase"
          >GIVE BOSLEY:</label
        >
        <div class="grid grid-cols-2 gap-2 text-sm">
          <label
            class="flex items-center p-1 border-2 border-white bg-[#292524] text-white cursor-pointer"
            :class="{
              'bg-[#f5f5f4] !text-black': form.interaction === 'treat',
            }">
            <input
              type="radio"
              v-model="form.interaction"
              name="interaction"
              value="treat"
              class="mr-1" />
            <span>🦴 A Treat</span>
          </label>
          <label
            class="flex items-center p-1 border-2 border-white bg-[#292524] text-white cursor-pointer"
            :class="{
              'bg-[#f5f5f4] !text-black': form.interaction === 'tummyRub',
            }">
            <input
              type="radio"
              v-model="form.interaction"
              name="interaction"
              value="tummyRub"
              class="mr-1" />
            <span>✋ Tummy Rub</span>
          </label>
          <label
            class="flex items-center p-1 border-2 border-white bg-[#292524] text-white cursor-pointer"
            :class="{
              'bg-[#f5f5f4] !text-black': form.interaction === 'chinScritch',
            }">
            <input
              type="radio"
              v-model="form.interaction"
              name="interaction"
              value="chinScritch"
              class="mr-1" />
            <span>👆 Chin Scritch</span>
          </label>
          <label
            class="flex items-center p-1 border-2 border-white bg-[#292524] text-white cursor-pointer"
            :class="{
              'bg-[#f5f5f4] !text-black': form.interaction === 'none',
            }">
            <input
              type="radio"
              v-model="form.interaction"
              name="interaction"
              value="none"
              class="mr-1" />
            <span>Nothing</span>
          </label>
        </div>
      </div>

      <div>
        <label
          for="photo"
          class="block font-bold mb-1 text-white text-sm uppercase"
          >UPLOAD PICTURE:</label
        >
        <input
          id="photo"
          type="file"
          name="photo"
          accept="image/*"
          @change="handleFileChange"
          class="w-full p-1 border-2 border-white bg-[#292524] text-white text-xs" />

        <!-- Preview with new design -->
        <div
          v-if="photoPreview"
          class="mt-2 border-2 border-white bg-[#292524] overflow-hidden relative flex">
          <!-- Comment preview section -->
          <div class="p-3 text-white relative z-10 flex-1">
            <div class="flex justify-between items-center mb-2">
              <div class="font-bold">{{ form.name || "Your Name" }}</div>
              <div
                class="text-xs text-white min-w-[170px] text-right bg-[#292524] px-2 py-1">
                {{
                  new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                    timeZone: "UTC",
                  })
                }}
              </div>
            </div>
            <p class="text-sm text-white">
              {{ form.message || "Your message will appear like this" }}
            </p>
            <div
              v-if="form.interaction && form.interaction !== 'none'"
              class="mt-1 text-xs italic text-white">
              <span v-if="form.interaction === 'treat'"
                >🦴 Gave Bosley a treat</span
              >
              <span v-if="form.interaction === 'tummyRub'"
                >✋ Gave Bosley a tummy rub</span
              >
              <span v-if="form.interaction === 'chinScritch'"
                >👆 Gave Bosley a chin scritch</span
              >
            </div>
          </div>

          <!-- Image preview -->
          <div class="absolute right-0 top-0 bottom-0 w-[40%] bg-[#292524]">
            <div
              class="absolute top-0 right-0 bg-[#292524] border-l-2 border-b-2 border-white p-1 z-20">
              <div class="text-xs text-white">PREVIEW</div>
            </div>
            <!-- Replace background-image with NuxtImg for preview -->
            <NuxtImg
              v-if="photoPreview"
              :src="photoPreview"
              preset="guestbook"
              class="h-full w-full object-cover"
              alt="Preview photo" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full bg-[#f5f5f4] text-black py-2 px-4 border-2 border-white hover:bg-transparent hover:text-white text-sm">
        {{ isSubmitting ? "SUBMITTING..." : "SIGN THE GUESTBOOK" }}
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
import { ref } from "vue";
import InteractionStats from "~/components/InteractionStats.vue";

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["add-entry"]);
const interactionStats = ref(null);

const form = ref({
  name: "",
  message: "",
  photoUrl: "",
  interaction: "none",
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
    // Create FormData for Netlify
    const formData = new FormData();
    formData.append("form-name", "guestbook");
    formData.append("name", form.value.name);
    formData.append("message", form.value.message);
    formData.append("interaction", form.value.interaction);

    if (photoFile.value) {
      formData.append("photo", photoFile.value);
    }

    // Submit to Netlify
    const response = await fetch("/api/guestbook", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to submit form");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to submit form");
    }

    // Submit entry to our API
    await emit("add-entry", {
      ...form.value,
      photoUrl: result.entry.photoUrl, // Use the URL from the server response
    });

    // Refresh interaction stats
    if (interactionStats.value) {
      interactionStats.value.refresh();
    }

    // Reset form
    form.value = { name: "", message: "", photoUrl: "", interaction: "none" };
    photoFile.value = null;
    photoPreview.value = null;
  } catch (error) {
    console.error("Error submitting entry:", error);
    alert(error.message || "Failed to submit your entry. Please try again.");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
