// Global Variables
let birthdayData = null;
let birthdayMusic = null;

// Main Initialization Function
async function initApp() {
    try {
        // Load configuration data
        const response = await fetch('../birthday/data/birthday.json');
        if (!response.ok) throw new Error('Failed to load configuration');
        birthdayData = await response.json();

        // Initialize audio system
        initAudio();
        
        // Setup UI components
        initForm();
        initModals();
        initEventListeners();
        
        // Check for shared link parameters
        checkUrlParams();

    } catch (error) {
        handleInitError(error);
    }
}

// Audio Management
function initAudio() {
    birthdayMusic = new Audio(birthdayData.musicUrl);
    birthdayMusic.loop = true;
    birthdayMusic.volume = 0.5;
    
    const musicControl = document.getElementById('musicControl');
    musicControl.style.display = 'flex';
    musicControl.addEventListener('click', toggleMusic);
}

function toggleMusic() {
    if (birthdayMusic.paused) {
        birthdayMusic.play()
            .then(() => updateMusicUI('pause'))
            .catch(handleAudioError);
    } else {
        birthdayMusic.pause();
        updateMusicUI('play'));
    }
}

// Form Initialization
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

// Event Listeners
function initEventListeners() {
    // Form Interactions
    document.getElementById('generateBtn').addEventListener('click', createShareLink);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('backBtn').addEventListener('click', resetForm);
    document.getElementById('saveCardBtn').addEventListener('click', saveCardAsImage);
    
    // Input Handlers
    document.getElementById('customMessage').addEventListener('change', updateMessagePreview);
    document.getElementById('customName').addEventListener('input', validateForm);
    document.getElementById('customPic').addEventListener('input', validateForm);
}

// Modal Management
function initModals() {
    const howItWorksModal = document.getElementById('howItWorksModal');
    
    // How It Works Modal
    document.getElementById('howItWorksBtn').addEventListener('click', () => 
        howItWorksModal.classList.add('active'));
    
    document.getElementById('closeHowItWorks').addEventListener('click', () => 
        howItWorksModal.classList.remove('active'));
    
    howItWorksModal.addEventListener('click', (e) => {
        if (e.target === howItWorksModal) howItWorksModal.classList.remove('active');
    });

    // Info Tooltip
    document.getElementById('infoButton').addEventListener('click', function(e) {
        e.stopPropagation();
        const tooltip = document.getElementById('infoTooltip');
        tooltip.style.display = tooltip.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        document.getElementById('infoTooltip').style.display = 'none';
    });
}

// Form Validation
function validateForm() {
    const name = document.getElementById('customName').value.trim();
    const picUrl = document.getElementById('customPic').value.trim();
    const generateBtn = document.getElementById('generateBtn');
    const urlError = document.getElementById('urlError');

    // URL Validation
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
    if (!url) return true;
    try {
        new URL(url);
        return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
    } catch {
        return false;
    }
}

// Message Preview
function updateMessagePreview() {
    const select = document.getElementById('customMessage');
    const preview = document.getElementById('messagePreview');
    
    preview.textContent = select.value === 'random' 
        ? "A random message will be selected when generated!" 
        : select.options[select.selectedIndex].dataset.message;
}

// Card Generation
async function createShareLink() {
    const name = document.getElementById('customName').value.trim() || 'Friend';
    const pic = document.getElementById('customPic').value.trim() || birthdayData.defaultPic;
    const messageId = getSelectedMessageId();

    // Update Display
    document.getElementById('birthdayName').textContent = name;
    document.getElementById('birthdayPic').alt = `Birthday photo for ${name}`;
    loadImageWithSpinner(document.getElementById('birthdayPic'), pic);
    
    // Generate Share URL
    const shareUrl = `${window.location.href.split('?')[0]}?${new URLSearchParams({
        name: encodeURIComponent(name),
        pic: encodeURIComponent(pic),
        message: messageId
    })}`;

    // Update UI
    document.getElementById('shareUrlDisplay').textContent = shareUrl;
    document.getElementById('birthdayDisplay').style.display = 'block';
    document.getElementById('customizeForm').style.display = 'none';
    document.getElementById('shareSection').style.display = 'block';
    
    createConfetti();
}

