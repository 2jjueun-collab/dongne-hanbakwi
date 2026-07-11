import { CATEGORIES, LANDMARKS, MISSIONS } from './data.js';

const STORAGE_KEY = 'dongne-hanbakwi-state-v1';
const DEFAULT_STATE = {
  visited: [],
  equipped: { hat: null, hand: null, neck: null, chest: null },
  claimedMissions: [],
  bonusPoints: 0,
  selectedCategory: '전체',
  currentLocation: null
};

let state = loadState();
let activeLandmarkId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  visitedCount: $('#visitedCount'),
  itemCount: $('#itemCount'),
  pointCount: $('#pointCount'),
  locationTitle: $('#locationTitle'),
  locationText: $('#locationText'),
  locateButton: $('#locateButton'),
  filters: $('#categoryFilters'),
  landmarkList: $('#landmarkList'),
  heroCharacter: $('#heroCharacter'),
  characterStage: $('#characterStage'),
  inventoryGrid: $('#inventoryGrid'),
  collectionGrid: $('#collectionGrid'),
  missionList: $('#missionList'),
  collectionProgress: $('#collectionProgress'),
  collectionProgressBar: $('#collectionProgressBar'),
  ownedSummary: $('#ownedSummary'),
  couponCard: $('#couponCard'),
  couponCode: $('#couponCode'),
  verifyDialog: $('#verifyDialog'),
  verifyTitle: $('#verifyTitle'),
  verifyDescription: $('#verifyDescription'),
  verifyMessage: $('#verifyMessage'),
  qrCodeInput: $('#qrCodeInput'),
  toast: $('#toast')
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULT_STATE, ...saved, equipped: { ...DEFAULT_STATE.equipped, ...(saved?.equipped || {}) } };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function totalPoints() {
  const visitPoints = LANDMARKS.filter((item) => state.visited.includes(item.id))
    .reduce((sum, item) => sum + item.points, 0);
  return visitPoints + state.bonusPoints;
}

function ownedItems() {
  return LANDMARKS.filter((item) => state.visited.includes(item.id)).map((item) => item.reward);
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const R = 6371e3;
  const toRad = (value) => value * Math.PI / 180;
  const φ1 = toRad(aLat);
  const φ2 = toRad(bLat);
  const Δφ = toRad(bLat - aLat);
  const Δλ = toRad(bLng - aLng);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '거리 확인 필요';
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

function characterMarkup(size = 'normal') {
  const items = ownedItems();
  const equippedItems = Object.values(state.equipped)
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean);
  const itemLayer = equippedItems.map((item) => `<span class="equipped-item slot-${item.slot}" aria-label="${item.name}">${item.emoji}</span>`).join('');
  return `<div class="character ${size}">
    <div class="character-shadow"></div>
    <div class="character-body"><span class="eye left"></span><span class="eye right"></span><span class="mouth"></span></div>
    <div class="character-shirt"><span>경산</span></div>${itemLayer}
  </div>`;
}

function renderCharacter() {
  elements.heroCharacter.innerHTML = characterMarkup('small');
  elements.characterStage.innerHTML = characterMarkup('large');
}

function renderStats() {
  const visited = state.visited.length;
  elements.visitedCount.textContent = visited;
  elements.itemCount.textContent = ownedItems().length;
  elements.pointCount.textContent = totalPoints().toLocaleString('ko-KR');
  const progress = Math.round((visited / LANDMARKS.length) * 100);
  elements.collectionProgress.textContent = `${progress}%`;
  elements.collectionProgressBar.style.width = `${progress}%`;
  elements.ownedSummary.textContent = `${ownedItems().length}개 보유`;
}

function renderFilters() {
  elements.filters.innerHTML = CATEGORIES.map((category) => `
    <button type="button" class="filter-chip ${state.selectedCategory === category ? 'active' : ''}" data-category="${category}">${category}</button>
  `).join('');
  elements.filters.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category;
      saveState();
      renderFilters();
      renderLandmarks();
    });
  });
}

function landmarkDistance(item) {
  if (!state.currentLocation) return null;
  return distanceMeters(state.currentLocation.lat, state.currentLocation.lng, item.lat, item.lng);
}

