// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  routeRules: {
    '/academies': { redirect: '/' }
  },
  runtimeConfig: {
    public: {
      kakaoMapKey: process.env.KAKAO_MAP_KEY || process.env.NUXT_PUBLIC_KAKAO_MAP_KEY || '',
    }
  }
})
