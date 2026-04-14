var CONTACT_API_URL = '/api/contact';
var SITE_CONFIG = {
  consent: {
    storageKey: 'alexTsiConsent.v1',
    version: '2026-04-08',
  },
  analytics: {
    ga4MeasurementId: '',
  },
  monitoring: {
    newRelic: {
      loaderUrl: 'https://js-agent.newrelic.com/nr-loader-spa-current.min.js',
      accountId: '',
      trustKey: '',
      agentId: '',
      licenseKey: '',
      applicationId: '',
    },
  },
};
var consentMemoryState = null;
var consentRuntime = {
  banner: null,
  modal: null,
  previousActiveElement: null,
  gaLoaded: false,
  nrLoaded: false,
  isModalOpen: false,
};

document.addEventListener('DOMContentLoaded', function () {
  initConsentManager();
  initHeaderScroll();
  initSmoothScroll();
  initActiveMenuItems();
  initParallax();
  initAnimatedText();
  initMovingAnimation();
  initWowAnimations();
  initTiltEffect();
  initProgressBars();
  initPortfolioNav();
  initTocScrollspy();
  initContactForm();
  initScrollToTop();

  // Check for URL params to scroll to sections
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'contact') {
    // Wait a bit for page to render
    setTimeout(function () {
      smoothScrollToSection('#contact');
    }, 300);
  }

  if (urlParams.get('action') === 'background') {
    // Wait a bit for page to render
    setTimeout(function () {
      smoothScrollToSection('#background');
    }, 300);
  }

  if (urlParams.get('action') === 'portfolio') {
    // Wait a bit for page to render
    setTimeout(function () {
      smoothScrollToSection('#portfolio');
    }, 300);
  }

  if (urlParams.get('action') === 'blog') {
    // Wait a bit for page to render
    setTimeout(function () {
      smoothScrollToSection('#blog');
    }, 300);
  }
});

function initConsentManager() {
  injectConsentUi();
  bindConsentManagerEvents();

  var storedState = getStoredConsentState();

  if (storedState) {
    syncConsentInputs(storedState);
    hideConsentBanner();
    applyConsentState(storedState);
    return;
  }

  syncConsentInputs(createDefaultConsentState());
  showConsentBanner();
}

