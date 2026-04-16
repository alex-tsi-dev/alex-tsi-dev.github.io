import { SITE_CONFIG } from '../config.js';

var consentMemoryState = null;
var consentRuntime = {
  banner: null,
  modal: null,
  previousActiveElement: null,
  gaLoaded: false,
  nrLoaded: false,
  isModalOpen: false,
};

export function initConsentManager() {
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
