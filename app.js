// ========== HELPERS ==========
function $(id) { return document.getElementById(id); }

function shuffle(arr) {
    arr = arr.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function saveFavs(key, favs) {
    localStorage.setItem('efs_favs_' + key, JSON.stringify(favs));
}

function loadFavs(key) {
    try { return JSON.parse(localStorage.getItem('efs_favs_' + key)) || []; }
    catch { return []; }
}

function saveLastIdx(key, idx) {
    localStorage.setItem('efs_lastidx_' + key, idx);
}

function loadLastIdx(key) {
    const v = localStorage.getItem('efs_lastidx_' + key);
    return v !== null ? parseInt(v, 10) : 0;
}

function focusFirstButton(parent) {
    const btn = parent.querySelector('button, [tabindex="0"]');
    if (btn) btn.focus();
}

function pluralize(count, one, few, many) {
    count = Math.abs(count) % 100;
    const n1 = count % 10;
    if (count > 10 && count < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
}

// ========== UI STATE ==========
let currentScreen = 'splash';
let lessonPickerMode = null;

function showScreen(id) {
    ['splash', 'mainMenu', 'cards', 'test', 'lessons', 'testResult'].forEach(s => {
        $(s).classList.toggle('hidden', s !== id);
    });
    currentScreen = id;
    setTimeout(() => $(id).focus(), 0);
}

function showModal(id) {
    $(id).classList.remove('hidden');
    setTimeout(() => $(id).focus(), 0);
}

function hideModal(id) {
    $(id).classList.add('hidden');
}

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', () => {
    const splash = $('splash');
    const mainMenu = $('mainMenu');
    const burgerBtn = $('burgerBtn');
    const burgerMenu = $('burgerMenu');
    const burgerMain = $('burgerMain');
    const burgerTest = $('burgerTest');
    const burgerDictionary = $('burgerDictionary');
    const btnCards = $('btnCards');

    // Splash fade
    setTimeout(() => {
        mainMenu.classList.remove('hidden');
        setTimeout(() => mainMenu.classList.add('visible'), 50);
        setTimeout(() => { splash.style.display = 'none'; }, 1500);
    }, 2000);

    // ========== BURGER ==========
    burgerBtn.addEventListener('click', () => {
        burgerMenu.style.display = burgerMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    burgerDictionary.addEventListener('click', () => {openLessonPicker('lessons', 'Словарик'); burgerMenu.style.display = 'none';});
    burgerMain.addEventListener('click', () => { showScreen('mainMenu'); burgerMenu.style.display = 'none'; });
    burgerTest.addEventListener('click', () => { openLessonPicker('test', 'Тестик'); burgerMenu.style.display = 'none'; });

    btnCards.addEventListener('click', () => openLessonPicker('cards', 'Карточки'));
});

// ========== MAIN MENU ==========
$('btnTest').onclick = (e) => {
    const title = e.currentTarget.querySelector('.mainBtname').textContent;
    openLessonPicker('test', title);
};
$('btnCards').onclick = (e) => {
    const title = e.currentTarget.querySelector('.mainBtname').textContent;
    openLessonPicker('cards', title);
};
$('btnLessons').onclick = () => showLessons();

function openLessonPicker(mode, title = '') {
    renderLessonList(mode);
    $('lessonPicker').querySelector('h3').textContent = title;
    showModal('lessonPicker');
    lessonPickerMode = mode;
}

function renderLessonList(mode) {
    const list = $('lessonList');
    list.innerHTML = '';
    const keys = Object.keys(LESSONS);
    if (!keys.length) { $('noLessons').classList.remove('hidden'); return; }
    $('noLessons').classList.add('hidden');
    keys.forEach(key => {
        const l = LESSONS[key];
        const li = document.createElement('li');
        li.innerHTML = `<button data-key="${key}"><strong>${l.name}</strong><br><small>${l.description}</small></button>`;
        li.querySelector('button').onclick = () => {
            hideModal('lessonPicker');
            if (mode === 'cards') startCards(key);
            else if (mode === 'test') startTest(key);
            else if (mode === 'lessons') startLessons(key);
        };
        list.appendChild(li);
    });
}

$('pickerCancel').onclick = () => hideModal('lessonPicker');
$('lessonPicker').addEventListener('keydown', e => { if (e.key === 'Escape') hideModal('lessonPicker'); });

// ========== CARDS ==========
let cardsState = null;
function startCards(lessonKey) {
    const lesson = LESSONS[lessonKey];
    if (!lesson || !lesson.items.length) { showScreen('mainMenu'); return; }
    cardsState = {
        lessonKey,
        idx: loadLastIdx(lessonKey),
        flipped: false,
        favs: loadFavs(lessonKey)
    };
    $('cardsLessonName').textContent = lesson.name;
    renderCard();
    showScreen('cards');
}

function renderCard() {
    const { lessonKey, idx, flipped, favs } = cardsState;
    const lesson = LESSONS[lessonKey];
    const item = lesson.items[idx];
    $('front').textContent = item.ru;
    $('back').textContent = item.en;
    $('card').classList.toggle('flipped', flipped);
    $('favBtn').classList.toggle('fav', favs.includes(idx));
    saveLastIdx(lessonKey, idx);
}

function flipCard() { cardsState.flipped = !cardsState.flipped; renderCard(); }
function nextCard() { const lesson = LESSONS[cardsState.lessonKey]; cardsState.idx = (cardsState.idx + 1) % lesson.items.length; cardsState.flipped = false; renderCard(); }
function prevCard() { const lesson = LESSONS[cardsState.lessonKey]; cardsState.idx = (cardsState.idx - 1 + lesson.items.length) % lesson.items.length; cardsState.flipped = false; renderCard(); }
function toggleFav() { const { lessonKey, idx, favs } = cardsState; const i = favs.indexOf(idx); i === -1 ? favs.push(idx) : favs.splice(i, 1); saveFavs(lessonKey, favs); renderCard(); }

$('card').onclick = flipCard;
$('card').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); } });
$('prevBtn').onclick = prevCard;
$('nextBtn').onclick = nextCard;
$('favBtn').onclick = toggleFav;
$('cardsBack').onclick = () => { cardsState = null; showScreen('mainMenu'); };

