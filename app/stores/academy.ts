import { defineStore } from 'pinia'

export const useAcademyStore = defineStore('academy', {
  state: () => ({
    selectedAcademy: null
  }),
  actions: {
    setSelectedAcademy(academy) {
      this.selectedAcademy = academy
    }
  }
})
