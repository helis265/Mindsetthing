/* ============================================================
   MINDSET Photography Studio — script.js
   Admin + content backed by Firebase (Authentication + Realtime Database)
   Falls back to localStorage / in-memory if Firebase is unavailable.
   ============================================================ */

/* ---------- 1. FIREBASE SETUP ---------- */
const firebaseConfig = {
    apiKey: "AIzaSyC2UJIhIx-3Y1Lqj6KEbnSsYiv4lxRJARk",
    authDomain: "mindset-dd649.firebaseapp.com",
    databaseURL: "https://mindset-dd649-default-rtdb.firebaseio.com",
    projectId: "mindset-dd649",
    storageBucket: "mindset-dd649.firebasestorage.app",
    messagingSenderId: "1070306514360",
    appId: "1:1070306514360:web:4af27be137534fdd266b4d",
    measurementId: "G-4NFXT4479M"
};

const DB_ROOT = 'mindset';
let db = null;
let auth = null;
let firebaseReady = false;

try {
    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        auth = firebase.auth();
        firebaseReady = true;
    } else {
        console.error('Firebase SDK did not load — falling back to local storage.');
    }
} catch (error) {
    console.error('Firebase initialisation failed — falling back to local storage.', error);
}

function dbRef(path) {
    return db.ref(DB_ROOT + '/' + path);
}

/* Normalise a Firebase array-like value into a plain array. */
function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return Object.keys(value)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => value[key]);
}

/* Normalise a Firebase keyed collection into [{ key, value }]. */
function toEntries(value) {
    if (!value) return [];
    return Object.keys(value).map((key) => ({ key, value: value[key] }));
}

/* ---------- 2. UI HELPERS ---------- */

/* Switch between pages / tabs */
function switchPage(pageId) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach((p) => p.classList.add('hidden'));

    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (pageId === 'home') {
        renderTestimonials();
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('text-gold');
            link.classList.remove('text-offwhite');
        } else {
            link.classList.remove('text-gold');
            link.classList.add('text-offwhite');
        }
    });

    window.location.hash = pageId;
}

/* Toggle mobile navigation menu */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
}

/* Lightbox */
function openLightbox(imgSrc, captionText) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!modal || !img || !cap) return;

    img.src = imgSrc;
    cap.textContent = captionText;
    modal.classList.remove('hidden');
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
}

/* Custom notification modal (replaces alert) */
function showCustomModal(title, message) {
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const modal = document.getElementById('custom-modal');
    if (!titleEl || !messageEl || !modal) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.remove('hidden');
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.add('hidden');
}

/* Portfolio filtering */
function filterPortfolio(category, button) {
    const items = document.querySelectorAll('.portfolio-item');
    const buttons = document.querySelectorAll('.portfolio-filter-btn');

    buttons.forEach((btn) => {
        btn.classList.remove('bg-gold', 'text-black');
        btn.classList.add('bg-cardGray', 'text-offwhite');
    });
    if (button) {
        button.classList.remove('bg-cardGray', 'text-offwhite');
        button.classList.add('bg-gold', 'text-black');
    }

    items.forEach((item) => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

/* ---------- 3. ADMIN AUTHENTICATION (Firebase Auth) ---------- */
function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;

    if (!email || !pass) {
        showCustomModal('Access Denied', 'Enter both your admin email and password.');
        return;
    }
    if (!firebaseReady || !auth) {
        showCustomModal('Service Unavailable', 'Authentication is not available right now. Please check your connection and try again.');
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            document.getElementById('admin-password').value = '';
            showCustomModal('Admin Access Granted', 'Welcome back, Administrator.');
        })
        .catch((error) => {
            console.error('Admin sign-in failed.', error);
            showCustomModal('Access Denied', friendlyAuthError(error));
        });
}

function friendlyAuthError(error) {
    const code = (error && error.code) || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        return 'Invalid admin email or password.';
    }
    if (code.includes('invalid-email')) return 'That email address is not valid.';
    if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
    if (code.includes('network')) return 'Network error. Check your connection and try again.';
    if (code.includes('operation-not-allowed')) return 'Email/password sign-in is not enabled for this project yet.';
    return 'Could not sign you in. Please try again.';
}

function adminLogout() {
    if (firebaseReady && auth) {
        auth.signOut().then(() => {
            showCustomModal('Logged Out', 'You have been successfully logged out from the admin dashboard.');
        });
    } else {
        applyAuthState(null);
        showCustomModal('Logged Out', 'You have been logged out.');
    }
}

