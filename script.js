/* Contact form validation only; email delivery is not connected yet. */
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const fields = ['name', 'email', 'phone', 'service', 'message'];
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    menu.focus();
  }
});
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    form.elements.service.value = link.dataset.service;
    validate('service');
  });
});

function validationMessage(id, value) {
  if (id === 'name' && (value.length < 2 || value.length > 80 || !/\p{L}/u.test(value) || /[\r\n<>]/.test(value))) return 'Please enter your name (2–80 characters).';
  if (id === 'email' && (value.length > 254 || !/^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,63}$/i.test(value))) return 'Enter a valid email, such as you@example.com.';
  if (id === 'phone' && value && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 10 || value.replace(/\D/g, '').length > 15 || value.length > 25)) return 'Enter a phone number with 10–15 digits, or leave it blank.';
  if (id === 'service' && !Array.from(form.elements.service.options).some(option => option.value && option.value === value)) return 'Please select a service.';
  if (id === 'message' && (value.length < 20 || value.length > 2000)) return 'Please include 20–2,000 characters about your project.';
  return '';
}

function validate(id) {
  const input = form.elements[id];
  const error = validationMessage(id, input.value.trim());
  document.getElementById(`${id}-error`).textContent = error;
  input.setAttribute('aria-invalid', String(Boolean(error)));
  return !error;
}
(form ? fields : []).forEach(id => {
  const input = form.elements[id];
  input.addEventListener('blur', () => validate(id));
  input.addEventListener('input', () => {
    status.textContent = '';
    if (input.getAttribute('aria-invalid') === 'true') validate(id);
  });
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';
  if (form.elements.website.value) {
    status.textContent = 'Unable to submit this request. Please contact Vito by phone or email.';
    return;
  }
  const invalid = fields.filter(id => !validate(id));
  if (invalid.length) {
    status.textContent = 'Please check the highlighted fields.';
    form.elements[invalid[0]].focus();
    return;
  }
  // Connect the future API endpoint here after validation succeeds.
  status.textContent = 'Online submission is not available yet. Please contact us directly.';
});
document.querySelector('#year').textContent = new Date().getFullYear();