// ========== TEST ==========
let testState = null;
function startTest(lessonKey) {
    const lesson = LESSONS[lessonKey];
    if (!lesson || !lesson.items.length) { showScreen('mainMenu'); return; }
    testState = { lessonKey, order: shuffle(lesson.items.map((_, i) => i)), cur: 0, results: [] };
    $('testLessonName').textContent = lesson.name;
    renderTestQuestion();
    showScreen('test');
}

function renderTestQuestion() {
    const state = testState;
    const lesson = LESSONS[state.lessonKey];
    if (state.cur >= state.order.length) { finishTest(); return; }
    const idx = state.order[state.cur];
    const qItem = lesson.items[idx];
    $('question').innerHTML = `Как переводиться <u>${qItem.ru}</u> ?`;

    let variants = [qItem.en];
    let pool = lesson.items.map(it => it.en).filter((v, i) => i !== idx);
    pool = shuffle(pool);
    while (variants.length < 3 && pool.length) variants.push(pool.shift());
    while (variants.length < 3) variants.push(variants[0]);
    variants = shuffle(variants);

    const optionsWrap = $('options');
    optionsWrap.innerHTML = '';
    variants.forEach(opt => {
        const b = document.createElement('button');
        b.textContent = opt;
        b.tabIndex = 0;
        b.onclick = () => handleAnswer(opt, qItem.en, idx);
        optionsWrap.appendChild(b);
    });
    focusFirstButton(optionsWrap);
}

function handleAnswer(chosen, correct, idx) {
    const state = testState;
    const isCorrect = chosen === correct;
    const buttons = Array.from($('options').children);
    buttons.forEach(b => {
        if (b.textContent === correct) b.disabled = true;
        b.classList.toggle('correct', b.textContent === correct);
        b.classList.toggle('wrong', b.textContent === chosen && !isCorrect);
    });
    state.results.push({ idx, correct: isCorrect, chosen });
    setTimeout(() => { state.cur += 1; renderTestQuestion(); }, 1000);
}

