/**
 * Packs small pieces of a document into a link, so a client can open it without an account and without a server.
 * The data is squeezed (deflate) and written in letters that are safe in a link. Nothing is uploaded anywhere.
 * When the site has Supabase storage for links, these can become short links; the pages that read them stay the same.
 */
const toB64Url = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromB64Url = (t: string) => {
  const s = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await res.arrayBuffer())
}

export async function pack(data: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(data))
  if (typeof CompressionStream !== 'undefined') return 'z' + toB64Url(await pipe(raw, new CompressionStream('deflate-raw')))
  return 'p' + toB64Url(raw)
}

export async function unpack<T>(code: string): Promise<T | null> {
  try {
    const kind = code[0]
    let bytes: Uint8Array = fromB64Url(code.slice(1))
    if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
    else if (kind !== 'p') return null
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

/** The full address of a page inside Generate, for sharing. */
export const appLink = (path: string) => `${window.location.origin}${window.location.pathname}#${path}`

/**
 * Opens a link that takes a moment to build (like WhatsApp with a packed link) without the phone blocking it:
 * the new tab is opened straight away on the tap, then pointed at the link once it is ready.
 */
export async function openWhenReady(build: () => Promise<string>) {
  const w = window.open('', '_blank')
  const url = await build()
  if (w && !w.closed) w.location.href = url
  else window.location.href = url
}
