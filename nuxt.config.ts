// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      kakaoMapKey: process.env.KAKAO_MAP_KEY,
    }
  },
  app: {
    head: {
      script: [
        { src: `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.KAKAO_MAP_KEY}&libraries=clusterer`, type: 'text/javascript' }
      ]
    }
  }
})
