<template>
  <div id="map"></div>
</template>

<script setup>
const props = defineProps({
  academies: { type: Array, default: () => [] },
  center: { type: Object, default: null },
})

const academyStore = useAcademyStore()
let map = null
let clusterer = null

function getCenterLatLng() {
  if (props.center && props.center.lat && props.center.lng) {
    return new window.kakao.maps.LatLng(props.center.lat, props.center.lng)
  }
  return new window.kakao.maps.LatLng(37.29, 127.01)
}

function initMap() {
  const container = document.getElementById('map')
  if (!container || container.offsetHeight === 0) {
    // Container not ready yet, retry in nextTick
    requestAnimationFrame(() => initMap())
    return
  }
  map = new window.kakao.maps.Map(container, {
    center: getCenterLatLng(),
    level: 7
  })
  createClusterer()
}

function createClusterer() {
  if (!map) return
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
    initMap()
  } else {
    const check = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        clearInterval(check)
        initMap()
      }
    }, 200)
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
