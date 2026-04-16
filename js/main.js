import { initConsentManager } from './features/consent-manager.js';
import {
  initActionScrollFromUrl,
  initActiveMenuItems,
  initHeaderScroll,
  initScrollToTop,
  initSmoothScroll,
} from './features/page-navigation.js';
import {
  initAnimatedText,
  initMovingAnimation,
  initParallax,
  initProgressBars,
  initTiltEffect,
  initWowAnimations,
} from './features/visual-effects.js';
import { initPortfolioNav } from './features/portfolio-navigation.js';
import { initTocScrollspy } from './features/toc-scrollspy.js';
import { initContactForm } from './features/contact-form.js';

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
  initActionScrollFromUrl();
});
