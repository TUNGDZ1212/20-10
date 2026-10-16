import { people } from './list.js';

const rainEmojis = ['💖', '✨', '🌸', '🎀', '🍓', '🍰', '🌷', '🦋', '🥰', '🎉', '🌟', '💝'];

let revealedState = {};
try {
    revealedState = JSON.parse(sessionStorage.getItem('revealedNames_8b_voice')) || {};
} catch (e) {
    revealedState = {};
}

// === HỆ THỐNG PHÁT FILE VOICE MP3 RIÊNG LẺ ===
const voicePlayer = document.getElementById('voice-player');

function playVoice(id) {
    voicePlayer.pause();
    voicePlayer.currentTime = 0;
    voicePlayer.src = `./voice/${id}.mp3`;
    
    // Giảm âm lượng nhạc nền khi voice đang phát
    const bgMusic = document.getElementById('bg-music');
    const originalVol = bgMusic.volume;
    if(originalVol > 0.3) bgMusic.volume = 0.3;

    voicePlayer.play().catch(err => {
        console.log(`Không tìm thấy file voice cho ${id}.mp3 hoặc chưa tương tác.`);
        bgMusic.volume = originalVol;
    });

    voicePlayer.onended = () => {
        bgMusic.volume = originalVol;
    };
}

// Nút nghe lại voice
document.getElementById('btn-replay-voice').addEventListener('click', () => {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/.]+)\.js$/);
    if(match && match[1]) {
        playVoice(match[1]);
    }
});
// ===========================================

initMouseTrail();
renderGrid();
handleRouting();
setupAudio();

function setupAudio() {
    const audio = document.getElementById('bg-music');
    const volumeSlider = document.getElementById('volume-slider');
    const audioIcon = document.getElementById('audio-icon');
    let interacted = false;

    audio.volume = volumeSlider.value;

    document.body.addEventListener('click', () => {
        if (!interacted) {
            audio.play().catch(() => {});
            interacted = true;
        }
    }, { once: true });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        if (audio.volume === 0) {
            audioIcon.innerText = '🔇';
        } else if (audio.volume < 0.5) {
            audioIcon.innerText = '🔉';
        } else {
            audioIcon.innerText = '🔊';
        }
    });

    audioIcon.addEventListener('click', () => {
        if (audio.volume > 0) {
            audio.dataset.lastVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
            audioIcon.innerText = '🔇';
        } else {
            const lastVol = audio.dataset.lastVolume || 0.5;
            audio.volume = lastVol;
            volumeSlider.value = lastVol;
            audioIcon.innerText = lastVol < 0.5 ? '🔉' : '🔊';
        }
    });
}

function initMouseTrail() {
    const container = document.getElementById('mouse-trail-container');
    if (!container) return;
    let lastTime = 0;
    
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTime < 40) return;
        lastTime = now;

        const star = document.createElement('div');
        star.className = 'mouse-star';
        star.style.left = `${e.clientX}px`;
        star.style.top = `${e.clientY}px`;
        container.appendChild(star);
        
        setTimeout(() => star.remove(), 500);
    });
}

function renderGrid() {
    const teacherSection = document.getElementById('teacher-section');
    const studentsGrid = document.getElementById('students-grid');

    if (!teacherSection || !studentsGrid) return;
    teacherSection.innerHTML = '';
    studentsGrid.innerHTML = '';

    people.forEach(person => {
        const card = document.createElement('div');
        const state = revealedState[person.id];
        const isRevealed = !!state;
        const currentEmoji = isRevealed ? state.emoji : '🎀'; 
        
        if (person.isTeacher) {
            card.className = 'teacher-card fade-in';
            card.innerHTML = `
                <div class="emoji-btn">👑</div>
                <div class="person-name" style="color: #ffeb3b; font-size: 2.5rem;">${person.name}</div>
            `;
            card.onclick = (e) => handleCardClick(person, card, e, '👑');
            teacherSection.appendChild(card);
        } else {
            card.className = 'student-card fade-in glass-box';
            card.innerHTML = `
                <div class="emoji-btn">${currentEmoji}</div>
                <div class="person-name">${person.name}</div>
            `;
            card.onclick = (e) => handleCardClick(person, card, e, currentEmoji);
            studentsGrid.appendChild(card);
        }
    });
}

