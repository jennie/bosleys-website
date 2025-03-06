<template>
  <div>
    <div class="page-container">
      <NuxtPage />
    </div>
    <div class="bosley-sticky">
      <img src="/images/bosley-smile.png" alt="Bosley Smile" />
    </div>
    <div class="bosley-sticky-right">
      <img src="/images/bosley-snow.png" alt="Bosley Snow" />
    </div>
  </div>
</template>

<style>
.page-container {
  position: relative;
  z-index: 1;
}

.bosley-sticky {
  position: fixed;
  bottom: 0px;
  left: 0px;
  z-index: 10;
}

.bosley-sticky img {
  width: auto;
  height: auto;
  max-width: 300px; /* Increased from 150px to 300px */
}

.bosley-sticky-right {
  position: fixed;
  bottom: -60px; /* Less hidden */
  right: -60px; /* Less hidden */
  z-index: 10;
}

.bosley-sticky-right img {
  width: auto;
  height: auto;
  max-width: 300px; /* Increased from 150px to 300px */
}

.bosley-sticky-bottom-center {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 10;
  transform: translateX(-50%);
}

.bosley-sticky-bottom-center img {
  width: auto;
  height: auto;
  max-width: 300px; /* Increased from 150px to 300px */
}

/* Media query for mobile devices */
@media (max-width: 768px) {
  /* Display the images in their normal flow on mobile */
  .bosley-sticky,
  .bosley-sticky-right {
    position: static; /* No longer fixed */
    display: none; /* Hide by default */
    margin: 0;
    padding: 0;
  }
  
  /* Using JS to properly position the images is more reliable */
  /* We'll add inline styles to the mobile bosley images */
  
  /* The guestbook container should display custom Bosley images for mobile */
  .guestbook-container {
    position: relative;
  }
  
  /* Add mobile Bosley images above the guestbook */
  .guestbook-container:before,
  .guestbook-container:after {
    content: '';
    display: block;
    position: absolute;
    top: -80px; /* Position above the guestbook */
    height: 80px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: bottom;
    z-index: 10;
  }
  
  /* Left Bosley above guestbook */
  .guestbook-container:before {
    left: 0;
    width: 100px;
    background-image: url('/images/bosley-smile.png');
  }
  
  /* Right Bosley above guestbook */
  .guestbook-container:after {
    right: 0;
    width: 100px;
    background-image: url('/images/bosley-snow.png');
    background-position: bottom right;
  }
  
  /* Add some space above the guestbook for the images */
  .guestbook-container {
    margin-top: 80px;
  }
}

/* Media query for very small screens */
@media (max-width: 480px) {
  /* Smaller images for smaller screens */
  .guestbook-container:before,
  .guestbook-container:after {
    top: -60px;
    height: 60px;
    width: 80px;
  }
  
  /* Adjust margin for smaller images */
  .guestbook-container {
    margin-top: 60px;
  }
}
</style>
