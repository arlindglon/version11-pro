/**
 * ================================================
 * 🎬 UNIVERSAL VIDEO UTILITIES
 * ================================================
 * 
 * Auto-detect video platform from URL and generate:
 * - Thumbnail URL
 * - Embed URL
 * - Video ID
 * 
 * Supported Platforms:
 * - YouTube (youtube.com, youtu.be)
 * - Vimeo (vimeo.com)
 * - Facebook (facebook.com/watch, fb.watch)
 * - Dailymotion (dailymotion.com)
 * - TikTok (tiktok.com)
 * - Direct Video Files (.mp4, .webm, .ogg)
 * ================================================
 */

export interface VideoInfo {
  platform: 'youtube' | 'vimeo' | 'facebook' | 'dailymotion' | 'tiktok' | 'direct' | 'unknown';
  videoId: string | null;
  embedUrl: string;
  thumbnailUrl: string;
  watchUrl: string;
  isDirectVideo: boolean;
}

/**
 * Extract video information from any video URL
 */
export function getVideoInfo(url: string): VideoInfo {
  if (!url) {
    return {
      platform: 'unknown',
      videoId: null,
      embedUrl: '',
      thumbnailUrl: '',
      watchUrl: '',
      isDirectVideo: false,
    };
  }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isDirectVideo: false,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      platform: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      watchUrl: `https://vimeo.com/${videoId}`,
      isDirectVideo: false,
    };
  }

  // Facebook
  const facebookMatch = url.match(/(?:facebook\.com\/.*\/videos\/|fb\.watch\/)(\d+)/);
  if (facebookMatch) {
    const videoId = facebookMatch[1];
    return {
      platform: 'facebook',
      videoId,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`,
      thumbnailUrl: '/video-placeholder.png', // Facebook doesn't provide public thumbnails
      watchUrl: url,
      isDirectVideo: false,
    };
  }

  // Dailymotion
  const dailymotionMatch = url.match(/(?:dailymotion\.com\/(?:video|embed)\/|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return {
      platform: 'dailymotion',
      videoId,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
      thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${videoId}`,
      watchUrl: `https://www.dailymotion.com/video/${videoId}`,
      isDirectVideo: false,
    };
  }

  // TikTok
  const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1];
    return {
      platform: 'tiktok',
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      thumbnailUrl: '/video-placeholder.png',
      watchUrl: url,
      isDirectVideo: false,
    };
  }

  // Direct video files (.mp4, .webm, .ogg, .mov)
  const directVideoMatch = url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i);
  if (directVideoMatch) {
    return {
      platform: 'direct',
      videoId: null,
      embedUrl: url,
      thumbnailUrl: '/video-placeholder.png',
      watchUrl: url,
      isDirectVideo: true,
    };
  }

  // Unknown - return as is
  return {
    platform: 'unknown',
    videoId: null,
    embedUrl: url,
    thumbnailUrl: '/video-placeholder.png',
    watchUrl: url,
    isDirectVideo: false,
  };
}

/**
 * Get platform icon name
 */
export function getPlatformIcon(platform: VideoInfo['platform']): string {
  switch (platform) {
    case 'youtube': return 'youtube';
    case 'vimeo': return 'vimeo';
    case 'facebook': return 'facebook';
    case 'dailymotion': return 'dailymotion';
    case 'tiktok': return 'tiktok';
    case 'direct': return 'video';
    default: return 'link';
  }
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: VideoInfo['platform']): string {
  switch (platform) {
    case 'youtube': return 'YouTube';
    case 'vimeo': return 'Vimeo';
    case 'facebook': return 'Facebook';
    case 'dailymotion': return 'Dailymotion';
    case 'tiktok': return 'TikTok';
    case 'direct': return 'Direct Video';
    default: return 'Video';
  }
}

/**
 * Check if URL is a valid video URL
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  const info = getVideoInfo(url);
  return info.platform !== 'unknown' || info.isDirectVideo;
}

/**
 * Generate thumbnail fallback chain
 */
export function getThumbnailWithFallback(videoUrl: string, fallbackIndex: number = 0): string {
  const info = getVideoInfo(videoUrl);
  
  if (info.platform === 'youtube' && info.videoId) {
    // YouTube has multiple thumbnail qualities
    const thumbnails = [
      `https://img.youtube.com/vi/${info.videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${info.videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${info.videoId}/default.jpg`,
    ];
    return thumbnails[Math.min(fallbackIndex, thumbnails.length - 1)];
  }
  
  return info.thumbnailUrl;
}

/**
 * Parse video URL and return formatted data for storage
 */
export function parseVideoUrl(url: string): {
  originalUrl: string;
  videoId: string | null;
  platform: string;
  thumbnailUrl: string;
  embedUrl: string;
} {
  const info = getVideoInfo(url);
  return {
    originalUrl: url,
    videoId: info.videoId,
    platform: info.platform,
    thumbnailUrl: info.thumbnailUrl,
    embedUrl: info.embedUrl,
  };
}