/* Show/hide the login box vs the dashboard based on auth state */
function applyAuthState(user) {
    const loginBox = document.getElementById('admin-login-box');
    const panel = document.getElementById('admin-dashboard-panel');
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (!loginBox || !panel || !logoutBtn) return;

    if (user) {
        loginBox.classList.add('hidden');
        panel.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginBox.classList.remove('hidden');
        panel.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
}

/* Admin tab switcher */
function switchAdminTab(tabName) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach((sec) => sec.classList.add('hidden'));

    const targetSec = document.getElementById('admin-tab-' + tabName);
    if (targetSec) targetSec.classList.remove('hidden');

    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach((btn) => {
        btn.classList.remove('bg-gold', 'text-black');
        btn.classList.add('bg-cardGray', 'text-offwhite');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.remove('bg-cardGray', 'text-offwhite');
            btn.classList.add('bg-gold', 'text-black');
        }
    });
}

/* ---------- 4. TESTIMONIALS ---------- */
const testimonialsStorageKey = 'mindset_client_testimonials';
const defaultTestimonials = [
    {
        quote: 'MINDSET captured our wedding in Blantyre with such breathtaking precision. Every time I look at our album, I relive the exact emotions of the day. Truly world-class.',
        name: 'Chikondi & Tiyamike',
        detail: 'Love Mindset Clients'
    },
    {
        quote: 'My graduation portrait session was phenomenal. They knew exactly how to make me feel confident and powerful in front of the lens. Exceptional professionalism!',
        name: 'Thoko Phiri',
        detail: 'Graduation Client'
    },
    {
        quote: 'For corporate branding in Blantyre, MINDSET is the only studio I trust. Their eye for detail and luxury aesthetic elevated our company profile instantly.',
        name: 'Madalitso Banda',
        detail: 'Corporate Executive'
    }
];
let testimonialsData = defaultTestimonials.map((t) => ({ ...t }));

function isValidTestimonial(t) {
    return t && typeof t.quote === 'string' && typeof t.name === 'string' && typeof t.detail === 'string';
}

function subscribeTestimonials() {
    if (!firebaseReady) {
        loadTestimonialsLocal();
        renderTestimonials();
        return;
    }
    dbRef('testimonials').on('value', (snapshot) => {
        const value = snapshot.val();
        if (value === null) {
            testimonialsData = defaultTestimonials.map((t) => ({ ...t }));
        } else {
            const list = toArray(value).filter(isValidTestimonial);
            testimonialsData = list.length ? list : defaultTestimonials.map((t) => ({ ...t }));
        }
        renderTestimonials();
    }, (error) => {
        console.error('Could not load testimonials from Firebase.', error);
        loadTestimonialsLocal();
        renderTestimonials();
    });
}

function loadTestimonialsLocal() {
    try {
        const saved = localStorage.getItem(testimonialsStorageKey);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(isValidTestimonial)) {
            testimonialsData = parsed;
        }
    } catch (error) {
        console.error('Could not load saved testimonials.', error);
    }
}

function saveTestimonials(updatedTestimonials) {
    testimonialsData = updatedTestimonials;
    renderTestimonials();

    if (firebaseReady) {
        return dbRef('testimonials').set(updatedTestimonials)
            .then(() => true)
            .catch((error) => {
                console.error('Could not save testimonials to Firebase.', error);
                showCustomModal('Unable to Save', 'Your changes could not be saved. Please make sure you are logged in and try again.');
                return false;
            });
    }

    try {
        localStorage.setItem(testimonialsStorageKey, JSON.stringify(updatedTestimonials));
        return Promise.resolve(true);
    } catch (error) {
        console.error('Could not save testimonials locally.', error);
        showCustomModal('Unable to Save', 'Testimonial changes could not be saved in this browser.');
        return Promise.resolve(false);
    }
}

