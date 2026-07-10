<template>
  <div class="search-bar">
    <div class="search-row">
      <select v-model="localCity" class="select-box" @change="onCityChange">
        <option value="">시/군 선택</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="localDistrict" class="select-box" @change="onDistrictChange" :disabled="!localCity">
        <option value="">구/군 선택</option>
        <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="localDong" class="select-box" @change="onDongChange" :disabled="!localDistrict">
        <option value="">동 선택</option>
        <option v-for="d in dongs" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="localAcademy" class="select-box academy-select" @change="onAcademyChange" :disabled="!academyNames.length">
        <option value="">학원 선택</option>
        <option v-for="a in academyNames" :key="a" :value="a">{{ a }}</option>
      </select>
      <button class="reset-btn" @click="onReset">초기화</button>
    </div>
    <div class="result-count">총 <strong>{{ filteredCount }}</strong>개 학원 표시 중</div>
  </div>
</template>

<script setup>
const props = defineProps({
  cities: { type: Array, default: () => [] },
  districts: { type: Array, default: () => [] },
  dongs: { type: Array, default: () => [] },
  academyNames: { type: Array, default: () => [] },
  filteredCount: { type: Number, default: 0 },
})
const emit = defineEmits(['update:city', 'update:district', 'update:dong', 'update:academy'])

const localCity = ref('')
const localDistrict = ref('')
const localDong = ref('')
const localAcademy = ref('')

function onCityChange() {
  localDistrict.value = ''
  localDong.value = ''
  localAcademy.value = ''
  emit('update:city', localCity.value)
  emit('update:district', '')
  emit('update:dong', '')
  emit('update:academy', '')
}
function onDistrictChange() {
  localDong.value = ''
  localAcademy.value = ''
  emit('update:district', localDistrict.value)
  emit('update:dong', '')
  emit('update:academy', '')
}
function onDongChange() {
  localAcademy.value = ''
  emit('update:dong', localDong.value)
  emit('update:academy', '')
}
function onAcademyChange() {
  emit('update:academy', localAcademy.value)
}
function onReset() {
  localCity.value = ''
  localDistrict.value = ''
  localDong.value = ''
  localAcademy.value = ''
  emit('update:city', '')
  emit('update:district', '')
  emit('update:dong', '')
  emit('update:academy', '')
}
</script>

<style scoped>
.search-bar {
  background: #ffffff;
  padding: 14px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  z-index: 10;
}
.search-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.select-box {
  padding: 8px 32px 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f8fafc;
  color: #2d3748;
  cursor: pointer;
  appearance: auto;
  min-width: 120px;
}
.select-box:focus {
  outline: none;
  border-color: #667eea;
}
.select-box:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.academy-select {
  min-width: 200px;
  flex: 1;
}
.reset-btn {
  padding: 8px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #667eea;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}
.reset-btn:hover {
  background: #f8fafc;
  border-color: #667eea;
}
.result-count {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #8892b0;
}
.result-count strong {
  color: #4f46e5;
}

@media (max-width: 768px) {
  .search-bar {
    padding: 10px 12px;
  }
  .search-row {
    gap: 6px;
  }
  .select-box {
    min-width: 0;
    flex: 1;
    font-size: 0.8rem;
    padding: 7px 24px 7px 8px;
  }
  .academy-select {
    min-width: 0;
  }
  .reset-btn {
    padding: 7px 10px;
    font-size: 0.78rem;
  }
  .result-count {
    font-size: 0.72rem;
    margin-top: 6px;
  }
}
</style>