function injectConsentUi() {
  if (document.getElementById('cmp-banner')) {
    consentRuntime.banner = document.getElementById('cmp-banner');
    consentRuntime.modal = document.getElementById('cmp-modal');
    return;
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    '<div class="cmp-banner" id="cmp-banner" hidden>' +
      '<div class="cmp-banner__inner">' +
        '<div class="cmp-banner__copy">' +
          '<p class="cmp-banner__text">We use cookies and collect analytics to improve your experience on our website. Click Accept to allow cookies, Google Analytics, and New Relic on this site. You can update your choice at any time in Cookie Settings.</p>' +
        '</div>' +
        '<div class="cmp-banner__actions">' +
          '<button class="cmp-button cmp-button--primary" id="cmp-accept-button" type="button">Accept</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="cmp-modal" id="cmp-modal" hidden>' +
      '<div class="cmp-modal__backdrop" data-cmp-close="true"></div>' +
      '<div class="cmp-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cmp-modal-title" aria-describedby="cmp-modal-description">' +
        '<button class="cmp-modal__close" id="cmp-close-button" type="button" aria-label="Close cookie settings">' +
          '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<div class="cmp-modal__header">' +
          '<p class="cmp-modal__eyebrow">Cookie Settings</p>' +
          '<h2 class="cmp-modal__title" id="cmp-modal-title">Manage your preferences</h2>' +
          '<p class="cmp-modal__description" id="cmp-modal-description">Necessary storage remains active so the site can remember your consent choice. Enable Google Analytics 4 and New Relic browser diagnostics if you want richer usage insight and performance visibility.</p>' +
        '</div>' +
        '<div class="cmp-modal__categories">' +
          '<div class="cmp-category cmp-category--locked">' +
            '<div class="cmp-category__body">' +
              '<div class="cmp-category__copy">' +
                '<div class="cmp-category__head">' +
                  '<p class="cmp-category__title">Strictly necessary</p>' +
                  '<span class="cmp-category__status">Always active</span>' +
                '</div>' +
                '<p class="cmp-category__text">Stores the first-party consent record and keeps core website functions reliable.</p>' +
              '</div>' +
              '<span class="cmp-category__toggle cmp-category__toggle--static" aria-hidden="true">' +
                '<span class="cmp-category__switch cmp-category__switch--active"></span>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<label class="cmp-category cmp-category--optional" for="cmp-analytics-input">' +
            '<input id="cmp-analytics-input" class="cmp-category__checkbox" type="checkbox" />' +
            '<span class="cmp-category__body">' +
              '<span class="cmp-category__copy">' +
                '<span class="cmp-category__title">Analytics</span>' +
                '<span class="cmp-category__text">Allow Google Analytics 4 to measure traffic, page engagement, and content performance.</span>' +
              '</span>' +
              '<span class="cmp-category__toggle" aria-hidden="true">' +
                '<span class="cmp-category__switch"></span>' +
              '</span>' +
            '</span>' +
          '</label>' +
          '<label class="cmp-category cmp-category--optional" for="cmp-monitoring-input">' +
            '<input id="cmp-monitoring-input" class="cmp-category__checkbox" type="checkbox" />' +
            '<span class="cmp-category__body">' +
              '<span class="cmp-category__copy">' +
                '<span class="cmp-category__title">Monitoring</span>' +
                '<span class="cmp-category__text">Allow New Relic browser diagnostics to monitor front-end performance, availability, and browser-side errors.</span>' +
              '</span>' +
              '<span class="cmp-category__toggle" aria-hidden="true">' +
                '<span class="cmp-category__switch"></span>' +
              '</span>' +
            '</span>' +
          '</label>' +
        '</div>' +
        '<div class="cmp-modal__actions">' +
          '<button class="cmp-button cmp-button--ghost cmp-button--modal-ghost" id="cmp-modal-reject-button" type="button">Reject non-essential</button>' +
          '<button class="cmp-button cmp-button--secondary cmp-button--modal-secondary" id="cmp-modal-accept-button" type="button">Accept all</button>' +
          '<button class="cmp-button cmp-button--primary cmp-button--modal-primary" id="cmp-modal-save-button" type="button">Save preferences</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  consentRuntime.banner = document.getElementById('cmp-banner');
  consentRuntime.modal = document.getElementById('cmp-modal');
}

function bindConsentManagerEvents() {
  if (document.body.getAttribute('data-cmp-bound') === 'true') {
    return;
  }

  document.body.setAttribute('data-cmp-bound', 'true');

  var bannerAcceptButton = document.getElementById('cmp-accept-button');
  var modalAcceptButton = document.getElementById('cmp-modal-accept-button');
  var modalRejectButton = document.getElementById('cmp-modal-reject-button');
  var modalSaveButton = document.getElementById('cmp-modal-save-button');
  var closeButton = document.getElementById('cmp-close-button');

  if (bannerAcceptButton) {
    bannerAcceptButton.addEventListener('click', function () {
      commitConsentState({
        version: SITE_CONFIG.consent.version,
        timestamp: new Date().toISOString(),
        categories: {
          analytics: true,
          monitoring: true,
        },
      });
    });
  }

  if (modalAcceptButton) {
    modalAcceptButton.addEventListener('click', function () {
      commitConsentState({
        version: SITE_CONFIG.consent.version,
        timestamp: new Date().toISOString(),
        categories: {
          analytics: true,
          monitoring: true,
        },
      });
    });
  }

  if (modalRejectButton) {
    modalRejectButton.addEventListener('click', function () {
      commitConsentState({
        version: SITE_CONFIG.consent.version,
        timestamp: new Date().toISOString(),
        categories: {
          analytics: false,
          monitoring: false,
        },
      });
    });
  }

  if (modalSaveButton) {
    modalSaveButton.addEventListener('click', function () {
      commitConsentState(readConsentInputs());
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeConsentModal();
    });
  }

  if (consentRuntime.modal) {
    consentRuntime.modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-cmp-close')) {
        closeConsentModal();
      }
    });
  }

  document
    .querySelectorAll('.footer__settings-button')
    .forEach(function (button) {
      button.addEventListener('click', function () {
        openConsentModal();
      });
    });
}

