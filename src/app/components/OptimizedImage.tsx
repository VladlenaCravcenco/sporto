import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // для важных картинок (не ленивая загрузка)
}

export function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // ✅ Генерируем WebP версию
  const getWebPUrl = (url: string) => {
    if (!url) return '';
    // Если используешь Supabase, можно добавить параметры:
    // https://supabase.co/docs/guides/storage/cdn/image-transformations
    return url; // пока просто возвращаем исходный URL
  };

  useEffect(() => {
    if (priority) {
      // Для важных картинок загружаем сразу
      setImageSrc(getWebPUrl(src));
    } else {
      // Для остальных используем Intersection Observer
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(false);
      img.src = getWebPUrl(src);
    }
  }, [src, priority]);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Плейсхолдер (размытое изображение) */}
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Основное изображение */}
      <img
        src={getWebPUrl(src)}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(false)}
      />

      {/* Запасной вариант картинки */}
      <noscript>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
        />
      </noscript>
    </div>
  );
}