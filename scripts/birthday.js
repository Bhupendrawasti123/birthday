// Global Variables
let birthdayData = null;
let birthdayMusic = null;

// Main Initialization Function
async function initApp() {
    try {
        // Load configuration from GitHub
        const response = await fetch('https://bhupendrawasti.com.np/data/birthday/birthday.json');
        if (!response.ok) throw new Error('Failed to load configuration');
        birthdayData = await response.json();
        
        // Initialize components
        initAudio();
        initForm();
        initEventListeners();
        checkUrlParams();

    } catch (error) {
        console.error('Initialization error:', error);
        handleDataError();
    }
}

// Audio Management
function initAudio() {
    try {
        birthdayMusic = new Audio(birthdayData.musicUrl);
        birthdayMusic.loop = true;
        birthdayMusic.volume = 0.5;
        document.getElementById('musicControl').style.display = 'flex';
    } catch (error) {
        console.error('Audio initialization failed:', error);
        document.getElementById('musicControl').style.display = 'none';
    }
}

function toggleMusic() {
    if (!birthdayMusic) return;
    
    if (birthdayMusic.paused) {
        birthdayMusic.play()
            .then(() => document.getElementById('musicControl').innerHTML = '<i class="fas fa-pause"></i>')
            .catch(error => console.error("Playback failed:", error));
    } else {
        birthdayMusic.pause();
        document.getElementById('musicControl').innerHTML = '<i class="fas fa-music"></i>';
    }
}

// Form Management
function initForm() {
    const messageSelect = document.getElementById('customMessage');
    messageSelect.innerHTML = '<option value="random">Random Message</option>';
    
    birthdayData.wishes.forEach(wish => {
        const option = document.createElement('option');
        option.value = wish.id;
        option.textContent = wish.title;
        option.dataset.message = wish.message;
        messageSelect.appendChild(option);
    });
}

function validateForm() {
    const name = document.getElementById('customName').value.trim();
    const picUrl = document.getElementById('customPic').value.trim();
    const generateBtn = document.getElementById('generateBtn');
    const urlError = document.getElementById('urlError');

    if (picUrl && !isValidImageUrl(picUrl)) {
        document.getElementById('customPic').classList.add('error');
        urlError.style.display = 'block';
        generateBtn.disabled = true;
        return;
    }
    
    document.getElementById('customPic').classList.remove('error');
    urlError.style.display = 'none';
    generateBtn.disabled = !name;
}

function isValidImageUrl(url) {
    try {
        new URL(url);
        return /\.(jpe?g|png|gif|webp)$/i.test(url);
    } catch {
        return false;
    }
}

// Message Preview
function updateMessagePreview() {
    const select = document.getElementById('customMessage');
    const preview = document.getElementById('messagePreview');
    preview.textContent = select.value === 'random' 
        ? "Random message will be selected on generation" 
        : select.options[select.selectedIndex].dataset.message;
}

// Card Generation
function createShareLink() {
    const name = document.getElementById('customName').value.trim() || 'Friend';
    const pic = document.getElementById('customPic').value.trim() || birthdayData.defaultPic;
    const messageId = getSelectedMessageId();

    // Update display
    document.getElementById('birthdayName').textContent = name;
    loadImageWithSpinner(document.getElementById('birthdayPic'), pic);
    setMessage(messageId);

    // Generate share URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?${new URLSearchParams({
        name: encodeURIComponent(name),
        pic: encodeURIComponent(pic),
        message: messageId
    })}`;

    document.getElementById('shareUrlDisplay').textContent = shareUrl;
    showSection('birthdayDisplay');
    createConfetti();
}

function getSelectedMessageId() {
    const select = document.getElementById('customMessage');
    return select.value === 'random' 
        ? birthdayData.wishes[Math.floor(Math.random() * birthdayData.wishes.length)].id 
        : parseInt(select.value);
}

function setMessage(messageId) {
    const message = birthdayData.wishes.find(w => w.id === messageId) || 
                   birthdayData.wishes[0];
    document.getElementById('birthdayMessage').textContent = message.message;
}

// Image Handling
function loadImageWithSpinner(imgElement, src) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'block';
    imgElement.style.opacity = '0';

    const testImage = new Image();
    testImage.src = src;
    
    testImage.onload = () => {
        imgElement.src = src;
        imgElement.style.opacity = '1';
        spinner.style.display = 'none';
    };

    testImage.onerror = () => {
        imgElement.src = birthdayData.defaultPic;
        imgElement.style.opacity = '1';
        spinner.style.display = 'none';
    };
}

// Confetti Effect
function createConfetti() {
    const colors = ['#E91E63', '#00BCD4', '#FF9800', '#9C27B0', '#3F51B5'];
    const card = document.querySelector('.birthday-card');
    const count = window.innerWidth < 600 ? 30 : 50;

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            left: ${Math.random() * 100}%;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            width: ${Math.random() * 8 + 5}px;
            height: ${Math.random() * 8 + 5}px;
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            --random-x: ${(Math.random() - 0.5) * 100}px;
        `;
        card.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Share Functionality
