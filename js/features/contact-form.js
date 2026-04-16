import { CONTACT_API_URL } from '../config.js';

export function initContactForm() {
  var form = document.getElementById('contact-form');

  if (!form) {
    return;
  }

  var submitButton = document.getElementById('contact-submit');
  var nameInput = document.getElementById('contact-name');
  var emailInput = document.getElementById('contact-email');
  var messageInput = document.getElementById('contact-message');
  var errorBox = document.getElementById('contact-error');
  var successBox = document.getElementById('contact-success');

  function showError(text) {
    errorBox.textContent = text;
    errorBox.style.display = 'block';
    successBox.style.display = 'none';
  }

  function showSuccess(text) {
    successBox.textContent = text;
    successBox.style.display = 'block';
    errorBox.style.display = 'none';
  }

  function hideMessages() {
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideMessages();

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var message = messageInput.value.trim();

    if (!name || !email || !message) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    submitButton.classList.add('contact__submit--disabled');
    submitButton.disabled = true;

    fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message }),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server responded with status ' + response.status);
        }
        return response.json();
      })
      .then(function () {
        showSuccess(
          'Your message has been sent successfully. I will get back to you soon!'
        );
        form.reset();
      })
      .catch(function () {
        showError(
          'Something went wrong. Please try again or contact me directly via email.'
        );
      })
      .finally(function () {
        submitButton.classList.remove('contact__submit--disabled');
        submitButton.disabled = false;
      });
  });
}
