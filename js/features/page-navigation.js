export function initHeaderScroll() {
  const header = document.getElementById('header');

  if (!header) {
    return;
  }

  function handleScroll() {
    if (window.scrollY > 100) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  handleScroll();

  window.addEventListener('scroll', handleScroll);
}

export function initSmoothScroll() {
  const menuLinks = document.querySelectorAll('.header__menu-link');

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  });

  const heroButtons = document.querySelectorAll('.hero__button');

  heroButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      const href = button.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  });

  const logoLink = document.querySelector('.header__logo a');

  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      const href = logoLink.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  }

  const heroMailLink = document.querySelector('.hero__mail-link');

  if (heroMailLink) {
    heroMailLink.addEventListener('click', function (e) {
      const href = heroMailLink.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  }

  const aboutButton = document.querySelector('.about__button-link');

  if (aboutButton) {
    aboutButton.addEventListener('click', function (e) {
      const href = aboutButton.getAttribute('href');

      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  }
}

export function initActionScrollFromUrl() {
  const actionTargets = {
    contact: '#contact',
    background: '#background',
    portfolio: '#portfolio',
    blog: '#blog',
  };
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const targetHref = actionTargets[action];

  if (!targetHref) {
    return;
  }

  setTimeout(function () {
    smoothScrollToSection(targetHref, {
      onComplete: function () {
        replaceLandingUrlWithCleanRoot();
      },
    });
  }, 300);
}

export function initActiveMenuItems() {
  const sections = document.querySelectorAll('section[id]');
  const menuLinks = document.querySelectorAll('.header__menu-link');

  window.addEventListener('scroll', function () {
    let current = '';
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 0;

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - headerHeight - 100;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        current = section.getAttribute('id');
      }
    });

    menuLinks.forEach(function (link) {
      link.classList.remove('header__menu-link--active');
      const href = link.getAttribute('href');

      if (href === '#' + current) {
        link.classList.add('header__menu-link--active');
      }
    });
  });
}

export function initScrollToTop() {
  var totopLink = document.querySelector('.footer__totop-link');

  if (!totopLink) {
    return;
  }

  totopLink.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

function smoothScrollToSection(href, options) {
  const targetId = href.substring(1);
  const targetSection = document.getElementById(targetId);
  const scrollOptions = options || {};
  const onComplete = scrollOptions.onComplete;

  if (targetSection) {
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetSection.offsetTop - headerHeight;

    if (Math.abs(window.scrollY - targetPosition) <= 2) {
      if (typeof onComplete === 'function') {
        onComplete();
      }

      return;
    }

    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      waitForScrollCompletion(targetPosition, onComplete);
    } else {
      smoothScrollFallback(targetPosition, onComplete);
    }
  }
}

function waitForScrollCompletion(targetPosition, onComplete) {
  if (typeof onComplete !== 'function') {
    return;
  }

  let isCompleted = false;

  function complete() {
    if (isCompleted) {
      return;
    }

    isCompleted = true;
    onComplete();
  }

  if ('onscrollend' in window || 'onscrollend' in document) {
    const maxWaitTime = 1600;

    function handleScrollEnd() {
      document.removeEventListener('scrollend', handleScrollEnd);
      window.clearTimeout(timeoutId);
      complete();
    }

    const timeoutId = window.setTimeout(function () {
      document.removeEventListener('scrollend', handleScrollEnd);
      complete();
    }, maxWaitTime);

    document.addEventListener('scrollend', handleScrollEnd, { once: true });
    return;
  }

  const maxWaitTime = 1600;
  const tolerance = 2;
  const stableThreshold = 1;
  const stableFramesRequired = 4;
  const startTime = performance.now();
  let lastPosition = window.scrollY;
  let stableFrames = 0;
  let hasMoved = false;

  function checkScrollPosition() {
    const currentPosition = window.scrollY;
    const movedBy = Math.abs(currentPosition - lastPosition);

    if (movedBy > stableThreshold) {
      hasMoved = true;
      stableFrames = 0;
    } else if (hasMoved) {
      stableFrames += 1;
    }

    const reachedTarget =
      Math.abs(currentPosition - targetPosition) <= tolerance;
    const isStable = hasMoved && stableFrames >= stableFramesRequired;
    const hasTimedOut = performance.now() - startTime >= maxWaitTime;

    if ((hasMoved && (reachedTarget || isStable)) || hasTimedOut) {
      complete();
      return;
    }

    lastPosition = currentPosition;
    window.requestAnimationFrame(checkScrollPosition);
  }

  window.requestAnimationFrame(checkScrollPosition);
}

function smoothScrollFallback(targetPosition, onComplete) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 800;
  let start = null;

  function step(timestamp) {
    if (!start) {
      start = timestamp;
    }

    const progress = timestamp - start;
    const percentage = Math.min(progress / duration, 1);
    const ease =
      percentage < 0.5
        ? 2 * percentage * percentage
        : 1 - Math.pow(-2 * percentage + 2, 2) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < duration) {
      window.requestAnimationFrame(step);
    } else if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  window.requestAnimationFrame(step);
}

function getCleanLandingUrl() {
  const cleanUrl = new URL(window.location.href);

  cleanUrl.search = '';
  cleanUrl.hash = '';

  if (cleanUrl.pathname.endsWith('/index.html')) {
    cleanUrl.pathname = cleanUrl.pathname.slice(0, -'index.html'.length);
  }

  return cleanUrl.pathname || '/';
}

function replaceLandingUrlWithCleanRoot() {
  const currentUrl =
    window.location.pathname + window.location.search + window.location.hash;
  const cleanUrl = getCleanLandingUrl();

  if (currentUrl !== cleanUrl) {
    window.history.replaceState(window.history.state, document.title, cleanUrl);
  }
}