function renderTestimonials() {
    const publicGrid = document.getElementById('testimonials-grid');
    const adminList = document.getElementById('admin-testimonials-list');

    if (publicGrid) {
        publicGrid.replaceChildren();
        testimonialsData.forEach((testimonial) => {
            const card = document.createElement('article');
            card.className = 'bg-cardGray/90 p-8 border border-gold/20 relative';

            const quoteIcon = document.createElement('i');
            quoteIcon.className = 'fa-solid fa-quote-left text-gold text-3xl mb-4 opacity-50';
            quoteIcon.setAttribute('aria-hidden', 'true');

            const quote = document.createElement('p');
            quote.className = 'text-offwhite/80 text-sm italic mb-6';
            quote.textContent = `"${testimonial.quote}"`;

            const name = document.createElement('h4');
            name.className = 'font-bold uppercase text-gold text-sm';
            name.textContent = testimonial.name;

            const detail = document.createElement('span');
            detail.className = 'text-xs text-offwhite/70';
            detail.textContent = testimonial.detail;

            card.append(quoteIcon, quote, name, detail);
            publicGrid.appendChild(card);
        });
    }

    if (adminList) {
        adminList.replaceChildren();
        testimonialsData.forEach((testimonial, index) => {
            const editor = document.createElement('div');
            editor.className = 'bg-black border border-gold/20 p-6 space-y-4';

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = testimonial.name;
            nameInput.maxLength = 100;
            nameInput.required = true;
            nameInput.setAttribute('aria-label', 'Client name');
            nameInput.dataset.testimonialField = 'name';
            nameInput.className = 'w-full bg-cardGray border border-gold/30 px-4 py-3 text-offwhite text-sm';

            const detailInput = document.createElement('input');
            detailInput.type = 'text';
            detailInput.value = testimonial.detail;
            detailInput.maxLength = 100;
            detailInput.required = true;
            detailInput.setAttribute('aria-label', 'Client or session details');
            detailInput.dataset.testimonialField = 'detail';
            detailInput.className = 'w-full bg-cardGray border border-gold/30 px-4 py-3 text-offwhite text-sm';

            const quoteInput = document.createElement('textarea');
            quoteInput.value = testimonial.quote;
            quoteInput.maxLength = 1000;
            quoteInput.required = true;
            quoteInput.rows = 4;
            quoteInput.setAttribute('aria-label', 'Client testimonial');
            quoteInput.dataset.testimonialField = 'quote';
            quoteInput.className = 'w-full bg-cardGray border border-gold/30 px-4 py-3 text-offwhite text-sm';

            const actions = document.createElement('div');
            actions.className = 'flex flex-wrap gap-3';

            const saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.textContent = 'Save Changes';
            saveButton.className = 'bg-gold text-black font-bold uppercase tracking-widest px-6 py-3 text-xs hover:bg-offwhite transition-colors';
            saveButton.addEventListener('click', () => saveTestimonial(index, editor));

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'border border-red-500/50 text-red-300 font-bold uppercase tracking-widest px-6 py-3 text-xs hover:bg-red-600 hover:text-white transition-colors';
            deleteButton.addEventListener('click', () => deleteTestimonial(index));

            actions.append(saveButton, deleteButton);
            editor.append(nameInput, detailInput, quoteInput, actions);
            adminList.appendChild(editor);
        });
    }
}

function saveTestimonial(index, editor) {
    const updated = {
        name: editor.querySelector('[data-testimonial-field="name"]').value.trim(),
        detail: editor.querySelector('[data-testimonial-field="detail"]').value.trim(),
        quote: editor.querySelector('[data-testimonial-field="quote"]').value.trim()
    };
    if (!updated.name || !updated.detail || !updated.quote) {
        showCustomModal('Details Required', 'Enter the client name, session details, and testimonial before saving.');
        return;
    }

    const nextTestimonials = testimonialsData.map((testimonial, itemIndex) =>
        itemIndex === index ? updated : testimonial
    );
    saveTestimonials(nextTestimonials).then((ok) => {
        if (ok) showCustomModal('Success', 'Client testimonial has been updated.');
    });
}

function addTestimonial(event) {
    event.preventDefault();
    const testimonial = {
        name: document.getElementById('new-testimonial-name').value.trim(),
        detail: document.getElementById('new-testimonial-detail').value.trim(),
        quote: document.getElementById('new-testimonial-quote').value.trim()
    };
    if (!testimonial.name || !testimonial.detail || !testimonial.quote) {
        showCustomModal('Details Required', 'Enter the client name, session details, and testimonial before adding.');
        return;
    }

    saveTestimonials([...testimonialsData, testimonial]).then((ok) => {
        if (ok) {
            event.target.reset();
            showCustomModal('Success', 'Client testimonial has been added.');
        }
    });
}

function deleteTestimonial(index) {
    saveTestimonials(testimonialsData.filter((_, itemIndex) => itemIndex !== index)).then((ok) => {
        if (ok) showCustomModal('Success', 'Client testimonial has been deleted.');
    });
}

/* ---------- 5. SERVICE PRICING ---------- */
const servicePricingStorageKey = 'mindset_service_pricing';

