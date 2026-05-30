export function initHeaderScroll() {
  const header = document.getElementById('header');

  if (!header) {
    return;
  }

  let scrollFrameId = null;
  let isHeaderScrolled = null;

  function updateHeaderState() {
    scrollFrameId = null;

    const shouldBeScrolled = window.scrollY > 100;

    if (shouldBeScrolled === isHeaderScrolled) {
      return;
    }

    header.classList.toggle('header--scrolled', shouldBeScrolled);
    isHeaderScrolled = shouldBeScrolled;
  }

  function requestHeaderUpdate() {
    if (scrollFrameId !== null) {
      return;
    }

    scrollFrameId = window.requestAnimationFrame(updateHeaderState);
  }

  updateHeaderState();

  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
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
        smoothScrollToSection(href, {
          onComplete: function () {
            applyContactPrefill(button);
            focusContactMessage(button);
          },
        });
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
        smoothScrollToSection(href, {
          onComplete: function () {
            applyContactPrefill(aboutButton);
            focusContactMessage(aboutButton);
          },
        });
      }
    });
  }
}

export function initMobileMenuSupport() {
  const menuCheckbox = document.querySelector('.header__menu-checkbox');
  const menuButton = document.querySelector('.header__menu-button');
  const menuLinks = document.querySelectorAll('.header__menu-link');
  const desktopBreakpoint = 900;
  let resizeFrameId = null;

  if (!menuCheckbox || !menuButton) {
    return;
  }

  function syncMenuButtonState() {
    menuButton.setAttribute(
      'aria-expanded',
      menuCheckbox.checked ? 'true' : 'false'
    );
  }

  function closeMenu() {
    if (!menuCheckbox.checked) {
      syncMenuButtonState();
      return;
    }

    menuCheckbox.checked = false;
    syncMenuButtonState();
  }

  syncMenuButtonState();

  menuCheckbox.addEventListener('change', syncMenuButtonState);

  menuLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', function () {
    if (resizeFrameId !== null) {
      return;
    }

    resizeFrameId = window.requestAnimationFrame(function () {
      resizeFrameId = null;

      if (window.innerWidth > desktopBreakpoint) {
        closeMenu();
      }
    });
  });
}

export function initActionScrollFromUrl() {
  const actionTargets = {
    contact: '#contact',
    services: '#services',
    background: '#background',
    portfolio: '#portfolio',
    blog: '#blog',
    faq: '#faq',
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
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const menuLinks = Array.from(document.querySelectorAll('.header__menu-link'));

  if (sections.length === 0 || menuLinks.length === 0) {
    return;
  }

  let sectionMetrics = [];
  let activeSectionId = null;
  let scrollFrameId = null;
  let resizeFrameId = null;

  function measureSections() {
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 0;

    sectionMetrics = sections.map(function (section) {
      const sectionTop = section.offsetTop - headerHeight - 100;

      return {
        id: section.getAttribute('id'),
        top: sectionTop,
        bottom: sectionTop + section.offsetHeight,
      };
    });
  }

  function setActiveMenuItem(nextSectionId) {
    if (nextSectionId === activeSectionId) {
      return;
    }

    activeSectionId = nextSectionId;

    menuLinks.forEach(function (link) {
      const href = link.getAttribute('href');

      link.classList.toggle(
        'header__menu-link--active',
        href === '#' + nextSectionId
      );
    });
  }

  function updateActiveMenuItem() {
    scrollFrameId = null;

    const scrollPosition = window.scrollY;
    let current = '';

    sectionMetrics.forEach(function (section) {
      if (
        scrollPosition >= section.top
        && scrollPosition < section.bottom
      ) {
        current = section.id;
      }
    });

    setActiveMenuItem(current);
  }

  function requestActiveMenuUpdate() {
    if (scrollFrameId !== null) {
      return;
    }

    scrollFrameId = window.requestAnimationFrame(updateActiveMenuItem);
  }

  function requestSectionMeasure() {
    if (resizeFrameId !== null) {
      return;
    }

    resizeFrameId = window.requestAnimationFrame(function () {
      resizeFrameId = null;
      measureSections();
      requestActiveMenuUpdate();
    });
  }

  measureSections();
  updateActiveMenuItem();

  window.addEventListener('load', requestSectionMeasure, { once: true });
  window.addEventListener('resize', requestSectionMeasure);
  window.addEventListener('orientationchange', requestSectionMeasure);
  window.addEventListener('scroll', requestActiveMenuUpdate, {
    passive: true,
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

function applyContactPrefill(element) {
  const prefillText = element.getAttribute('data-contact-prefill');
  const targetFieldId =
    element.getAttribute('data-contact-target') || 'contact-message';

  if (!prefillText) {
    return;
  }

  const targetField = document.getElementById(targetFieldId);

  if (!targetField) {
    return;
  }

  targetField.value = prefillText;
}

function focusContactMessage(element) {
  if (!element.hasAttribute('data-contact-prefill')) {
    return;
  }

  const targetFieldId =
    element.getAttribute('data-contact-target') || 'contact-message';
  const targetField = document.getElementById(targetFieldId);

  if (!targetField) {
    return;
  }

  targetField.focus();
  targetField.setSelectionRange(
    targetField.value.length,
    targetField.value.length
  );
}
