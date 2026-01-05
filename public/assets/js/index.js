const items = document.querySelectorAll('.carousel-item');
const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const guideTrack = document.querySelector('.carousel2');
const guideWrapper = document.querySelector('.carousel2-wrapper');
const guideItems = document.querySelectorAll('.carousel-item2');
const guidePrevBtn = document.getElementById('guidePrev');
const guideNextBtn = document.getElementById('guideNext');
const GUIDE_VISIBLE = 2;
const AUTO_SCROLL_DELAY = 2200;
let currentIndex = 2;
let autoScrollInterval;
let guideIndex = 0;
let guideAutoInterval;

function updateCarousel() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  items.forEach((item) => {
    item.classList.remove('active');
    item.style.transform = isMobile ? 'scale(1)' : 'scale(0.8)';
    item.style.opacity = isMobile ? '1' : '0.5';
    const caption = item.querySelector('.caption');
    if (caption) caption.style.display = 'none';
  });

  const activeItem = items[currentIndex];
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.style.transform = isMobile ? 'scale(1)' : 'scale(1.2)';
    activeItem.style.opacity = '1';
    const caption = activeItem.querySelector('.caption');
    if (caption) caption.style.display = 'block';
    centerActiveItem(activeItem);
  }
}

function centerActiveItem(activeItem) {
  if (!carousel) return;
  const containerWidth = carousel.clientWidth;
  const rawTarget = activeItem.offsetLeft - (containerWidth / 2 - activeItem.offsetWidth / 2);
  const maxScroll = carousel.scrollWidth - containerWidth;
  const targetScroll = Math.max(0, Math.min(rawTarget, maxScroll));
  carousel.scrollTo({ left: targetScroll, behavior: 'smooth' });
}

function nextItem() {
  currentIndex = (currentIndex + 1) % items.length;
  updateCarousel();
}

function prevItem() {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  updateCarousel();
}

const startAutoScroll = () => {
  if (!items.length || autoScrollInterval) return;
  autoScrollInterval = setInterval(nextItem, AUTO_SCROLL_DELAY);
};

const pauseAutoScroll = () => {
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
};

const resetAutoScroll = () => {
  pauseAutoScroll();
  startAutoScroll();
};

if (prevBtn && nextBtn && items.length) {
  updateCarousel();
  startAutoScroll();

  prevBtn.addEventListener('click', () => {
    prevItem();
    resetAutoScroll();
  });

  nextBtn.addEventListener('click', () => {
    nextItem();
    resetAutoScroll();
  });

  if (carousel) {
    carousel.addEventListener('mouseenter', pauseAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);
    window.addEventListener('resize', () => {
      updateCarousel();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAutoScroll();
    else startAutoScroll();
  });
}

const getGuideStep = () => {
  if (!guideItems.length) return 0;
  const itemWidth = guideItems[0].offsetWidth;
  const styles = window.getComputedStyle(guideTrack);
  const gap = parseFloat(styles.columnGap || styles.gap || '0');
  return itemWidth + gap;
};

const scrollGuideToIndex = (behavior = 'smooth') => {
  if (!guideTrack || !guideItems.length) return;
  const maxIndex = Math.max(0, guideItems.length - 2);
  if (guideIndex > maxIndex) guideIndex = maxIndex;
  if (guideIndex < 0) guideIndex = 0;
  const step = getGuideStep();
  if (behavior === 'auto') {
    guideTrack.style.transition = 'none';
    guideTrack.style.transform = `translateX(-${guideIndex * step}px)`;
    requestAnimationFrame(() => (guideTrack.style.transition = 'transform 0.4s ease'));
  } else {
    guideTrack.style.transition = 'transform 0.4s ease';
    guideTrack.style.transform = `translateX(-${guideIndex * step}px)`;
  }
};

const advanceGuide = () => {
  if (!guideItems.length) return;
  const maxIndex = Math.max(0, guideItems.length - 2);
  guideIndex += 1;
  if (guideIndex > maxIndex) guideIndex = 0;
  scrollGuideToIndex();
};

const startGuideAuto = () => {
  if (guideAutoInterval || guideItems.length <= GUIDE_VISIBLE) return;
  guideAutoInterval = setInterval(advanceGuide, 3000);
};

const pauseGuideAuto = () => {
  clearInterval(guideAutoInterval);
  guideAutoInterval = null;
};

if (guideTrack && guideItems.length) {
  scrollGuideToIndex('auto');
  requestAnimationFrame(() => (guideTrack.style.transition = 'transform 0.4s ease'));
  startGuideAuto();

  guidePrevBtn?.addEventListener('click', () => {
    guideIndex -= 1;
    if (guideIndex < 0) {
      guideIndex = Math.max(0, guideItems.length - GUIDE_VISIBLE);
    }
    scrollGuideToIndex();
    pauseGuideAuto();
    startGuideAuto();
  });

  guideNextBtn?.addEventListener('click', () => {
    const maxIndex = Math.max(0, guideItems.length - GUIDE_VISIBLE);
    guideIndex = guideIndex + 1;
    if (guideIndex > maxIndex) guideIndex = 0;
    scrollGuideToIndex();
    pauseGuideAuto();
    startGuideAuto();
  });

  guideWrapper?.addEventListener('mouseenter', pauseGuideAuto);
  guideWrapper?.addEventListener('mouseleave', startGuideAuto);
  window.addEventListener('resize', () => scrollGuideToIndex('auto'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGuideAuto();
    else startGuideAuto();
  });
}
