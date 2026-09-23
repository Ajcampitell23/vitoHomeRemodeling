# Vito Home Remodeling redesign

Open `Index.html` in a browser. No build step or dependencies are needed. The page works at desktop and mobile sizes. Google Fonts are optional; system fonts are used if unavailable.

## Files

- `Index.html`: page content and accessible contact form.
- `services.html`: roofing, gutters, exterior, and interior service sections with a sticky jump bar. Estimate links return to the homepage contact form.
- `slideshows.js`: service photo slideshows with 5-second intervals, fading transitions, previous/next and pause controls. Autoplay pauses offscreen and in hidden tabs; reduced-motion preferences disable autoplay by default.
- `images/`: additional labeled AVIF photos, grouped by service in `services.html`. Roofing and gutters retain their original image first; exterior and interior slideshows use only uploaded photos. Additional photos load as needed; failed images are skipped.
- `styles.css`: responsive layout, colors, and typography.
- `script.js`: navigation, service selection, and form validation.
- `assets/`: locally saved photos from the original website.

## Contact form

The form currently validates inputs only. It does not open an email application, send requests, or store inquiries. Valid submissions display an unavailable message and retain the entered details. The separate direct phone and email links remain available.

Validation checks names, required services, email addresses (including @ and a dotted domain), optional phone numbers (10–15 digits), and messages (20–2,000 trimmed characters). Inline errors are associated with each field; submission focuses the first invalid field. A hidden honeypot rejects simple automated form fills. No API keys or personal data are saved in browser storage.

For direct submission at deployment, connect the marked submission handler in `script.js` to the planned API Gateway endpoint, backed by Lambda and SES. Repeat all validation on the server: browser validation and honeypots can be bypassed. Add rate limits, spam filtering, request size limits, and origin checks appropriate to your host. Keep credentials on the server, prevent email-header injection, handle failed requests without clearing inputs, and display success only after a confirmed response. Do not enable direct submission until the endpoint is ready.

## Photos and content

Photos and business details were taken from https://www.vitohomeremodeling.com/ on September 22, 2026. Existing website photos are reused as site imagery, not labeled as verified portfolio projects. Confirm rights and business details before publishing.

Replace the files in `assets/` with your own photos using the same names, or change their paths and descriptive alt text in the HTML. Hero and service photos use `object-fit: cover`; adjust `object-position` in CSS to change cropping.

- `roofing.jpg`: original roofing image (`98d290_45144d0373d04f45b77ce8c975077806~mv2.jpg`).
- `exterior.jpg`: original gutter image (`98d290_8a726f8c18ca4e0cb07f44dd66bc2d84~mv2.jpg`).
- `vito.jpg`: original owner image (`98d290_492ab04987834068995092a3754f72ef~mv2.png`).

For a case-sensitive host that expects lowercase `index.html`, rename `Index.html` before deployment.

