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
    const burgerLessons = $('burgerLessons');
    const burgerMain = $('burgerMain');
    const burgerTest = $('burgerTest');
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

    // Главный меню - карточки
    btnCards.addEventListener('click', () => openLessonPicker('cards'));
    btnCards.addEventListener('touchstart', (e) => { e.preventDefault(); openLessonPicker('cards'); });

    // Бургер - карточки
    burgerLessons.addEventListener('click', () => {
        showLessons();
        burgerMenu.style.display = 'none';
    });
    burgerLessons.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showLessons();
        burgerMenu.style.display = 'none';
    });

    // Бургер - главная
    burgerMain.addEventListener('click', () => {
        showScreen('mainMenu');
        burgerMenu.style.display = 'none';
    });

    burgerTest.addEventListener('click', () => {
        openLessonPicker('test');
        burgerMenu.style.display = 'none';
    })
});

// ========== MAIN MENU ==========
$('btnTest').onclick = () => openLessonPicker('test');
$('btnLessons').onclick = () => showLessons();

let lessonPickerMode = null;
function openLessonPicker(mode) {
    renderLessonList(mode);
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
        };
        list.appendChild(li);
    });
}

$('pickerCancel').onclick = () => hideModal('lessonPicker');
$('lessonPicker').addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal('lessonPicker');
});

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

function flipCard() {
    cardsState.flipped = !cardsState.flipped;
    renderCard();
}

function nextCard() {
    const lesson = LESSONS[cardsState.lessonKey];
    cardsState.idx = (cardsState.idx + 1) % lesson.items.length;
    cardsState.flipped = false;
    renderCard();
}

function prevCard() {
    const lesson = LESSONS[cardsState.lessonKey];
    cardsState.idx = (cardsState.idx - 1 + lesson.items.length) % lesson.items.length;
    cardsState.flipped = false;
    renderCard();
}

function toggleFav() {
    const { lessonKey, idx, favs } = cardsState;
    const i = favs.indexOf(idx);
    if (i === -1) favs.push(idx);
    else favs.splice(i, 1);
    saveFavs(lessonKey, favs);
    renderCard();
}

$('card').onclick = flipCard;
$('card').addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
});

$('prevBtn').onclick = prevCard;
$('nextBtn').onclick = nextCard;
$('favBtn').onclick = toggleFav;
$('cardsBack').onclick = () => { cardsState = null; showScreen('mainMenu'); };

document.addEventListener('keydown', e => {
    if (currentScreen === 'cards') {
        if (e.key === 'ArrowLeft') prevCard();
        else if (e.key === 'ArrowRight') nextCard();
        else if (e.key === ' ' || e.key === 'Enter') flipCard();
        else if (e.key === 'Escape') $('cardsBack').click();
    }
});

// ========== TEST ==========
let testState = null;

function startTest(lessonKey) {
    const lesson = LESSONS[lessonKey];
    if (!lesson || !lesson.items.length) { showScreen('mainMenu'); return; }
    testState = {
        lessonKey,
        order: shuffle([...lesson.items.keys()]),
        cur: 0,
        results: []
    };
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
        b.disabled = true;
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
    // Если тест завершен, запускаем последний урок заново
    let lastLessonKey = null;
    if (testState) lastLessonKey = testState.lessonKey;
    else {
        const lessonName = $('testLessonName').textContent || $('resultLessonName')?.textContent;
        if (lessonName) {
            lastLessonKey = Object.keys(LESSONS).find(k => LESSONS[k].name === lessonName);
        }
    }

    if (lastLessonKey) startTest(lastLessonKey);
};

$('resultBack').onclick = () => showScreen('mainMenu');

document.addEventListener('keydown', e => {
    if (currentScreen === 'test') {
        if (['1', '2', '3'].includes(e.key)) {
            const btns = $('options').children;
            const idx = parseInt(e.key, 10) - 1;
            if (btns[idx]) btns[idx].click();
        } else if (e.key === 'Escape') $('testBack').click();
    }
    if (currentScreen === 'testResult' && e.key === 'Escape') $('resultBack').click();
});

// ========== LESSONS ==========
function showLessons() {
    const list = $('lessonsList');
    list.innerHTML = '';
    const keys = Object.keys(LESSONS);
    if (!keys.length) {
        const li = document.createElement('li'); li.textContent = 'No lessons available.'; list.appendChild(li);
    } else {
        keys.forEach(key => {
            const l = LESSONS[key];
            const countText = `${l.items.length} ${pluralize(l.items.length, 'слово', 'слова', 'слов')}`;
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="lesson-header">
                    <strong>${l.name}</strong> — ${l.description} 
                    <span class="lesson-count">(${countText})</span>
                </div>
                <button class="vocab-btn">Словарик 📖</button>
                <ul class="vocab-list hidden"></ul>
            `;
            const btn = li.querySelector('.vocab-btn');
            const vocabList = li.querySelector('.vocab-list');
            l.items.forEach(item => {
                const wordLi = document.createElement('li');
                wordLi.innerHTML = `<span class="ru">${item.ru}</span> — <span class="en">${item.en}</span>`;
                vocabList.appendChild(wordLi);
            });
            btn.onclick = () => vocabList.classList.toggle('hidden');
            list.appendChild(li);
        });
    }
    showScreen('lessons');
}
$('lessonsBack').onclick = () => showScreen('mainMenu');

// ========== ACCESSIBILITY ==========
document.addEventListener('keydown', e => {
    if (currentScreen === 'mainMenu' && e.key === 'Escape') showScreen('splash');
});

// Показываем splash при загрузке
showScreen('splash');
