import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface ShareOptions {
  title: string;
  text: string;
  url: string;
  dialogTitle?: string;
}

interface ShareResult {
  success: boolean;
  method: 'capacitor' | 'web-share' | 'clipboard';
  error?: string;
}

export async function shareContent(options: ShareOptions): Promise<ShareResult> {
  try {
    console.log('Share attempt:', {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      url: options.url,
      hasWebShare: !!navigator.share,
      hasCanShare: !!navigator.canShare
    });

    // Check if we're in a Capacitor native app (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      console.log('Using Capacitor Share for native platform');

      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || 'Share this content'
      });

      return {
        success: true,
        method: 'capacitor'
      };
    }
    // Check for Web Share API support
    else if (navigator.share && navigator.canShare) {
      console.log('Using Web Share API');

      const shareData = {
        title: options.title,
        text: options.text,
        url: options.url
      };

      // Check if the specific content can be shared
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return {
          success: true,
          method: 'web-share'
        };
      } else {
        throw new Error('Content cannot be shared via Web Share API');
      }
    }
    // Fallback to clipboard
    else {
      console.log('Using clipboard fallback');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(options.url);
        return {
          success: true,
          method: 'clipboard'
        };
      } else {
        throw new Error('Clipboard API not available');
      }
    }
  } catch (error) {
    console.error('Share failed:', error);

    // Try clipboard as final fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(options.url);
        return {
          success: true,
          method: 'clipboard'
        };
      }
    } catch (clipboardError) {
      console.error('Clipboard fallback failed:', clipboardError);
    }

    return {
      success: false,
      method: 'clipboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}