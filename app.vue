<template>
  <div>
    <NuxtPage />
    <div class="bosley-sticky-bottom-center">
      <img src="/images/bosley-smile-2.png" alt="Bosley Smile 2" />
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
.bosley-sticky {
  position: fixed;
  bottom: 0px;
  left: 0px;
  z-index: 10;
}

.bosley-sticky img {
  width: auto;
  height: auto;
}

.bosley-sticky-right {
  position: fixed;
  bottom: -120px;
  right: -120px;
  z-index: 10;
}

.bosley-sticky-right img {
  width: auto;
  height: auto;
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
}
</style>
