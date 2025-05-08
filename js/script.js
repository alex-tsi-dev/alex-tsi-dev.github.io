
const mainNav = document.querySelector('.main-nav');


if (mainNav) {
    const stickyThreshold = mainNav.offsetTop;

    function handleScroll() {
        const currentScrollPos = window.scrollY;
        if (currentScrollPos > stickyThreshold) {
            if (!mainNav.classList.contains('sticky-nav')) {
                mainNav.classList.add('sticky-nav');
            }
        } else {
            if (mainNav.classList.contains('sticky-nav')) {
                mainNav.classList.remove('sticky-nav');
            }
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

} else {
    console.error("No .main-nav on the page");
}


//------------------------------------------


const navLinks = document.querySelectorAll('.main-nav__item a');

navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();

        const targetId = this.getAttribute('href');

        if (targetId !== '#' && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const mainNavHeight = mainNav ? mainNav.offsetHeight : 0;

                const scrollToPosition = targetElement.offsetTop - mainNavHeight;
                window.scrollTo({
                    top: scrollToPosition,
                    behavior: 'smooth'
                });
            }
        } else if (targetId === '#') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
});
