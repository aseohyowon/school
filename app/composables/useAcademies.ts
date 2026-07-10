export const useAcademies = () => {
  const academies = ref([])
  const loading = ref(true)
  const metadata = ref(null)

  const cities = computed(() => metadata.value?.cities || [])
  const hasMetadata = computed(() => !!metadata.value)

  function getDistricts(city) {
    if (!city || !metadata.value) return []
    return metadata.value.districts[city] || []
  }

  function getDongs(city, district) {
    if (!city || !district || !metadata.value) return []
    const key = `${city}||${district}`
    return metadata.value.dongs[key] || []
  }

  function getCenter() {
    const list = academies.value
    if (list.length === 0) return null
    const latSum = list.reduce((s, a) => s + a.lat, 0)
    const lngSum = list.reduce((s, a) => s + a.lng, 0)
    return { lat: latSum / list.length, lng: lngSum / list.length }
  }

  async function loadMetadata() {
    try {
      const res = await fetch('/api/academies/metadata')
      if (res.ok) {
        metadata.value = await res.json()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to load metadata:', e)
      return false
    }
  }

  async function loadAcademies(city, district, dong) {
    try {
      loading.value = true
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (district) params.set('district', district)
      if (dong) params.set('dong', dong)
      const qs = params.toString()
      const url = qs ? `/api/academies?${qs}` : '/api/academies'

      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      academies.value = data?.academies || []
      return true
    } catch (e) {
      console.error('Failed to load academies:', e)
      academies.value = []
      return false
    } finally {
      loading.value = false
    }
  }

  async function init() {
    loading.value = true
    await loadMetadata()
    // Load first city's data as initial set (to avoid 27K markers)
    const firstCity = cities.value[0]
    if (firstCity) {
      await loadAcademies(firstCity, '', '')
    } else {
      // Fallback: load empty
      academies.value = []
      loading.value = false
    }
  }

  return {
    academies,
    loading,
    metadata,
    cities,
    hasMetadata,
    getDistricts,
    getDongs,
    getCenter,
    loadMetadata,
    loadAcademies,
    init,
  }
}
