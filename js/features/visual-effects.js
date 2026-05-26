const HERO_MOBILE_QUERY = '(max-width: 37.5em)';
const PROCESS_COMPACT_QUERY = '(max-width: 56.25em)';
const PARALLAX_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TILT_COMPACT_QUERY = '(max-width: 75em)';
const ROLE_AUTO_REVEAL_QUERY = '(max-width: 75em)';
const ROLE_AUTO_REVEAL_REDUCED_MOTION_QUERY =
  '(prefers-reduced-motion: reduce)';
const ROLE_AUTO_REVEAL_ACTIVE_DURATION = 2400;
const ROLE_AUTO_REVEAL_GAP_DURATION = 1800;
const ROLE_AUTO_REVEAL_IDLE_DURATION = 400;
const ROLE_AUTO_REVEAL_VISIBILITY_THRESHOLD = 0.35;
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
const PARALLAX_SCENE_CONFIGS = [
  {
    key: 'hero',
    sceneSelector: '#home .hero__avatar.parallax',
    sectionSelector: '#home',
    boundsSelector: '#home .hero__inner',
    compactQuery: HERO_MOBILE_QUERY,
    compactFallbackWidth: 600,
    compactIconSelectors: HERO_MOBILE_ICON_SELECTORS,
  },
  {
    key: 'process',
    sceneSelector: '#process .hero__avatar--process.parallax',
    sectionSelector: '#process',
    boundsSelector: '#process .process__visual',
    compactQuery: PROCESS_COMPACT_QUERY,
    compactFallbackWidth: 900,
    compactIconSelectors: HERO_MOBILE_ICON_SELECTORS,
  },
];

let parallaxSceneControllerInitialized = false;
let parallaxReducedMotionMediaQuery = null;
let parallaxReducedMotionMediaQueryListener = null;
let tiltCompactMediaQuery = null;
let tiltCompactMediaQueryListener = null;
let tiltControllerInitialized = false;
let tiltEffectActive = false;
let roleAutoRevealMediaQuery = null;
let roleAutoRevealReducedMotionMediaQuery = null;
let roleAutoRevealMediaQueryListener = null;
let roleAutoRevealReducedMotionMediaQueryListener = null;
let roleAutoRevealVisibilityListener = null;
let roleAutoRevealInitialized = false;

const parallaxSceneStates = PARALLAX_SCENE_CONFIGS.reduce(function (
  states,
  config
) {
  states[config.key] = createParallaxSceneState();
  return states;
}, {});

const roleAutoRevealState = {
  active: false,
  activeCard: null,
  cards: [],
  observer: null,
  timerId: null,
  visibleCards: new Set(),
  nextCardIndex: 0,
};

export function initParallax() {
  const hasParallaxScene = PARALLAX_SCENE_CONFIGS.some(function (config) {
    return getParallaxSceneElement(config) !== null;
  });

  if (!hasParallaxScene) {
    return;
  }

  if (!parallaxSceneControllerInitialized) {
    parallaxSceneControllerInitialized = true;
    parallaxReducedMotionMediaQuery = window.matchMedia
      ? window.matchMedia(PARALLAX_REDUCED_MOTION_QUERY)
      : null;
    parallaxReducedMotionMediaQueryListener = function () {
      syncAllParallaxSceneModes();
    };

    if (parallaxReducedMotionMediaQuery) {
      addMediaQueryListener(
        parallaxReducedMotionMediaQuery,
        parallaxReducedMotionMediaQueryListener
      );
    }

    PARALLAX_SCENE_CONFIGS.forEach(function (config) {
      const state = getParallaxSceneState(config);

      state.compactMediaQuery = window.matchMedia
        ? window.matchMedia(config.compactQuery)
        : null;
      state.compactMediaQueryListener = function () {
        syncParallaxSceneMode(config);
      };

      if (state.compactMediaQuery) {
        addMediaQueryListener(
          state.compactMediaQuery,
          state.compactMediaQueryListener
        );
      }
    });
  }

  syncAllParallaxSceneModes();
}

function createParallaxSceneState() {
  return {
    compactMediaQuery: null,
    compactMediaQueryListener: null,
    parallaxInstance: null,
    motionState: createSceneMotionState(),
  };
}