function createDefaultConsentState() {
  return {
    version: SITE_CONFIG.consent.version,
    timestamp: null,
    categories: {
      analytics: false,
      monitoring: false,
    },
  };
}

function getStoredConsentState() {
  var rawState = null;

  try {
    rawState = window.localStorage.getItem(SITE_CONFIG.consent.storageKey);
  } catch {
    rawState = consentMemoryState;
  }

  if (!rawState) {
    return null;
  }

  try {
    var parsedState = JSON.parse(rawState);

    if (
      !parsedState ||
      parsedState.version !== SITE_CONFIG.consent.version ||
      !parsedState.categories
    ) {
      return null;
    }

    return parsedState;
  } catch {
    return null;
  }
}

function persistConsentState(state) {
  var serializedState = JSON.stringify(state);

  try {
    window.localStorage.setItem(
      SITE_CONFIG.consent.storageKey,
      serializedState
    );
  } catch {
    consentMemoryState = serializedState;
  }
}

function syncConsentInputs(state) {
  var analyticsInput = document.getElementById('cmp-analytics-input');
  var monitoringInput = document.getElementById('cmp-monitoring-input');

  if (analyticsInput) {
    analyticsInput.checked = !!state.categories.analytics;
  }

  if (monitoringInput) {
    monitoringInput.checked = !!state.categories.monitoring;
  }
}

function readConsentInputs() {
  var analyticsInput = document.getElementById('cmp-analytics-input');
  var monitoringInput = document.getElementById('cmp-monitoring-input');

  return {
    version: SITE_CONFIG.consent.version,
    timestamp: new Date().toISOString(),
    categories: {
      analytics: analyticsInput ? analyticsInput.checked : false,
      monitoring: monitoringInput ? monitoringInput.checked : false,
    },
  };
}

function commitConsentState(nextState) {
  var previousState = getStoredConsentState();
  var shouldReloadForMonitoringRevocation =
    previousState &&
    previousState.categories.monitoring &&
    !nextState.categories.monitoring &&
    consentRuntime.nrLoaded;

  persistConsentState(nextState);
  syncConsentInputs(nextState);
  hideConsentBanner();
  closeConsentModal();

  if (
    previousState &&
    previousState.categories.analytics &&
    !nextState.categories.analytics
  ) {
    disableGoogleAnalytics();
  }

  applyConsentState(nextState);

  if (shouldReloadForMonitoringRevocation) {
    window.location.reload();
  }
}

function applyConsentState(state) {
  if (state.categories.analytics) {
    enableGoogleAnalytics();
    loadGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
  }

  if (state.categories.monitoring) {
    loadNewRelicBrowser();
  }
}

function showConsentBanner() {
  if (consentRuntime.banner) {
    consentRuntime.banner.hidden = false;
  }
}

function hideConsentBanner() {
  if (consentRuntime.banner) {
    consentRuntime.banner.hidden = true;
  }
}

function openConsentModal() {
  if (!consentRuntime.modal || consentRuntime.isModalOpen) {
    return;
  }

  consentRuntime.previousActiveElement = document.activeElement;
  consentRuntime.modal.hidden = false;
  consentRuntime.isModalOpen = true;
  document.body.classList.add('body--cmp-open');
  document.addEventListener('keydown', handleConsentModalKeydown);

  var firstFocusable = getConsentFocusableElements()[0];

  if (firstFocusable) {
    firstFocusable.focus();
  }
}

function closeConsentModal() {
  if (!consentRuntime.modal || !consentRuntime.isModalOpen) {
    return;
  }

  consentRuntime.modal.hidden = true;
  consentRuntime.isModalOpen = false;
  document.body.classList.remove('body--cmp-open');
  document.removeEventListener('keydown', handleConsentModalKeydown);

  if (
    consentRuntime.previousActiveElement &&
    typeof consentRuntime.previousActiveElement.focus === 'function'
  ) {
    consentRuntime.previousActiveElement.focus();
  }
}

