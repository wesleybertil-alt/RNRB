/**
 * E-ink Tablet + Stylus Utilities
 * Optimized for: Boox, reMarkable, Supernote, and similar devices
 */

// ============================================
// E-INK REFRESH UTILITIES
// ============================================

/**
 * Trigger a full e-ink refresh by causing a minimal DOM change
 * Call after: new message rendered, page navigation, modal open/close
 *
 * This works by forcing the browser to repaint, which triggers
 * the e-ink display controller to do a full refresh
 */
export const triggerEinkRefresh = (): void => {
  // Method 1: Scroll trick (works on most e-ink browsers)
  const currentScroll = window.scrollY;
  window.scrollTo(0, currentScroll + 1);

  requestAnimationFrame(() => {
    window.scrollTo(0, currentScroll);
  });

  // Method 2: Force repaint via style change (backup)
  const root = document.documentElement;
  root.style.opacity = '0.999';
  requestAnimationFrame(() => {
    root.style.opacity = '1';
  });
};

/**
 * Trigger a partial e-ink refresh on a specific element
 * Use for smaller UI updates to reduce ghosting
 */
export const triggerElementRefresh = (element: HTMLElement): void => {
  if (!element) return;

  // Force layout recalculation
  element.style.transform = 'translateZ(0)';
  requestAnimationFrame(() => {
    element.style.transform = '';
  });
};

/**
 * Schedule a refresh after content settles
 * Use after dynamic content loads
 */
export const scheduleRefresh = (delay: number = 100): void => {
  setTimeout(triggerEinkRefresh, delay);
};

/**
 * Force e-ink refresh on an element or full page
 * Combines partial element refresh with full page refresh trigger
 */
export const forceEinkRefresh = (element?: HTMLElement | null): void => {
  if (element) {
    triggerElementRefresh(element);
  }
  triggerEinkRefresh();
};

/**
 * Mark an element as refreshing (disables interaction)
 */
export const setRefreshing = (element: HTMLElement, isRefreshing: boolean): void => {
  if (isRefreshing) {
    element.classList.add('eink-refreshing');
  } else {
    element.classList.remove('eink-refreshing');
  }
};

// ============================================
// INPUT DETECTION
// ============================================

/**
 * Detect if the device supports stylus/pen input
 */
export const hasStylusSupport = (): boolean => {
  // Check for fine pointer (stylus)
  if (window.matchMedia('(pointer: fine)').matches) {
    return true;
  }

  // Check for any fine pointer (stylus + mouse)
  if (window.matchMedia('(any-pointer: fine)').matches) {
    return true;
  }

  return false;
};

/**
 * Detect if the device is likely an e-ink display
 */
export const isEinkDisplay = (): boolean => {
  // Check for slow update rate (experimental media query)
  if (window.matchMedia('(update: slow)').matches) {
    return true;
  }

  // Check user agent for known e-ink devices
  const ua = navigator.userAgent.toLowerCase();
  const einkDevices = ['boox', 'onyx', 'remarkable', 'supernote', 'kindle', 'kobo'];

  return einkDevices.some(device => ua.includes(device));
};

/**
 * Detect current input type from pointer event
 */
export const getInputType = (event: PointerEvent): 'touch' | 'pen' | 'mouse' => {
  return event.pointerType as 'touch' | 'pen' | 'mouse';
};

/**
 * Check if event is from stylus/pen
 */
export const isPenInput = (event: PointerEvent): boolean => {
  return event.pointerType === 'pen';
};

/**
 * Check if event is from finger touch
 */
export const isTouchInput = (event: PointerEvent): boolean => {
  return event.pointerType === 'touch';
};

// ============================================
// ID AND STRING UTILITIES
// ============================================

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// ============================================
// TIMING UTILITIES
// ============================================

/**
 * Debounce function for e-ink-friendly updates
 * Longer default delay for e-ink to prevent ghosting
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = 150 // Longer default for e-ink
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for e-ink - limits how often a function runs
 * Useful for scroll handlers on e-ink
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number = 200 // E-ink friendly limit
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Wait for next animation frame (e-ink safe)
 */
export const nextFrame = (): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
};

/**
 * Wait for DOM to settle before refresh
 */
export const waitAndRefresh = async (delay: number = 50): Promise<void> => {
  await nextFrame();
  await new Promise(resolve => setTimeout(resolve, delay));
  triggerEinkRefresh();
};

// ============================================
// SCROLL UTILITIES (E-ink optimized)
// ============================================

/**
 * Scroll to element without smooth scrolling (instant for e-ink)
 */
export const scrollToElement = (element: HTMLElement, offset: number = 0): void => {
  const rect = element.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY - offset;

  window.scrollTo({
    top: absoluteTop,
    behavior: 'auto' // Never smooth on e-ink
  });

  scheduleRefresh();
};

/**
 * Scroll to bottom of container (for chat)
 */
export const scrollToBottom = (container: HTMLElement): void => {
  container.scrollTop = container.scrollHeight;
  scheduleRefresh();
};

// ============================================
// VISUAL FEEDBACK (E-ink safe)
// ============================================

/**
 * Flash an element to indicate action (e-ink safe inversion)
 */
export const flashElement = (element: HTMLElement): void => {
  element.classList.add('eink-inverted');

  setTimeout(() => {
    element.classList.remove('eink-inverted');
    triggerElementRefresh(element);
  }, 100);
};

/**
 * Add high contrast to element
 */
export const setHighContrast = (element: HTMLElement, enabled: boolean): void => {
  if (enabled) {
    element.classList.add('eink-high-contrast');
  } else {
    element.classList.remove('eink-high-contrast');
  }
};

// ============================================
// CLIPBOARD (Works with stylus selection)
// ============================================

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};
