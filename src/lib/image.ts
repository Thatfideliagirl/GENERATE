/**
 * Reads a picture the person chose, shrinks it, and returns a PNG data URL.
 * With removeWhite on, a white or light background becomes see through,
 * which is what a photographed signature needs.
 */
export function readImage(file: File, maxWidth: number, removeWhite: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a picture'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Could not use the picture'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        if (removeWhite) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const px = data.data
          for (let i = 0; i < px.length; i += 4) {
            const lowest = Math.min(px[i], px[i + 1], px[i + 2])
            if (lowest > 215) px[i + 3] = 0
            else if (lowest > 150) px[i + 3] = Math.round((255 * (215 - lowest)) / 65)
          }
          ctx.putImageData(data, 0, 0)
        }
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