function handleConsentModalKeydown(e) {
  if (!consentRuntime.isModalOpen) {
    return;
  }

  if (e.key === 'Escape') {
    closeConsentModal();
    return;
  }

  if (e.key !== 'Tab') {
    return;
  }

  var focusableElements = getConsentFocusableElements();

  if (focusableElements.length === 0) {
    return;
  }

  var firstElement = focusableElements[0];
  var lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
}

function getConsentFocusableElements() {
  if (!consentRuntime.modal) {
    return [];
  }

  return Array.prototype.slice.call(
    consentRuntime.modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
  );
}

function isGaConfigured() {
  return !!SITE_CONFIG.analytics.ga4MeasurementId;
}

function loadGoogleAnalytics() {
  if (consentRuntime.gaLoaded || !isGaConfigured()) {
    return;
  }

  var measurementId = SITE_CONFIG.analytics.ga4MeasurementId;
  var script = document.createElement('script');

  script.id = 'alex-tsi-ga4-script';
  script.async = true;
  script.src =
    'https://www.googletagmanager.com/gtag/js?id=' +
    encodeURIComponent(measurementId);

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window['ga-disable-' + measurementId] = false;
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    transport_type: 'beacon',
  });

  document.head.appendChild(script);
  consentRuntime.gaLoaded = true;
}

