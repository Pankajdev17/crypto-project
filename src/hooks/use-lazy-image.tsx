
import { useState, useEffect, useRef } from 'react';

interface UseLazyImageProps {
  src: string;
  fallbackSrc?: string;
  threshold?: number;
}

interface UseLazyImageReturn {
  isLoaded: boolean;
  currentSrc: string;
  ref: React.RefObject<HTMLImageElement>;
  onLoad: () => void;
  onError: () => void;
}

export function useLazyImage({
  src,
  fallbackSrc = 'https://via.placeholder.com/150?text=Loading...',
  threshold = 0.1
}: UseLazyImageProps): UseLazyImageReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(fallbackSrc);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    let current = imgRef.current;

    // Reset states when src changes
    setIsLoaded(false);
    setCurrentSrc(fallbackSrc);

    if (current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When image enters viewport, start loading the actual image
            if (entry.isIntersecting) {
              // Create a new image element to preload
              const img = new Image();
              
              img.onload = () => {
                setCurrentSrc(src);
                setIsLoaded(true);
              };
              
              img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                setCurrentSrc(fallbackSrc);
              };
              
              img.src = src;
              
              // Disconnect after triggering load
              observer.disconnect();
            }
          });
        },
        { threshold }
      );
      
      observer.observe(current);
    }
    
    return () => {
      if (observer && current) {
        observer.disconnect();
      }
    };
  }, [src, fallbackSrc, threshold]);
  
  const onLoad = () => {
    setIsLoaded(true);
  };
  
  const onError = () => {
    console.error(`Failed to load image: ${src}`);
    setCurrentSrc(fallbackSrc);
  };
  
  return { isLoaded, currentSrc, ref: imgRef, onLoad, onError };
}

// Usage example component
export const LazyImage = ({
  src,
  alt,
  className,
  fallbackSrc,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string }) => {
  const { isLoaded, currentSrc, ref, onLoad, onError } = useLazyImage({
    src: src || '',
    fallbackSrc
  });
  
  return (
    <img
      ref={ref}
      src={currentSrc}
      alt={alt}
      className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className || ''}`}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
};
