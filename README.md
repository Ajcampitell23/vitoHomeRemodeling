# Vito Home Remodeling redesign

Open `index.html` in a browser. No build step or dependencies are needed. The page works at desktop and mobile sizes. Google Fonts are optional; system fonts are used if unavailable.

## Files

- `index.html`: page content and accessible contact form.
- `services.html`: roofing, gutters, exterior, and interior service sections with a sticky jump bar. Estimate links return to the homepage contact form.
- `slideshows.js`: service photo slideshows with 5-second intervals, fading transitions, previous/next and pause controls. Autoplay pauses offscreen and in hidden tabs; reduced-motion preferences disable autoplay by default.
- `images/`: additional labeled AVIF photos, grouped by service in `services.html`. Roofing and gutters retain their original image first; exterior and interior slideshows use only uploaded photos. Additional photos load as needed; failed images are skipped.
- `styles.css`: responsive layout, colors, and typography.
- `script.js`: navigation, service selection, and form validation.
- `assets/`: locally saved photos from the original website.

## Contact form

The form matches the supplied SES Lambda handler. `CONTACT_API_URL` at the top of `script.js` is configured to `https://sxe7pylr44.execute-api.us-east-2.amazonaws.com/default/sendProjectEmail`. Valid submissions POST to this endpoint. Submission tests replace the URL with a mocked endpoint and never send live requests.

Requests use POST with `Content-Type: application/json` and exactly these fields: `firstName`, `lastName`, `email`, `phone`, and `project`. The project field combines the selected service and message. First name, last name, email, phone, service, and message are required. Names allow 1-80 characters; email requires an @ and dotted domain; phone requires 10-15 digits; message requires 20-2,000 characters. The honeypot and inline validation remain enabled.

The submit button is disabled while sending. A successful response must be HTTP 2xx with the Lambda's JSON message `Project request received`. Errors preserve the entered details; ambiguous network failures do not retry automatically. Requests time out after 20 seconds. No browser AWS credentials are needed. The separate direct contact links remain available.

### API Gateway setup

Use a Lambda proxy integration so the JSON request reaches `event.body`. Configure cross-origin access for the website's exact origin, POST, and the Content-Type header, and support OPTIONS preflight. For HTTP APIs, API Gateway can manage CORS. For REST proxy APIs, configure OPTIONS and include the appropriate Access-Control-Allow-Origin header in Lambda success and error responses (the supplied handler currently returns only Content-Type). See [HTTP API CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html) and [REST API CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html). Preview through a local HTTP server whose origin is allowed, rather than a file:// URL.

The supplied handler's required-field and email checks are compatible. Client-side restrictions and the honeypot can be bypassed, so repeat desired length, type, phone, and spam checks server-side. Avoid logging the entire event, which includes customer contact details. This change does not deploy or modify AWS resources.

## Photos and content

Photos and business details were taken from https://www.vitohomeremodeling.com/ on September 22, 2026. Existing website photos are reused as site imagery, not labeled as verified portfolio projects. Confirm rights and business details before publishing.

Replace the files in `assets/` with your own photos using the same names, or change their paths and descriptive alt text in the HTML. Hero and service photos use `object-fit: cover`; adjust `object-position` in CSS to change cropping.

- `roofing.jpg`: original roofing image (`98d290_45144d0373d04f45b77ce8c975077806~mv2.jpg`).
- `exterior.jpg`: original gutter image (`98d290_8a726f8c18ca4e0cb07f44dd66bc2d84~mv2.jpg`).
- `vito.jpg`: original owner image (`98d290_492ab04987834068995092a3754f72ef~mv2.png`).

The homepage and all internal links use lowercase `index.html` for case-sensitive hosting.


## Google reviews

`reviews.js` fetches public JSON from `REVIEWS_API_URL`. No Google API key is included in the frontend. The configured `/reviews` route returns HTTP 200 with live Places data. Allow the site's origin in API Gateway CORS. Loading, empty results, network errors, and a retry button are supported. The carousel supports touch/trackpad scrolling, keyboard arrows when focused, and Previous/Next buttons.

Expected data is a Places-style object: `displayName.text` (or `businessName`), numeric `rating`, `userRatingCount` (or `reviewCount` / `totalReviews`), `googleMapsUri`, and `reviews`. Each review can include `authorAttribution.displayName`, `authorAttribution.uri`, `authorAttribution.photoUri`, `rating`, `text.text` or string `text`, `publishTime`, `relativePublishTimeDescription`, and `googleMapsUri`. Direct objects and `body`, `place`, `result`, or `data` wrappers are supported. Keep author attribution and source links in the Lambda response. Review text is rendered as text, never HTML, and external URLs must use HTTPS. The returned order is preserved; no review data is persisted in browser storage.

The Google button is shown only when a valid returned `googleMapsUri` is available. Overall review count reflects the API's total, not the number of review cards returned. The integration was checked with fixtures using `node verify-reviews.cjs`; the live endpoint returned a 4.9 rating, 21 total reviews, and five review records when checked on October 12, 2026. Browser access also depends on CORS for the site origin. Google attribution guidance: https://developers.google.com/maps/documentation/places/web-service/policies
## AWS Amplify Hosting

The source stays in the project root. `amplify.yml` runs `node build.cjs` and publishes `dist/`. Node.js 18 or newer is required for packaging; no npm dependencies or backend build are needed.

- `index.html`, `services.html`, `faq.html`: public pages.
- `styles.css` and browser JavaScript: public site styling and behavior.
- `images/`: categorized website images.
- `build.cjs`, `amplify.yml`: hosting build configuration.
- `dist/`: generated deployment files; excluded from Git.
- Verification scripts, README, editor settings, and Git files are not published.

For a Git-connected Amplify app, select the repository root and use the committed build settings. Commit the lowercase homepage rename along with the updated links. This is a multipage static site; do not add a catch-all SPA rewrite to index.html.

For a manual deployment, run `node build.cjs` and ZIP the contents of `dist/` (with index.html at the ZIP root), then upload that ZIP to Amplify Hosting. Edit the source files, not dist, and rebuild after changes.

The email and reviews APIs remain hosted at their existing API Gateway endpoints. Ensure their CORS settings allow the eventual Amplify/custom-domain origin. No AWS credentials or Google API key belong in these static files. Nothing has been deployed by this preparation.

Build specification reference: https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html