function finishTest() {
    const state = testState;
    if (!state) return;
    const lesson = LESSONS[state.lessonKey];
    const wrap = $('resultSummary');
    wrap.innerHTML = '';
    const total = state.results.length;
    let score = 0;
    const container = document.createElement('div');
    container.style.maxWidth = '700px';
    container.style.margin = '0 auto';

    state.results.forEach(r => {
        const item = lesson.items[r.idx];
        if (r.correct) score++;
        const div = document.createElement('div');
        div.className = 'result-item ' + (r.correct ? 'correct' : 'wrong');
        div.style.background = 'rgba(255,255,255,0.05)';
        div.style.borderRadius = '10px';
        div.style.padding = '0.8rem 1rem';
        div.style.marginBottom = '0.7rem';
        div.style.fontSize = '1rem';
        div.style.color = '#fff';
        div.style.lineHeight = '1.4';
        div.style.borderLeft = r.correct ? '6px solid #4caf50' : '6px solid #f44336';
        div.innerHTML = `
            <div class="question">${item.ru}</div>
            <div class="user-answer">Ти ответила: ${r.chosen}</div>
            <div class="correct-answer">Правильна: ${item.en}</div>
        `;
        container.appendChild(div);
    });

    const p = document.createElement('p');
    p.style.fontSize = '1.5rem';
    p.style.fontWeight = '600';
    p.style.color = '#fff';
    p.style.textAlign = 'center';
    p.style.textShadow = '1px 1px 8px rgba(0,0,0,0.3)';
    p.textContent = `Умничка! Ти ответила на: ${score} из ${total} слов (${Math.round(score / total * 100)}%)`;
    wrap.appendChild(p);
    wrap.appendChild(container);

    showScreen('testResult');
    testState = null;
}

$('testBack').onclick = () => { testState = null; showScreen('mainMenu'); };
$('retryBtn').onclick = () => {
    const lessonName = $('testLessonName').textContent;
    const lastLessonKey = Object.keys(LESSONS).find(k => LESSONS[k].name === lessonName);
    if (lastLessonKey) startTest(lastLessonKey);
};
$('resultBack').onclick = () => showScreen('mainMenu');

// ======== LESSONS ========
let currentLessonKey = null;

// Функция для показа словаря урока
function startLessons(lessonKey) {
    const lesson = LESSONS[lessonKey];
    if (!lesson || !lesson.items.length) {
        showScreen('mainMenu');
        return;
    }
    currentLessonKey = lessonKey;
    $('dictionaryName').textContent = lesson.name;

    const list = $('lessonsList');
    list.innerHTML = '';
    lesson.items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="num">${index + 1}</span>
                        <span class="ru">${item.ru}</span>
                        <span class="en">${item.en}</span>`;
        list.appendChild(li);
    });

    showScreen('lessons');
}

// Кнопка «Словарь» на главном меню
$('btnLessons').onclick = () => {
    openLessonPicker('lessons', 'Словарик');
};

// Обработка выбора урока из picker
function renderLessonList(mode) {
    const list = $('lessonList');
    list.innerHTML = '';
    const keys = Object.keys(LESSONS);
    if (!keys.length) {
        $('noLessons').classList.remove('hidden');
        return;
    }
    $('noLessons').classList.add('hidden');
    keys.forEach(key => {
        const l = LESSONS[key];
        const li = document.createElement('li');
        li.innerHTML = `<button data-key="${key}"><strong>${l.name}</strong><br><small>${l.description}</small></button>`;
        li.querySelector('button').onclick = () => {
            hideModal('lessonPicker');
            if (mode === 'cards') startCards(key);
            else if (mode === 'test') startTest(key);
            else if (mode === 'lessons') startLessons(key); // <- открываем словарь
        };
        list.appendChild(li);
    });
}

// Кнопка назад из словаря
$('lessonsback').onclick = () => {
    currentLessonKey = null;
    showScreen('mainMenu');
};

// ========== ACCESSIBILITY ==========
document.addEventListener('keydown', e => {
    if (currentScreen === 'mainMenu' && e.key === 'Escape') burgerMenu.style.display = 'none';
});
