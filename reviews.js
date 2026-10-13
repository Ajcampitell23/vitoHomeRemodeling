// Public Lambda endpoint only. Google credentials remain on the server.
const REVIEWS_API_URL = 'https://ysxufhnrm0.execute-api.us-east-2.amazonaws.com/reviews';

function reviewText(value) {
  return typeof value === 'string' ? value : typeof value?.text === 'string' ? value.text : '';
}

function safeReviewUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

function normalizeReviews(payload) {
  if (payload?.body) payload = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
  const place = payload?.place || payload?.result || payload?.data || payload;
  const name = reviewText(place?.displayName) || reviewText(place?.businessName) || reviewText(place?.name);
  if (!place || !name) throw new Error('Missing business information');
  const rating = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
  const count = place.userRatingCount ?? place.reviewCount ?? place.totalReviews ?? place.totalReviewCount ?? place.user_ratings_total;
  return {
    name,
    rating: rating(place.rating),
    count: Number.isInteger(count) && count >= 0 ? count : null,
    url: safeReviewUrl(place.googleMapsUri || place.url),
    reviews: (Array.isArray(place.reviews) ? place.reviews : []).filter(item => item && typeof item === 'object').map(item => ({
      author: reviewText(item.authorAttribution?.displayName) || reviewText(item.authorName) || reviewText(item.author_name) || 'Google reviewer',
      authorUrl: safeReviewUrl(item.authorAttribution?.uri || item.author_url),
      photo: safeReviewUrl(item.authorAttribution?.photoUri || item.profile_photo_url),
      rating: rating(item.rating),
      text: reviewText(item.originalText) || reviewText(item.text),
      published: item.publishTime || item.publishedAt || (typeof item.time === 'number' ? new Date(item.time * 1000).toISOString() : ''),
      relative: reviewText(item.relativePublishTimeDescription) || reviewText(item.relative_time_description),
      url: safeReviewUrl(item.googleMapsUri)
    }))
  };
}

const reviewsSection = document.querySelector('#google-reviews');
if (reviewsSection) {
  const content = document.querySelector('#google-reviews-content');
  const status = document.querySelector('#reviews-status');
  const retry = document.querySelector('#reviews-retry');
  let loading = false;


  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function link(label, url, className) {
    const node = element('a', className, label);
    node.href = url;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
  }

  function stars(rating) {
    const node = element('span', 'review-stars');
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', `${rating} out of 5 stars`);
    const shape = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26Z');
      svg.append(path);
      return svg;
    };
    for (let index = 0; index < 5; index++) {
      const star = element('span', 'review-star');
      star.setAttribute('aria-hidden', 'true');
      const fill = element('span', 'review-star-fill');
      fill.style.width = `${Math.max(0, Math.min(1, rating - index)) * 100}%`;
      fill.append(shape());
      star.append(shape(), fill);
      node.append(star);
    }
    return node;
  }

  function render(place) {
    const summary = element('div', 'reviews-summary');
    const business = element('div');

    const score = element('div', 'reviews-score');
    if (place.rating !== null) {
      score.append(element('strong', '', `${place.rating.toFixed(1)} / 5`), stars(place.rating));
    } else score.append(element('span', '', 'Rating unavailable'));
    if (place.count !== null) score.append(element('span', 'reviews-count', `${place.count.toLocaleString()} ${place.count === 1 ? 'review' : 'reviews'}`));
    business.append(score);
    summary.append(business);
    if (place.url) summary.append(link('View All Reviews on Google', place.url, 'button button-small'));
    content.append(summary);

    if (!place.reviews.length) {
      content.append(element('p', 'reviews-empty', 'No individual reviews are available to display yet.'));
      return;
    }
    const toolbar = element('div', 'reviews-toolbar');
    toolbar.append(element('p', '', 'Scroll down to explore reviews. Shown in the order provided by Google.'));
    const list = element('div', 'reviews-list');
    list.id = 'reviews-list';
    list.tabIndex = 0;
    list.setAttribute('role', 'region');
    list.setAttribute('aria-label', 'Customer reviews, vertically scrollable');
    for (const review of place.reviews) {
      const card = element('article', 'review-card');
      const author = element('div', 'review-author');
      if (review.photo) {
        const photo = element('img', 'review-avatar');
        photo.src = review.photo;
        photo.alt = '';
        photo.width = 40;
        photo.height = 40;
        photo.loading = 'lazy';
        photo.addEventListener('error', () => photo.remove(), { once: true });
        author.append(photo);
      }
      const name = element('h5');
      name.append(review.authorUrl ? link(review.author, review.authorUrl) : document.createTextNode(review.author));
      author.append(name);
      card.append(author);
      if (review.rating !== null) card.append(stars(review.rating));
      const date = new Date(review.published);
      if (review.published && !Number.isNaN(date.getTime())) {
        const time = element('time', 'review-date', date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
        time.dateTime = date.toISOString();
        card.append(time);
      } else card.append(element('p', 'review-date', review.relative || 'Publication date unavailable'));
      const text = element('p', 'review-text', review.text || 'This reviewer left a star rating without a written review.');



      card.append(text);
      if (review.url) card.append(link('Read on Google Maps', review.url, 'review-source'));
      list.append(card);
    }
    content.append(toolbar, list);

  }

  async function loadReviews() {
    if (loading) return;
    loading = true;

    content.replaceChildren();
    retry.hidden = true;
    status.textContent = 'Loading Google reviews...';
    content.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(REVIEWS_API_URL, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`Reviews request failed (${response.status})`);
      render(normalizeReviews(await response.json()));
      status.textContent = '';
    } catch {
      content.replaceChildren();
      status.textContent = 'Reviews are temporarily unavailable. Please try again in a moment.';
      retry.hidden = false;
    } finally {
      clearTimeout(timeout);
      content.setAttribute('aria-busy', 'false');
      loading = false;
    }
  }
  retry.addEventListener('click', loadReviews);
  loadReviews();
}