function enableGoogleAnalytics() {
  if (!isGaConfigured()) {
    return;
  }

  var measurementId = SITE_CONFIG.analytics.ga4MeasurementId;

  window['ga-disable-' + measurementId] = false;

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

function disableGoogleAnalytics() {
  if (!isGaConfigured()) {
    return;
  }

  var measurementId = SITE_CONFIG.analytics.ga4MeasurementId;

  window['ga-disable-' + measurementId] = true;

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
}

function isNewRelicConfigured() {
  var config = SITE_CONFIG.monitoring.newRelic;

  return !!(
    config.loaderUrl &&
    config.accountId &&
    config.trustKey &&
    config.agentId &&
    config.licenseKey &&
    config.applicationId
  );
}

function loadNewRelicBrowser() {
  if (consentRuntime.nrLoaded || !isNewRelicConfigured()) {
    return;
  }

  var config = SITE_CONFIG.monitoring.newRelic;
  var script = document.createElement('script');

  window.NREUM = window.NREUM || {};
  window.NREUM.init = {
    privacy: {
      cookies_enabled: true,
    },
    ajax: {
      deny_list: ['bam.nr-data.net'],
    },
  };
  window.NREUM.loader_config = {
    accountID: config.accountId,
    trustKey: config.trustKey,
    agentID: config.agentId,
    licenseKey: config.licenseKey,
    applicationID: config.applicationId,
  };
  window.NREUM.info = {
    beacon: 'bam.nr-data.net',
    errorBeacon: 'bam.nr-data.net',
    licenseKey: config.licenseKey,
    applicationID: config.applicationId,
    sa: 1,
  };

  script.id = 'alex-tsi-newrelic-script';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = config.loaderUrl;

  document.head.appendChild(script);
  consentRuntime.nrLoaded = true;
}

function initHeaderScroll() {
  const header = document.getElementById('header');

  if (!header) {
    return;
  }

  // Handle scroll dynamically
  function handleScroll() {
    if (window.scrollY > 100) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  // Check initial scroll position
  handleScroll();

  window.addEventListener('scroll', handleScroll);
}

function initSmoothScroll() {
  // Handle menu links
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

  // Handle hero buttons
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

  // Handle logo link
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

  // Handle hero mail link
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

  // Handle about button
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

function smoothScrollToSection(href) {
  const targetId = href.substring(1);
  const targetSection = document.getElementById(targetId);

  if (targetSection) {
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetSection.offsetTop - headerHeight;

    // Use smooth scroll with better browser support
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    } else {
      // Fallback for browsers that don't support smooth scroll
      smoothScrollFallback(targetPosition);
    }
  }
}

function smoothScrollFallback(targetPosition) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 800; // milliseconds
  let start = null;

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const percentage = Math.min(progress / duration, 1);

    // Easing function (ease-in-out)
    const ease =
      percentage < 0.5
        ? 2 * percentage * percentage
        : 1 - Math.pow(-2 * percentage + 2, 2) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < duration) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function initActiveMenuItems() {
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

function initParallax() {
  const parallaxElement = document.querySelector('.parallax');

  if (!parallaxElement) {
    return;
  }

  if (typeof Parallax === 'undefined') {
    console.error(
      'Parallax: Library not loaded. Check if parallax-js is properly included.'
    );
    return;
  }

  // Check if layers are found
  const layers = parallaxElement.getElementsByClassName('layer');
  console.log('Parallax: Found layers', layers.length);

  new Parallax(parallaxElement, {
    relativeInput: true,
    hoverOnly: false,
    calibrateX: true,
    calibrateY: true,
    invertX: false,
    invertY: false,
    limitX: false,
    limitY: false,
    scalarX: 10,
    scalarY: 10,
    frictionX: 0.05,
    frictionY: 0.05,
    originX: 0.5,
    originY: 0.5,
  });

  console.log('Parallax: Initialized successfully');
}

function initAnimatedText() {
  const headlines = document.querySelectorAll('.hero__job-animated--rotate');

  if (headlines.length === 0) {
    return;
  }

  // Animation settings
  const animationDelay = 2000; // 2 seconds between word changes

  headlines.forEach(function (headline) {
    const wordsWrapper = headline.querySelector('.hero__job-words');
    if (!wordsWrapper) return;

    const words = wordsWrapper.querySelectorAll('b');
    if (words.length === 0) return;

    // Set width of wrapper to the longest word
    let maxWidth = 0;
    words.forEach(function (word) {
      const wordWidth = word.offsetWidth;
      if (wordWidth > maxWidth) {
        maxWidth = wordWidth;
      }
    });
    wordsWrapper.style.width = maxWidth + 'px';

    // Start animation
    let currentIndex = 0;

    function hideWord() {
      const currentWord = words[currentIndex];
      if (!currentWord) return;

      // Get next word index
      currentIndex = (currentIndex + 1) % words.length;
      const nextWord = words[currentIndex];

      // Switch words simultaneously (like in original)
      // Old word: remove is-visible, add is-hidden
      currentWord.classList.remove('is-visible');
      currentWord.classList.add('is-hidden');

      // New word: remove is-hidden, add is-visible
      nextWord.classList.remove('is-hidden');
      nextWord.classList.add('is-visible');

      // Continue animation
      setTimeout(hideWord, animationDelay);
    }

    // Start animation after initial delay
    setTimeout(hideWord, animationDelay);
  });

  console.log('Animated text: Initialized successfully');
}

function initMovingAnimation() {
  const elements = document.querySelectorAll('.moving_effect');

  if (elements.length === 0) {
    return;
  }

  function updateElementPosition(element) {
    const direction = element.getAttribute('data-direction');
    const reverse = element.getAttribute('data-reverse') === 'yes';
    const offset = window.pageYOffset || window.scrollY;
    const h = window.innerHeight;

    // Get element position relative to document
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + offset;
    let i = elementTop - offset - h;

    if (reverse) {
      i *= -1;
    }

    let x = direction === 'x' ? (i * 70) / h : 0;
    let y = direction === 'x' ? 0 : (i * 70) / h;

    if (reverse) {
      i *= -1;
    }

    if (i * -1 < h + 300 && i < 300) {
      element.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
    }
  }

  // Update all elements on scroll
  window.addEventListener('scroll', function () {
    elements.forEach(function (element) {
      updateElementPosition(element);
    });
  });

  // Initial update
  elements.forEach(function (element) {
    updateElementPosition(element);
  });

  console.log('Moving animation: Initialized successfully');
}

function initWowAnimations() {
  if (typeof WOW === 'undefined') {
    console.warn('WOW: Library not loaded. Skipping scroll animations.');
    return;
  }

  new WOW({
    boxClass: 'wow',
    animateClass: 'animate__animated',
    offset: 80,
    mobile: true,
    live: true,
  }).init();
}

function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-effect');

  if (tiltCards.length === 0) {
    return;
  }

  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
    return;
  }

  if (typeof jQuery === 'undefined' || !jQuery.fn || !jQuery.fn.tilt) {
    console.warn('Tilt: Library not loaded. Skipping tilt effects.');
    return;
  }

  jQuery(tiltCards).tilt({
    maxTilt: 10,
    perspective: 900,
    scale: 1.02,
    easing: 'cubic-bezier(.03,.98,.52,.99)',
    speed: 500,
    transition: true,
    glare: false,
  });
}

