function getApiBaseUrl() {
  if (window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  return "http://127.0.0.1:5000";
}

const API_BASE_URL = getApiBaseUrl();
const hasGsap = typeof window.gsap !== "undefined";

const menuGrid = document.getElementById("menuGrid");
const menuNote = document.getElementById("menuNote");
const mainFilterButtons = document.querySelectorAll(".filter-btn");
const subcategoryFilters = document.getElementById("subcategoryFilters");
const reservationForm = document.getElementById("reservationForm");
const reservationStatus = document.getElementById("reservationStatus");
const customCursor = document.getElementById("cursor");
const cursorDot = document.getElementById("cursorDot");
const musicToggle = document.getElementById("musicToggle");
const musicVolume = document.getElementById("musicVolume");
const backgroundMusic = document.getElementById("backgroundMusic");
const heroContent = document.getElementById("heroContent");
const signatureTarget = document.getElementById("signatureTarget");
const reservationCurtain = document.getElementById("reservationCurtain");
const openReservation = document.getElementById("openReservation");

const dishOverlay = document.getElementById("dishOverlay");
const dishModal = document.getElementById("dishModal");
const closeDish = document.getElementById("closeDish");
const dishCategory = document.getElementById("dishCategory");
const dishTitle = document.getElementById("dishTitle");
const dishDescription = document.getElementById("dishDescription");
const dishPrices = document.getElementById("dishPrices");

let allItems = [];
let activeMainFilter = "all";
let activeSubcategoryFilter = "all";
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let dotX = cursorX;
let dotY = cursorY;

const SUBCATEGORY_ORDER = {
  food: [
    "Nepali Cuisine",
    "Indian Cuisine",
    "Asian Cuisine",
    "American Cuisine",
    "European Cuisine",
  ],
  drinks: [
    "Hard Drinks",
    "Soft Drinks / Juices",
    "Wines",
    "Champagne",
    "Beers",
    "Nepali Drinks",
    "Cocktails",
    "Mocktails",
  ],
};

const MUSIC_SOURCES = [
  "assets/audio/bg-music.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
];
let musicSourceIndex = 0;

function formatPrice(value) {
  return Number(value).toFixed(2);
}

function createMenuCard(item) {
  const card = document.createElement("article");
  card.className = "menu-item reveal-item cursor-hover cursor-menu";
  card.dataset.category = item.category;
  card.dataset.subcategory = item.subcategory || "";

  const sectionLabel = item.category === "food" ? "FOODS" : "DRINKS";

  card.innerHTML = `
    <div class="menu-item-visual" data-parallax="0.05">
      <span class="menu-badge">${sectionLabel}</span>
      <p class="menu-subcategory">${item.subcategory || "Curated Selection"}</p>
      <h3>${item.name}</h3>
    </div>
    <div class="menu-item-content">
      <p>${item.description}</p>
      <div class="prices">
        <span class="price-chip">NRS ${formatPrice(item.price_nrs)}</span>
        <span class="price-chip">USD ${formatPrice(item.price_usd)}</span>
        <span class="price-chip">EUR ${formatPrice(item.price_eur)}</span>
      </div>
    </div>
  `;

  card.addEventListener("click", () => openDishOverlay(item));
  return card;
}

function openDishOverlay(item) {
  const sectionLabel = item.category === "food" ? "FOODS" : "DRINKS";
  const subcategoryLabel = item.subcategory || "Curated Selection";
  dishCategory.textContent = `${sectionLabel} -> ${subcategoryLabel}`;

  dishTitle.textContent = item.name;
  dishDescription.textContent = item.description;
  dishPrices.innerHTML = `
    <span class="price-chip">NRS ${formatPrice(item.price_nrs)}</span>
    <span class="price-chip">USD ${formatPrice(item.price_usd)}</span>
    <span class="price-chip">EUR ${formatPrice(item.price_eur)}</span>
  `;

  dishOverlay.classList.add("open");
  dishOverlay.setAttribute("aria-hidden", "false");

  if (hasGsap) {
    window.gsap.fromTo(
      dishModal,
      { y: 24, autoAlpha: 0, scale: 0.98 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: "power3.out" }
    );
  }
}

function closeDishOverlay() {
  if (!dishOverlay.classList.contains("open")) {
    return;
  }

  if (hasGsap) {
    window.gsap.to(dishModal, {
      y: 24,
      autoAlpha: 0,
      scale: 0.98,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        dishOverlay.classList.remove("open");
        dishOverlay.setAttribute("aria-hidden", "true");
      },
    });
    return;
  }

  dishOverlay.classList.remove("open");
  dishOverlay.setAttribute("aria-hidden", "true");
}

