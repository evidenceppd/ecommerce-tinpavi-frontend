import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

type LoadingMode = 'lazy' | 'eager'

type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'> & {
  loading?: LoadingMode
  containerClassName?: string
  placeholderClassName?: string
  aspectRatio?: string
}

export default function OptimizedImage({
  loading = 'lazy',
  srcSet,
  sizes,
  containerClassName,
  placeholderClassName,
  className,
  style,
  aspectRatio,
  onLoad,
  onError,
  ...imgProps
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <div
      className={containerClassName ?? 'relative overflow-hidden'}
      style={aspectRatio ? { ...style, aspectRatio } : style}
    >
      {!isLoaded && !hasError ? (
        <div
          aria-hidden="true"
          className={placeholderClassName ?? 'absolute inset-0 animate-pulse bg-black/10 dark:bg-white/10'}
        />
      ) : undefined}

      <img
        {...imgProps}
        className={className}
        loading={loading}
        decoding="async"
        srcSet={srcSet}
        sizes={sizes}
        onLoad={(event) => {
          setIsLoaded(true)
          onLoad?.(event)
        }}
        onError={(event) => {
          setHasError(true)
          onError?.(event)
        }}
      />
    </div>
  )
}