function initProgressBars() {
  const skillsSection = document.querySelector('.skills');

  if (!skillsSection) {
    return;
  }

  const progressItems = skillsSection.querySelectorAll(
    '.skills__progress-item'
  );

  if (progressItems.length === 0) {
    return;
  }

  // Use Intersection Observer for better performance
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            progressItems.forEach(function (item) {
              const value = parseInt(item.getAttribute('data-value'), 10);
              const barWrap = item.querySelector('.skills__progress-bar');
              const barInner = item.querySelector(
                '.skills__progress-bar-inner'
              );

              if (barWrap && barInner && !barWrap.classList.contains('open')) {
                barInner.style.width = value + '%';
                setTimeout(function () {
                  barWrap.classList.add('open');
                }, 100);
              }
            });

            observer.unobserve(skillsSection);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(skillsSection);
  } else {
    // Fallback for older browsers
    function checkViewport() {
      const rect = skillsSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        progressItems.forEach(function (item) {
          const value = parseInt(item.getAttribute('data-value'), 10);
          const barWrap = item.querySelector('.skills__progress-bar');
          const barInner = item.querySelector('.skills__progress-bar-inner');

          if (barWrap && barInner && !barWrap.classList.contains('open')) {
            barInner.style.width = value + '%';
            setTimeout(function () {
              barWrap.classList.add('open');
            }, 100);
          }
        });

        window.removeEventListener('scroll', checkViewport);
      }
    }

    window.addEventListener('scroll', checkViewport);
    checkViewport();
  }

  console.log('Progress bars: Initialized successfully');
}

