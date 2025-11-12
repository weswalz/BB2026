// 2025 Web Animation Scripts - Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', function() {
  // Create intersection observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animate-on-scroll class
  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });

  // Enhanced button hover effects
  document.querySelectorAll('.biyu-btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(247, 223, 91, 0.3)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = 'none';
    });
  });

  // Parallax effect for hero image (simplified version)
  const heroImage = document.querySelector('.biyu-hero-bg img');
  if (heroImage) {
    let ticking = false;
    
    function updateParallax() {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      heroImage.style.transform = `translate3d(0, ${parallax}px, 0) scale(1.1)`;
      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestTick);
  }

  // Smart header background blur on scroll
  const header = document.querySelector('header');
  if (header) {
    let ticking = false;
    
    function updateHeader() {
      const scrolled = window.pageYOffset;
      const opacity = Math.min(scrolled / 100, 0.95);
      const blur = Math.min(scrolled / 10, 20);
      
      header.style.backgroundColor = `rgba(255, 255, 255, ${Math.min(opacity * 0.2, 0.15)})`;
      header.style.backdropFilter = `blur(${Math.min(blur, 5)}px)`;
      ticking = false;
    }

    function requestHeaderTick() {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestHeaderTick);
  }

  // Text shimmer effect on hover for gradient text
  document.querySelectorAll('.text-gradient').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.backgroundSize = '200% 200%';
      this.style.animation = 'gradientShift 0.5s ease-in-out';
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.animation = 'gradientShift 3s ease-in-out infinite';
    });
  });

});