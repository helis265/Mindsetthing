let bookingsList = [];

        // Switch between pages / tabs
        function switchPage(pageId) {
            // Hide all page contents
            const pages = document.querySelectorAll('.page-content');
            pages.forEach(p => p.classList.add('hidden'));

            // Show selected page
            const targetPage = document.getElementById('page-' + pageId);
            if (targetPage) {
                targetPage.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (pageId === 'home') {
                loadTestimonials();
                renderTestimonials();
            }

            // Update header active styling
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('text-gold');
                    link.classList.remove('text-offwhite');
                } else {
                    link.classList.remove('text-gold');
                    link.classList.add('text-offwhite');
                }
            });

            // Handle Hash change for demo /admin
            if (pageId === 'admin') {
                window.location.hash = 'admin';
            } else {
                window.location.hash = pageId;
            }
        }

        // Toggle mobile navigation menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        function toggleMobileMenu() {
            mobileMenu.classList.add('hidden');
        }

        // Lightbox Functions
        function openLightbox(imgSrc, captionText) {
            const modal = document.getElementById('lightbox-modal');
            const img = document.getElementById('lightbox-img');
            const cap = document.getElementById('lightbox-caption');

            img.src = imgSrc;
            cap.textContent = captionText;
            modal.classList.remove('hidden');
        }

        function closeLightbox() {
            document.getElementById('lightbox-modal').classList.add('hidden');
        }

        // Custom Modal Functions (Replacing alert)
        function showCustomModal(title, message) {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            document.getElementById('custom-modal').classList.remove('hidden');
        }

        function closeCustomModal() {
            document.getElementById('custom-modal').classList.add('hidden');
        }

        // Portfolio Filtering
        function filterPortfolio(category, button) {
            const items = document.querySelectorAll('.portfolio-item');
            const buttons = document.querySelectorAll('.portfolio-filter-btn');

            buttons.forEach(btn => {
                btn.classList.remove('bg-gold', 'text-black');
                btn.classList.add('bg-cardGray', 'text-offwhite');
            });
            button.classList.remove('bg-cardGray', 'text-offwhite');
            button.classList.add('bg-gold', 'text-black');

            items.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // Admin Authentication Simulation
        function handleAdminLogin(event) {
            event.preventDefault();
            const email = document.getElementById('admin-email').value.trim().toLowerCase();
            const pass = document.getElementById('admin-password').value;

            if (!email || !pass) {
                showCustomModal('Access Denied', 'Enter both your admin email and password.');
            } else if (email === 'mindsetthing4@gmail.com' && pass === 'mind2026set#!!') {
                document.getElementById('admin-login-box').classList.add('hidden');
                document.getElementById('admin-dashboard-panel').classList.remove('hidden');
                document.getElementById('admin-logout-btn').classList.remove('hidden');
                showCustomModal('Admin Access Granted', 'Welcome back, Administrator.');
            } else {
                showCustomModal('Access Denied', 'Invalid admin email or password.');
            }
        }

        function adminLogout() {
            document.getElementById('admin-dashboard-panel').classList.add('hidden');
            document.getElementById('admin-logout-btn').classList.add('hidden');
            document.getElementById('admin-login-box').classList.remove('hidden');
            showCustomModal('Logged Out', 'You have been successfully logged out from the admin dashboard.');
        }

        // Admin Tab Switcher
        function switchAdminTab(tabName) {
            const sections = document.querySelectorAll('.admin-section');
            sections.forEach(sec => sec.classList.add('hidden'));

            const targetSec = document.getElementById('admin-tab-' + tabName);
            if (targetSec) targetSec.classList.remove('hidden');

            const tabBtns = document.querySelectorAll('.admin-tab-btn');
            tabBtns.forEach(btn => {
                btn.classList.remove('bg-gold', 'text-black');
                btn.classList.add('bg-cardGray', 'text-offwhite');
                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.remove('bg-cardGray', 'text-offwhite');
                    btn.classList.add('bg-gold', 'text-black');
                }
            });
        }

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
        let testimonialsData = defaultTestimonials.map(testimonial => ({ ...testimonial }));

        function loadTestimonials() {
            try {
                const savedTestimonials = localStorage.getItem(testimonialsStorageKey);
                if (!savedTestimonials) return;

                const parsedTestimonials = JSON.parse(savedTestimonials);
                if (!Array.isArray(parsedTestimonials) || parsedTestimonials.some(testimonial =>
                    !testimonial ||
                    typeof testimonial.quote !== 'string' ||
                    typeof testimonial.name !== 'string' ||
                    typeof testimonial.detail !== 'string'
                )) {
                    throw new Error('Saved testimonials have an invalid format.');
                }
                testimonialsData = parsedTestimonials;
            } catch (error) {
                console.error('Could not load saved client testimonials.', error);
                showCustomModal('Unable to Load Testimonials', 'Saved client testimonials could not be read. The default testimonials are shown.');
            }
        }

        window.addEventListener('storage', (event) => {
            if (event.key !== testimonialsStorageKey && event.key !== null) return;

            testimonialsData = defaultTestimonials.map(testimonial => ({ ...testimonial }));
            loadTestimonials();
            renderTestimonials();
        });

        function saveTestimonials(updatedTestimonials) {
            try {
                localStorage.setItem(testimonialsStorageKey, JSON.stringify(updatedTestimonials));
                testimonialsData = updatedTestimonials;
                renderTestimonials();
                return true;
            } catch (error) {
                console.error('Could not save client testimonials in this browser.', error);
                showCustomModal('Unable to Save Testimonials', 'Testimonial changes could not be saved in this browser. Please try again.');
                return false;
            }
        }

        function renderTestimonials() {
            const publicGrid = document.getElementById('testimonials-grid');
            const adminList = document.getElementById('admin-testimonials-list');

            if (publicGrid) {
                publicGrid.replaceChildren();
                testimonialsData.forEach(testimonial => {
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
            if (saveTestimonials(nextTestimonials)) {
                showCustomModal('Success', 'Client testimonial has been updated.');
            }
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

            if (saveTestimonials([...testimonialsData, testimonial])) {
                event.target.reset();
                showCustomModal('Success', 'Client testimonial has been added.');
            }
        }

        function deleteTestimonial(index) {
            if (saveTestimonials(testimonialsData.filter((_, itemIndex) => itemIndex !== index))) {
                showCustomModal('Success', 'Client testimonial has been deleted.');
            }
        }

        const servicePricingStorageKey = 'mindset_service_pricing';

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

            try {
                localStorage.setItem(servicePricingStorageKey, JSON.stringify(
                    Object.fromEntries(updates.map(({ input, price }) => [input.dataset.servicePriceInput, price]))
                ));
                showCustomModal('Success', 'Service pricing has been updated and saved.');
            } catch (error) {
                console.error('Could not save service pricing to this browser.', error);
                showCustomModal('Pricing Updated', 'Prices updated for this visit, but could not be saved in this browser.');
            }
        }

        function loadServicePricing() {
            let savedPricing;
            try {
                const storedPricing = localStorage.getItem(servicePricingStorageKey);
                if (!storedPricing) return;
                savedPricing = JSON.parse(storedPricing);
            } catch (error) {
                console.error('Could not load saved service pricing.', error);
                showCustomModal('Unable to Load Saved Pricing', 'Saved service prices could not be read. The default prices are shown.');
                return;
            }

            if (!savedPricing || typeof savedPricing !== 'object' || Array.isArray(savedPricing)) {
                console.error('Saved service pricing has an invalid format.');
                showCustomModal('Unable to Load Saved Pricing', 'Saved service prices have an invalid format. The default prices are shown.');
                return;
            }

            for (const input of document.querySelectorAll('[data-service-price-input]')) {
                const price = savedPricing[input.dataset.servicePriceInput];
                const display = document.querySelector(`[data-service-price-display="${input.dataset.servicePriceInput}"]`);
                if (typeof price === 'string' && price.trim() && display) {
                    input.value = price;
                    display.textContent = price;
                }
            }
        }


        // UPLOAD PHOTO FORM WITH DEVICE FILE READER
const uploadPhotoForm = document.getElementById('uploadPhotoForm');
const uploadFileInput = document.getElementById('uploadFile');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const uploadedMediaDatabaseName = 'mindset_uploaded_media';
const uploadedMediaStoreName = 'photos';
const galleryBucket = 'mindset-gallery';

let uploadedFile = null;
let previewObjectUrl = '';
const generatedMediaUrls = new Set();

function openUploadedMediaDatabase() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB is not supported in this browser.'));
            return;
        }

        const request = indexedDB.open(uploadedMediaDatabaseName, 2);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(uploadedMediaStoreName)) {
                database.createObjectStore(uploadedMediaStoreName, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('owner_profiles')) {
                database.createObjectStore('owner_profiles', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open the media database.'));
    });
}

