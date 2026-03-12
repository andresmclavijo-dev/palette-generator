type RGB = [number, number, number]

function dist(a: RGB, b: RGB): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function extractDominantColors(imageData: ImageData, k = 5, maxSamples = 2000, iterations = 20): string[] {
  const { data, width, height } = imageData
  const totalPixels = width * height

  // Sample random pixels
  const samples: RGB[] = []
  const sampleCount = Math.min(maxSamples, totalPixels)
  const seen = new Set<number>()
  while (samples.length < sampleCount) {
    const idx = Math.floor(Math.random() * totalPixels)
    if (seen.has(idx)) continue
    seen.add(idx)
    const off = idx * 4
    const a = data[off + 3]
    if (a < 128) continue // skip transparent
    samples.push([data[off], data[off + 1], data[off + 2]])
  }

  if (samples.length < k) {
    return samples.map(([r, g, b]) => rgbToHex(r, g, b))
  }

  // Init centroids randomly from samples
  const centroids: RGB[] = []
  const usedIndices = new Set<number>()
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * samples.length)
    if (usedIndices.has(idx)) continue
    usedIndices.add(idx)
    centroids.push([...samples[idx]])
  }

  const assignments = new Int32Array(samples.length)

  // K-means iterations
  for (let iter = 0; iter < iterations; iter++) {
    // Assign
    for (let i = 0; i < samples.length; i++) {
      let minDist = Infinity
      let minC = 0
      for (let c = 0; c < k; c++) {
        const d = dist(samples[i], centroids[c])
        if (d < minDist) { minDist = d; minC = c }
      }
      assignments[i] = minC
    }

    // Update centroids
    for (let c = 0; c < k; c++) {
      let sr = 0, sg = 0, sb = 0, count = 0
      for (let i = 0; i < samples.length; i++) {
        if (assignments[i] === c) {
          sr += samples[i][0]
          sg += samples[i][1]
          sb += samples[i][2]
          count++
        }
      }
      if (count > 0) {
        centroids[c] = [sr / count, sg / count, sb / count]
      }
    }
  }

  // Count cluster sizes for sorting
  const counts = new Array(k).fill(0)
  for (let i = 0; i < samples.length; i++) {
    counts[assignments[i]]++
  }

  // Sort by frequency (largest cluster first)
  const indexed = centroids.map((c, i) => ({ c, count: counts[i] }))
  indexed.sort((a, b) => b.count - a.count)

  return indexed.map(({ c }) => rgbToHex(c[0], c[1], c[2]))
}

export function extractColorsFromFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const maxDim = 200
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('No canvas context')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const colors = extractDominantColors(imageData)
        resolve(colors)
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
