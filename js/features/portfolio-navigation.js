export function initPortfolioNav() {
  const nav = document.querySelector('.portfolio-page__nav');

  if (!nav) {
    return;
  }

  const isTabLandOrBelow = window.matchMedia
    ? window.matchMedia('(max-width: 75em)').matches
    : window.innerWidth <= 1200;

  if (isTabLandOrBelow) {
    return;
  }

  const navLinks = nav.querySelectorAll('.portfolio-page__nav-link');
  const activeClass = 'portfolio-page__nav-link--active';
  const sections = document.querySelectorAll('section[id]');
  const projectItems = document.querySelectorAll(
    '.portfolio-page__experience-item'
  );
  const yearToProjects = {};

  projectItems.forEach(function (item) {
    const dateElement = item.querySelector('.portfolio-page__experience-date');
    if (!dateElement) {
      return;
    }

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

  function updateActiveNavLink(targetId) {
    navLinks.forEach(function (link) {
      link.classList.remove(activeClass);
    });

    const activeLink = nav.querySelector(`a[href="#${targetId}"]`);
    if (activeLink) {
      activeLink.classList.add(activeClass);
    }
  }

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;

          if (sectionId === 'about') {
            updateActiveNavLink('2024');
            return;
          }

          if (sectionId === 'experience') {
            checkVisibleYear();
            return;
          }

          updateActiveNavLink(sectionId);
        }
      });
    },
    {
      rootMargin: '20% 0% -50% 0%',
      threshold: 0,
    }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  function checkVisibleYear() {
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const isAtBottom =
      window.innerHeight + scrollPosition >= documentHeight - 50;
    const focusLine = viewportHeight * 0.25;

    let activeYear = null;
    let lastVisibleYear = null;

    projectItems.forEach(function (item) {
      const rect = item.getBoundingClientRect();
      const dateElement = item.querySelector(
        '.portfolio-page__experience-date'
      );
      if (!dateElement) {
        return;
      }

      const yearsAttr = dateElement.getAttribute('data-years');
      if (!yearsAttr) {
        return;
      }

      const year = yearsAttr.split(',')[0].trim();

      if (rect.top <= focusLine) {
        activeYear = year;
      }

      if (rect.top < viewportHeight && rect.bottom > 0) {
        lastVisibleYear = year;
      }
    });

    if (isAtBottom && lastVisibleYear) {
      const years = Object.keys(yearToProjects)
        .map(Number)
        .sort((a, b) => a - b);
      const earliestYear = years[0].toString();

      if (lastVisibleYear === earliestYear) {
        activeYear = lastVisibleYear;
      }
    }

    if (activeYear) {
      updateActiveNavLink(activeYear);
    }
  }

  let isClickScrolling = false;
  let clickScrollTimeout;

  const projectObserver = new IntersectionObserver(
    function () {
      if (!isClickScrolling) {
        checkVisibleYear();
      }
    },
    {
      rootMargin: '20% 0% -30% 0%',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  projectItems.forEach(function (item) {
    projectObserver.observe(item);
  });

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

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');

      if (href && href.startsWith('#')) {
        const year = href.substring(1);
        const yearProjects = yearToProjects[year];

        if (yearProjects && yearProjects.length > 0) {
          e.preventDefault();
          isClickScrolling = true;
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

          if (clickScrollTimeout) {
            clearTimeout(clickScrollTimeout);
          }

          clickScrollTimeout = setTimeout(function () {
            isClickScrolling = false;
            checkVisibleYear();
          }, 1000);
        }
      }
    });
  });

  checkVisibleYear();
}