function initPortfolioNav() {
  const nav = document.querySelector('.portfolio-page__nav');

  if (!nav) {
    return;
  }

  // Check if we're on a large screen (same breakpoint as CSS)
  if (window.innerWidth < 1201) {
    return;
  }

  const navLinks = nav.querySelectorAll('.portfolio-page__nav-link');
  const activeClass = 'portfolio-page__nav-link--active';

  // Get all sections that can be tracked (about, experience, and year sections if they exist)
  const sections = document.querySelectorAll('section[id]');

  // Also get project items to track by year
  const projectItems = document.querySelectorAll(
    '.portfolio-page__experience-item'
  );

  // Create a map of year to project items
  const yearToProjects = {};

  projectItems.forEach(function (item) {
    const dateElement = item.querySelector('.portfolio-page__experience-date');
    if (!dateElement) return;

    // Get year from data-years attribute (single year, e.g., "2024")
    // Note: supports comma-separated values for backward compatibility, but typically contains single year
    const yearsAttr = dateElement.getAttribute('data-years');

    if (yearsAttr) {
      const years = yearsAttr.split(',').map(function (year) {
        return year.trim();
      });

      years.forEach(function (year) {
        if (year && /^\d{4}$/.test(year)) {
          if (!yearToProjects[year]) {
            yearToProjects[year] = [];
          }
          yearToProjects[year].push(item);
        }
      });
    }
  });

  // Function to update active nav link
  function updateActiveNavLink(targetId) {
    navLinks.forEach(function (link) {
      link.classList.remove(activeClass);
    });

    const activeLink = nav.querySelector(`a[href="#${targetId}"]`);
    if (activeLink) {
      activeLink.classList.add(activeClass);
    }
  }

  // Create Intersection Observer for sections
  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;

          // If it's the about section, activate the first year (2024)
          if (sectionId === 'about') {
            updateActiveNavLink('2024');
            return;
          }

          // If it's the experience section, check which projects are visible
          if (sectionId === 'experience') {
            // Check which year's projects are most visible
            checkVisibleYear();
            return;
          }

          // For other sections, activate corresponding nav link
          updateActiveNavLink(sectionId);
        }
      });
    },
    {
      rootMargin: '20% 0% -50% 0%',
      threshold: 0,
    }
  );

  // Observe all sections
  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // Function to check which year's projects are most visible
  function checkVisibleYear() {
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if we're near the bottom of the page
    const isAtBottom =
      window.innerHeight + scrollPosition >= documentHeight - 50;

    // "Sticky Focus" Logic:
    // The active project is the last one that has started (top <= Focus Line).
    // Focus Line at 25% of viewport height (just below header + offset)
    const focusLine = viewportHeight * 0.25;

    let activeYear = null;
    let lastVisibleYear = null; // To track the very last visible project

    // Iterate through project items in DOM order (reliable)
    projectItems.forEach(function (item) {
      const rect = item.getBoundingClientRect();
      const dateElement = item.querySelector(
        '.portfolio-page__experience-date'
      );
      if (!dateElement) return;

      const yearsAttr = dateElement.getAttribute('data-years');
      if (!yearsAttr) return;

      const year = yearsAttr.split(',')[0].trim(); // Take the first year

      // If project has started (its top crossed the focus line)
      if (rect.top <= focusLine) {
        activeYear = year;
      }

      // Track if this project is visible at all
      if (rect.top < viewportHeight && rect.bottom > 0) {
        lastVisibleYear = year;
      }
    });

    // If we are at the bottom, and the sticky logic didn't pick the last visible year
    // (e.g. the last project is small and didn't reach the focus line),
    // we might want to activate it IF the previous one is mostly scrolled out.
    // BUT user specifically asked to fix 2018 vs 2017 issue.
    // The issue was that 2018 was active, but bottom check forced 2017.
    // By removing the forced bottom check and relying on Sticky Focus, 2018 will stay active
    // until 2017 actually crosses the line.

    // Exception: If we are at the very bottom, and the last project IS visible,
    // AND the current active project is the one right before it,
    // we might want to switch only if the last project is significant enough?
    // Let's just stick to Sticky Focus as it's the most predictable.
    // However, if the LAST project is fully visible but hasn't crossed the line (super short page end),
    // users might expect it to be active.

    // Refined logic for bottom:
    // If at bottom, force the last visible year ONLY if it's the very last project in the list.
    if (isAtBottom && lastVisibleYear) {
      const years = Object.keys(yearToProjects)
        .map(Number)
        .sort((a, b) => a - b);
      const earliestYear = years[0].toString(); // 2017

      // If the last visible year is indeed the earliest (last in list)
      if (lastVisibleYear === earliestYear) {
        // Check if it takes up significant space or is the only thing we see?
        // No, let's just allow it to be active if we are strictly at bottom.
        // BUT only if we are REALLY at the bottom.
        activeYear = lastVisibleYear;
      }
    }

    if (activeYear) {
      updateActiveNavLink(activeYear);
    }
  }

  // Also observe project items for more precise tracking
  const projectObserver = new IntersectionObserver(
    function () {
      if (!isClickScrolling) {
        checkVisibleYear();
      }
    },
    {
      rootMargin: '20% 0% -30% 0%',
      threshold: [0, 0.25, 0.5, 0.75, 1], // Trigger more often
    }
  );

  // Observe all project items
  projectItems.forEach(function (item) {
    projectObserver.observe(item);
  });

  // Flag to prevent scroll updates when clicking
  let isClickScrolling = false;
  let clickScrollTimeout;

  // Add scroll event listener for more responsive updates (throttled)
  let isScrolling = false;
  window.addEventListener('scroll', function () {
    if (!isScrolling) {
      window.requestAnimationFrame(function () {
        if (!isClickScrolling) {
          checkVisibleYear();
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  // Handle navigation clicks - scroll to first project of selected year
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');

      if (href && href.startsWith('#')) {
        const year = href.substring(1);

        // Find first project for this year
        const yearProjects = yearToProjects[year];

        if (yearProjects && yearProjects.length > 0) {
          e.preventDefault();

          // Set manual flag
          isClickScrolling = true;

          // Manually update active link immediately
          updateActiveNavLink(year);

          const firstProject = yearProjects[0];
          const projectTop =
            firstProject.getBoundingClientRect().top + window.scrollY;
          const header = document.getElementById('header');
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition = projectTop - headerHeight - 80;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });

          // Reset flag after scroll animation (approx 1000ms)
          if (clickScrollTimeout) clearTimeout(clickScrollTimeout);
          clickScrollTimeout = setTimeout(() => {
            isClickScrolling = false;
            // Perform one check after scrolling finishes to ensure consistency
            checkVisibleYear();
          }, 1000);
        }
      }
    });
  });

  // Initial check
  checkVisibleYear();
}

