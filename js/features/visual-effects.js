const HERO_MOBILE_QUERY = '(max-width: 37.5em)';
const HERO_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const HERO_MOBILE_MIN_SPEED = 5;
const HERO_MOBILE_MAX_SPEED = 9;
const HERO_MOBILE_MIN_DRIFT_DELAY = 4000;
const HERO_MOBILE_MAX_DRIFT_DELAY = 7000;
const HERO_MOBILE_MIN_DRIFT_ANGLE = 10;
const HERO_MOBILE_MAX_DRIFT_ANGLE = 18;
const HERO_MOBILE_BOUNCE_VARIATION = 4.5;
const HERO_MOBILE_MAX_FRAME_DELTA = 0.05;
const HERO_MOBILE_ICON_SELECTORS = [
  '.hero__icon--csharp',
  '.hero__icon--dotnet',
  '.hero__icon--azure',
  '.hero__icon--docker',
  '.hero__icon--kubernetes',
  '.hero__icon--aws',
  '.hero__icon--azuredevops',
  '.hero__icon--devops',
  '.hero__icon--javascript',
  '.hero__icon--sql',
  '.hero__icon--react',
];

let heroParallaxInstance = null;
let heroMotionControllerInitialized = false;
let heroMotionMediaQuery = null;
let heroReducedMotionMediaQuery = null;
let heroMotionMediaQueryListener = null;
let heroReducedMotionMediaQueryListener = null;

const heroMobileMotionState = {
  active: false,
  animationFrameId: null,
  resizeFrameId: null,
  intersectionObserver: null,
  heroSection: null,
  heroInner: null,
  icons: [],
  isVisible: true,
  lastFrameTime: null,
  resizeHandler: null,
};

export function initParallax() {
  const parallaxElement = getHeroParallaxScene();

  if (!parallaxElement) {
    return;
  }

  if (!heroMotionControllerInitialized) {
    heroMotionControllerInitialized = true;
    heroMotionMediaQuery = window.matchMedia
      ? window.matchMedia(HERO_MOBILE_QUERY)
      : null;
    heroReducedMotionMediaQuery = window.matchMedia
      ? window.matchMedia(HERO_REDUCED_MOTION_QUERY)
      : null;

    heroMotionMediaQueryListener = function () {
      syncHeroMotionMode();
    };
    heroReducedMotionMediaQueryListener = function () {
      syncHeroMotionMode();
    };

    if (heroMotionMediaQuery) {
      addMediaQueryListener(
        heroMotionMediaQuery,
        heroMotionMediaQueryListener
      );
    }

    if (heroReducedMotionMediaQuery) {
      addMediaQueryListener(
        heroReducedMotionMediaQuery,
        heroReducedMotionMediaQueryListener
      );
    }
  }

  syncHeroMotionMode();
}

function addMediaQueryListener(mediaQuery, listener) {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return;
  }

  if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(listener);
  }
}

function syncHeroMotionMode() {
  if (isHeroMobileViewport()) {
    stopHeroParallax();

    if (prefersReducedMotion()) {
      stopHeroMobileFloatingIcons();
      clearHeroMobileTransforms();
      return;
    }

    startHeroMobileFloatingIcons();
    return;
  }

  stopHeroMobileFloatingIcons();
  clearHeroMobileTransforms();
  startHeroParallax();
}