function renderLandmarks() {
  const filtered = LANDMARKS.filter((item) => state.selectedCategory === '전체' || item.category === state.selectedCategory);
  elements.landmarkList.innerHTML = filtered.map((item, index) => {
    const visited = state.visited.includes(item.id);
    const distance = landmarkDistance(item);
    return `<article class="landmark-card ${visited ? 'visited' : ''}">
      <div class="landmark-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="landmark-copy">
        <div class="landmark-meta"><span>${item.category}</span>${visited ? '<strong>방문 완료</strong>' : ''}</div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="reward-line"><span class="reward-icon">${item.reward.emoji}</span><span><small>방문 보상</small><strong>${item.reward.name} · ${item.points}P</strong></span></div>
      </div>
      <div class="landmark-actions">
        <span class="distance-label">${distance === null ? 'GPS 미확인' : formatDistance(distance)}</span>
        <button class="${visited ? 'secondary-button' : 'primary-button'} compact" type="button" data-verify="${item.id}">${visited ? '다시 보기' : '방문 인증'}</button>
        <button class="text-button map-button" type="button" data-map="${item.name}">지도 검색</button>
      </div>
    </article>`;
  }).join('');

  elements.landmarkList.querySelectorAll('[data-verify]').forEach((button) => button.addEventListener('click', () => openVerify(button.dataset.verify)));
  elements.landmarkList.querySelectorAll('[data-map]').forEach((button) => button.addEventListener('click', () => {
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(button.dataset.map + ' 경산')}`, '_blank', 'noopener,noreferrer');
  }));
}

function renderInventory() {
  const items = ownedItems();
  if (!items.length) {
    elements.inventoryGrid.innerHTML = '<div class="empty-state">아직 보유한 아이템이 없습니다.<br />탐험지에서 첫 아이템을 획득해 보세요.</div>';
    return;
  }
  elements.inventoryGrid.innerHTML = items.map((item) => {
    const equipped = state.equipped[item.slot] === item.id;
    return `<button class="inventory-item ${equipped ? 'equipped' : ''}" type="button" data-equip="${item.id}">
      <span>${item.emoji}</span><strong>${item.name}</strong><small>${equipped ? '착용 중' : '눌러서 착용'}</small>
    </button>`;
  }).join('');
  elements.inventoryGrid.querySelectorAll('[data-equip]').forEach((button) => button.addEventListener('click', () => toggleEquip(button.dataset.equip)));
}

function renderCollection() {
  elements.collectionGrid.innerHTML = LANDMARKS.map((item) => {
    const unlocked = state.visited.includes(item.id);
    return `<article class="collection-item ${unlocked ? 'unlocked' : 'locked'}">
      <span class="collection-art">${unlocked ? item.reward.emoji : '？'}</span>
      <div><small>${item.shortName}</small><strong>${unlocked ? item.reward.name : '미발견 아이템'}</strong></div>
    </article>`;
  }).join('');
}

function missionProgress(mission) {
  return Math.min(state.visited.length, mission.target);
}

function renderMissions() {
  elements.missionList.innerHTML = MISSIONS.map((mission) => {
    const progress = missionProgress(mission);
    const complete = progress >= mission.target;
    const claimed = state.claimedMissions.includes(mission.id);
    return `<article class="mission-card ${complete ? 'complete' : ''}">
      <div class="mission-check">${claimed ? '✓' : complete ? '!' : progress}</div>
      <div class="mission-copy"><h3>${mission.title}</h3><p>${mission.description}</p><div class="mini-progress"><span style="width:${progress / mission.target * 100}%"></span></div><small>${progress}/${mission.target} · 보상 ${mission.reward}P</small></div>
      <button class="${complete && !claimed ? 'primary-button' : 'secondary-button'} compact" type="button" data-claim="${mission.id}" ${!complete || claimed ? 'disabled' : ''}>${claimed ? '수령 완료' : complete ? '보상 받기' : '진행 중'}</button>
    </article>`;
  }).join('');
  elements.missionList.querySelectorAll('[data-claim]').forEach((button) => button.addEventListener('click', () => claimMission(button.dataset.claim)));

  const couponUnlocked = state.visited.length >= 3;
  elements.couponCard.classList.toggle('unlocked', couponUnlocked);
  elements.couponCode.textContent = couponUnlocked ? 'LOCAL10' : 'LOCKED';
}

function renderAll() {
  renderStats();
  renderFilters();
  renderLandmarks();
  renderCharacter();
  renderInventory();
  renderCollection();
  renderMissions();
}

function openVerify(id) {
  const landmark = LANDMARKS.find((item) => item.id === id);
  if (!landmark) return;
  activeLandmarkId = id;
  elements.verifyTitle.textContent = `${landmark.name} 방문 인증`;
  elements.verifyDescription.textContent = `${landmark.radius}m 이내 GPS 또는 현장 QR 코드로 인증합니다. 심사 발표에서는 데모 방문 처리를 사용할 수 있습니다.`;
  elements.verifyMessage.textContent = '';
  elements.qrCodeInput.value = '';
  elements.verifyDialog.showModal();
}

function unlockLandmark(id, method = 'GPS') {
  const landmark = LANDMARKS.find((item) => item.id === id);
  if (!landmark) return;
  const isNew = !state.visited.includes(id);
  if (isNew) state.visited.push(id);
  saveState();
  renderAll();
  if (elements.verifyDialog.open) elements.verifyDialog.close();
  showToast(isNew ? `${landmark.reward.emoji} ${landmark.reward.name} 획득! (${method})` : `${landmark.name}은 이미 인증된 장소입니다.`);
}

function verifyActiveByGps() {
  const landmark = LANDMARKS.find((item) => item.id === activeLandmarkId);
  if (!landmark) return;
  elements.verifyMessage.textContent = '위치를 확인하는 중입니다…';
  requestLocation(({ lat, lng, accuracy }) => {
    const distance = distanceMeters(lat, lng, landmark.lat, landmark.lng);
    const allowed = landmark.radius + Math.min(accuracy || 0, 200);
    if (distance <= allowed) {
      unlockLandmark(landmark.id, 'GPS');
    } else {
      elements.verifyMessage.textContent = `현재 약 ${formatDistance(distance)} 떨어져 있습니다. 현장 반경 ${landmark.radius}m 안에서 다시 시도해 주세요.`;
    }
  }, (message) => { elements.verifyMessage.textContent = message; });
}

function requestLocation(onSuccess, onError) {
  if (!('geolocation' in navigator)) {
    onError?.('이 브라우저는 위치 기능을 지원하지 않습니다.');
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const payload = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
    state.currentLocation = payload;
    saveState();
    elements.locationTitle.textContent = '현재 위치 확인 완료';
    elements.locationText.textContent = `위치 정확도 약 ${Math.round(payload.accuracy)}m · 장소별 거리를 계산했습니다.`;
    elements.locateButton.textContent = '다시 확인';
    renderLandmarks();
    onSuccess?.(payload);
  }, (error) => {
    const messages = {
      1: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.',
      2: '현재 위치를 확인할 수 없습니다.',
      3: '위치 확인 시간이 초과되었습니다.'
    };
    onError?.(messages[error.code] || '위치 확인 중 오류가 발생했습니다.');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

function toggleEquip(id) {
  const item = ownedItems().find((candidate) => candidate.id === id);
  if (!item) return;
  state.equipped[item.slot] = state.equipped[item.slot] === item.id ? null : item.id;
  saveState();
  renderCharacter();
  renderInventory();
}

function claimMission(id) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || missionProgress(mission) < mission.target || state.claimedMissions.includes(id)) return;
  state.claimedMissions.push(id);
  state.bonusPoints += mission.reward;
  saveState();
  renderAll();
  showToast(`${mission.title} 보상 ${mission.reward}P를 받았습니다.`);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2600);
}

function navigate(target) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === target));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.target === target));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function shareProgress() {
  const text = `동네 한 바퀴에서 경산 랜드마크 ${state.visited.length}곳을 탐험하고 ${ownedItems().length}개 아이템을 모았어요! #동네한바퀴 #경산탐험`;
  try {
    if (navigator.share) {
      await navigator.share({ title: '나의 경산 탐험 기록', text, url: location.href });
    } else {
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      showToast('공유 문구를 클립보드에 복사했습니다.');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('공유 기능을 사용할 수 없습니다.');
  }
}

function resetProgress() {
  if (!confirm('방문 기록, 아이템, 포인트를 모두 초기화할까요?')) return;
  state = structuredClone(DEFAULT_STATE);
  localStorage.removeItem(STORAGE_KEY);
  elements.locationTitle.textContent = '현재 위치를 확인해 주세요';
  elements.locationText.textContent = 'GPS 인증은 HTTPS 환경에서 작동합니다.';
  elements.locateButton.textContent = '내 위치 확인';
  renderAll();
  navigate('explore');
  showToast('진행 상황을 초기화했습니다.');
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.target)));
$('#resetButton').addEventListener('click', resetProgress);
$('#locateButton').addEventListener('click', () => requestLocation(() => showToast('현재 위치를 확인했습니다.'), showToast));
$('#gpsVerifyButton').addEventListener('click', verifyActiveByGps);
$('#demoVerifyButton').addEventListener('click', () => unlockLandmark(activeLandmarkId, '데모'));
$('#codeVerifyButton').addEventListener('click', () => {
  const landmark = LANDMARKS.find((item) => item.id === activeLandmarkId);
  const input = elements.qrCodeInput.value.trim().toUpperCase();
  if (landmark && input === landmark.qrCode.toUpperCase()) unlockLandmark(landmark.id, 'QR');
  else elements.verifyMessage.textContent = 'QR 코드 값이 일치하지 않습니다.';
});
$('#demoAllButton').addEventListener('click', () => {
  LANDMARKS.forEach((item) => { if (!state.visited.includes(item.id)) state.visited.push(item.id); });
  saveState();
  renderAll();
  showToast('심사용으로 모든 장소와 아이템을 해금했습니다.');
});
$('#shareButton').addEventListener('click', shareProgress);

window.addEventListener('hashchange', () => {
  const target = location.hash.slice(1);
  if (['explore', 'character', 'collection', 'mission'].includes(target)) navigate(target);
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

renderAll();