async function getUploadedMedia() {
    const database = await openUploadedMediaDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(uploadedMediaStoreName, 'readonly');
        const request = transaction.objectStore(uploadedMediaStoreName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not read uploaded media.'));
        request.oncomplete = () => database.close();
    });
}

async function saveUploadedMedia(mediaItem) {
    const database = await openUploadedMediaDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(uploadedMediaStoreName, 'readwrite');
        const request = transaction.objectStore(uploadedMediaStoreName).put(mediaItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Could not save uploaded media.'));
        request.oncomplete = () => database.close();
    });
}

function createObjectUrl(blob) {
    const url = URL.createObjectURL(blob);
    generatedMediaUrls.add(url);
    return url;
}

function createHeroSlide(mediaItem, imageUrl) {
    const sliderContainer = document.getElementById('hero-slider-container');
    if (!sliderContainer) return;

    const slide = document.createElement('div');
    slide.className = 'hero-slide absolute inset-0 transition-opacity duration-1000 opacity-0';

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
    const categoryLabel = mediaItem.destination.replace('graduation', 'Graduation').replace('love', 'Love').replace('boss', 'Boss').replace('family', 'Family');
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

async function renderUploadedMedia() {
    try {
        const uploadedMedia = await getUploadedMedia();
        uploadedMedia.forEach((mediaItem) => {
            const imageUrl = createObjectUrl(mediaItem.image);
            if (mediaItem.destination === 'Home Tab' || mediaItem.showOnHome === 'yes') {
                createHeroSlide(mediaItem, imageUrl);
            }

            const validCategories = ['love', 'graduation', 'boss', 'family'];
            if (validCategories.includes(mediaItem.destination)) {
                createPortfolioItem(mediaItem, imageUrl);
            }
        });
    } catch (error) {
        console.error('Could not render uploaded media.', error);
        showCustomModal('Media Error', 'Uploaded photos could not be loaded. This browser may not support local media storage.');
    }
}

// When user selects a file from their device, show a live preview
if (uploadFileInput) {
    uploadFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            uploadedFile = null;
            showCustomModal('Invalid File', 'Please choose a valid image file.');
            uploadFileInput.value = '';
            return;
        }

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
        }
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

        try {
            const newMediaItem = {
                id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                image: uploadedFile,
                destination,
                caption,
                location,
                showOnHome,
                dateUploaded: new Date().toLocaleString()
            };

            await saveUploadedMedia(newMediaItem);
            const imageUrl = createObjectUrl(uploadedFile);
            if (destination === 'Home Tab' || showOnHome === 'yes') createHeroSlide(newMediaItem, imageUrl);
            if (['love', 'graduation', 'boss', 'family'].includes(destination)) createPortfolioItem(newMediaItem, imageUrl);

            showCustomModal('Photo Published', 'The photo was saved and is now visible on the selected page.');
            uploadPhotoForm.reset();
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            if (imagePreview) imagePreview.src = '';
            uploadedFile = null;
            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = '';
            initHeroSlider();
        } catch (error) {
            console.error('Could not save uploaded media.', error);
            showCustomModal('Upload Failed', 'The browser could not save this photo. The browser may have insufficient storage space.');
        }
    });
}

        // Handle Booking Form Submission
        function handleBookingSubmission(event) {
            event.preventDefault();
            const name = document.getElementById('book-name').value;
            const phone = document.getElementById('book-phone').value;
            const type = document.getElementById('book-type').value;
            const date = document.getElementById('book-date').value;
            const message = document.getElementById('book-message').value;

            const newBooking = { name, phone, type, date, message };
            bookingsList.push(newBooking);
            updateAdminBookingsTable();

            showCustomModal('Booking Request Received', `Thank you ${name}! Your request for a ${type} shoot on ${date} has been logged. Our Blantyre team will contact you shortly.`);
            event.target.reset();
        }

        function updateAdminBookingsTable() {
            const tbody = document.getElementById('admin-bookings-table-body');
            if (bookingsList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-offwhite/50">No booking requests submitted yet.</td></tr>`;
                return;
            }

            let html = '';
            bookingsList.forEach((b) => {
                html += `
                    <tr class="hover:bg-gold/5">
                        <td class="p-4 font-semibold text-offwhite">${b.name}</td>
                        <td class="p-4 text-gold">${b.phone}</td>
                        <td class="p-4">${b.type}</td>
                        <td class="p-4">${b.date}</td>
                        <td class="p-4 text-offwhite/70 text-xs">${b.message || 'N/A'}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }

        function editOwnerPrompt(index) {
            showCustomModal('Owner Edit', `To edit owner #${index + 1}, please update the code comments directly in the index.html template section <!-- START OWNER TEMPLATE -->.`);
        }

        // Owner Management Data
        let ownersData = [
            { name: 'Kadosh', role: 'CEO, Photographer', bio: 'Passionate about editorial lighting and capturing the unyielding ambition of Blantyre\'s trailblazers.', image: 'PHOTOS/IMG_1.jpg' },
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

        let currentEditingOwnerIndex = null;
        let currentPhotoData = null;

        function saveOwnerProfiles(profiles) {
            return openUploadedMediaDatabase().then((database) => new Promise((resolve, reject) => {
                const transaction = database.transaction('owner_profiles', 'readwrite');
                transaction.objectStore('owner_profiles').put({ id: 'studio', profiles });
                transaction.oncomplete = () => {
                    database.close();
                    resolve();
                };
                transaction.onerror = () => {
                    database.close();
                    reject(transaction.error || new Error('Could not save owner profiles.'));
                };
                transaction.onabort = () => {
                    database.close();
                    reject(transaction.error || new Error('Saving owner profiles was aborted.'));
                };
            }));
        }

        function loadOwnerProfiles() {
            return openUploadedMediaDatabase().then((database) => new Promise((resolve, reject) => {
                const transaction = database.transaction('owner_profiles', 'readonly');
                const request = transaction.objectStore('owner_profiles').get('studio');
                transaction.oncomplete = () => {
                    database.close();
                    resolve(request.result ? request.result.profiles : null);
                };
                transaction.onerror = () => {
                    database.close();
                    reject(transaction.error || new Error('Could not load owner profiles.'));
                };
                transaction.onabort = () => {
                    database.close();
                    reject(transaction.error || new Error('Loading owner profiles was aborted.'));
                };
            }));
        }

        async function restoreOwnerProfiles() {
            try {
                const savedProfiles = await loadOwnerProfiles();
                if (!savedProfiles) return;

                const validProfiles = Array.isArray(savedProfiles) && savedProfiles.every((owner) =>
                    owner &&
                    typeof owner.name === 'string' &&
                    typeof owner.role === 'string' &&
                    typeof owner.bio === 'string' &&
                    typeof owner.image === 'string'
                );
                if (!validProfiles) {
                    throw new Error('Saved owner profiles have an invalid format.');
                }
                ownersData = savedProfiles;
            } catch (error) {
                console.error('Could not restore saved owner profiles.', error);
                showCustomModal('Unable to Load Owner Profiles', 'Saved owner details could not be loaded. The default owner details are shown.');
            }
        }

        function renderOwnerCards() {
            const container = document.getElementById('admin-owners-cards');
            if (!container) return;
            
            container.innerHTML = '';
            ownersData.forEach((owner, index) => {
                const card = document.createElement('div');
                card.className = 'bg-black border border-gold/20 overflow-hidden shadow-xl pb-4';
                card.innerHTML = `
                    <div class="aspect-[3/4] overflow-hidden mb-4">
                        <img src="${owner.image}" alt="${owner.name}" class="w-full h-full object-cover" />
                    </div>
                    <div class="px-4">
                        <h3 class="text-lg font-bold uppercase tracking-wider text-offwhite mb-1">${owner.name}</h3>
                        <p class="text-gold text-xs uppercase tracking-widest font-semibold mb-2">${owner.role}</p>
                        <p class="text-offwhite/70 text-xs mb-4 line-clamp-3">${owner.bio}</p>
                        <button onclick="openOwnerEditModal(${index})" class="w-full bg-gold text-black px-4 py-2 text-xs uppercase font-semibold hover:bg-offwhite transition-colors">
                            Edit Card
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function openOwnerEditModal(index) {
            currentEditingOwnerIndex = index;
            currentPhotoData = null;
            const owner = ownersData[index];
            
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
            reader.onload = function(e) {
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

        document.addEventListener('DOMContentLoaded', function() {
            const ownerEditForm = document.getElementById('owner-edit-form');
            if (ownerEditForm) {
                ownerEditForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    if (currentEditingOwnerIndex !== null) {
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

                        try {
                            if (currentPhotoData) {
                                updatedOwners[currentEditingOwnerIndex].image = currentPhotoData;
                            }
                            await saveOwnerProfiles(updatedOwners);
                        } catch (error) {
                            console.error('Could not save owner profile changes.', error);
                            showCustomModal('Unable to Save Owner', 'Owner changes could not be saved in this browser. Please try again.');
                            return;
                        }

                        ownersData = updatedOwners;
                        closeOwnerEditModal();
                        renderOwnerCards();
                        updateOwnerCardsDisplay();
                        showCustomModal('Success', 'Owner details have been updated successfully!');
                    }
                });
            }
        });

        function updateOwnerCardsDisplay() {
            const ownerCardsContainer = document.getElementById('owners-container');
            if (ownerCardsContainer) {
                ownersData.forEach((owner, index) => {
                    const cards = document.querySelectorAll('.owner-card');
                    if (cards[index]) {
                        cards[index].querySelector('img').src = owner.image;
                        cards[index].querySelector('h3').textContent = owner.name;
                        cards[index].querySelector('p:nth-of-type(1)').textContent = owner.role;
                        cards[index].querySelector('.description').textContent = owner.bio;
                    }
                });
            }
        }

        // Hero Slider Rotation Logic
        let currentSlideIndex = 0;
        function initHeroSlider() {
            const slides = document.querySelectorAll('.hero-slide');
            if (slides.length <= 1) return;

            setInterval(() => {
                slides[currentSlideIndex].style.opacity = '0';
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                slides[currentSlideIndex].style.opacity = '1';
            }, 6000);
        }

        // PDF Documentation Generator Function
        function downloadPDFDocumentation() {
            // Generates and downloads MINDSET-Website-Documentation.pdf simulation as text/markdown or data blob
            const docContent = `
            `;

            const blob = new Blob([docContent], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MINDSET-Website-Documentation.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showCustomModal('PDF Downloaded', 'MINDSET-Website-Documentation.pdf has been successfully downloaded to your device.');
        }

        // On window load
        window.onload = async function() {
            renderUploadedMedia();
            initHeroSlider();
            await restoreOwnerProfiles();
            renderOwnerCards();
            updateOwnerCardsDisplay();
            loadTestimonials();
            renderTestimonials();
            loadServicePricing();
            // Check hash on load
            if (window.location.hash === '#admin') {
                switchPage('admin');
            }
        };