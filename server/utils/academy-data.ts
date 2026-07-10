import { readFileSync } from 'fs'
import { join } from 'path'

let cachedData = null
let cachedMeta = null

export function loadData() {
  if (cachedData) return cachedData
  const filePath = join(process.cwd(), 'public', 'academies.json')
  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  cachedData = data
  return data
}

export function buildMetadata(data) {
  if (cachedMeta) return cachedMeta

  const academies = data.academies
  const cities = [...new Set(academies.map(a => a.city))].sort()

  const districts = {}
  cities.forEach(c => {
    districts[c] = [...new Set(
      academies.filter(a => a.city === c && a.district).map(a => a.district)
    )].sort()
  })

  const dongs = {}
  academies.forEach(a => {
    if (a.dong) {
      const key = `${a.city}||${a.district}`
      if (!dongs[key]) dongs[key] = new Set()
      dongs[key].add(a.dong)
    }
  })
  const dongArrays = {}
  Object.keys(dongs).forEach(k => {
    dongArrays[k] = [...dongs[k]].sort()
  })

  const counts = {}
  academies.forEach(a => {
    const key = `${a.city}||${a.district}||${a.dong || ''}`
    counts[key] = (counts[key] || 0) + 1
  })

  const meta = { cities, districts, dongs: dongArrays, counts }
  cachedMeta = meta
  return meta
}
