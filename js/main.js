import { initConsentManager } from './features/consent-manager.js';
import {
  initActionScrollFromUrl,
  initActiveMenuItems,
  initHeaderScroll,
  initMobileMenuSupport,
  initScrollToTop,
  initSmoothScroll,
} from './features/page-navigation.js';
import {
  initAnimatedText,
  initMovingAnimation,
  initParallax,
  initProgressBars,
  initRoleAutoReveal,
  initTiltEffect,
  initWowAnimations,
} from './features/visual-effects.js';
import { initPortfolioNav } from './features/portfolio-navigation.js';
import { initTocScrollspy } from './features/toc-scrollspy.js';
import { initContactForm } from './features/contact-form.js';

document.addEventListener('DOMContentLoaded', function () {
  initConsentManager();
  initHeaderScroll();
  initMobileMenuSupport();
  initSmoothScroll();
  initActiveMenuItems();
  initParallax();
  initAnimatedText();
  initMovingAnimation();
  initWowAnimations();
  initTiltEffect();
  initRoleAutoReveal();
  initProgressBars();
  initPortfolioNav();
  initTocScrollspy();
  initContactForm();
  initScrollToTop();
  initActionScrollFromUrl();
});