function getSubcategoryRank(category, subcategory) {
  const ordering = SUBCATEGORY_ORDER[category] || [];
  const index = ordering.indexOf(subcategory);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getVisibleItemsByMainFilter(items) {
  if (activeMainFilter === "all") {
    return items;
  }

  return items.filter((item) => item.category === activeMainFilter);
}

function getAvailableSubcategories(items) {
  const visibleItems = getVisibleItemsByMainFilter(items);
  const uniqueMap = new Map();

  visibleItems.forEach((item) => {
    if (!item.subcategory || uniqueMap.has(item.subcategory)) {
      return;
    }
    uniqueMap.set(item.subcategory, item.category);
  });

  return [...uniqueMap.entries()]
    .sort(([nameA, categoryA], [nameB, categoryB]) => {
      const categoryOrderA = categoryA === "food" ? 0 : 1;
      const categoryOrderB = categoryB === "food" ? 0 : 1;
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }

      const rankA = getSubcategoryRank(categoryA, nameA);
      const rankB = getSubcategoryRank(categoryB, nameB);
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return nameA.localeCompare(nameB);
    })
    .map(([name]) => name);
}

function getOrderedSubcategoriesByCategory(items, category) {
  const visibleNames = new Set(
    items
      .filter((item) => item.category === category && item.subcategory)
      .map((item) => item.subcategory)
  );

  const ordered = (SUBCATEGORY_ORDER[category] || []).filter((name) => visibleNames.has(name));
  const extras = [...visibleNames]
    .filter((name) => !ordered.includes(name))
    .sort((a, b) => a.localeCompare(b));

  return [...ordered, ...extras];
}

function renderSubcategoryChip(subcategory) {
  return `<button class="subfilter-btn cursor-hover ${activeSubcategoryFilter === subcategory ? "active" : ""}" type="button" data-subfilter="${subcategory}">${subcategory}</button>`;
}

function applyFilter(items) {
  let filtered = getVisibleItemsByMainFilter(items);

  if (activeSubcategoryFilter !== "all") {
    filtered = filtered.filter((item) => item.subcategory === activeSubcategoryFilter);
  }

  return filtered;
}

function renderSubcategoryFilters() {
  if (!subcategoryFilters) {
    return;
  }

  const subcategories = getAvailableSubcategories(allItems);

  if (!subcategories.length) {
    subcategoryFilters.innerHTML = "";
    return;
  }

  const allButton = `<button class="subfilter-btn cursor-hover ${activeSubcategoryFilter === "all" ? "active" : ""}" type="button" data-subfilter="all">All Subcategories</button>`;

  if (activeMainFilter !== "all") {
    const chips = [allButton, ...subcategories.map((subcategory) => renderSubcategoryChip(subcategory))];
    subcategoryFilters.innerHTML = chips.join("");
    setupCursorTargets();
    return;
  }

  const foodSubcategories = getOrderedSubcategoriesByCategory(allItems, "food");
  const drinksSubcategories = getOrderedSubcategoriesByCategory(allItems, "drinks");

  const groupedMarkup = [
    `<div class="subfilter-global">${allButton}</div>`,
    `<div class="subfilter-group"><p class="subfilter-group-title">FOODS</p><div class="subfilter-row">${foodSubcategories.map((subcategory) => renderSubcategoryChip(subcategory)).join("")}</div></div>`,
    `<div class="subfilter-group"><p class="subfilter-group-title">DRINKS</p><div class="subfilter-row">${drinksSubcategories.map((subcategory) => renderSubcategoryChip(subcategory)).join("")}</div></div>`,
  ];

  subcategoryFilters.innerHTML = groupedMarkup.join("");
  setupCursorTargets();
}

