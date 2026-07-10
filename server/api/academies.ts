import { loadData } from './../utils/academy-data'

export default defineEventHandler((event) => {
  const data = loadData()
  const query = getQuery(event)

  if (!query.city && !query.district && !query.dong && !query.name) {
    return data
  }

  let filtered = data.academies

  if (query.city) {
    filtered = filtered.filter(a => a.city === query.city)
  }
  if (query.district) {
    filtered = filtered.filter(a => a.district === query.district)
  }
  if (query.dong) {
    filtered = filtered.filter(a => a.dong === query.dong)
  }
  if (query.name) {
    filtered = filtered.filter(a => a.name.includes(query.name))
  }

  return { academies: filtered, total: filtered.length }
})
