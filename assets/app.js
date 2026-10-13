window.onTurnstileLoad = () => window.dispatchEvent(new Event('turnstile-ready'));

(() => {
      const isStaticPreview = document.documentElement.dataset.staticPreview === 'true';
      const pageBackdrop = document.querySelector('#pageBackdrop');
      const bookingBackdrop = document.querySelector('#bookingBackdrop');
      const modalBlurLayer = document.querySelector('#modalBlurLayer');
      const pageBody = document.querySelector('#pageBody');
      const pageTitle = document.querySelector('#pageWindowTitle');
      const pageFolder = document.querySelector('#pageFolder');
      const form = document.querySelector('#bookingForm');
      const formMessage = document.querySelector('#formMessage');
      const formMessageContainer = formMessage.closest('.form-message-container');
      const turnstileContainer = document.querySelector('#turnstileWidget');
      const turnstileSiteKey = '0x4AAAAAAFUKM-xabEgMsz0c';
      let turnstileWidgetId;
      let turnstileRequest;
      const turnstileApi = isStaticPreview ? Promise.resolve(null) : new Promise((resolve, reject) => {
        const resolveApi = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
        if (window.turnstile) resolveApi();
        else window.addEventListener('turnstile-ready', resolveApi, { once: true });
        window.setTimeout(() => reject(new Error('Turnstile unavailable')), 10000);
      });

      function completeTurnstileRequest(token) {
        if (!turnstileRequest) return;
        const request = turnstileRequest;
        turnstileRequest = undefined;
        if (typeof token === 'string' && token) {
          turnstileContainer.hidden = true;
          request.resolve(token);
        } else {
          request.reject(new Error('Turnstile verification failed'));
        }
      }

      async function ensureTurnstileWidget() {
        const api = await turnstileApi;
        if (turnstileWidgetId !== undefined) return api;
        turnstileWidgetId = api.render(turnstileContainer, {
          sitekey: turnstileSiteKey,
          action: 'registration',
          execution: 'render',
          appearance: 'always',
          size: 'flexible',
          theme: 'light',
          'response-field': false,
          callback: completeTurnstileRequest,
          'error-callback': (errorCode) => {
            console.error('Turnstile client error:', errorCode);
            completeTurnstileRequest();
            return true;
          },
          'expired-callback': () => {
            console.warn('Turnstile token expired before submission completed.');
            completeTurnstileRequest();
          },
          'timeout-callback': () => {
            console.warn('Turnstile challenge timed out.');
            completeTurnstileRequest();
          }
        });
        return api;
      }

      async function requestTurnstileToken() {
        turnstileContainer.hidden = false;
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        const widgetAlreadyRendered = turnstileWidgetId !== undefined;
        return new Promise((resolve, reject) => {
          turnstileRequest = { resolve, reject };
          void ensureTurnstileWidget()
            .then((api) => {
              if (widgetAlreadyRendered) api.reset(turnstileWidgetId);
            })
            .catch(() => completeTurnstileRequest());
        });
      }

      async function destroyTurnstile() {
        completeTurnstileRequest();
        const widgetId = turnstileWidgetId;
        turnstileWidgetId = undefined;
        try {
          if (widgetId !== undefined) {
            const api = await turnstileApi;
            api.remove(widgetId);
          }
        } catch {
          // The widget is already unavailable; the next attempt renders a fresh one.
        } finally {
          turnstileContainer.replaceChildren();
        }
      }
      const facts = document.querySelector('.facts');
      const desktopGallery = document.querySelector('.desktop-gallery');
      const galleryVideo = document.querySelector('[data-lazy-video]');
      const pageMeta = {
        about: { title: 'About the Workshop', folder: 'Chapter 01' },
        results: { title: 'Outcomes', folder: 'Chapter 06' },
        agenda: { title: 'Workshop Program', folder: 'Chapter 04' },
        tutors: { title: 'Instructors', folder: 'Chapter 05' },
        before: { title: 'Before You Join', folder: 'Chapter 03' },
        price: { title: 'Price & Booking', folder: 'Chapter 02' }
      };
      const optimizedAssets = {
        'assets/red-flower.png': 'assets/red-flower-480.webp',
        'assets/agenda-part1.png': 'assets/agenda-part1-960.webp',
        'assets/agenda-part3.png': 'assets/agenda-part3-960.webp',
        'assets/knit-blue.png': 'assets/knit-blue-800.webp',
        'assets/knit-grey.png': 'assets/knit-grey-800.webp',
        'assets/knit-indigo.png': 'assets/knit-indigo-800.webp',
        'assets/knit-pink.png': 'assets/knit-pink-800.webp',
        'assets/knit-red.png': 'assets/knit-red-800.webp',
        'assets/results-outfit.png': 'assets/results-outfit-768.webp',
        'assets/daria.png': 'assets/daria-340.webp',
        'assets/olha.png': 'assets/olha-340.webp',
        'assets/starter-folder.png': 'assets/starter-folder-512.webp'
      };
      const mobileOptimizedAssets = {
        'assets/knit-blue.png': 'assets/knit-blue-400.webp',
        'assets/knit-grey.png': 'assets/knit-grey-400.webp',
        'assets/knit-indigo.png': 'assets/knit-indigo-400.webp',
        'assets/knit-pink.png': 'assets/knit-pink-400.webp',
        'assets/knit-red.png': 'assets/knit-red-400.webp',
        'assets/knit-beige-800.webp': 'assets/knit-beige-400.webp'
      };
      const mobileAssetsMedia = window.matchMedia('(max-width: 760px)');

      function optimizedAssetFor(source) {
        const relativePrefix = source.startsWith('../') ? '../' : '';
        const lookupSource = relativePrefix ? source.slice(3) : source;
        const replacement = (mobileAssetsMedia.matches && mobileOptimizedAssets[lookupSource])
          || optimizedAssets[lookupSource];
        return replacement ? `${relativePrefix}${replacement}` : source;
      }

      function replaceOptimizedSources(root) {
        root.querySelectorAll('img[src]').forEach((image) => {
          const source = image.getAttribute('src');
          const optimized = optimizedAssetFor(source);
          if (optimized !== source) image.src = optimized;
        });
      }

      const assetPreloadCache = new Map();
      const deferredCssImageAssets = [
        `${isStaticPreview ? '../' : ''}assets/blue-flower-480.webp`,
        `${isStaticPreview ? '../' : ''}assets/green-flower-480.webp`,
        `${isStaticPreview ? '../' : ''}assets/pink-flower-480.webp`
      ];

      function toAssetUrl(source) {
        if (!source) return null;
        const url = new URL(source, document.baseURI);
        return url.origin === window.location.origin ? url.href : null;
      }

      function preloadImage(source, priority = 'high') {
        const url = toAssetUrl(source);
        if (!url) return Promise.resolve();
        if (assetPreloadCache.has(url)) return assetPreloadCache.get(url);
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = priority;
        const ready = new Promise((resolve) => {
          const finish = () => resolve();
          image.onload = () => image.decode().catch(() => {}).then(finish);
          image.onerror = finish;
          image.src = url;
          if (image.complete) image.decode().catch(() => {}).then(finish);
        });
        assetPreloadCache.set(url, ready);
        return ready;
      }

      function firstSourceFromSet(srcset) {
        return srcset.split(',')[0].trim().split(/\s+/)[0];
      }

      function collectMarkupAssets(root) {
        const urls = new Set();
        if (!root) return urls;
        root.querySelectorAll('img[src], source[srcset], video[poster]').forEach((element) => {
          const source = element.getAttribute('src')
            || element.getAttribute('srcset')
            || element.getAttribute('poster');
          if (!source) return;
          const url = element.hasAttribute('srcset') ? firstSourceFromSet(source) : source;
          urls.add(optimizedAssetFor(url));
        });
        return urls;
      }

      function isImageAsset(source) {
        return /\.(?:webp|png|jpe?g|svg)(?:[?#].*)?$/i.test(source);
      }

      const landingFontRequests = [
        '500 1em "Signika Negative"',
        '400 1em "Waiting for the Sunrise"',
        '400 1em Ubuntu',
        '500 1em Ubuntu',
        '700 1em Ubuntu',
        '400 1em Amarna',
        '400 1em Poppins'
      ];

      async function loadLandingFonts() {
        if (!document.fonts) return;
        await Promise.all(landingFontRequests.map((font) => document.fonts.load(font).catch(() => [])));
        await document.fonts.ready;
      }

      function activateDeferredMarkupAssets(root) {
        root?.querySelectorAll('[data-src]').forEach((element) => {
          element.src = element.dataset.src;
          delete element.dataset.src;
        });
        root?.querySelectorAll('[data-srcset]').forEach((element) => {
          element.srcset = element.dataset.srcset;
          delete element.dataset.srcset;
        });
      }

      async function prepareLandingAssets() {
        const markupAssets = [...collectMarkupAssets(document.querySelector('#landing'))];
        const imageAssets = markupAssets.filter(isImageAsset);

        await Promise.all([...imageAssets.map(preloadImage), loadLandingFonts()]);
      }

      async function prepareDeferredAssets() {
        activateDeferredMarkupAssets(pageBackdrop);
        activateDeferredMarkupAssets(bookingBackdrop);
        const deferredMarkupAssets = [
          ...collectMarkupAssets(pageBackdrop),
          ...collectMarkupAssets(bookingBackdrop),
          ...[...document.querySelectorAll('template')].flatMap((template) => [...collectMarkupAssets(template.content)])
        ];
        const deferredImageAssets = [...new Set([...deferredMarkupAssets, ...deferredCssImageAssets])]
          .filter(isImageAsset);

        await Promise.all(deferredImageAssets.map((source) => preloadImage(source, 'low')));
      }

      // Never gate first paint on fonts or decorative imagery. The browser can
      // render the page immediately and swap fonts/images in as they arrive.
      document.body.hidden = false;
      document.documentElement.classList.replace('assets-loading', 'assets-ready');
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('landing-assets-ready'));
      });
      void loadLandingFonts();

      // The desktop clip is large, so only fetch/play it when the gallery is
      // close to the viewport. Reduced-motion users keep the poster frame.
      if (galleryVideo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if ('IntersectionObserver' in window) {
          const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) void galleryVideo.play().catch(() => undefined);
              else galleryVideo.pause();
            });
          }, { rootMargin: '240px 0px', threshold: 0.01 });
          videoObserver.observe(galleryVideo);
        } else {
          void galleryVideo.play().catch(() => undefined);
        }
      }

      const factsMedia = window.matchMedia('(min-aspect-ratio: 7 / 5)');
      // Important content should never depend on the first scroll event to exist.
      const factsAnimationEnabled = false;
      let factsPositionFrame;
      let factsScrollStarted = false;
      let factsRevealed = false;
      if (factsAnimationEnabled) facts?.classList.add('facts-fade-in');
      function updateFactsVisibility() {
        factsPositionFrame = undefined;
        if (!facts || !factsAnimationEnabled || factsRevealed) return;
        const distanceFromViewportBottom = window.innerHeight - facts.getBoundingClientRect().bottom;
        if (distanceFromViewportBottom > 100) {
          factsRevealed = true;
          facts.classList.add('facts--visible');
        }
      }
      function scheduleFactsVisibility() {
        if (!factsPositionFrame) factsPositionFrame = window.requestAnimationFrame(updateFactsVisibility);
      }

      const galleryAnimationEnabled = false;
      let galleryPositionFrame;
      let galleryScrollStarted = false;
      let galleryRevealed = false;
      if (galleryAnimationEnabled) desktopGallery?.classList.add('desktop-gallery-fade-in');
      function updateGalleryVisibility() {
        galleryPositionFrame = undefined;
        if (!desktopGallery || !galleryAnimationEnabled || galleryRevealed) return;
        if (desktopGallery.getBoundingClientRect().top <= window.innerHeight - 200) {
          galleryRevealed = true;
          desktopGallery.classList.add('desktop-gallery--visible');
        }
      }
      function scheduleGalleryVisibility() {
        if (!galleryPositionFrame) galleryPositionFrame = window.requestAnimationFrame(updateGalleryVisibility);
      }

      window.addEventListener('scroll', () => {
        factsScrollStarted = true;
        scheduleFactsVisibility();
        galleryScrollStarted = true;
        scheduleGalleryVisibility();
      }, { passive: true });
      window.addEventListener('resize', () => {
        if (factsScrollStarted && factsAnimationEnabled) scheduleFactsVisibility();
        if (galleryScrollStarted && galleryAnimationEnabled) scheduleGalleryVisibility();
      });

      const heroIntroMedia = window.matchMedia('(min-aspect-ratio: 7 / 5)');
      const heroIntroElements = document.querySelectorAll('#hero-title, .hero-subtitle, .hero-description, .hero-note, .hero-copy .primary-button, .hero-art');
      let heroIntroPlayed = false;
      function playHeroIntro() {
        if (heroIntroPlayed || !heroIntroMedia.matches) return;
        heroIntroPlayed = true;
        heroIntroElements.forEach((element) => element.classList.add('hero-fade-in'));
      }
      window.addEventListener('landing-assets-ready', playHeroIntro, { once: true });

      const modalTransitionMs = 250;
      const modalTimers = new WeakMap();
      const modalFrames = new WeakMap();
      let blurHideTimer;
      let bookingOpen = false;

      function setFormMessage(message, type = 'system') {
        if (!bookingOpen) return;
        formMessage.textContent = message;
        formMessage.classList.remove('form-message--error', 'form-message--success');
        if (type === 'error') formMessage.classList.add('form-message--error');
        if (type === 'success') formMessage.classList.add('form-message--success');
        formMessageContainer.classList.toggle('form-message-container--visible', Boolean(message));
      }

      function clearFormMessage() {
        formMessage.textContent = '';
        formMessage.classList.remove('form-message--error', 'form-message--success');
        formMessageContainer.classList.remove('form-message-container--visible');
      }

      function lockPageScroll() {
        document.documentElement.classList.add('modal-open');
      }

      function unlockPageScroll() {
        document.documentElement.classList.remove('modal-open');
      }

      function showModal(backdrop) {
        window.clearTimeout(modalTimers.get(backdrop));
        window.clearTimeout(blurHideTimer);
        window.cancelAnimationFrame(modalFrames.get(backdrop));
        modalBlurLayer.hidden = false;
        backdrop.classList.remove('is-visible');
        backdrop.hidden = false;
        void backdrop.offsetWidth;
        modalFrames.set(backdrop, requestAnimationFrame(() => {
          modalBlurLayer.classList.add('is-visible');
          backdrop.classList.add('is-visible');
        }));
      }

      function hideModal(backdrop) {
        window.cancelAnimationFrame(modalFrames.get(backdrop));
        backdrop.classList.remove('is-visible');
        modalTimers.set(backdrop, window.setTimeout(() => {
          if (!backdrop.classList.contains('is-visible')) backdrop.hidden = true;
        }, modalTransitionMs));
      }

      function closeModals() {
        bookingOpen = false;
        turnstileContainer.hidden = true;
        document.documentElement.classList.remove('booking-blur-active');
        document.documentElement.classList.remove('page-blur-active');
        clearFormMessage();
        void destroyTurnstile();
        hideModal(pageBackdrop);
        hideModal(bookingBackdrop);
        modalBlurLayer.classList.remove('is-visible');
        window.clearTimeout(blurHideTimer);
        blurHideTimer = window.setTimeout(() => {
          if (!modalBlurLayer.classList.contains('is-visible')) modalBlurLayer.hidden = true;
        }, modalTransitionMs);
        unlockPageScroll();
      }
      function resetPageScroll() {
        pageBody.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        requestAnimationFrame(() => pageBody.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
      }
      async function openPage(key) {
        const meta = pageMeta[key];
        const template = document.querySelector(`#page-${key}`);
        if (!meta || !template) return;
        activateDeferredMarkupAssets(pageBackdrop);
        pageTitle.textContent = meta.title;
        pageFolder.textContent = meta.folder;
        const page = template.content.cloneNode(true);
        replaceOptimizedSources(page);
        pageBody.replaceChildren(page);
        showModal(pageBackdrop);
        resetPageScroll();
        bookingOpen = false;
        document.documentElement.classList.remove('booking-blur-active');
        document.documentElement.classList.add('page-blur-active');
        hideModal(bookingBackdrop);
        lockPageScroll();
        pageBackdrop.querySelector('[data-close]').focus();
      }
      function openBooking() {
        activateDeferredMarkupAssets(bookingBackdrop);
        bookingOpen = true;
        document.documentElement.classList.remove('page-blur-active');
        document.documentElement.classList.add('booking-blur-active');
        hideModal(pageBackdrop);
        showModal(bookingBackdrop);
        lockPageScroll();
        form.reset();
        resetSubmittedButton();
        clearFormMessage();
        bookingBackdrop.querySelector('input').focus();
      }

      document.addEventListener('click', (event) => {
        const pageButton = event.target.closest('[data-page]');
        const bookingButton = event.target.closest('[data-open-booking]');
        if (pageButton) {
          event.preventDefault();
          openPage(pageButton.dataset.page);
        } else if (bookingButton) {
          event.preventDefault();
          openBooking();
        } else if (event.target.closest('[data-close]') || event.target === pageBackdrop || event.target === bookingBackdrop) {
          closeModals();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModals();
      });

      let submitting = false;
      let formSubmitted = false;
      const submitButton = form.querySelector('button[type="submit"]');
      const defaultSubmitButtonText = submitButton.textContent.trim();

      function showSubmittedButton() {
        formSubmitted = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Form Submitted';
        submitButton.classList.add('submit-button--submitted');
      }

      function resetSubmittedButton() {
        formSubmitted = false;
        submitButton.disabled = false;
        submitButton.textContent = defaultSubmitButtonText;
        submitButton.classList.remove('submit-button--submitted');
      }

      form.addEventListener('input', (event) => {
        if (formSubmitted && !submitting && event.target.matches('input[name="full_name"], input[name="email"]')) {
          resetSubmittedButton();
        }
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity() || submitting || formSubmitted) return;

        if (isStaticPreview) {
          setFormMessage('Concept preview only — registration is not connected. Contact riolaacademy@gmail.com to ask about availability.', 'success');
          return;
        }

        submitting = true;
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        setFormMessage('Verifying security...');

        const formData = new FormData(form);
        const fullName = (formData.get('full_name') || '').toString().trim();
        const email = (formData.get('email') || '').toString().trim();
        const referralSource = (formData.get('referral_source') || '').toString();

        try {
          const turnstileToken = await requestTurnstileToken();
          setFormMessage('Sending your request...');
          const headers = { 'Content-Type': 'application/json' };
          const response = await fetch('/api/registrations', {
            method: 'POST',
            headers,
            body: JSON.stringify({ full_name: fullName, email, referral_source: referralSource, turnstile_token: turnstileToken })
          });
          const payload = await response.json().catch(() => ({}));

          if (response.status === 202) {
            clearFormMessage();
            showSubmittedButton();
          } else if (response.status === 400 && payload.error === 'turnstile_failed') {
            setFormMessage('Security verification failed. Please try again.', 'error');
          } else if (response.status === 400) {
            const details = Array.isArray(payload.details) ? payload.details : [];
            const messages = details.map((detail) => detail.message).filter(Boolean);
            setFormMessage(messages.join(' ') || 'Please check your name and email address.', 'error');
          } else if (response.status === 429) {
            setFormMessage('Too many requests. Please try again later.', 'error');
          } else if (response.status === 503) {
            setFormMessage('We could not submit your request right now. Please try again later.', 'error');
          } else {
            setFormMessage('Something went wrong. Please try again later.', 'error');
          }
        } catch (error) {
          console.error('Registration security verification error:', error);
          setFormMessage('We could not complete security verification. Please try again.', 'error');
        } finally {
          submitting = false;
          if (!formSubmitted) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }
        }
      });

      document.addEventListener('change', (event) => {
        if (!event.target.matches('.checklist input[type="checkbox"]')) return;
        const checked = document.querySelectorAll('.checklist input:checked').length;
        const progress = document.querySelector('#checkProgress');
        if (progress) progress.textContent = checked;
      });
    })();
