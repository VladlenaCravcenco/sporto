// src/lib/imageHelper.ts
export function getOptimizedImageUrl(
  url: string | null,
  width: number = 300,
  quality: number = 80
): string {
  if (!url) return '/placeholder.jpg';
  
  // Если уже есть параметры трансформации
  if (url.includes('width=')) return url;
  
  // Добавляем параметры для Supabase Storage
  return `${url}?width=${width}&quality=${quality}`;
}