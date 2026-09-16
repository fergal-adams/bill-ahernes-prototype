const header = document.querySelector('.site-header');
const footer = document.querySelector('.site-footer');
const monogram = footer.querySelector('.monogram');
const hostFooter = document.querySelector('.host-footer');
const drinkSection = document.getElementById('drink');
const hostSection = document.getElementById('host');

// Which of header/footer is anchored to the top edge, the bottom edge, or
// neither (e.g. the wordmark is vertically centred on desktop) changes
// between breakpoints. Rather than hardcode which is which, measure each
// element's current rendered position directly.
function edgeLine(rect) {
  if (rect.top <= 5) return rect.bottom;
  if (rect.bottom >= window.innerHeight - 5) return rect.top;
  return null;
}

function setupChromeColorSwitch() {
  // The header watches what's under it; the footer watches what's under
  // it. Each gets its own trigger line, measured from its own current
  // position, so they can flip at different scroll positions instead of
  // being forced to match each other.
  let ticking = false;

  function isLightAt(triggerLine) {
    const drinkTop = drinkSection.getBoundingClientRect().top;
    const hostTop = hostSection.getBoundingClientRect().top;
    return drinkTop <= triggerLine && hostTop > triggerLine;
  }

  function update() {
    const headerRect = header.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    header.classList.toggle('is-light', isLightAt(headerRect.bottom));
    footer.classList.toggle('is-light', isLightAt(edgeLine(footerRect) ?? footerRect.bottom));

    // On desktop the mark sits on its own at the bottom-left, independent
    // of the hours block pinned top-left, so it needs its own read of
    // what's behind ITS position rather than inheriting the footer's.
    const monogramRect = monogram.getBoundingClientRect();
    monogram.classList.toggle('is-light', isLightAt(edgeLine(monogramRect) ?? monogramRect.top));

    // Final transition: once the gold sub-footer on "Host at Bill's" has
    // scrolled up far enough to sit behind the fixed mark, flip it to
    // navy so it doesn't disappear against the matching gold background.
    // hostFooter is display:none on mobile, where it doesn't apply.
    const onGold =
      getComputedStyle(hostFooter).display !== 'none' &&
      hostFooter.getBoundingClientRect().top <= monogramRect.bottom;
    monogram.classList.toggle('is-on-gold', onGold);

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function setupRevealOnScroll() {
  // Text and images stay invisible while they're still emerging from
  // behind a fixed bar that's anchored to that edge, and only fade in
  // once they've fully cleared it — instead of being visible the whole
  // time and colliding with the wordmark/opening-hours chrome. An
  // element that isn't edge-anchored (e.g. the vertically-centred
  // wordmark on desktop) doesn't get any occlusion — content passing
  // behind it as it scrolls away is normal fixed-header behaviour.
  const revealEls = document.querySelectorAll(
    'main h1, main h2, main h3, main p, main .placeholder, main a'
  );
  revealEls.forEach((el) => el.classList.add('reveal'));

  const rects = [header.getBoundingClientRect(), footer.getBoundingClientRect()];
  const topOcclusion = Math.max(0, ...rects.filter((r) => r.top <= 5).map((r) => r.bottom));
  const bottomAnchoredTop = Math.min(
    window.innerHeight,
    ...rects.filter((r) => r.bottom >= window.innerHeight - 5).map((r) => r.top)
  );
  const bottomOcclusion = Math.max(0, window.innerHeight - bottomAnchoredTop);

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      // Only count an element as "in" once it is entirely clear of both
      // occluded edges (threshold: 1 = fully within the shrunk root).
      rootMargin: `-${topOcclusion}px 0px -${bottomOcclusion}px 0px`,
      threshold: 1,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

setupChromeColorSwitch();
setupRevealOnScroll();
