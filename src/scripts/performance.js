// Performance monitoring and optimization script
// Implements Core Web Vitals tracking and responsive optimizations

// Core Web Vitals monitoring
if (typeof window !== 'undefined') {
  // Lazy load images with native loading attribute fallback
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.dataset.src = img.src;
    });
  } else {
    // Fallback for browsers that don't support native lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    script.async = true;
    document.body.appendChild(script);
  }

  // Monitor Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP observer not supported
    }

    // Monitor First Input Delay (FID) / Interaction to Next Paint (INP)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const delay = entry.processingStart - entry.startTime;
            console.log('FID:', delay);
          }
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID observer not supported
    }

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries = [];
    
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS observer not supported
    }
  }

  // Responsive breakpoint optimizations
  const breakpoints = {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
    wide: 1536
  };

  function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.desktop) return 'desktop';
    if (width < breakpoints.wide) return 'wide';
    return 'ultrawide';
  }

  // Optimize images based on viewport
  function optimizeImagesForViewport() {
    const currentBreakpoint = getCurrentBreakpoint();
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
      const sources = JSON.parse(img.dataset.responsive || '{}');
      if (sources[currentBreakpoint]) {
        img.src = sources[currentBreakpoint];
      }
    });
  }

  // Throttle function for performance
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  // Optimize on resize with throttling
  window.addEventListener('resize', throttle(optimizeImagesForViewport, 250));

  // Preload critical resources based on viewport
  function preloadCriticalResources() {
    const breakpoint = getCurrentBreakpoint();
    
    // Preload hero images based on device
    if (breakpoint === 'mobile') {
      // Mobile-specific preloads
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = '/images/home/hero-mobile.webp';
      document.head.appendChild(link);
    } else {
      // Desktop preloads
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = '/images/home/hero-background.png';
      document.head.appendChild(link);
    }
  }

  // Resource hints for faster navigation
  function setupResourceHints() {
    // Prefetch likely next pages
    const currentPath = window.location.pathname;
    const prefetchMap = {
      '/': ['/about-us/', '/fighters/'],
      '/about-us/': ['/contact-us/', '/box-for-us/'],
      '/fighters/': ['/news/', '/events/'],
      '/news/': ['/events/', '/fighters/'],
      '/events/': ['/events/previous/', '/contact-us/']
    };

    const toPrefetch = prefetchMap[currentPath] || [];
    toPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Network-aware loading
  function adaptToNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Adapt based on network speed
      if (connection.effectiveType === '4g') {
        // High quality for fast connections
        document.body.classList.add('high-quality');
      } else if (connection.effectiveType === '3g') {
        // Standard quality
        document.body.classList.add('standard-quality');
      } else {
        // Reduced quality for slow connections
        document.body.classList.add('reduced-quality');
        
        // Disable animations on very slow connections
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          document.body.classList.add('reduce-motion');
        }
      }

      // Monitor for changes
      connection.addEventListener('change', adaptToNetworkConditions);
    }
  }

  // Initialize performance optimizations
  document.addEventListener('DOMContentLoaded', () => {
    optimizeImagesForViewport();
    preloadCriticalResources();
    setupResourceHints();
    adaptToNetworkConditions();
  });

  // Report Web Vitals to analytics (if available)
  function reportWebVitals(metric) {
    // Send to analytics
    if (window.gtag) {
      gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
      });
    }
  }

  // Load Web Vitals library if available
  if (window.webVitals) {
    webVitals.getCLS(reportWebVitals);
    webVitals.getFID(reportWebVitals);
    webVitals.getLCP(reportWebVitals);
    webVitals.getFCP(reportWebVitals);
    webVitals.getTTFB(reportWebVitals);
  }
}

// Export for use in Astro components
export { getCurrentBreakpoint, optimizeImagesForViewport };