function handleCardClick(person, cardElement, event, currentEmoji) {
    const emojiBtn = cardElement.querySelector('.emoji-btn');

    createExplosion(event.clientX, event.clientY);
    createEmojiRain();

    let emojiToPass = currentEmoji;

    if (!person.isTeacher && !revealedState[person.id]) {
        emojiToPass = rainEmojis[Math.floor(Math.random() * rainEmojis.length)];
        emojiBtn.innerText = emojiToPass;
        emojiBtn.style.animation = 'popIn 0.3s ease';
        
        revealedState[person.id] = { emoji: emojiToPass };
        sessionStorage.setItem('revealedNames_8b_voice', JSON.stringify(revealedState));
    }

    setTimeout(() => {
        navigateTo(person.id, emojiToPass);
    }, 700);
}

function createExplosion(x, y) {
    const container = document.getElementById('rain-container');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.innerText = '✨';
        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.fontSize = '1.8rem';
        particle.style.filter = 'drop-shadow(0 0 10px white)';
        container.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 60 + Math.random() * 120;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
        ], { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });

        setTimeout(() => particle.remove(), 600);
    }
}

function createEmojiRain() {
    const container = document.getElementById('rain-container');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
        const drop = document.createElement('div');
        drop.innerText = rainEmojis[Math.floor(Math.random() * rainEmojis.length)];
        drop.style.position = 'absolute';
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.top = `-10vh`;
        drop.style.fontSize = `${Math.random() * 1.5 + 1.2}rem`;
        drop.style.opacity = Math.random() * 0.6 + 0.4;
        drop.style.filter = 'drop-shadow(0 0 5px rgba(255,255,255,0.5))';
        container.appendChild(drop);

        const duration = Math.random() * 2000 + 1500;
        drop.animate([
            { transform: `translateY(0) rotate(0deg)` },
            { transform: `translateY(120vh) rotate(${Math.random() * 360}deg)` }
        ], { duration: duration, easing: 'linear' });

        setTimeout(() => drop.remove(), duration);
    }
}

function navigateTo(id, emoji) {
    history.pushState({ id, emoji }, "", `/${id}.js`);
    showDetailView(id, emoji);
}

window.addEventListener("popstate", (event) => {
    if (event.state && event.state.id) {
        showDetailView(event.state.id, event.state.emoji);
    } else {
        handleRouting();
    }
});

function handleRouting() {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/.]+)\.js$/);
    if (match && match[1]) {
        const storedState = revealedState[match[1]];
        const fallbackEmoji = storedState ? storedState.emoji : '💝';
        showDetailView(match[1], fallbackEmoji);
    } else {
        showHomeView();
    }
}

async function showDetailView(id, emoji) {
    const homeView = document.getElementById('home-view');
    const detailView = document.getElementById('detail-view');
    if (!homeView || !detailView) return;

    homeView.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailView.classList.add('fade-in');

    const emojiDisplay = document.getElementById('emoji-display');
    const wishBox = document.getElementById('wish-box');
    const wishText = document.getElementById('wish-text');
    
    emojiDisplay.innerText = emoji;
    wishBox.classList.remove('hidden');
    
    try {
        const module = await import(`./wishes/${id}.js`);
        wishText.innerHTML = module.default;
        
        // Tự động phát file MP3 tương ứng trong thư mục voice/
        playVoice(id);

    } catch (error) {
        wishText.innerHTML = "Có lỗi xảy ra! Không tải được lời chúc.";
    }
}

function showHomeView() {
    const homeView = document.getElementById('home-view');
    const detailView = document.getElementById('detail-view');
    if (!homeView || !detailView) return;

    // Dừng phát voice khi quay lại trang chủ
    voicePlayer.pause();
    const bgMusic = document.getElementById('bg-music');
    const volumeSlider = document.getElementById('volume-slider');
    bgMusic.volume = volumeSlider.value;

    detailView.classList.add('hidden');
    homeView.classList.remove('hidden');
    renderGrid(); 
}

const btnExit = document.getElementById('btn-exit');
if (btnExit) {
    btnExit.addEventListener('click', () => {
        history.pushState(null, "", "/");
        showHomeView();
    });
}