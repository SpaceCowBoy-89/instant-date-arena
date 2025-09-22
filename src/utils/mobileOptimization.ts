/**
 * Mobile optimization utilities for responsive design on native apps
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native mobile platform
 */
export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get platform-specific information
 */
export const getPlatformInfo = () => {
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    isIOS: Capacitor.getPlatform() === 'ios',
    isAndroid: Capacitor.getPlatform() === 'android',
  };
};

/**
 * Apply mobile-optimized class names conditionally
 */
export const mobileOptimizedClass = (baseClass: string, mobileClass?: string): string => {
  if (!mobileClass) return baseClass;
  
  // If running on native, prefer mobile-optimized classes
  if (isNativeMobile()) {
    return `${baseClass} ${mobileClass}`;
  }
  
  return baseClass;
};

/**
 * Get safe container classes for mobile layouts
 */
export const getMobileContainerClasses = (): string => {
  const baseClasses = 'min-h-screen bg-background';
  
  if (isNativeMobile()) {
    return `${baseClasses} mobile-container`;
  }
  
  return `${baseClasses} container mx-auto`;
};

/**
 * Get mobile-safe content classes that prevent navbar obstruction
 */
export const getMobileContentClasses = (): string => {
  const baseClasses = 'min-h-screen bg-background';
  
  if (isNativeMobile()) {
    return `${baseClasses} mobile-container pb-20`; // Extra bottom padding for native
  }
  
  return `${baseClasses} container mx-auto pb-16`;
};

/**
 * Get navbar-safe spacing for the last elements in content
 */
export const getNavbarSafeClasses = (): string => {
  if (isNativeMobile()) {
    return 'pb-16 mb-4'; // Adjusted for shorter navbar on native
  }
  
  return 'pb-14 mb-2'; // Adjusted for shorter navbar on web
};

/**
 * Get optimal touch target size classes for the current platform
 */
export const getTouchTargetClasses = (size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const sizeMap = {
    small: 'min-h-[40px] min-w-[40px]',
    medium: 'min-h-[44px] min-w-[44px]',
    large: 'min-h-[48px] min-w-[48px]',
  };
  
  return `${sizeMap[size]} touch-target touch-manipulation`;
};

/**
 * Get responsive text size classes
 */
export const getResponsiveTextClasses = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl'): string => {
  const textMap = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  };
  
  return textMap[size];
};

/**
 * Get responsive spacing classes for mobile
 */
export const getResponsiveSpacing = (spacing: 'tight' | 'normal' | 'loose'): string => {
  const spacingMap = {
    tight: 'gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3',
    normal: 'gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4',
    loose: 'gap-4 sm:gap-6 px-6 sm:px-8 py-4 sm:py-6',
  };
  
  return spacingMap[spacing];
};

/**
 * Check if device has safe area insets (iPhone X and newer, Android with gestures)
 */
export const hasSafeAreaInsets = (): boolean => {
  // Check if safe area insets are available
  const testDiv = document.createElement('div');
  testDiv.style.paddingTop = 'env(safe-area-inset-top)';
  testDiv.style.position = 'absolute';
  testDiv.style.visibility = 'hidden';
  document.body.appendChild(testDiv);
  
  const computedStyle = window.getComputedStyle(testDiv);
  const hasSafeArea = computedStyle.paddingTop !== '0px' && computedStyle.paddingTop !== '';
  
  document.body.removeChild(testDiv);
  return hasSafeArea;
};

/**
 * Get safe area aware padding classes
 */
export const getSafeAreaClasses = (position: 'top' | 'bottom' | 'all' = 'all'): string => {
  const classes = [];
  
  if (position === 'top' || position === 'all') {
    classes.push('pt-safe');
  }
  
  if (position === 'bottom' || position === 'all') {
    classes.push('pb-safe');
  }
  
  return classes.join(' ');
};

/**
 * Mobile-optimized button classes generator
 */
export const getMobileButtonClasses = (
  variant: 'primary' | 'secondary' | 'ghost' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const baseClasses = getTouchTargetClasses(size);
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  return `${baseClasses} ${variantClasses[variant]} active:scale-95 transition-all duration-200`;
};