function startHeroParallax() {
  const parallaxElement = getHeroParallaxScene();

  if (!parallaxElement || heroParallaxInstance) {
    return;
  }

  if (typeof Parallax === 'undefined') {
    console.error(
      'Parallax: Library not loaded. Check if parallax-js is properly included.'
    );
    return;
  }

  const layers = parallaxElement.getElementsByClassName('layer');
  console.log('Parallax: Found layers', layers.length);

  heroParallaxInstance = new Parallax(parallaxElement, {
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

function stopHeroParallax() {
  if (!heroParallaxInstance) {
    return;
  }

  heroParallaxInstance.destroy();
  heroParallaxInstance = null;
}

function startHeroMobileFloatingIcons() {
  const state = heroMobileMotionState;
  const heroSection = getHeroSection();
  const heroInner = getHeroInner();
  const iconElements = getHeroMobileIconElements(heroInner);

  if (state.active || !heroSection || !heroInner || iconElements.length === 0) {
    return;
  }

  state.active = true;
  state.heroSection = heroSection;
  state.heroInner = heroInner;
  state.isVisible = true;
  state.lastFrameTime = null;
  state.icons = iconElements.map(function (element) {
    const velocity = createHeroMobileVelocity();

    return {
      element,
      baseX: 0,
      baseY: 0,
      x: 0,
      y: 0,
      vx: velocity.vx,
      vy: velocity.vy,
      width: 0,
      height: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      nextDriftAt: 0,
    };
  });

  clearHeroMobileTransforms();

  state.animationFrameId = window.requestAnimationFrame(function (timestamp) {
    state.animationFrameId = null;

    if (!state.active) {
      return;
    }

    recalculateHeroMobileIconLayout(false, timestamp);
    setupHeroMobileResizeHandler();
    setupHeroMobileIntersectionObserver();

    if (state.isVisible) {
      startHeroMobileAnimationLoop();
    }
  });
}

function stopHeroMobileFloatingIcons() {
  const state = heroMobileMotionState;

  state.active = false;
  state.isVisible = true;
  state.lastFrameTime = null;

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  if (state.resizeFrameId !== null) {
    window.cancelAnimationFrame(state.resizeFrameId);
    state.resizeFrameId = null;
  }

  if (state.intersectionObserver) {
    state.intersectionObserver.disconnect();
    state.intersectionObserver = null;
  }

  if (state.resizeHandler) {
    window.removeEventListener('resize', state.resizeHandler);
    window.removeEventListener('orientationchange', state.resizeHandler);
    state.resizeHandler = null;
  }

  state.icons.forEach(function (iconState) {
    iconState.element.style.removeProperty('transform');
  });

  state.heroSection = null;
  state.heroInner = null;
  state.icons = [];
}

function setupHeroMobileResizeHandler() {
  const state = heroMobileMotionState;

  if (state.resizeHandler) {
    return;
  }

  state.resizeHandler = function () {
    if (!state.active || state.resizeFrameId !== null) {
      return;
    }

    state.resizeFrameId = window.requestAnimationFrame(function () {
      state.resizeFrameId = null;

      if (!state.active) {
        return;
      }

      recalculateHeroMobileIconLayout(true, window.performance.now());
    });
  };

  window.addEventListener('resize', state.resizeHandler);
  window.addEventListener('orientationchange', state.resizeHandler);
}

function setupHeroMobileIntersectionObserver() {
  const state = heroMobileMotionState;

  if (
    !state.heroSection ||
    state.intersectionObserver ||
    !('IntersectionObserver' in window)
  ) {
    return;
  }

  state.intersectionObserver = new IntersectionObserver(
    function (entries) {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      state.isVisible = entry.isIntersecting;

      if (state.isVisible) {
        startHeroMobileAnimationLoop();
      } else {
        stopHeroMobileAnimationLoop();
      }
    },
    {
      threshold: 0.05,
    }
  );

  state.intersectionObserver.observe(state.heroSection);
}

function startHeroMobileAnimationLoop() {
  const state = heroMobileMotionState;

  if (!state.active || !state.isVisible || state.animationFrameId !== null) {
    return;
  }

  state.animationFrameId = window.requestAnimationFrame(
    stepHeroMobileFloatingIcons
  );
}

function stopHeroMobileAnimationLoop() {
  const state = heroMobileMotionState;

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  state.lastFrameTime = null;
}

function stepHeroMobileFloatingIcons(timestamp) {
  const state = heroMobileMotionState;

  state.animationFrameId = null;

  if (!state.active || !state.isVisible) {
    return;
  }

  if (state.lastFrameTime === null) {
    state.lastFrameTime = timestamp;
  }

  const deltaSeconds = Math.min(
    (timestamp - state.lastFrameTime) / 1000,
    HERO_MOBILE_MAX_FRAME_DELTA
  );

  state.lastFrameTime = timestamp;

  state.icons.forEach(function (iconState) {
    if (timestamp >= iconState.nextDriftAt) {
      applyHeroMobileRandomDrift(iconState);
      iconState.nextDriftAt = getNextHeroMobileDriftTime(timestamp);
    }

    let nextX = iconState.x + iconState.vx * deltaSeconds;
    let nextY = iconState.y + iconState.vy * deltaSeconds;
    let hitX = false;
    let hitY = false;

    if (nextX <= iconState.minX || nextX >= iconState.maxX) {
      iconState.vx *= -1;
      hitX = true;
      nextX = clamp(nextX, iconState.minX, iconState.maxX);
    }

    if (nextY <= iconState.minY || nextY >= iconState.maxY) {
      iconState.vy *= -1;
      hitY = true;
      nextY = clamp(nextY, iconState.minY, iconState.maxY);
    }

    if (hitX || hitY) {
      applyHeroMobileBounceVariation(iconState, hitX, hitY);
    }

    iconState.x = clamp(nextX, iconState.minX, iconState.maxX);
    iconState.y = clamp(nextY, iconState.minY, iconState.maxY);

    setHeroMobileIconTransform(iconState);
  });

  state.animationFrameId = window.requestAnimationFrame(
    stepHeroMobileFloatingIcons
  );
}

function recalculateHeroMobileIconLayout(preservePosition, timestamp) {
  const state = heroMobileMotionState;

  if (!state.active || !state.heroInner || state.icons.length === 0) {
    return;
  }

  const heroRect = state.heroInner.getBoundingClientRect();

  if (heroRect.width === 0 || heroRect.height === 0) {
    return;
  }

  const visualPositions = preservePosition
    ? state.icons.map(function (iconState) {
        const iconRect = iconState.element.getBoundingClientRect();

        return {
          x: iconRect.left - heroRect.left,
          y: iconRect.top - heroRect.top,
        };
      })
    : null;

  state.icons.forEach(function (iconState) {
    iconState.element.style.removeProperty('transform');
  });

  state.icons.forEach(function (iconState, index) {
    const baseRect = iconState.element.getBoundingClientRect();

    iconState.baseX = baseRect.left - heroRect.left;
    iconState.baseY = baseRect.top - heroRect.top;
    iconState.width = baseRect.width;
    iconState.height = baseRect.height;
    iconState.minX = -iconState.baseX;
    iconState.maxX = Math.max(
      iconState.minX,
      heroRect.width - iconState.width - iconState.baseX
    );
    iconState.minY = -iconState.baseY;
    iconState.maxY = Math.max(
      iconState.minY,
      heroRect.height - iconState.height - iconState.baseY
    );

    if (visualPositions) {
      iconState.x = clamp(
        visualPositions[index].x - iconState.baseX,
        iconState.minX,
        iconState.maxX
      );
      iconState.y = clamp(
        visualPositions[index].y - iconState.baseY,
        iconState.minY,
        iconState.maxY
      );
    } else {
      iconState.x = clamp(iconState.x, iconState.minX, iconState.maxX);
      iconState.y = clamp(iconState.y, iconState.minY, iconState.maxY);
    }

    if (!iconState.nextDriftAt) {
      iconState.nextDriftAt = getNextHeroMobileDriftTime(timestamp);
    }

    setHeroMobileIconTransform(iconState);
  });
}

function applyHeroMobileRandomDrift(iconState) {
  const currentSpeed = getVectorMagnitude(iconState.vx, iconState.vy);

  if (currentSpeed === 0) {
    return;
  }

  const currentAngle = Math.atan2(iconState.vy, iconState.vx);
  const angleOffset = degreesToRadians(
    getRandomSignedBetween(
      HERO_MOBILE_MIN_DRIFT_ANGLE,
      HERO_MOBILE_MAX_DRIFT_ANGLE
    )
  );
  const nextAngle = currentAngle + angleOffset;

  iconState.vx = Math.cos(nextAngle) * currentSpeed;
  iconState.vy = Math.sin(nextAngle) * currentSpeed;
}

function applyHeroMobileBounceVariation(iconState, hitX, hitY) {
  const currentSpeed = getVectorMagnitude(iconState.vx, iconState.vy);

  if (currentSpeed === 0) {
    return;
  }

  if (hitX) {
    iconState.vy += getRandomSignedBetween(1.5, HERO_MOBILE_BOUNCE_VARIATION);
  }

  if (hitY) {
    iconState.vx += getRandomSignedBetween(1.5, HERO_MOBILE_BOUNCE_VARIATION);
  }

  normalizeHeroMobileVelocity(iconState, currentSpeed);
}

function normalizeHeroMobileVelocity(iconState, targetSpeed) {
  const currentSpeed = getVectorMagnitude(iconState.vx, iconState.vy);

  if (currentSpeed === 0) {
    const velocity = createHeroMobileVelocity();
    iconState.vx = velocity.vx;
    iconState.vy = velocity.vy;
    return;
  }

  const scale = targetSpeed / currentSpeed;
  iconState.vx *= scale;
  iconState.vy *= scale;
}

function createHeroMobileVelocity() {
  const speed = getRandomBetween(
    HERO_MOBILE_MIN_SPEED,
    HERO_MOBILE_MAX_SPEED
  );
  const angle = Math.random() * Math.PI * 2;

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

function clearHeroMobileTransforms() {
  getHeroMobileIconElements(getHeroInner()).forEach(function (element) {
    element.style.removeProperty('transform');
  });
}

function setHeroMobileIconTransform(iconState) {
  iconState.element.style.transform =
    'translate3d(' +
    iconState.x.toFixed(2) +
    'px, ' +
    iconState.y.toFixed(2) +
    'px, 0)';
}

function getHeroParallaxScene() {
  return document.querySelector('#home .hero__avatar.parallax');
}

function getHeroSection() {
  return document.querySelector('#home');
}

function getHeroInner() {
  return document.querySelector('#home .hero__inner');
}

function getHeroMobileIconElements(heroInner) {
  if (!heroInner) {
    return [];
  }

  return HERO_MOBILE_ICON_SELECTORS.map(function (selector) {
    return heroInner.querySelector(selector);
  }).filter(function (element) {
    return element !== null;
  });
}

function isHeroMobileViewport() {
  if (heroMotionMediaQuery) {
    return heroMotionMediaQuery.matches;
  }

  return window.innerWidth <= 600;
}

function prefersReducedMotion() {
  if (heroReducedMotionMediaQuery) {
    return heroReducedMotionMediaQuery.matches;
  }

  return false;
}

function getNextHeroMobileDriftTime(timestamp) {
  return (
    timestamp +
    getRandomBetween(HERO_MOBILE_MIN_DRIFT_DELAY, HERO_MOBILE_MAX_DRIFT_DELAY)
  );
}

function getRandomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getRandomSignedBetween(min, max) {
  const value = getRandomBetween(min, max);

  return Math.random() >= 0.5 ? value : value * -1;
}

function getVectorMagnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function initAnimatedText() {
  const headlines = document.querySelectorAll('.hero__job-animated--rotate');

  if (headlines.length === 0) {
    return;
  }

  const animationDelay = 2000;

  headlines.forEach(function (headline) {
    const wordsWrapper = headline.querySelector('.hero__job-words');
    if (!wordsWrapper) {
      return;
    }

    const words = wordsWrapper.querySelectorAll('b');
    if (words.length === 0) {
      return;
    }

    let maxWidth = 0;

    words.forEach(function (word) {
      const wordWidth = word.offsetWidth;
      if (wordWidth > maxWidth) {
        maxWidth = wordWidth;
      }
    });
    wordsWrapper.style.width = maxWidth + 'px';

    let currentIndex = 0;

    function hideWord() {
      const currentWord = words[currentIndex];
      if (!currentWord) {
        return;
      }

      currentIndex = (currentIndex + 1) % words.length;
      const nextWord = words[currentIndex];

      currentWord.classList.remove('is-visible');
      currentWord.classList.add('is-hidden');

      nextWord.classList.remove('is-hidden');
      nextWord.classList.add('is-visible');

      setTimeout(hideWord, animationDelay);
    }

    setTimeout(hideWord, animationDelay);
  });

  console.log('Animated text: Initialized successfully');
}

export function initMovingAnimation() {
  const elements = document.querySelectorAll('.moving_effect');

  if (elements.length === 0) {
    return;
  }

  function updateElementPosition(element) {
    const direction = element.getAttribute('data-direction');
    const reverse = element.getAttribute('data-reverse') === 'yes';
    const offset = window.pageYOffset || window.scrollY;
    const h = window.innerHeight;
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

  window.addEventListener('scroll', function () {
    elements.forEach(function (element) {
      updateElementPosition(element);
    });
  });

  elements.forEach(function (element) {
    updateElementPosition(element);
  });

  console.log('Moving animation: Initialized successfully');
}

export function initWowAnimations() {
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

export function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-effect');

  if (tiltCards.length === 0) {
    return;
  }

  const isTabPortOrBelow = window.matchMedia
    ? window.matchMedia('(max-width: 56.25em)').matches
    : window.innerWidth <= 900;

  if (isTabPortOrBelow) {
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

export function initProgressBars() {
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
