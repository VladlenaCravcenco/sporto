'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import { responsiveImage, type ImageVariant } from '../../lib/responsive-images';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string; variant: ImageVariant;
};

/** One original-image fallback if the storage transformation is unavailable. */
export function StoreImage({ src, variant, sizes, onError, decoding = 'async', ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const image: { src: string; srcSet?: string; sizes?: string } = failedSource === src ? { src } : responsiveImage(src, variant);
  return <img {...props} {...image} decoding={decoding} sizes={image.srcSet ? sizes || image.sizes : undefined}
    onError={event => {
      if (image.src !== src) setFailedSource(src);
      else onError?.(event);
    }} />;
}