function animateMenuIn() {
  const cards = menuGrid.querySelectorAll(".menu-item");
  if (!cards.length) {
    return;
  }

  if (hasGsap) {
    window.gsap.fromTo(
      cards,
      { y: 36, autoAlpha: 0, scale: 0.985 },
      {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 0.9,
        stagger: 0.09,
        ease: "power3.out",
      }
    );
  } else {
    cards.forEach((card) => card.classList.add("visible"));
  }
}

function renderMenu() {
  const filteredItems = applyFilter(allItems);

  const mountItems = () => {
    menuGrid.innerHTML = "";

    if (!filteredItems.length) {
      menuNote.textContent = "No items currently available in this category.";
      return;
    }

    filteredItems.forEach((item) => {
      menuGrid.appendChild(createMenuCard(item));
    });

    const sectionLabel = activeMainFilter === "all" ? "curated" : activeMainFilter;
    const subLabel = activeSubcategoryFilter === "all" ? "all subcategories" : activeSubcategoryFilter;
    menuNote.textContent = `Showing ${filteredItems.length} ${sectionLabel} selections across ${subLabel}.`;
    animateMenuIn();
    revealOnScroll();
    setupCursorTargets();
    registerParallaxLayers();
  };

  if (hasGsap && menuGrid.children.length) {
    window.gsap.to(menuGrid.children, {
      y: -10,
      autoAlpha: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.in",
      onComplete: mountItems,
    });
    return;
  }

  mountItems();
}

function setActiveMainFilter(newFilter) {
  activeMainFilter = newFilter;
  activeSubcategoryFilter = "all";

  mainFilterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === newFilter);
  });

  renderSubcategoryFilters();
  renderMenu();
}

function setActiveSubcategoryFilter(newFilter) {
  activeSubcategoryFilter = newFilter;
  renderSubcategoryFilters();
  renderMenu();
}

async function loadMenu() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/menu`);
    if (!response.ok) {
      throw new Error("Unable to load menu data.");
    }

    allItems = await response.json();
    renderSubcategoryFilters();
    renderMenu();
  } catch (error) {
    menuNote.textContent = "Menu is currently unavailable. Please try again shortly.";
    console.error(error);
  }
}

function revealOnScroll() {
  const revealElements = document.querySelectorAll(".reveal-item:not(.visible)");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupCursor() {
  if (!customCursor || !cursorDot || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  document.body.classList.add("cursor-enabled");

  window.addEventListener("mousemove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
  });

  const animate = () => {
    dotX += (cursorX - dotX) * 0.34;
    dotY += (cursorY - dotY) * 0.34;
    customCursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px)`;
    requestAnimationFrame(animate);
  };

  animate();
}

function setupCursorTargets() {
  if (!customCursor || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  const allTargets = document.querySelectorAll(".cursor-hover, button, input, textarea, a, .menu-item");
  allTargets.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      customCursor.classList.add("mode-hover");

      if (el.classList.contains("cursor-menu") || el.classList.contains("menu-item")) {
        customCursor.classList.add("mode-menu");
      }

      if (el.classList.contains("cursor-text")) {
        customCursor.classList.add("mode-text");
      }
    });

    el.addEventListener("mouseleave", () => {
      customCursor.classList.remove("mode-hover", "mode-menu", "mode-text");
    });
  });
}

function splitTextForReveal() {
  const splitTargets = document.querySelectorAll(".split-line");
  splitTargets.forEach((element) => {
    if (element.dataset.split === "true") {
      return;
    }

    const words = element.textContent.trim().split(/\s+/);
    element.innerHTML = words
      .map((word) => `<span class="word-wrap"><span class="word">${word}</span></span>`)
      .join(" ");
    element.dataset.split = "true";
  });
}

