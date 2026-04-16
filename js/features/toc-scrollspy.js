export function initTocScrollspy() {
  var tocLinks = document.querySelectorAll('.toc__link');

  if (tocLinks.length === 0) {
    return;
  }

  var activeClass = 'toc__link--active';
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

  checkActiveSection();
}
