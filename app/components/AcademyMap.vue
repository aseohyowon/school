<template>
  <div id="map"></div>
</template>

<script setup>
const props = defineProps({
  academies: { type: Array, default: () => [] },
  center: { type: Object, default: null },
})

const config = useRuntimeConfig()
const academyStore = useAcademyStore()
let map = null
let clusterer = null
let pending = false

function getCenterLatLng() {
  if (props.center && props.center.lat && props.center.lng) {
    return new window.kakao.maps.LatLng(props.center.lat, props.center.lng)
  }
  return new window.kakao.maps.LatLng(37.29, 127.01)
}

function initMap() {
  const container = document.getElementById('map')
  if (!container || container.offsetHeight === 0) {
    requestAnimationFrame(() => initMap())
    return
  }
  map = new window.kakao.maps.Map(container, {
    center: getCenterLatLng(),
    level: 7
  })
  createClusterer()
  pending = false
}

function createClusterer() {
  if (!map) {
    pending = true
    return
  }
  if (clusterer) {
    clusterer.clear()
  }

  const markers = props.academies.map((academy) => {
    const position = new window.kakao.maps.LatLng(academy.lat, academy.lng)
    const marker = new window.kakao.maps.Marker({ position })

    window.kakao.maps.event.addListener(marker, 'click', () => {
      academyStore.setSelectedAcademy(academy)
    })

    return marker
  })

  clusterer = new window.kakao.maps.MarkerClusterer({
    map,
    markers,
    gridSize: 40,
    averageCenter: true,
    minLevel: 6
  })
}

function moveCenter() {
  if (!map || !props.center) return
  const cl = getCenterLatLng()
  map.setCenter(cl)
}

function loadKakaoSDK() {
  const key = config.public.kakaoMapKey
  if (!key) {
    console.error('[AcademyMap] Kakao Map key is empty. Check .env or NUXT_PUBLIC_KAKAO_MAP_KEY')
    return
  }
  console.log('[AcademyMap] Loading Kakao SDK...')
  const script = document.createElement('script')
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=clusterer&autoload=false`
  script.onload = () => {
    console.log('[AcademyMap] Kakao SDK loaded')
    window.kakao.maps.load(() => {
      console.log('[AcademyMap] Kakao maps ready')
      pending = true
      initMap()
    })
  }
  script.onerror = () => {
    console.error('[AcademyMap] Failed to load Kakao SDK. Check domain whitelist and network.')
  }
  document.head.appendChild(script)
}

watch(() => props.academies, () => {
  if (map) {
    createClusterer()
    moveCenter()
  }
}, { deep: true })

watch(() => props.center, () => {
  moveCenter()
}, { deep: true })

onMounted(() => {
  if (window.kakao && window.kakao.maps) {
    pending = true
    initMap()
  } else {
    loadKakaoSDK()
  }
})
</script>

<style scoped>
#map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