async function copyToClipboard() {
    const shareUrl = document.getElementById('shareUrlDisplay').textContent;
    try {
        await navigator.clipboard.writeText(shareUrl);
        showTemporaryMessage('successMessage');
    } catch (err) {
        fallbackCopy(shareUrl);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showTemporaryMessage('successMessage');
}

function showTemporaryMessage(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 3000);
}

// Save Functionality
async function saveCardAsImage() {
    const saveBtn = document.getElementById('saveCardBtn');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        // Update save container
        document.getElementById('saveName').textContent = 
            document.getElementById('birthdayName').textContent;
        document.getElementById('savePic').src = 
            document.getElementById('birthdayPic').src;
        document.getElementById('saveMessage').textContent = 
            document.getElementById('birthdayMessage').textContent;

        // Generate image
        const saveContainer = document.getElementById('saveContainer');
        saveContainer.classList.remove('hidden-for-save');
        
        const canvas = await html2canvas(saveContainer, {
            scale: 2,
            logging: false,
            backgroundColor: '#FFD1DC'
        });

        // Trigger download
        const link = document.createElement('a');
        link.download = 'birthday-card.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();

    } catch (error) {
        alert('Error saving card. Please try again.');
    } finally {
        saveContainer.classList.add('hidden-for-save');
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
    }
}

// URL Handling
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size > 0) showSharedCard(urlParams);
}

function showSharedCard(params) {
    const name = params.get('name') || 'Friend';
    const pic = params.get('pic') || birthdayData.defaultPic;
    const messageId = params.get('message');

    document.getElementById('birthdayName').textContent = decodeURIComponent(name);
    loadImageWithSpinner(document.getElementById('birthdayPic'), pic);
    setMessage(messageId ? parseInt(messageId) : 'random');
    showSection('birthdayDisplay');
}

function showSection(sectionId) {
    document.getElementById('birthdayDisplay').style.display = 
        sectionId === 'birthdayDisplay' ? 'block' : 'none';
    document.getElementById('customizeForm').style.display = 
        sectionId === 'customizeForm' ? 'block' : 'none';
    document.getElementById('shareSection').style.display = 
        sectionId === 'shareSection' ? 'block' : 'none';
}

// Reset Functionality
function resetForm() {
    document.getElementById('customName').value = '';
    document.getElementById('customPic').value = '';
    document.getElementById('customMessage').value = 'random';
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('urlError').style.display = 'none';
    document.getElementById('messagePreview').textContent = 'Select a message to preview';
    showSection('customizeForm');
}

// Error Handling
function handleDataError() {
    birthdayData = {
        wishes: [{
            id: 0,
            title: "Default Message",
            message: "Happy Birthday! Wishing you all the best!"
        }],
        defaultPic: "https://i.imgur.com/JQWUQfZ.jpg",
        musicUrl: "https://bhupendrawasti123.github.io/bhupendra/media/birthday.mp3"
    };
    initForm();
    initAudio();
    alert('Using default configuration due to load error');
}

// Event Listeners
function initEventListeners() {
    document.getElementById('generateBtn').addEventListener('click', createShareLink);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('backBtn').addEventListener('click', resetForm);
    document.getElementById('saveCardBtn').addEventListener('click', saveCardAsImage);
    document.getElementById('customMessage').addEventListener('change', updateMessagePreview);
    document.getElementById('customName').addEventListener('input', validateForm);
    document.getElementById('customPic').addEventListener('input', validateForm);
    document.getElementById('musicControl').addEventListener('click', toggleMusic);
    document.getElementById('howItWorksBtn').addEventListener('click', () => 
        document.getElementById('howItWorksModal').classList.add('active'));
    document.getElementById('closeHowItWorks').addEventListener('click', () => 
        document.getElementById('howItWorksModal').classList.remove('active'));
}

// Initialize Application
document.addEventListener('DOMContentLoaded', initApp);