function registerParallaxLayers() {
  if (!hasGsap || typeof window.ScrollTrigger === "undefined") {
    return;
  }

  window.gsap.utils.toArray("[data-parallax]").forEach((layer) => {
    if (layer.dataset.parallaxBound === "true") {
      return;
    }

    layer.dataset.parallaxBound = "true";
    const speed = Number(layer.dataset.parallax || 0.06);

    window.gsap.to(layer, {
      yPercent: speed * 100,
      ease: "none",
      scrollTrigger: {
        trigger: layer,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

function setupSignatureMoment() {
  if (!hasGsap || typeof window.ScrollTrigger === "undefined" || !heroContent || !signatureTarget) {
    return;
  }

  window.gsap.timeline({
    scrollTrigger: {
      trigger: "#philosophy",
      start: "top 88%",
      end: "top 30%",
      scrub: true,
    },
  })
    .to(heroContent, { autoAlpha: 0.12, y: -70, scale: 0.98, ease: "none" }, 0)
    .fromTo(signatureTarget, { autoAlpha: 0.22, y: 18 }, { autoAlpha: 1, y: 0, ease: "none" }, 0);
}

function setupSectionBlending() {
  if (!hasGsap || typeof window.ScrollTrigger === "undefined") {
    return;
  }

  window.gsap.utils.toArray(".blend-scene").forEach((scene) => {
    window.gsap.fromTo(
      scene,
      { autoAlpha: 0.56 },
      {
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: {
          trigger: scene,
          start: "top 90%",
          end: "bottom 45%",
          scrub: true,
        },
      }
    );
  });
}

function setupGsapScenes() {
  if (!hasGsap || typeof window.ScrollTrigger === "undefined") {
    revealOnScroll();
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  window.gsap.fromTo(
    ".hero .word",
    { yPercent: 120, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 1.5,
      stagger: 0.06,
      ease: "power4.out",
      delay: 0.15,
    }
  );

  window.gsap.utils.toArray(".story-card, .menu-section, .reservation-section").forEach((section) => {
    const words = section.querySelectorAll(".word");
    if (!words.length) {
      return;
    }

    window.gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.028,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
        },
      }
    );
  });

  window.gsap.utils.toArray(".reveal-item").forEach((item) => {
    window.gsap.fromTo(
      item,
      { y: 34, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 88%",
        },
      }
    );
  });

  setupSignatureMoment();
  setupSectionBlending();
  registerParallaxLayers();
}

function updateMusicToggleLabel() {
  if (!musicToggle || !backgroundMusic) {
    return;
  }

  const isPlaying = !backgroundMusic.paused;
  musicToggle.textContent = isPlaying ? "Music: On" : "Music: Off";
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

async function tryStartMusicPlayback() {
  if (!backgroundMusic) {
    return false;
  }

  try {
    await backgroundMusic.play();
    updateMusicToggleLabel();
    return true;
  } catch (error) {
    updateMusicToggleLabel();
    return false;
  }
}

function advanceMusicSource() {
  if (!backgroundMusic || MUSIC_SOURCES.length < 2) {
    return false;
  }

  if (musicSourceIndex >= MUSIC_SOURCES.length - 1) {
    return false;
  }

  musicSourceIndex += 1;
  backgroundMusic.src = MUSIC_SOURCES[musicSourceIndex];
  backgroundMusic.load();
  return true;
}

function setupBackgroundMusic() {
  if (!musicToggle || !musicVolume || !backgroundMusic) {
    return;
  }

  const storedVolumeRaw = window.localStorage.getItem("cozycup_music_volume");
  const storedVolume = storedVolumeRaw === null ? NaN : Number(storedVolumeRaw);
  const initialVolume = Number.isFinite(storedVolume) && storedVolume > 0 && storedVolume <= 1
    ? storedVolume
    : Number(musicVolume.value);

  backgroundMusic.volume = initialVolume;
  musicVolume.value = String(initialVolume);

  const currentSrc = backgroundMusic.currentSrc || backgroundMusic.src || "";
  const foundIndex = MUSIC_SOURCES.findIndex((item) => currentSrc.includes(item));
  musicSourceIndex = foundIndex >= 0 ? foundIndex : 0;

  if (!currentSrc) {
    backgroundMusic.src = MUSIC_SOURCES[musicSourceIndex];
    backgroundMusic.load();
  }

  const musicWasEnabled = window.localStorage.getItem("cozycup_music_enabled") === "true";

  if (musicWasEnabled) {
    const unlockPlayback = async () => {
      const started = await tryStartMusicPlayback();
      if (started) {
        ["click", "keydown", "touchstart"].forEach((eventName) => {
          document.removeEventListener(eventName, unlockPlayback);
        });
      }
    };

    ["click", "keydown", "touchstart"].forEach((eventName) => {
      document.addEventListener(eventName, unlockPlayback, { once: true });
    });
  }

  updateMusicToggleLabel();

  backgroundMusic.addEventListener("error", async () => {
    const switched = advanceMusicSource();
    if (!switched) {
      musicToggle.textContent = "Music: Unavailable";
      musicToggle.setAttribute("aria-pressed", "false");
      window.localStorage.setItem("cozycup_music_enabled", "false");
      return;
    }

    await tryStartMusicPlayback();
  });

  musicToggle.addEventListener("click", async () => {
    if (backgroundMusic.paused) {
      if (!Number.isFinite(backgroundMusic.volume) || backgroundMusic.volume <= 0) {
        backgroundMusic.volume = 0.4;
        musicVolume.value = "0.4";
        window.localStorage.setItem("cozycup_music_volume", "0.4");
      }

      backgroundMusic.muted = false;
      const started = await tryStartMusicPlayback();
      if (!started) {
        musicToggle.textContent = "Music: Tap Again";
      }
      window.localStorage.setItem("cozycup_music_enabled", String(started));
      return;
    }

    backgroundMusic.pause();
    updateMusicToggleLabel();
    window.localStorage.setItem("cozycup_music_enabled", "false");
  });

  musicVolume.addEventListener("input", () => {
    const volume = Number(musicVolume.value);
    if (!Number.isFinite(volume)) {
      return;
    }

    backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    window.localStorage.setItem("cozycup_music_volume", String(backgroundMusic.volume));
  });
}

function setupReservationStage() {
  if (!reservationCurtain || !openReservation) {
    return;
  }

  openReservation.addEventListener("click", () => {
    if (hasGsap) {
      window.gsap.to(reservationCurtain, {
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => {
          reservationCurtain.style.pointerEvents = "none";
        },
      });

      window.gsap.fromTo(
        "#reservationForm label, #reservationForm button, #reservationForm .form-row",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.08, ease: "power3.out", delay: 0.2 }
      );
      return;
    }

    reservationCurtain.style.opacity = "0";
    reservationCurtain.style.pointerEvents = "none";
  });
}

function setupReservationSubmit() {
  if (!reservationForm || !reservationStatus) {
    return;
  }

  reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(reservationForm);
    const payload = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      visit_date: formData.get("visit_date"),
      visit_time: formData.get("visit_time"),
      guests: Number(formData.get("guests")),
      notes: formData.get("notes") || "",
    };

    reservationStatus.textContent = "Preparing your table...";
    reservationStatus.classList.remove("ok");

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Reservation request failed.");
      }

      reservationStatus.textContent = `Table confirmed. Reservation #${data.reservation_id}.`;
      reservationStatus.classList.add("ok");

      if (hasGsap) {
        window.gsap.fromTo(
          reservationStatus,
          { scale: 0.94, autoAlpha: 0.4 },
          { scale: 1, autoAlpha: 1, duration: 0.55, ease: "power3.out" }
        );
      }

      reservationForm.reset();
    } catch (error) {
      reservationStatus.textContent = "Unable to confirm right now. Please try again shortly.";
      reservationStatus.classList.remove("ok");
      console.error(error);
    }
  });
}

function setupDishOverlayInteractions() {
  if (!dishOverlay || !closeDish) {
    return;
  }

  closeDish.addEventListener("click", closeDishOverlay);

  dishOverlay.addEventListener("click", (event) => {
    if (event.target.classList.contains("dish-overlay-bg")) {
      closeDishOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDishOverlay();
    }
  });
}

mainFilterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveMainFilter(button.dataset.filter));
});

if (subcategoryFilters) {
  subcategoryFilters.addEventListener("click", (event) => {
    const target = event.target.closest(".subfilter-btn");
    if (!target) {
      return;
    }

    setActiveSubcategoryFilter(target.dataset.subfilter || "all");
  });
}

loadMenu();
splitTextForReveal();
setupGsapScenes();
setupCursor();
setupCursorTargets();
setupBackgroundMusic();
setupReservationStage();
setupReservationSubmit();
setupDishOverlayInteractions();
revealOnScroll();
