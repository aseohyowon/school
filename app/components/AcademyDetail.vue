<template>
  <div v-if="selectedAcademy" class="detail-card">
    <div class="card-header">
      <h2 class="title">{{ selectedAcademy.name }}</h2>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">지역</span>
        <span class="value">{{ selectedAcademy.city }} {{ selectedAcademy.district }}</span>
      </div>
      <div class="info-row">
        <span class="label">주소</span>
        <span class="value">{{ selectedAcademy.address }}</span>
      </div>
      <div class="info-row" v-if="selectedAcademy.phone">
        <span class="label">연락처</span>
        <span class="value">{{ selectedAcademy.phone }}</span>
      </div>
      <div class="info-row" v-if="selectedAcademy.field">
        <span class="label">유형</span>
        <span class="value">{{ selectedAcademy.field }}</span>
      </div>
      <div class="info-row">
        <span class="label">과목</span>
        <div class="subjects">
          <span v-for="s in selectedAcademy.subjects" :key="s" class="subject-tag">{{ s }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="empty-icon">📍</div>
    <p class="empty-text">지도에서 학원 마커를 클릭하면<br>상세 정보가 표시됩니다</p>
  </div>
</template>

<script setup>
const academyStore = useAcademyStore()
const selectedAcademy = computed(() => academyStore.selectedAcademy)
</script>

<style scoped>
.detail-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  margin: 16px;
  overflow: hidden;
}
.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
}
.card-body {
  padding: 16px 24px 24px;
}
.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 0.9rem;
}
.label {
  flex-shrink: 0;
  width: 72px;
  color: #8892b0;
  font-weight: 500;
}
.value {
  color: #2d3748;
  line-height: 1.5;
}
.subjects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.subject-tag {
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}
.empty-text {
  color: #a0aec0;
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
