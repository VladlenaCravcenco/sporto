export type ImageVariant = 'card' | 'menu' | 'hero' | 'detail' | 'thumbnail' | 'logo';
const profiles: Record<ImageVariant, { widths: number[]; sizes: string; fallback: number }> = {
  logo: { widths: [120, 240, 360], sizes: '120px', fallback: 240 },
  card: { widths: [240, 400, 640, 800], sizes: '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw', fallback: 400 },
  menu: { widths: [160, 320, 480], sizes: '(max-width: 1279px) 25vw, 14vw', fallback: 320 },
  hero: { widths: [480, 800, 1200, 1600, 2000], sizes: '(max-width: 1023px) 100vw, 67vw', fallback: 1200 },
  detail: { widths: [400, 640, 960, 1280, 1600], sizes: '(max-width: 767px) 100vw, (max-width: 1300px) 50vw, 650px', fallback: 960 },
  thumbnail: { widths: [120, 240, 400], sizes: '(max-width: 767px) 25vw, 160px', fallback: 240 },
};

/** Public Supabase images and known supplier thumbnails. Signed URLs stay intact. */
export function responsiveImage(source: string, variant: ImageVariant): { src: string; srcSet?: string; sizes?: string } {
  const original = { src: source };
  let url: URL;
  try { url = new URL(source); } catch { return original; }
  // Supplier exposes these thumbnail sizes. Keep detail/hero originals and
  // let StoreImage fall back to the original if a thumbnail is unavailable.
  if (url.protocol === 'https:' && ['www.insportline.eu', 'insportline.eu'].includes(url.hostname)
    && url.pathname.startsWith('/upload/product/640x640/') && !url.search && !url.hash
    && /\.(jpe?g|png|webp)$/i.test(url.pathname)
    && ['card', 'menu', 'thumbnail'].includes(variant)) {
    const resized = (width: number) => {
      const result = new URL(url);
      result.pathname = result.pathname.replace('/640x640/', `/${width}x${width}/`);
      return result.href;
    };
    return {
      src: resized(320),
      srcSet: [150, 320, 640].map(width => `${resized(width)} ${width}w`).join(', '),
      sizes: profiles[variant].sizes,
    };
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')
    || !url.pathname.startsWith('/storage/v1/object/public/') || url.search || url.hash
    || !/\.(jpe?g|png|webp|avif)$/i.test(url.pathname)) return original;
  const profile = profiles[variant];
  const transformed = (width: number) => {
    const result = new URL(url);
    result.pathname = result.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    result.search = new URLSearchParams({ width: String(width), ...(variant === 'logo' ? { height: String(Math.round(width * 32 / 120)) } : {}), quality: '80', resize: 'contain' }).toString();
    return result.href;
  };
  return {
    src: transformed(profile.fallback),
    srcSet: profile.widths.map(width => `${transformed(width)} ${variant === 'logo' ? `${width / 120}x` : `${width}w`}`).join(', '),
    ...(variant === 'logo' ? {} : { sizes: profile.sizes }),
  };
}
