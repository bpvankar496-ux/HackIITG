import React, { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import type { HeritageMediaItem } from '../types/heritage';

interface HeritageImageProps {
  media?: HeritageMediaItem;
  siteName: string;
  category?: string;
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  showAttribution?: boolean;
}

/**
 * Displays catalogue media without allowing a failed remote image to collapse
 * a card or expose a browser broken-image icon.
 */
export const HeritageImage: React.FC<HeritageImageProps> = ({
  media,
  siteName,
  category,
  className = '',
  imageClassName = '',
  loading = 'lazy',
  showAttribution = true,
}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isAvailable = Boolean(media?.url) && failedUrl !== media?.url;

  useEffect(() => {
    setFailedUrl(null);
  }, [media?.url]);

  return (
    <div className={`group relative isolate overflow-hidden bg-[#EDE5D5] ${className}`}>
      {isAvailable && media ? (
        <img
          src={media.url}
          alt={media.alt}
          loading={loading}
          onError={() => setFailedUrl(media.url)}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F4EFE6] px-4 text-center text-[#666052]"
          role="img"
          aria-label={`Photograph of ${siteName} is unavailable`}
        >
          <Landmark className="h-7 w-7 text-[#B65F43]" aria-hidden="true" />
          <span className="font-serif text-sm font-semibold">{siteName}</span>
          {category && <span className="text-[10px] font-mono uppercase tracking-wide">{category}</span>}
        </div>
      )}

      {isAvailable && media && showAttribution && (
        <a
          href={media.source_url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1.5 right-1.5 max-w-[calc(100%-0.75rem)] truncate rounded bg-[#16192E]/85 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity hover:bg-[#16192E] focus:opacity-100 group-hover:opacity-100"
          aria-label={`View image source for ${siteName}: ${media.photographer}, ${media.license}`}
          title={`${media.photographer} · ${media.license}`}
        >
          {media.photographer} · {media.license}
        </a>
      )}
    </div>
  );
};
