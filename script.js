/* Set this to the full API Gateway POST URL, including its stage and route. */
const CONTACT_API_URL = 'https://sxe7pylr44.execute-api.us-east-2.amazonaws.com/default/sendProjectEmail';
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const fields = ['firstName', 'lastName', 'email', 'phone', 'service', 'message'];
let submitting = false;
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
  if (['firstName', 'lastName'].includes(id) && (value.length < 1 || value.length > 80 || !/\p{L}/u.test(value) || /[\r\n<>]/.test(value))) return 'Please enter a name (1–80 characters).';
  if (id === 'email' && (value.length > 254 || !/^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,63}$/i.test(value))) return 'Enter a valid email, such as you@example.com.';
  if (id === 'phone' && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 10 || value.replace(/\D/g, '').length > 15 || value.length > 25)) return 'Enter a phone number with 10–15 digits.';
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

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
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
  if (!CONTACT_API_URL) {
    status.textContent = 'Online submission is not available yet. Please contact us directly.';
    return;
  }
  const value = id => form.elements[id].value.trim();
  const payload = {
    firstName: value('firstName'),
    lastName: value('lastName'),
    email: value('email'),
    phone: value('phone'),
    project: `Service: ${value('service')}\n\n${value('message')}`
  };
  submitting = true;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending...';
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'Sending your project request...';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      status.textContent = response.status === 400
        ? 'Please check your details and try again. Your information has been kept.'
        : 'We could not submit your request. Please try again later or contact us directly. Your information has been kept.';
      return;
    }
    const result = await response.json();
    if (result.message !== 'Project request received') throw new Error('Unexpected response');
    status.textContent = 'Thank you! Your project request has been received.';
  } catch {
    status.textContent = 'We could not confirm your submission. Your information has been kept. Please contact us directly before trying again to avoid a duplicate request.';
  } finally {
    clearTimeout(timeout);
    submitting = false;
    button.disabled = false;
    button.textContent = 'Submit';
    form.removeAttribute('aria-busy');
  }
});
if (form && CONTACT_API_URL) {
  form.querySelector('.form-note').textContent = 'Submit your details to request a free consultation.';
}
document.querySelector('#year').textContent = new Date().getFullYear();