function applyServicePricing(pricing) {
    if (!pricing || typeof pricing !== 'object') return;
    document.querySelectorAll('[data-service-price-input]').forEach((input) => {
        const price = pricing[input.dataset.servicePriceInput];
        const display = document.querySelector(`[data-service-price-display="${input.dataset.servicePriceInput}"]`);
        if (typeof price === 'string' && price.trim()) {
            input.value = price;
            if (display) display.textContent = price;
        }
    });
}

function subscribeServicePricing() {
    if (!firebaseReady) {
        try {
            const stored = localStorage.getItem(servicePricingStorageKey);
            if (stored) applyServicePricing(JSON.parse(stored));
        } catch (error) {
            console.error('Could not load saved service pricing.', error);
        }
        return;
    }
    dbRef('services').on('value', (snapshot) => {
        applyServicePricing(snapshot.val());
    }, (error) => {
        console.error('Could not load service pricing from Firebase.', error);
    });
}

function saveServicePricing() {
    const inputs = document.querySelectorAll('[data-service-price-input]');
    const updates = [];

    for (const input of inputs) {
        const price = input.value.trim();
        const index = input.getAttribute('data-service-price-input');
        const display = document.querySelector(`[data-service-price-display="${index}"]`);

        if (!price) {
            showCustomModal('Pricing Required', 'Enter a price for every service before saving.');
            input.focus();
            return;
        }
        if (!display) {
            console.error(`Could not find the displayed price for service ${index}.`);
            showCustomModal('Unable to Update Pricing', 'A service price display is missing. Please refresh the page and try again.');
            return;
        }
        updates.push({ input, display, price });
    }

    updates.forEach(({ input, display, price }) => {
        display.textContent = price;
        input.value = price;
    });

    const pricingObject = Object.fromEntries(
        updates.map(({ input, price }) => [input.dataset.servicePriceInput, price])
    );

    if (firebaseReady) {
        dbRef('services').set(pricingObject)
            .then(() => showCustomModal('Success', 'Service pricing has been updated and saved.'))
            .catch((error) => {
                console.error('Could not save service pricing to Firebase.', error);
                showCustomModal('Unable to Save', 'Pricing could not be saved. Please make sure you are logged in and try again.');
            });
        return;
    }

    try {
        localStorage.setItem(servicePricingStorageKey, JSON.stringify(pricingObject));
        showCustomModal('Success', 'Service pricing has been updated and saved.');
    } catch (error) {
        console.error('Could not save service pricing locally.', error);
        showCustomModal('Pricing Updated', 'Prices updated for this visit, but could not be saved in this browser.');
    }
}

/* ---------- 6. PHOTOS (uploaded to Realtime Database as resized data URLs) ---------- */
const PHOTO_MAX_DIMENSION = 1400;
const PHOTO_JPEG_QUALITY = 0.8;

let uploadedFile = null;
let previewObjectUrl = '';

/* Resize/compress an image file into a JPEG data URL so it fits comfortably in the database. */
function resizeImageToDataUrl(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    const scale = maxDimension / Math.max(width, height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Could not read the selected image.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
    });
}

function createHeroSlide(mediaItem, imageUrl) {
    const sliderContainer = document.getElementById('hero-slider-container');
    if (!sliderContainer) return;

    const slide = document.createElement('div');
    slide.className = 'hero-slide absolute inset-0 transition-opacity duration-1000 opacity-0';
    slide.dataset.dynamic = '1';

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = mediaItem.caption || 'Admin uploaded photo';
    image.className = 'w-full h-full object-cover filter brightness-75';

    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent';

    const content = document.createElement('div');
    content.className = 'absolute bottom-16 left-6 right-6 md:left-16 max-w-4xl';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'text-gold uppercase tracking-widest text-xs sm:text-sm font-semibold mb-3 block';
    eyebrow.textContent = mediaItem.location || 'Blantyre, Malawi Photography Studio';

    const heading = document.createElement('h1');
    heading.className = 'text-3xl sm:text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-offwhite mb-4 leading-tight';
    heading.textContent = mediaItem.caption || 'A MINDSET moment';

    const caption = document.createElement('div');
    caption.className = 'mt-4 text-xs text-gold/80 italic font-light caption-display';
    caption.textContent = mediaItem.location || '';

    content.append(eyebrow, heading, caption);
    slide.append(image, overlay, content);
    sliderContainer.appendChild(slide);
}