function initTocScrollspy() {
  var tocLinks = document.querySelectorAll('.toc__link');

  if (tocLinks.length === 0) {
    return;
  }

  var activeClass = 'toc__link--active';

  // Build an ordered list of { link, target } pairs
  var tocItems = [];
  tocLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      var target = document.getElementById(href.substring(1));
      if (target) {
        tocItems.push({ link: link, target: target });
      }
    }
  });

  if (tocItems.length === 0) {
    return;
  }

  var isClickScrolling = false;
  var clickScrollTimeout;

  function updateActiveTocLink(activeLink) {
    tocLinks.forEach(function (link) {
      link.classList.remove(activeClass);
    });
    if (activeLink) {
      activeLink.classList.add(activeClass);
    }
  }

  function checkActiveSection() {
    var viewportHeight = window.innerHeight;
    var scrollPosition = window.scrollY;
    var documentHeight = document.documentElement.scrollHeight;
    var focusLine = viewportHeight * 0.25;
    var isAtBottom = window.innerHeight + scrollPosition >= documentHeight - 50;

    if (isAtBottom) {
      updateActiveTocLink(tocItems[tocItems.length - 1].link);
      return;
    }

    var activeLink = null;
    tocItems.forEach(function (item) {
      var rect = item.target.getBoundingClientRect();
      if (rect.top <= focusLine) {
        activeLink = item.link;
      }
    });

    updateActiveTocLink(activeLink);
  }

  // Throttled scroll handler
  var isScrolling = false;
  window.addEventListener('scroll', function () {
    if (!isScrolling) {
      window.requestAnimationFrame(function () {
        if (!isClickScrolling) {
          checkActiveSection();
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  // Handle TOC link clicks
  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var target = document.getElementById(href.substring(1));
        if (target) {
          e.preventDefault();

          isClickScrolling = true;
          updateActiveTocLink(link);

          var targetTop = target.getBoundingClientRect().top + window.scrollY;
          var offset = 80;

          window.scrollTo({
            top: targetTop - offset,
            behavior: 'smooth',
          });

          if (clickScrollTimeout) {
            clearTimeout(clickScrollTimeout);
          }
          clickScrollTimeout = setTimeout(function () {
            isClickScrolling = false;
            checkActiveSection();
          }, 1000);
        }
      }
    });
  });

  // Initial check
  checkActiveSection();
}

function initContactForm() {
  var form = document.getElementById('contact-form');

  if (!form) {
    return;
  }

  var submitButton = document.getElementById('contact-submit');
  var nameInput = document.getElementById('contact-name');
  var emailInput = document.getElementById('contact-email');
  var messageInput = document.getElementById('contact-message');
  var errorBox = document.getElementById('contact-error');
  var successBox = document.getElementById('contact-success');

  function showError(text) {
    errorBox.textContent = text;
    errorBox.style.display = 'block';
    successBox.style.display = 'none';
  }

  function showSuccess(text) {
    successBox.textContent = text;
    successBox.style.display = 'block';
    errorBox.style.display = 'none';
  }

  function hideMessages() {
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideMessages();

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var message = messageInput.value.trim();

    if (!name || !email || !message) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    submitButton.classList.add('contact__submit--disabled');
    submitButton.disabled = true;

    fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message }),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server responded with status ' + response.status);
        }
        return response.json();
      })
      .then(function () {
        showSuccess(
          'Your message has been sent successfully. I will get back to you soon!'
        );
        form.reset();
      })
      .catch(function () {
        showError(
          'Something went wrong. Please try again or contact me directly via email.'
        );
      })
      .finally(function () {
        submitButton.classList.remove('contact__submit--disabled');
        submitButton.disabled = false;
      });
  });
}

function initScrollToTop() {
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
