const mainNav = document.querySelector('.main-nav');
const pageLanguage = document.documentElement.lang.toLowerCase();
const isRussianPage = pageLanguage.startsWith('ru');
const formMessages = isRussianPage
    ? {
        success: 'Заявка отправлена!',
        error: 'Не удалось отправить заявку.',
        network: 'Проверьте соединение и попробуйте снова.'
    }
    : {
        success: 'Wiadomość została wysłana!',
        error: 'Błąd podczas wysyłania wiadomości.',
        network: 'Wystąpił problem z połączeniem.'
    };

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
    console.error('No .main-nav on the page');
}

//------------------------------------------

const navLinks = document.querySelectorAll('.main-nav__item a');

navLinks.forEach((link) => {
    link.addEventListener('click', function(event) {
        const href = this.getAttribute('href');

        if (!href || !href.startsWith('#')) {
            return;
        }

        event.preventDefault();

        if (href === '#') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            return;
        }

        const targetElement = document.querySelector(href);

        if (targetElement) {
            const mainNavHeight = mainNav ? mainNav.offsetHeight : 0;
            const scrollToPosition = targetElement.offsetTop - mainNavHeight;

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
        }
    });
});

//------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const callLinks = document.querySelectorAll('.call-link');

    if (callLinks.length > 0) {
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

        callLinks.forEach((callLink) => {
            if (!isMobile) {
                callLink.addEventListener('click', function(e) {
                    e.preventDefault();

                    const target = document.querySelector('#contact-info');

                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        console.warn('There is no #contact-info');
                    }
                });
            }
        });
    }
});

//------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const contactButtons = document.querySelectorAll('.contact-button');

    if (contactButtons.length > 0) {
        contactButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const targetElement = document.getElementById('contact-info');

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                } else {
                    console.warn('There is no element with ID "contact-info"');
                }
            });
        });
    } else {
        console.warn('There is no button with ".contact-button" class');
    }
});

//------------------------------------------

const mainForm = document.querySelector('#main-form');

if (mainForm) {
    mainForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const form = this;
        const webhookUrl = 'https://hook.eu2.make.com/t7djoabppt6eo7yp6jgkp9rqcutdp02k';
        const name = form.querySelector('[name="main-form-name"]').value.trim();
        const email = form.querySelector('[name="main-form-email"]').value.trim();
        const message = form.querySelector('[name="main-form-message"]').value.trim();
        const data = {
            name: name,
            email: email,
            message: message
        };

        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then((res) => {
                if (res.ok) {
                    alert(formMessages.success);
                    form.reset();
                } else {
                    alert(formMessages.error);
                }
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                alert(formMessages.network);
            });
    });
} else {
    console.warn('There is no form with "#main-form" id');
}