function createSceneMotionState() {
  return {
    active: false,
    animationFrameId: null,
    resizeFrameId: null,
    intersectionObserver: null,
    sectionElement: null,
    boundsElement: null,
    icons: [],
    isVisible: true,
    lastFrameTime: null,
    resizeHandler: null,
  };
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

function syncAllParallaxSceneModes() {
  PARALLAX_SCENE_CONFIGS.forEach(function (config) {
    syncParallaxSceneMode(config);
  });
}

function syncParallaxSceneMode(config) {
  const parallaxElement = getParallaxSceneElement(config);

  if (!parallaxElement) {
    stopSceneParallax(config);
    stopSceneFloatingIcons(config);
    clearSceneTransforms(config);
    return;
  }

  if (isSceneCompactViewport(config)) {
    stopSceneParallax(config);

    if (prefersReducedMotion()) {
      stopSceneFloatingIcons(config);
      clearSceneTransforms(config);
      return;
    }

    startSceneFloatingIcons(config);
    return;
  }

  stopSceneFloatingIcons(config);
  clearSceneTransforms(config);
  startSceneParallax(config);
}

function startSceneParallax(config) {
  const parallaxElement = getParallaxSceneElement(config);
  const state = getParallaxSceneState(config);

  if (!parallaxElement || state.parallaxInstance) {
    return;
  }

  if (typeof Parallax === 'undefined') {
    console.error(
      'Parallax: Library not loaded. Check if parallax-js is properly included.'
    );
    return;
  }

  const layers = parallaxElement.getElementsByClassName('layer');
  console.log('Parallax: Found layers for', config.key, layers.length);

  state.parallaxInstance = new Parallax(parallaxElement, {
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

  console.log('Parallax: Initialized successfully for', config.key);
}

function stopSceneParallax(config) {
  const state = getParallaxSceneState(config);

  if (!state.parallaxInstance) {
    return;
  }

  state.parallaxInstance.destroy();
  state.parallaxInstance = null;
}

function startSceneFloatingIcons(config) {
  const sceneState = getParallaxSceneState(config);
  const motionState = sceneState.motionState;
  const sectionElement = getSceneSection(config);
  const boundsElement = getSceneBoundsElement(config);
  const iconElements = getSceneCompactIconElements(config, boundsElement);

  if (
    motionState.active
    || !sectionElement
    || !boundsElement
    || iconElements.length === 0
  ) {
    return;
  }

  motionState.active = true;
  motionState.sectionElement = sectionElement;
  motionState.boundsElement = boundsElement;
  motionState.isVisible = true;
  motionState.lastFrameTime = null;
  motionState.icons = iconElements.map(function (element) {
    const velocity = createSceneVelocity();

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

  clearSceneTransforms(config);

  motionState.animationFrameId = window.requestAnimationFrame(function (
    timestamp
  ) {
    motionState.animationFrameId = null;

    if (!motionState.active) {
      return;
    }

    recalculateSceneIconLayout(config, false, timestamp);
    setupSceneResizeHandler(config);
    setupSceneIntersectionObserver(config);

    if (motionState.isVisible) {
      startSceneAnimationLoop(config);
    }
  });
}

function stopSceneFloatingIcons(config) {
  const motionState = getParallaxSceneState(config).motionState;

  motionState.active = false;
  motionState.isVisible = true;
  motionState.lastFrameTime = null;

  if (motionState.animationFrameId !== null) {
    window.cancelAnimationFrame(motionState.animationFrameId);
    motionState.animationFrameId = null;
  }

  if (motionState.resizeFrameId !== null) {
    window.cancelAnimationFrame(motionState.resizeFrameId);
    motionState.resizeFrameId = null;
  }

  if (motionState.intersectionObserver) {
    motionState.intersectionObserver.disconnect();
    motionState.intersectionObserver = null;
  }

  if (motionState.resizeHandler) {
    window.removeEventListener('resize', motionState.resizeHandler);
    window.removeEventListener('orientationchange', motionState.resizeHandler);
    motionState.resizeHandler = null;
  }

  motionState.icons.forEach(function (iconState) {
    iconState.element.style.removeProperty('transform');
  });

  motionState.sectionElement = null;
  motionState.boundsElement = null;
  motionState.icons = [];
}

function setupSceneResizeHandler(config) {
  const motionState = getParallaxSceneState(config).motionState;

  if (motionState.resizeHandler) {
    return;
  }

  motionState.resizeHandler = function () {
    if (!motionState.active || motionState.resizeFrameId !== null) {
      return;
    }

    motionState.resizeFrameId = window.requestAnimationFrame(function () {
      motionState.resizeFrameId = null;

      if (!motionState.active) {
        return;
      }

      recalculateSceneIconLayout(config, true, window.performance.now());
    });
  };

  window.addEventListener('resize', motionState.resizeHandler);
  window.addEventListener('orientationchange', motionState.resizeHandler);
}

function setupSceneIntersectionObserver(config) {
  const motionState = getParallaxSceneState(config).motionState;

  if (
    !motionState.sectionElement
    || motionState.intersectionObserver
    || !('IntersectionObserver' in window)
  ) {
    return;
  }

  motionState.intersectionObserver = new IntersectionObserver(
    function (entries) {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      motionState.isVisible = entry.isIntersecting;

      if (motionState.isVisible) {
        startSceneAnimationLoop(config);
      } else {
        stopSceneAnimationLoop(config);
      }
    },
    {
      threshold: 0.05,
    }
  );

  motionState.intersectionObserver.observe(motionState.sectionElement);
}

function startSceneAnimationLoop(config) {
  const motionState = getParallaxSceneState(config).motionState;

  if (
    !motionState.active
    || !motionState.isVisible
    || motionState.animationFrameId !== null
  ) {
    return;
  }

  motionState.animationFrameId = window.requestAnimationFrame(function (
    timestamp
  ) {
    stepSceneFloatingIcons(config, timestamp);
  });
}

function stopSceneAnimationLoop(config) {
  const motionState = getParallaxSceneState(config).motionState;

  if (motionState.animationFrameId !== null) {
    window.cancelAnimationFrame(motionState.animationFrameId);
    motionState.animationFrameId = null;
  }

  motionState.lastFrameTime = null;
}

function stepSceneFloatingIcons(config, timestamp) {
  const motionState = getParallaxSceneState(config).motionState;

  motionState.animationFrameId = null;

  if (!motionState.active || !motionState.isVisible) {
    return;
  }

  if (motionState.lastFrameTime === null) {
    motionState.lastFrameTime = timestamp;
  }

  const deltaSeconds = Math.min(
    (timestamp - motionState.lastFrameTime) / 1000,
    HERO_MOBILE_MAX_FRAME_DELTA
  );

  motionState.lastFrameTime = timestamp;

  motionState.icons.forEach(function (iconState) {
    if (timestamp >= iconState.nextDriftAt) {
      applySceneRandomDrift(iconState);
      iconState.nextDriftAt = getNextSceneDriftTime(timestamp);
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
      applySceneBounceVariation(iconState, hitX, hitY);
    }

    iconState.x = clamp(nextX, iconState.minX, iconState.maxX);
    iconState.y = clamp(nextY, iconState.minY, iconState.maxY);

    setSceneIconTransform(iconState);
  });

  motionState.animationFrameId = window.requestAnimationFrame(function (
    nextTimestamp
  ) {
    stepSceneFloatingIcons(config, nextTimestamp);
  });
}

function recalculateSceneIconLayout(config, preservePosition, timestamp) {
  const motionState = getParallaxSceneState(config).motionState;

  if (
    !motionState.active
    || !motionState.boundsElement
    || motionState.icons.length === 0
  ) {
    return;
  }

  const boundsRect = motionState.boundsElement.getBoundingClientRect();

  if (boundsRect.width === 0 || boundsRect.height === 0) {
    return;
  }

  const visualPositions = preservePosition
    ? motionState.icons.map(function (iconState) {
        const iconRect = iconState.element.getBoundingClientRect();

        return {
          x: iconRect.left - boundsRect.left,
          y: iconRect.top - boundsRect.top,
        };
      })
    : null;

  motionState.icons.forEach(function (iconState) {
    iconState.element.style.removeProperty('transform');
  });

  motionState.icons.forEach(function (iconState, index) {
    const baseRect = iconState.element.getBoundingClientRect();

    iconState.baseX = baseRect.left - boundsRect.left;
    iconState.baseY = baseRect.top - boundsRect.top;
    iconState.width = baseRect.width;
    iconState.height = baseRect.height;
    iconState.minX = -iconState.baseX;
    iconState.maxX = Math.max(
      iconState.minX,
      boundsRect.width - iconState.width - iconState.baseX
    );
    iconState.minY = -iconState.baseY;
    iconState.maxY = Math.max(
      iconState.minY,
      boundsRect.height - iconState.height - iconState.baseY
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
      iconState.nextDriftAt = getNextSceneDriftTime(timestamp);
    }

    setSceneIconTransform(iconState);
  });
}

function applySceneRandomDrift(iconState) {
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

function applySceneBounceVariation(iconState, hitX, hitY) {
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

  normalizeSceneVelocity(iconState, currentSpeed);
}

function normalizeSceneVelocity(iconState, targetSpeed) {
  const currentSpeed = getVectorMagnitude(iconState.vx, iconState.vy);

  if (currentSpeed === 0) {
    const velocity = createSceneVelocity();
    iconState.vx = velocity.vx;
    iconState.vy = velocity.vy;
    return;
  }

  const scale = targetSpeed / currentSpeed;
  iconState.vx *= scale;
  iconState.vy *= scale;
}

function createSceneVelocity() {
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

function clearSceneTransforms(config) {
  const boundsElement = getSceneBoundsElement(config);

  getSceneCompactIconElements(config, boundsElement).forEach(function (element) {
    element.style.removeProperty('transform');
  });
}

function setSceneIconTransform(iconState) {
  iconState.element.style.transform =
    'translate3d(' +
    iconState.x.toFixed(2) +
    'px, ' +
    iconState.y.toFixed(2) +
    'px, 0)';
}

function getParallaxSceneState(config) {
  return parallaxSceneStates[config.key];
}

function getParallaxSceneElement(config) {
  return document.querySelector(config.sceneSelector);
}

function getSceneSection(config) {
  return document.querySelector(config.sectionSelector);
}

function getSceneBoundsElement(config) {
  return document.querySelector(config.boundsSelector);
}

function getSceneCompactIconElements(config, boundsElement) {
  if (!boundsElement) {
    return [];
  }

  return config.compactIconSelectors
    .map(function (selector) {
      return boundsElement.querySelector(selector);
    })
    .filter(function (element) {
      return element !== null;
    });
}

function isSceneCompactViewport(config) {
  const state = getParallaxSceneState(config);

  if (state.compactMediaQuery) {
    return state.compactMediaQuery.matches;
  }

  return window.innerWidth <= config.compactFallbackWidth;
}

function prefersReducedMotion() {
  if (parallaxReducedMotionMediaQuery) {
    return parallaxReducedMotionMediaQuery.matches;
  }

  return window.matchMedia
    ? window.matchMedia(PARALLAX_REDUCED_MOTION_QUERY).matches
    : false;
}

function getNextSceneDriftTime(timestamp) {
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
  if (document.querySelector('.wow') === null) {
    return;
  }

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

export function initRoleAutoReveal() {
  const roleCards = document.querySelectorAll('.roles .role');

  if (roleCards.length === 0) {
    return;
  }

  roleAutoRevealState.cards = Array.from(roleCards);

  if (!roleAutoRevealInitialized) {
    roleAutoRevealInitialized = true;
    roleAutoRevealMediaQuery = window.matchMedia
      ? window.matchMedia(ROLE_AUTO_REVEAL_QUERY)
      : null;
    roleAutoRevealReducedMotionMediaQuery = window.matchMedia
      ? window.matchMedia(ROLE_AUTO_REVEAL_REDUCED_MOTION_QUERY)
      : null;

    roleAutoRevealMediaQueryListener = function () {
      syncRoleAutoRevealMode();
    };
    roleAutoRevealReducedMotionMediaQueryListener = function () {
      syncRoleAutoRevealMode();
    };
    roleAutoRevealVisibilityListener = function () {
      handleRoleAutoRevealVisibilityChange();
    };

    if (roleAutoRevealMediaQuery) {
      addMediaQueryListener(
        roleAutoRevealMediaQuery,
        roleAutoRevealMediaQueryListener
      );
    }

    if (roleAutoRevealReducedMotionMediaQuery) {
      addMediaQueryListener(
        roleAutoRevealReducedMotionMediaQuery,
        roleAutoRevealReducedMotionMediaQueryListener
      );
    }

    document.addEventListener(
      'visibilitychange',
      roleAutoRevealVisibilityListener
    );
  }

  syncRoleAutoRevealMode();
}

export function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-effect');

  if (tiltCards.length === 0) {
    return;
  }

  if (!tiltControllerInitialized) {
    tiltControllerInitialized = true;
    tiltCompactMediaQuery = window.matchMedia
      ? window.matchMedia(TILT_COMPACT_QUERY)
      : null;

    tiltCompactMediaQueryListener = function () {
      syncTiltEffectMode();
    };

    if (tiltCompactMediaQuery) {
      addMediaQueryListener(tiltCompactMediaQuery, tiltCompactMediaQueryListener);
    }
  }

  syncTiltEffectMode();
}

function syncRoleAutoRevealMode() {
  const state = roleAutoRevealState;

  state.cards = Array.from(document.querySelectorAll('.roles .role'));

  if (state.cards.length === 0) {
    stopRoleAutoReveal();
    return;
  }

  if (
    !isRoleAutoRevealViewport()
    || prefersRoleAutoRevealReducedMotion()
  ) {
    stopRoleAutoReveal();
    return;
  }

  startRoleAutoReveal();
}

function startRoleAutoReveal() {
  const state = roleAutoRevealState;

  if (!state.active) {
    state.active = true;
    state.nextCardIndex = 0;
  }

  refreshRoleAutoRevealObserver();
  restartRoleAutoRevealCycle();
}

function stopRoleAutoReveal() {
  const state = roleAutoRevealState;

  state.active = false;
  clearRoleAutoRevealTimer();
  deactivateRoleAutoRevealCard();

  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  state.visibleCards.clear();
}

function refreshRoleAutoRevealObserver() {
  const state = roleAutoRevealState;

  if (!state.active) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    state.visibleCards = new Set(state.cards);
    return;
  }

  if (!state.observer) {
    state.observer = new IntersectionObserver(handleRoleAutoRevealIntersection, {
      threshold: [ROLE_AUTO_REVEAL_VISIBILITY_THRESHOLD],
    });
  } else {
    state.observer.disconnect();
  }

  state.visibleCards.clear();

  state.cards.forEach(function (card) {
    state.observer.observe(card);
  });
}

function handleRoleAutoRevealIntersection(entries) {
  const state = roleAutoRevealState;
  let shouldRestart = false;

  entries.forEach(function (entry) {
    const isVisible =
      entry.isIntersecting
      && entry.intersectionRatio >= ROLE_AUTO_REVEAL_VISIBILITY_THRESHOLD;

    if (isVisible) {
      state.visibleCards.add(entry.target);
      return;
    }

    state.visibleCards.delete(entry.target);

    if (state.activeCard === entry.target) {
      shouldRestart = true;
    }
  });

  if (shouldRestart) {
    restartRoleAutoRevealCycle();
    return;
  }

  if (state.active && state.timerId === null && !document.hidden) {
    scheduleRoleAutoRevealCycle(0);
  }
}

function handleRoleAutoRevealVisibilityChange() {
  if (document.hidden) {
    clearRoleAutoRevealTimer();
    deactivateRoleAutoRevealCard();
    return;
  }

  if (roleAutoRevealState.active) {
    restartRoleAutoRevealCycle();
  }
}

function restartRoleAutoRevealCycle() {
  clearRoleAutoRevealTimer();
  deactivateRoleAutoRevealCard();

  if (!roleAutoRevealState.active || document.hidden) {
    return;
  }

  scheduleRoleAutoRevealCycle(0);
}

function scheduleRoleAutoRevealCycle(delay) {
  clearRoleAutoRevealTimer();

  if (!roleAutoRevealState.active || document.hidden) {
    return;
  }

  roleAutoRevealState.timerId = window.setTimeout(function () {
    roleAutoRevealState.timerId = null;
    runRoleAutoRevealCycle();
  }, delay);
}

function runRoleAutoRevealCycle() {
  const nextCard = getNextRoleAutoRevealCard();

  if (!nextCard) {
    scheduleRoleAutoRevealCycle(ROLE_AUTO_REVEAL_IDLE_DURATION);
    return;
  }

  activateRoleAutoRevealCard(nextCard);

  roleAutoRevealState.timerId = window.setTimeout(function () {
    roleAutoRevealState.timerId = null;
    deactivateRoleAutoRevealCard();
    scheduleRoleAutoRevealCycle(ROLE_AUTO_REVEAL_GAP_DURATION);
  }, ROLE_AUTO_REVEAL_ACTIVE_DURATION);
}

function getNextRoleAutoRevealCard() {
  const state = roleAutoRevealState;
  const totalCards = state.cards.length;

  if (totalCards === 0 || state.visibleCards.size === 0) {
    return null;
  }

  for (let offset = 0; offset < totalCards; offset += 1) {
    const cardIndex = (state.nextCardIndex + offset) % totalCards;
    const card = state.cards[cardIndex];

    if (state.visibleCards.has(card)) {
      state.nextCardIndex = (cardIndex + 1) % totalCards;
      return card;
    }
  }

  return null;
}

function activateRoleAutoRevealCard(card) {
  deactivateRoleAutoRevealCard();
  roleAutoRevealState.activeCard = card;
  card.classList.add('role--auto-reveal');
}

function deactivateRoleAutoRevealCard() {
  const activeCard = roleAutoRevealState.activeCard;

  if (!activeCard) {
    return;
  }

  activeCard.classList.remove('role--auto-reveal');
  roleAutoRevealState.activeCard = null;
}

function clearRoleAutoRevealTimer() {
  if (roleAutoRevealState.timerId === null) {
    return;
  }

  window.clearTimeout(roleAutoRevealState.timerId);
  roleAutoRevealState.timerId = null;
}

function isRoleAutoRevealViewport() {
  if (roleAutoRevealMediaQuery) {
    return roleAutoRevealMediaQuery.matches;
  }

  return window.innerWidth <= 1200;
}

function prefersRoleAutoRevealReducedMotion() {
  if (roleAutoRevealReducedMotionMediaQuery) {
    return roleAutoRevealReducedMotionMediaQuery.matches;
  }

  return window.matchMedia
    ? window.matchMedia(ROLE_AUTO_REVEAL_REDUCED_MOTION_QUERY).matches
    : false;
}

function syncTiltEffectMode() {
  const tiltCards = document.querySelectorAll('.tilt-effect');

  if (tiltCards.length === 0) {
    return;
  }

  if (isTiltCompactViewport()) {
    destroyTiltEffect(tiltCards);
    return;
  }

  startTiltEffect(tiltCards);
}

function startTiltEffect(tiltCards) {
  if (tiltEffectActive) {
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

  setInitialTiltMousePositions(tiltCards);
  tiltEffectActive = true;
}

function destroyTiltEffect(tiltCards) {
  if (!tiltEffectActive) {
    return;
  }

  if (
    typeof jQuery === 'undefined'
    || !jQuery.fn
    || !jQuery.fn.tilt
    || typeof jQuery.fn.tilt.destroy !== 'function'
  ) {
    tiltEffectActive = false;
    return;
  }

  jQuery.fn.tilt.destroy.call(jQuery(tiltCards));
  tiltEffectActive = false;
}

function isTiltCompactViewport() {
  if (tiltCompactMediaQuery) {
    return tiltCompactMediaQuery.matches;
  }

  return window.innerWidth <= 1200;
}

function setInitialTiltMousePositions(tiltCards) {
  tiltCards.forEach(function (card) {
    const rect = card.getBoundingClientRect();

    card.mousePositions = {
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY + rect.height / 2,
    };
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
