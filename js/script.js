
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