function getSelectedMessageId() {
    const select = document.getElementById('customMessage');
    if (select.value === 'random') {
        return birthdayData.wishes[Math.floor(Math.random() * birthdayData.wishes.length)].id;
    }
    return parseInt(select.value);
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
        createConfetti();
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
    const confettiCount = window.innerWidth < 600 ? 30 : 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        Object.assign(confetti.style, {
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            width: `${Math.random() * 8 + 5}px`,
            height: `${Math.random() * 8 + 5}px`,
            animation: `confettiFall ${Math.random() * 3 + 2}s linear forwards`,
            '--random-x': `${(Math.random() - 0.5) * 100}px`
        });

        card.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Share Functionality
async function copyToClipboard() {
    const shareUrl = document.getElementById('shareUrlDisplay').textContent;
    const successMessage = document.getElementById('successMessage');

    try {
        await navigator.clipboard.writeText(shareUrl);
        successMessage.style.display = 'block';
        setTimeout(() => successMessage.style.display = 'none', 3000);
    } catch (err) {
        fallbackCopyMethod(shareUrl, successMessage);
    }
}

function fallbackCopyMethod(text, successElement) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const success = document.execCommand('copy');
        successElement.style.display = success ? 'block' : 'none';
    } catch (err) {
        alert('Failed to copy link. Please copy manually.');
    }
    
    document.body.removeChild(textarea);
}

// Save Functionality
async function saveCardAsImage() {
    const saveBtn = document.getElementById('saveCardBtn');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        // Update save container content
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
        saveBtn.innerHTML = '<i class="fas fa-download"></i> Save Card as Image';
        saveBtn.disabled = false;
    }
}

// URL Parameter Handling
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size > 0) showSharedCard(urlParams);
}

function showSharedCard(params) {
    const name = params.get('name') || 'Friend';
    const pic = params.get('pic') || birthdayData.defaultPic;
    const messageId = params.get('message');

    // Set display content
    document.getElementById('birthdayName').textContent = decodeURIComponent(name);
    document.getElementById('birthdayPic').alt = `Birthday photo for ${decodeURIComponent(name)}`;
    loadImageWithSpinner(document.getElementById('birthdayPic'), pic);
    
    // Set message
    const selectedMessage = messageId === 'random' || !messageId
        ? getRandomMessage()
        : birthdayData.wishes.find(w => w.id === parseInt(messageId)) || getRandomMessage();
    
    document.getElementById('birthdayMessage').textContent = selectedMessage.message;

    // Update UI state
    document.getElementById('birthdayDisplay').style.display = 'block';
    document.getElementById('customizeForm').style.display = 'none';
    document.getElementById('shareSection').style.display = 'none';
    
    playBirthdayMusic();
}

function getRandomMessage() {
    return birthdayData.wishes[Math.floor(Math.random() * birthdayData.wishes.length)];
}

// Reset Functionality
function resetForm() {
    document.getElementById('birthdayDisplay').style.display = 'none';
    document.getElementById('shareSection').style.display = 'none';
    document.getElementById('customizeForm').style.display = 'block';
    
    // Reset form fields
    document.getElementById('customName').value = '';
    document.getElementById('customPic').value = '';
    document.getElementById('customMessage').value = 'random';
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('urlError').style.display = 'none';
    document.getElementById('customPic').classList.remove('error');
    document.getElementById('messagePreview').textContent = 'Select a message to preview';
}

// Error Handling
function handleInitError(error) {
    console.error('Initialization Error:', error);
    alert('Failed to initialize application. Please refresh the page.');
}

function handleAudioError(error) {
    console.error('Audio Error:', error);
    document.getElementById('musicControl').style.display = 'none';
}

function updateMusicUI(state) {
    const musicControl = document.getElementById('musicControl');
    musicControl.innerHTML = state === 'pause' 
        ? '<i class="fas fa-pause"></i>' 
        : '<i class="fas fa-music"></i>';
    musicControl.title = state === 'pause' ? "Pause music" : "Play music";
}

// Start Application
document.addEventListener('DOMContentLoaded', initApp);
