<template>
  <div class="page-layout">
    <AcademySearch
      :cities="cities"
      :districts="districts"
      :dongs="dongs"
      :academy-names="academyNames"
      :filtered-count="academies.length"
      @update:city="onCityChange"
      @update:district="onDistrictChange"
      @update:dong="onDongChange"
      @update:academy="onAcademyChange"
    />
    <div class="content">
      <div class="map-wrapper">
        <AcademyMap :academies="academies" :center="mapCenter" />
        <div v-if="loading" class="map-loading">
          <div class="spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
      <div class="detail-wrapper">
        <AcademyDetail />
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  academies,
  loading,
  cities,
  getDistricts,
  getDongs,
  getCenter,
  loadAcademies,
  init,
} = useAcademies()

const districts = ref([])
const dongs = ref([])
const academyNames = ref([])
const mapCenter = ref(null)

const selectedCity = ref('')
const selectedDistrict = ref('')
const selectedDong = ref('')
const selectedAcademy = ref('')

onMounted(async () => {
  await init()
  if (academies.value.length > 0) {
    mapCenter.value = getCenter()
  }
})

function onCityChange(city) {
  selectedCity.value = city
  selectedDistrict.value = ''
  selectedDong.value = ''
  selectedAcademy.value = ''
  mapCenter.value = null
  academyNames.value = []
  if (city) {
    districts.value = getDistricts(city)
    dongs.value = []
    loadAcademies(city, '', '')
  } else {
    districts.value = []
    dongs.value = []
    loadAcademies('', '', '')
  }
}

function onDistrictChange(district) {
  selectedDistrict.value = district
  selectedDong.value = ''
  selectedAcademy.value = ''
  academyNames.value = []
  if (district) {
    dongs.value = getDongs(selectedCity.value, district)
    loadAcademies(selectedCity.value, district, '')
  } else {
    dongs.value = []
    loadAcademies(selectedCity.value, '', '')
  }
}

function onDongChange(dong) {
  selectedDong.value = dong
  selectedAcademy.value = ''
  if (dong) {
    loadAcademies(selectedCity.value, selectedDistrict.value, dong)
  } else {
    loadAcademies(selectedCity.value, selectedDistrict.value, '')
  }
}

watch(() => academies.value, () => {
  if (academies.value.length > 0) {
    mapCenter.value = getCenter()
    academyNames.value = academies.value.map(a => a.name).sort()
  } else {
    academyNames.value = []
  }
}, { deep: true })

function onAcademyChange(name) {
  selectedAcademy.value = name
  if (name) {
    const ac = academies.value.find(a => a.name === name)
    if (ac) {
      mapCenter.value = { lat: ac.lat, lng: ac.lng }
    }
  }
}
</script>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.map-wrapper {
  flex: 2;
  position: relative;
  min-height: 0;
}
.detail-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #f7f8fc;
}
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8892b0;
  font-size: 0.95rem;
  background: #f0f2f5;
  z-index: 1;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
