const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('script.js', 'utf8').replace(/const CONTACT_API_URL = '[^']*';/, "const CONTACT_API_URL = '';");

async function run({ configured = true, code = 200, fail = false, phone = '(412) 555-0123', invalid = false } = {}) {
  const values = { firstName: ' Jane ', lastName: ' Doe ', email: 'jane@example.com', phone, service: 'Interior remodeling', message: 'Please help remodel our kitchen.', website: '' };
  const element = value => ({ value, textContent: '', addEventListener() {}, setAttribute() {}, removeAttribute() {}, getAttribute() {}, focus() {} });
  const status = element('');
  const button = element('');
  const form = element('');
  form.elements = Object.fromEntries(Object.entries(values).map(([id, value]) => [id, element(value)]));
  form.elements.service.options = [{ value: 'Interior remodeling' }];
  form.querySelector = () => button;
  let submit;
  form.addEventListener = (event, handler) => { if (event === 'submit') submit = handler; };
  const document = {
    querySelector: selector => selector === '#contact-form' ? form : selector === '#form-status' ? status : element(''),
    querySelectorAll: () => [], addEventListener() {}, getElementById: () => element('')
  };
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    assert.equal(button.disabled, true);
    if (fail) throw new Error('Network failed');
    return { ok: code === 200, status: code, json: async () => ({ message: invalid ? 'Unexpected' : 'Project request received' }) };
  };
  vm.runInNewContext(configured ? source.replace("const CONTACT_API_URL = '';", "const CONTACT_API_URL = 'https://example.test/contact';") : source, { document, fetch, AbortController, setTimeout, clearTimeout, Date });
  const first = submit({ preventDefault() {} });
  const second = submit({ preventDefault() {} });
  await Promise.all([first, second]);
  assert.equal(form.elements.message.value, values.message);
  if (configured && phone) {
    assert.equal(calls.length, 1, 'Block duplicate in-flight submissions');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      firstName: 'Jane', lastName: 'Doe', email: values.email, phone,
      project: 'Service: Interior remodeling\n\nPlease help remodel our kitchen.'
    });
    assert.equal(button.disabled, false);
    assert.equal(status.textContent.includes('Thank you!'), code === 200 && !fail && !invalid);
  } else assert.equal(calls.length, 0);
}
(async () => {
  await run();
  await run({ code: 400 });
  await run({ code: 500 });
  await run({ fail: true });
  await run({ invalid: true });
  await run({ configured: false });
  await run({ phone: '' });
  console.log('Submission payload, placeholder, validation, duplicate protection, success, and failure checks passed. No live requests sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
