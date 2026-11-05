const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('script.js', 'utf8').replace(/const CONTACT_API_URL = '[^']*';/, "const CONTACT_API_URL = '';");

async function run({ configured = true, code = 200, fail = false, phone = '(412) 555-0123', invalid = false, reducedMotion = false, missingReviews = false, website = '' } = {}) {
  const values = { firstName: ' Jane ', lastName: ' Doe ', email: 'jane@example.com', phone, service: 'Interior remodeling', message: 'Please help remodel our kitchen.', website };
  const element = value => ({ value, textContent: '', attributes: {}, classes: new Set(), addEventListener() {}, setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; }, getAttribute(name) { return this.attributes[name]; }, focus() { this.focused = true; } });
  const status = element('');
  status.children = [];
  status.append = child => status.children.push(child);
  const button = element('');
  const form = element('');
  form.classList = { add: name => form.classes.add(name) };
  form.elements = Object.fromEntries(Object.entries(values).map(([id, value]) => [id, element(value)]));
  form.elements.service.options = [{ value: 'Interior remodeling' }];
  form.children = [...Object.values(form.elements), button, status];
  form.querySelector = () => button;
  let submit;
  form.addEventListener = (event, handler) => { if (event === 'submit') submit = handler; };
  const scrolls = [];
  const reviews = { scrollIntoView: options => scrolls.push(options) };
  const window = { matchMedia: query => {
    assert.equal(query, '(prefers-reduced-motion: reduce)');
    return { matches: reducedMotion };
  } };
  const document = {
    createElement: () => element(''),
    querySelector: selector => selector === '#contact-form' ? form : selector === '#form-status' ? status : selector === '#google-reviews' ? (missingReviews ? null : reviews) : element(''),
    querySelectorAll: () => [], addEventListener() {}, getElementById: () => element('')
  };
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    assert.equal(button.disabled, true);
    if (fail) throw new Error('Network failed');
    return { ok: code === 200, status: code, json: async () => ({ message: invalid ? 'Unexpected' : 'Project request received' }) };
  };
  const timers = new Map();
  let timerId = 0;
  const setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; };
  const clearTimeout = id => timers.delete(id);
  vm.runInNewContext(configured ? source.replace("const CONTACT_API_URL = '';", "const CONTACT_API_URL = 'https://example.test/contact';") : source, { document, window, fetch, AbortController, setTimeout, clearTimeout, Date });
  const first = submit({ preventDefault() {} });
  const second = submit({ preventDefault() {} });
  await Promise.all([first, second]);
  assert.equal(form.elements.message.value, values.message);
  assert.equal(status.children.length, 0, 'Reload hint is not shown immediately');
  assert.equal(scrolls.length, 0, 'Do not scroll before the delay');
  if (website) {
    assert.equal(calls.length, 0, 'Filled honeypot blocks the email API request');
    assert.equal(timers.size, 0, 'Blocked spam schedules no success message or scrolling');
    assert.equal(form.classes.has('is-submitted'), false);
    assert.equal(Boolean(button.disabled), false);
    assert.equal(status.textContent, 'Unable to submit this request. Please contact Vito by phone or email.');
    return;
  }
  if (configured && phone) {
    assert.equal(calls.length, 1, 'Block duplicate in-flight submissions');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      firstName: 'Jane', lastName: 'Doe', email: values.email, phone,
      project: 'Service: Interior remodeling\n\nPlease help remodel our kitchen.'
    });
    const success = code === 200 && !fail && !invalid;
    assert.equal(button.disabled, success);
    assert.equal(status.textContent === 'Email received, Thank you!', success);
    assert.equal(form.classes.has('is-submitted'), success);
    assert.equal(Boolean(status.focused), success);
    assert.equal(form.getAttribute('aria-busy'), undefined);
    for (const child of form.children.filter(child => child !== status)) {
      assert.equal(Boolean(child.inert), success, 'Only a confirmed success disables the covered form controls');
    }
    assert.equal(Boolean(status.inert), false);
    if (success) {
      assert.equal(status.getAttribute('tabindex'), '-1');
      await submit({ preventDefault() {} });
      assert.equal(calls.length, 1, 'Block duplicate submissions after success');
      assert.equal(status.textContent, 'Email received, Thank you!');
      assert.equal(timers.size, 2);
      const hintTimer = [...timers.values()].find(timer => timer.delay === 1000);
      assert.equal(hintTimer.delay, 1000, 'Wait one second before showing the reload hint');
      hintTimer.callback();
      assert.equal(status.children.length, 1);
      assert.equal(status.children[0].textContent, '(reload to send another email)');
      assert.equal(status.children[0].className, 'submission-reload-hint');
      assert.equal(scrolls.length, 0, 'Showing the reload hint does not scroll yet');
      const scrollTimer = [...timers.values()].find(timer => timer.delay === 4000);
      assert.ok(scrollTimer, 'Scroll four seconds after confirmed success');
      scrollTimer.callback();
      assert.equal(scrolls.length, missingReviews ? 0 : 1);
      if (!missingReviews) {
        assert.equal(scrolls[0].behavior, reducedMotion ? 'instant' : 'smooth');
        assert.equal(scrolls[0].block, 'start');
      }
    } else {
      assert.equal(timers.size, 0, 'Failed submissions never schedule a reload hint or scroll');
    }
  } else {
    assert.equal(calls.length, 0);
    assert.equal(timers.size, 0);
  }
}
(async () => {
  await run();
  await run({ website: 'https://spam.example' });
  await run({ website: ' ' });
  await run({ reducedMotion: true });
  await run({ missingReviews: true });
  await run({ code: 400 });
  await run({ code: 500 });
  await run({ fail: true });
  await run({ invalid: true });
  await run({ configured: false });
  await run({ phone: '' });
  console.log('Submission payload, honeypot, placeholder, validation, duplicate protection, success, and failure checks passed. No live requests sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
