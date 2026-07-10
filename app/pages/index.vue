<template>
  <div class="page-layout">
    <header class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h1 class="hero-title">
          <span class="hero-main">학원</span>
          <span class="hero-accent">어디있어?</span>
        </h1>
        <p class="hero-subtitle">경기도 모든 학원을 한눈에 검색하고 지도로 확인하세요</p>
      </div>
    </header>
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
  height: 100dvh;
  overflow: hidden;
}
.hero {
  position: relative;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
  padding: 20px 24px;
  overflow: hidden;
  flex-shrink: 0;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
}
.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}
.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  flex-shrink: 0;
}
.hero-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero-main {
  color: rgba(255,255,255,0.95);
}
.hero-accent {
  color: #fde047;
  font-style: italic;
}
.hero-subtitle {
  margin: 0 0 0 auto;
  font-size: 0.82rem;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
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

@media (max-width: 768px) {
  .hero {
    padding: 12px 16px;
  }
  .hero-icon {
    width: 36px;
    height: 36px;
  }
  .hero-icon svg {
    width: 22px;
    height: 22px;
  }
  .hero-title {
    font-size: 1.15rem;
  }
  .hero-subtitle {
    display: none;
  }
  .content {
    flex-direction: column;
  }
  .map-wrapper {
    flex: 1;
    min-height: 200px;
  }
  .detail-wrapper {
    flex: none;
    max-height: 38vh;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
}
</style>