function createPortfolioItem(mediaItem, imageUrl) {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    const item = document.createElement('div');
    item.className = 'portfolio-item group relative overflow-hidden bg-cardGray aspect-[4/5] cursor-pointer shadow-lg';
    item.dataset.category = mediaItem.destination;
    item.dataset.dynamic = '1';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Open ${mediaItem.caption || 'uploaded photo'}`);

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = mediaItem.caption || 'Uploaded photo';
    image.className = 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105';

    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6';

    const category = document.createElement('span');
    category.className = 'text-gold text-xs uppercase tracking-wider font-semibold';
    const categoryLabel = String(mediaItem.destination || '')
        .replace('graduation', 'Graduation')
        .replace('love', 'Love')
        .replace('boss', 'Boss')
        .replace('family', 'Family');
    category.textContent = `${categoryLabel.toUpperCase()} MINDSET`;

    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-offwhite mt-1';
    title.textContent = mediaItem.caption || 'Uploaded moment';

    overlay.append(category, title);
    item.append(image, overlay);
    item.addEventListener('click', () => openLightbox(imageUrl, mediaItem.caption || ''));
    item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLightbox(imageUrl, mediaItem.caption || '');
        }
    });
    grid.appendChild(item);
}

function renderPhotos(photos) {
    /* Clear previously rendered dynamic slides/items so re-renders don't duplicate. */
    document.querySelectorAll('#hero-slider-container [data-dynamic="1"]').forEach((el) => el.remove());
    document.querySelectorAll('#portfolio-grid [data-dynamic="1"]').forEach((el) => el.remove());

    const validCategories = ['love', 'graduation', 'boss', 'family'];
    photos.forEach((mediaItem) => {
        const imageUrl = mediaItem.dataUrl;
        if (!imageUrl) return;
        if (mediaItem.destination === 'Home Tab' || mediaItem.showOnHome === 'yes') {
            createHeroSlide(mediaItem, imageUrl);
        }
        if (validCategories.includes(mediaItem.destination)) {
            createPortfolioItem(mediaItem, imageUrl);
        }
    });

    initHeroSlider();
    renderAdminPhotosList(photos);
}

function renderAdminPhotosList(photos) {
    const list = document.getElementById('admin-photos-list');
    if (!list) return;
    list.replaceChildren();

    if (!photos.length) {
        const empty = document.createElement('p');
        empty.className = 'text-offwhite/50 text-sm';
        empty.textContent = 'No photos uploaded yet.';
        list.appendChild(empty);
        return;
    }

    photos.forEach((photo) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-4 bg-black border border-gold/20 p-3';

        const thumb = document.createElement('img');
        thumb.src = photo.dataUrl;
        thumb.alt = photo.caption || 'Uploaded photo';
        thumb.className = 'w-16 h-16 object-cover border border-gold/30';

        const meta = document.createElement('div');
        meta.className = 'flex-1 min-w-0';

        const title = document.createElement('p');
        title.className = 'text-offwhite text-sm font-semibold truncate';
        title.textContent = photo.caption || '(no caption)';

        const sub = document.createElement('p');
        sub.className = 'text-gold text-xs uppercase tracking-wider';
        sub.textContent = `${photo.destination || 'unknown'}${photo.showOnHome === 'yes' ? ' · home hero' : ''}`;

        meta.append(title, sub);

        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = 'Delete';
        del.className = 'border border-red-500/50 text-red-300 px-4 py-2 text-xs uppercase font-semibold hover:bg-red-600 hover:text-white transition-colors';
        del.addEventListener('click', () => deletePhoto(photo.key));

        row.append(thumb, meta, del);
        list.appendChild(row);
    });
}

function subscribePhotos() {
    if (!firebaseReady) {
        renderPhotos([]);
        return;
    }
    dbRef('photos').on('value', (snapshot) => {
        const photos = toEntries(snapshot.val()).map(({ key, value }) => ({ key, ...value }));
        renderPhotos(photos);
    }, (error) => {
        console.error('Could not load photos from Firebase.', error);
    });
}

function deletePhoto(key) {
    if (!firebaseReady || !key) return;
    dbRef('photos').child(key).remove()
        .then(() => showCustomModal('Photo Deleted', 'The photo has been removed from the website.'))
        .catch((error) => {
            console.error('Could not delete photo.', error);
            showCustomModal('Unable to Delete', 'The photo could not be deleted. Please make sure you are logged in.');
        });
}

/* ---------- 7. BOOKINGS ---------- */
let bookingsList = [];

function subscribeBookings() {
    if (!firebaseReady) {
        updateAdminBookingsTable();
        return;
    }
    dbRef('bookings').on('value', (snapshot) => {
        bookingsList = toEntries(snapshot.val()).map(({ key, value }) => ({ key, ...value }));
        updateAdminBookingsTable();
    }, (error) => {
        console.error('Could not load bookings from Firebase.', error);
    });
}

function handleBookingSubmission(event) {
    event.preventDefault();
    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const type = document.getElementById('book-type').value;
    const date = document.getElementById('book-date').value;
    const message = document.getElementById('book-message').value.trim();

    const newBooking = { name, phone, type, date, message, createdAt: new Date().toISOString() };

    if (firebaseReady) {
        dbRef('bookings').push(newBooking)
            .then(() => {
                showCustomModal('Booking Request Received', `Thank you ${name}! Your request for a ${type} shoot on ${date} has been logged. Our Blantyre team will contact you shortly.`);
                event.target.reset();
            })
            .catch((error) => {
                console.error('Could not save booking.', error);
                showCustomModal('Booking Not Sent', 'We could not send your booking right now. Please call or WhatsApp us on 0983 172 650.');
            });
        return;
    }

    bookingsList.push(newBooking);
    updateAdminBookingsTable();
    showCustomModal('Booking Request Received', `Thank you ${name}! Your request for a ${type} shoot on ${date} has been logged. Our Blantyre team will contact you shortly.`);
    event.target.reset();
}

function updateAdminBookingsTable() {
    const tbody = document.getElementById('admin-bookings-table-body');
    if (!tbody) return;

    tbody.replaceChildren();

    if (bookingsList.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'p-6 text-center text-offwhite/50';
        td.textContent = 'No booking requests submitted yet.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    bookingsList.forEach((b) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gold/5';

        const cells = [
            { text: b.name, cls: 'p-4 font-semibold text-offwhite' },
            { text: b.phone, cls: 'p-4 text-gold' },
            { text: b.type, cls: 'p-4' },
            { text: b.date, cls: 'p-4' },
            { text: b.message || 'N/A', cls: 'p-4 text-offwhite/70 text-xs' }
        ];

        cells.forEach(({ text, cls }) => {
            const td = document.createElement('td');
            td.className = cls;
            td.textContent = text;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

/* ---------- 8. OWNERS ---------- */
const defaultOwners = [
    { name: 'Kadosh', role: 'CEO, Photographer', bio: "Passionate about editorial lighting and capturing the unyielding ambition of Blantyre's trailblazers.", image: 'PHOTOS/IMG_1.jpg' },
    { name: 'Praise', role: 'Photographer', bio: 'Dedicated to curating luxury visual experiences that reflect modern Malawian elegance and timeless grace.', image: 'ABOUT/Praise.jpg' },
    { name: 'Francis', role: 'Director, Designer and Partner', bio: 'Specializing in high-end post-production and ensuring every single frame meets international luxury standards.', image: 'PHOTOS/IMG_3.jpg' },
    { name: 'Tupe(Gwababa)', role: 'Manager', bio: 'Brings an attentive eye to portrait sessions and helps each shoot feel relaxed and personal.', image: 'PHOTOS/IMG_4.jpg' },
    { name: 'George', role: 'Assist Manager', bio: 'Helps clients feel at ease and confident throughout every studio session.', image: 'PHOTOS/IMG_5.jpg' },
    { name: 'Vintage', role: 'Financial Director', bio: 'Shapes natural light into polished, expressive portraits with a refined finish.', image: 'PHOTOS/IMG_6.jpg' },
    { name: 'Lobrino', role: 'Assist Director', bio: 'Keeps portrait sessions organized, welcoming, and running smoothly.', image: 'PHOTOS/IMG_7.jpg' },
    { name: 'Mega', role: 'Journalist', bio: 'Supports creative direction with thoughtful composition and a collaborative approach.', image: 'ABOUT/Mega.jpg' },
    { name: 'Confort', role: 'Technical Director', bio: 'Helps prepare each shoot and keeps the production moving smoothly.', image: 'ABOUT/Confort.jpg' },
    { name: 'Prince', role: 'Assist Technical Director', bio: 'Helps prepare each shoot and keeps the production moving smoothly.', image: 'MINDSETTTT/IMG_13.jpg' }
];

let ownersData = defaultOwners.map((o) => ({ ...o }));
let currentEditingOwnerIndex = null;
let currentPhotoData = null;

function isValidOwner(o) {
    return o && typeof o.name === 'string' && typeof o.role === 'string' &&
        typeof o.bio === 'string' && typeof o.image === 'string';
}

function subscribeOwners() {
    if (!firebaseReady) {
        renderOwnerCards();
        renderPublicOwners();
        return;
    }
    dbRef('owners').on('value', (snapshot) => {
        const value = snapshot.val();
        if (value === null) {
            ownersData = defaultOwners.map((o) => ({ ...o }));
        } else {
            const list = toArray(value).filter(isValidOwner);
            ownersData = list.length ? list : defaultOwners.map((o) => ({ ...o }));
        }
        renderOwnerCards();
        renderPublicOwners();
    }, (error) => {
        console.error('Could not load owners from Firebase.', error);
        renderOwnerCards();
        renderPublicOwners();
    });
}

function saveOwnerProfiles(profiles) {
    if (firebaseReady) {
        return dbRef('owners').set(profiles);
    }
    return Promise.resolve();
}

function renderOwnerCards() {
    const container = document.getElementById('admin-owners-cards');
    if (!container) return;

    container.replaceChildren();
    ownersData.forEach((owner, index) => {
        const card = document.createElement('div');
        card.className = 'bg-black border border-gold/20 overflow-hidden shadow-xl pb-4';

        const imgWrap = document.createElement('div');
        imgWrap.className = 'aspect-[3/4] overflow-hidden mb-4';
        const img = document.createElement('img');
        img.src = owner.image;
        img.alt = owner.name;
        img.className = 'w-full h-full object-cover';
        imgWrap.appendChild(img);

        const body = document.createElement('div');
        body.className = 'px-4';

        const name = document.createElement('h3');
        name.className = 'text-lg font-bold uppercase tracking-wider text-offwhite mb-1';
        name.textContent = owner.name;

        const role = document.createElement('p');
        role.className = 'text-gold text-xs uppercase tracking-widest font-semibold mb-2';
        role.textContent = owner.role;

        const bio = document.createElement('p');
        bio.className = 'text-offwhite/70 text-xs mb-4 line-clamp-3';
        bio.textContent = owner.bio;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'w-full bg-gold text-black px-4 py-2 text-xs uppercase font-semibold hover:bg-offwhite transition-colors';
        editBtn.textContent = 'Edit Card';
        editBtn.addEventListener('click', () => openOwnerEditModal(index));

        body.append(name, role, bio, editBtn);
        card.append(imgWrap, body);
        container.appendChild(card);
    });
}

function renderPublicOwners() {
    const container = document.getElementById('owners-container');
    if (!container) return;

    container.replaceChildren();
    ownersData.forEach((owner) => {
        const card = document.createElement('div');
        card.className = 'owner-card bg-black border border-gold/20 overflow-hidden shadow-xl text-center pb-8 group';

        const imgWrap = document.createElement('div');
        imgWrap.className = 'aspect-[4/5] overflow-hidden mb-4';
        const img = document.createElement('img');
        img.src = owner.image;
        img.alt = owner.name;
        img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500';
        imgWrap.appendChild(img);

        const name = document.createElement('h3');
        name.className = 'text-xl font-bold uppercase tracking-wider text-offwhite mb-1';
        name.textContent = owner.name;

        const role = document.createElement('p');
        role.className = 'text-gold text-xs uppercase tracking-widest font-semibold mb-4';
        role.textContent = owner.role;

        const bio = document.createElement('p');
        bio.className = 'description px-6 text-offwhite/70 text-sm font-light';
        bio.textContent = owner.bio;

        card.append(imgWrap, name, role, bio);
        container.appendChild(card);
    });
}

function openOwnerEditModal(index) {
    currentEditingOwnerIndex = index;
    currentPhotoData = null;
    const owner = ownersData[index];
    if (!owner) return;

    document.getElementById('owner-name-input').value = owner.name;
    document.getElementById('owner-role-input').value = owner.role;
    document.getElementById('owner-bio-input').value = owner.bio;
    document.getElementById('photo-preview-container').classList.add('hidden');
    document.getElementById('owner-photo-input').value = '';

    document.getElementById('owner-edit-modal').classList.remove('hidden');
}

function closeOwnerEditModal() {
    document.getElementById('owner-edit-modal').classList.add('hidden');
    currentEditingOwnerIndex = null;
    currentPhotoData = null;
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentPhotoData = e.target.result;
        const preview = document.getElementById('owner-photo-preview');
        preview.src = currentPhotoData;
        document.getElementById('photo-preview-container').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearPhotoPreview() {
    currentPhotoData = null;
    document.getElementById('owner-photo-input').value = '';
    document.getElementById('photo-preview-container').classList.add('hidden');
}

/* ---------- 9. HERO SLIDER ---------- */
let heroSliderInterval = null;
let currentSlideIndex = 0;

function initHeroSlider() {
    if (heroSliderInterval) {
        clearInterval(heroSliderInterval);
        heroSliderInterval = null;
    }

    const slides = Array.from(document.querySelectorAll('.hero-slide'));
    if (slides.length === 0) return;

    currentSlideIndex = 0;
    slides.forEach((slide, index) => {
        slide.style.opacity = index === 0 ? '1' : '0';
    });

    if (slides.length <= 1) return;

    heroSliderInterval = setInterval(() => {
        slides[currentSlideIndex].style.opacity = '0';
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].style.opacity = '1';
    }, 6000);
}

/* ---------- 10. INIT ---------- */
function initApp() {
    /* Mobile menu */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    /* Owner edit form */
    const ownerEditForm = document.getElementById('owner-edit-form');
    if (ownerEditForm) {
        ownerEditForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (currentEditingOwnerIndex === null) return;

            const name = document.getElementById('owner-name-input').value.trim();
            const role = document.getElementById('owner-role-input').value.trim();
            const bio = document.getElementById('owner-bio-input').value.trim();

            if (!name || !role || !bio) {
                showCustomModal('Error', 'Please fill in all fields (Name, Role, and Bio).');
                return;
            }

            const updatedOwners = ownersData.map((owner) => ({ ...owner }));
            updatedOwners[currentEditingOwnerIndex].name = name;
            updatedOwners[currentEditingOwnerIndex].role = role;
            updatedOwners[currentEditingOwnerIndex].bio = bio;
            if (currentPhotoData) {
                updatedOwners[currentEditingOwnerIndex].image = currentPhotoData;
            }

            try {
                await saveOwnerProfiles(updatedOwners);
                ownersData = updatedOwners;
                closeOwnerEditModal();
                renderOwnerCards();
                renderPublicOwners();
                showCustomModal('Success', 'Owner details have been updated successfully!');
            } catch (error) {
                console.error('Could not save owner profile changes.', error);
                showCustomModal('Unable to Save Owner', 'Owner changes could not be saved. Please make sure you are logged in and try again.');
            }
        });
    }

    /* Photo upload form */
    const uploadPhotoForm = document.getElementById('uploadPhotoForm');
    const uploadFileInput = document.getElementById('uploadFile');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (uploadFileInput) {
        uploadFileInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                uploadedFile = null;
                showCustomModal('Invalid File', 'Please choose a valid image file.');
                uploadFileInput.value = '';
                return;
            }

            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
            uploadedFile = file;
            previewObjectUrl = URL.createObjectURL(file);
            imagePreview.src = previewObjectUrl;
            imagePreviewContainer.style.display = 'block';
        });
    }

    if (uploadPhotoForm) {
        uploadPhotoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const caption = document.getElementById('uploadCaption').value.trim();
            const destination = document.getElementById('uploadDestination').value;
            const location = document.getElementById('uploadLocation').value.trim();
            const showOnHome = document.getElementById('showOnHome').value;

            if (!uploadedFile) {
                showCustomModal('Image Required', 'Please select an image file from your device first.');
                return;
            }
            if (!firebaseReady) {
                showCustomModal('Service Unavailable', 'Photo uploads need a connection to the server. Please try again later.');
                return;
            }

            try {
                const dataUrl = await resizeImageToDataUrl(uploadedFile, PHOTO_MAX_DIMENSION, PHOTO_JPEG_QUALITY);
                const newMediaItem = {
                    dataUrl,
                    destination,
                    caption,
                    location,
                    showOnHome,
                    dateUploaded: new Date().toISOString()
                };

                await dbRef('photos').push(newMediaItem);

                showCustomModal('Photo Published', 'The photo was saved and is now visible on the selected page.');
                uploadPhotoForm.reset();
                if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
                if (imagePreview) imagePreview.src = '';
                uploadedFile = null;
                if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
                previewObjectUrl = '';
            } catch (error) {
                console.error('Could not save uploaded media.', error);
                showCustomModal('Upload Failed', 'The photo could not be uploaded. Please make sure you are logged in and try again.');
            }
        });
    }

    /* Subscribe to live data */
    subscribeTestimonials();
    subscribeServicePricing();
    subscribeOwners();
    subscribePhotos();
    subscribeBookings();

    /* Auth state */
    if (firebaseReady && auth) {
        auth.onAuthStateChanged((user) => applyAuthState(user));
    } else {
        applyAuthState(null);
    }

    /* Initial hash routing */
    if (window.location.hash === '#admin') {
        switchPage('admin');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
