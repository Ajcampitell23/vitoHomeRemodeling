const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('reviews.js', 'utf8');
const context = { URL, document: { querySelector: () => null } };
vm.createContext(context);
vm.runInContext(source, context);
const fixture = {
  displayName: { text: 'Sample business' }, rating: 4.7, userRatingCount: 42,
  googleMapsUri: 'https://maps.google.com/?cid=123',
  reviews: [{ authorAttribution: { displayName: '<script>not HTML</script>', uri: 'https://maps.google.com/profile/1' }, rating: 5, originalText: { text: 'A sample review.' }, publishTime: '2026-01-02T12:00:00Z' }]
};
const place = context.normalizeReviews(fixture);
assert.equal(place.name, 'Sample business');
assert.equal(place.count, 42);
assert.equal(context.normalizeReviews({ name: 'Sample business', rating: 4.9, reviewCount: 21, reviews: [] }).count, 21);
assert.equal(place.rating, 4.7);
assert.equal(place.reviews[0].text, 'A sample review.');
assert.equal(place.reviews[0].author, '<script>not HTML</script>');
assert.equal(context.normalizeReviews({ body: JSON.stringify(fixture) }).rating, 4.7);
assert.equal(context.normalizeReviews({ data: fixture }).reviews.length, 1);
assert.equal(context.normalizeReviews({ businessName: 'Empty', rating: null, totalReviews: 0 }).reviews.length, 0);
assert.equal(context.normalizeReviews({ name: 'Legacy', user_ratings_total: 2, reviews: [{ author_name: 'Sam', text: 'Good', time: 1700000000 }] }).reviews[0].author, 'Sam');
assert.equal(context.safeReviewUrl('javascript:alert(1)'), '');
assert.equal(context.safeReviewUrl('https://name:password@example.com'), '');
assert.equal(context.normalizeReviews({ name: 'Bad rating', rating: 99 }).rating, null);
assert.throws(() => context.normalizeReviews({ message: 'Not Found' }));
assert.ok(!source.includes('innerHTML'), 'API content must not be inserted as HTML');

async function verifyFailure() {
  const nodes = Object.fromEntries(['#google-reviews', '#google-reviews-content', '#reviews-status', '#reviews-retry'].map(id => [id, { textContent: '', hidden: false, setAttribute() {}, replaceChildren() {}, addEventListener() {} }]));
  let requests = 0;
  const sandbox = { URL, AbortController, setTimeout, clearTimeout,
    document: { querySelector: id => nodes[id] },
    fetch: async (url, options) => {
      requests++;
      assert.equal(options.headers.Accept, 'application/json');
      assert.equal(nodes['#reviews-status'].textContent, 'Loading Google reviews...');
      return { ok: false, status: 404 };
    }
  };
  vm.runInNewContext(source, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 1);
  assert.equal(nodes['#reviews-retry'].hidden, false);
  assert.match(nodes['#reviews-status'].textContent, /temporarily unavailable/);
}
verifyFailure().then(() => console.log('Review schema, empty data, unsafe URLs, and loading/error checks passed. No live requests sent.')).catch(error => { console.error(error); process.exitCode = 1; });
