import { loadData, buildMetadata } from './../../utils/academy-data'

export default defineEventHandler(() => {
  const data = loadData()
  const meta = buildMetadata(data)
  return meta
})
