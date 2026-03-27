'use client';

import React, { useState, useLayoutEffect, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ImagePreviewProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreview({ src, alt, isOpen, onClose }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset zoom and rotation when dialog opens
  useLayoutEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none overflow-hidden" showCloseButton={false}>
        <VisuallyHidden.Root>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <p className="text-white font-medium truncate max-w-[60%]">{alt}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div className="w-full h-full flex items-center justify-center overflow-auto p-4 pt-16">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Clickable Image Component
interface ClickableImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export function ClickableImage({ src, alt, className = '', fallback = '/placeholder.png' }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallback);
    setHasError(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  // Generate a placeholder image with product initials
  const getPlaceholderUrl = (name: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#6366f1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      ctx.fillText(initials || '?', 100, 100);
    }
    return canvas.toDataURL();
  };

  const displaySrc = imgSrc || getPlaceholderUrl(alt);

  return (
    <>
      <img
        src={displaySrc}
        alt={alt}
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={() => src && setIsOpen(true)}
        onError={handleError}
      />
      {src && (
        <ImagePreview
          src={src}
          alt={alt}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// Product Image Component with placeholder
interface ProductImageProps {
  product: {
    name: string;
    image?: string;
    imageUrl?: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export function ProductImage({ product, className = '', size = 'md', onClick }: ProductImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const getImageUrl = () => {
    return product.image || product.imageUrl || null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const imageSrc = getImageUrl();

  return (
    <>
      <div
        className={`${sizeClasses[size]} ${className} rounded-lg overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all`}
        onClick={() => imageSrc && (onClick ? onClick() : setIsOpen(true))}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-xs md:text-sm">
            {getInitials(product.name)}
          </span>
        )}
      </div>
      {imageSrc && (
        <ImagePreview
          src={imageSrc}
          alt={product.name}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default ImagePreview;
