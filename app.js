import {
  CATEGORIES,
  HIDDEN_ITEM,
  HIDDEN_ITEM_CODE,
  LANDMARKS,
  MISSIONS,
  SHOP_ITEMS
} from './data.js';

const STORAGE_KEY = 'dongne-hanbakwi-state-v1';
const DEFAULT_STATE = {
  visited: [],
  equipped: { hat: null, hand: null, neck: null, chest: null },
  claimedMissions: [],
  bonusPoints: 0,
  purchasedItems: [],
  unlockedHiddenItems: [],
  spentPoints: 0,
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
  shopPointCount: $('#shopPointCount'),
  locationTitle: $('#locationTitle'),
  locationText: $('#locationText'),
  locateButton: $('#locateButton'),
  filters: $('#categoryFilters'),
  landmarkList: $('#landmarkList'),
  heroCharacter: $('#heroCharacter'),
  characterStage: $('#characterStage'),
  inventoryGrid: $('#inventoryGrid'),
  shopGrid: $('#shopGrid'),
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
  hiddenCodeInput: $('#hiddenCodeInput'),
  hiddenCodeMessage: $('#hiddenCodeMessage'),
  toast: $('#toast')
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      ...structuredClone(DEFAULT_STATE),
      ...saved,
      visited: Array.isArray(saved.visited) ? saved.visited : [],
      claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
      purchasedItems: Array.isArray(saved.purchasedItems) ? saved.purchasedItems : [],
      unlockedHiddenItems: Array.isArray(saved.unlockedHiddenItems) ? saved.unlockedHiddenItems : [],
      equipped: { ...DEFAULT_STATE.equipped, ...(saved.equipped || {}) },
      spentPoints: Number.isFinite(saved.spentPoints) ? Math.max(0, saved.spentPoints) : 0,
      bonusPoints: Number.isFinite(saved.bonusPoints) ? Math.max(0, saved.bonusPoints) : 0
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function earnedPoints() {
  const visitPoints = LANDMARKS.filter((item) => state.visited.includes(item.id))
    .reduce((sum, item) => sum + item.points, 0);
  return visitPoints + state.bonusPoints;
}

function availablePoints() {
  return Math.max(0, earnedPoints() - state.spentPoints);
}

function dedupeItems(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function ownedItems() {
  const landmarkItems = LANDMARKS
    .filter((item) => state.visited.includes(item.id))
    .map((item) => item.reward);
  const purchased = SHOP_ITEMS.filter((item) => state.purchasedItems.includes(item.id));
  const hidden = state.unlockedHiddenItems.includes(HIDDEN_ITEM.id) ? [HIDDEN_ITEM] : [];
  return dedupeItems([...landmarkItems, ...purchased, ...hidden]);
}

function collectionItems() {
  const landmarkItems = LANDMARKS.map((landmark) => ({
    ...landmark.reward,
    source: landmark.shortName,
    unlockType: 'visit'
  }));
  const shopItems = SHOP_ITEMS.map((item) => ({ ...item, source: '포인트 상점', unlockType: 'shop' }));
  return [...landmarkItems, ...shopItems, { ...HIDDEN_ITEM, source: '히든 코드', unlockType: 'hidden' }];
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
  const itemLayer = equippedItems
    .map((item) => `<span class="equipped-item slot-${item.slot}" aria-label="${item.name}">${item.emoji}</span>`)
    .join('');

  return `<div class="character ${size}" aria-label="아이템을 착용한 흰곰 캐릭터">
    <div class="character-shadow"></div>
    <span class="bear-leg left"></span><span class="bear-leg right"></span>
    <div class="bear-body"><span class="bear-belly">경산</span></div>
    <span class="bear-arm left"></span><span class="bear-arm right"></span>
    <span class="bear-ear left"><i></i></span><span class="bear-ear right"><i></i></span>
    <div class="bear-head">
      <span class="eye left"></span><span class="eye right"></span>
      <span class="bear-muzzle"><i class="bear-nose"></i><i class="bear-mouth"></i></span>
    </div>
    ${itemLayer}
  </div>`;
}

function renderCharacter() {
  elements.heroCharacter.innerHTML = characterMarkup('small');
  elements.characterStage.innerHTML = characterMarkup('large');
}

function renderStats() {
  const visited = state.visited.length;
  const items = ownedItems();
  const allItems = collectionItems();
  const progress = Math.round((items.length / allItems.length) * 100);

  elements.visitedCount.textContent = visited;
  elements.itemCount.textContent = items.length;
  elements.pointCount.textContent = availablePoints().toLocaleString('ko-KR');
  elements.shopPointCount.textContent = availablePoints().toLocaleString('ko-KR');
  elements.collectionProgress.textContent = `${progress}%`;
  elements.collectionProgressBar.style.width = `${progress}%`;
  elements.ownedSummary.textContent = `${items.length}개 보유`;
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
    elements.inventoryGrid.innerHTML = '<div class="empty-state">아직 보유한 아이템이 없습니다.<br />탐험하거나 포인트 상점을 이용해 보세요.</div>';
    return;
  }

  elements.inventoryGrid.innerHTML = items.map((item) => {
    const equipped = state.equipped[item.slot] === item.id;
    return `<button class="inventory-item ${equipped ? 'equipped' : ''}" type="button" data-equip="${item.id}">
      <span>${item.emoji}</span><strong>${item.name}</strong><small>${equipped ? '착용 중 · 눌러서 해제' : '눌러서 착용'}</small>
    </button>`;
  }).join('');

  elements.inventoryGrid.querySelectorAll('[data-equip]').forEach((button) => button.addEventListener('click', () => toggleEquip(button.dataset.equip)));
}

function renderShop() {
  const balance = availablePoints();
  elements.shopGrid.innerHTML = SHOP_ITEMS.map((item) => {
    const purchased = state.purchasedItems.includes(item.id);
    const affordable = balance >= item.price;
    const buttonText = purchased ? '구매 완료' : affordable ? `${item.price}P로 구매` : `${item.price - balance}P 부족`;
    return `<article class="shop-item ${purchased ? 'purchased' : ''}">
      <div class="shop-item-art">${item.emoji}</div>
      <div class="shop-item-copy"><span>${slotLabel(item.slot)}</span><h3>${item.name}</h3><p>${item.description}</p></div>
      <div class="shop-item-footer"><strong>${item.price}P</strong><button class="${purchased ? 'secondary-button' : 'primary-button'} compact" type="button" data-buy="${item.id}" ${purchased || !affordable ? 'disabled' : ''}>${buttonText}</button></div>
    </article>`;
  }).join('');

  elements.shopGrid.querySelectorAll('[data-buy]').forEach((button) => button.addEventListener('click', () => buyItem(button.dataset.buy)));

  const hiddenUnlocked = state.unlockedHiddenItems.includes(HIDDEN_ITEM.id);
  elements.hiddenCodeInput.disabled = hiddenUnlocked;
  $('#hiddenCodeButton').disabled = hiddenUnlocked;
  if (hiddenUnlocked) {
    elements.hiddenCodeInput.value = '';
    elements.hiddenCodeInput.placeholder = '이미 해금됨';
    elements.hiddenCodeMessage.textContent = `${HIDDEN_ITEM.emoji} ${HIDDEN_ITEM.name} 해금 완료`;
    elements.hiddenCodeMessage.classList.add('success');
  } else {
    elements.hiddenCodeInput.placeholder = '코드 입력';
    if (elements.hiddenCodeMessage.textContent.includes('해금 완료')) elements.hiddenCodeMessage.textContent = '';
    elements.hiddenCodeMessage.classList.remove('success');
  }
}

function slotLabel(slot) {
  const labels = { hat: '머리', hand: '손', neck: '목', chest: '가슴' };
  return labels[slot] || '소품';
}

function renderCollection() {
  const ownedIds = new Set(ownedItems().map((item) => item.id));
  elements.collectionGrid.innerHTML = collectionItems().map((item) => {
    const unlocked = ownedIds.has(item.id);
    const hiddenLocked = item.unlockType === 'hidden' && !unlocked;
    return `<article class="collection-item ${unlocked ? 'unlocked' : 'locked'}">
      <span class="collection-art">${unlocked ? item.emoji : '？'}</span>
      <div><small>${hiddenLocked ? '비밀 아이템' : item.source}</small><strong>${unlocked ? item.name : hiddenLocked ? '???' : '미획득 아이템'}</strong></div>
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
  renderShop();
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
  showToast(isNew ? `${landmark.reward.emoji} ${landmark.reward.name} + ${landmark.points}P 획득! (${method})` : `${landmark.name}은 이미 인증된 장소입니다.`);
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

function buyItem(id) {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id);
  if (!item || state.purchasedItems.includes(id)) return;
  if (availablePoints() < item.price) {
    showToast('포인트가 부족합니다. 탐험이나 미션을 완료해 주세요.');
    return;
  }

  state.purchasedItems.push(id);
  state.spentPoints += item.price;
  saveState();
  renderAll();
  showToast(`${item.emoji} ${item.name}을 구매했습니다. ${item.price}P 사용`);
}

function redeemHiddenItem() {
  if (state.unlockedHiddenItems.includes(HIDDEN_ITEM.id)) {
    elements.hiddenCodeMessage.textContent = '이미 히든 아이템을 해금했습니다.';
    elements.hiddenCodeMessage.classList.add('success');
    return;
  }

  const code = elements.hiddenCodeInput.value.trim().toUpperCase();
  if (code !== HIDDEN_ITEM_CODE.toUpperCase()) {
    elements.hiddenCodeMessage.textContent = '히든 코드가 일치하지 않습니다.';
    elements.hiddenCodeMessage.classList.remove('success');
    return;
  }

  state.unlockedHiddenItems.push(HIDDEN_ITEM.id);
  saveState();
  elements.hiddenCodeInput.value = '';
  renderAll();
  showToast(`${HIDDEN_ITEM.emoji} 히든 아이템 ${HIDDEN_ITEM.name} 해금!`);
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
  if (location.hash !== `#${target}`) history.replaceState(null, '', `#${target}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function shareProgress() {
  const text = `동네 한 바퀴에서 경산 랜드마크 ${state.visited.length}곳을 탐험하고 흰곰 아이템 ${ownedItems().length}개를 모았어요! #동네한바퀴 #경산탐험`;
  try {
    if (navigator.share) {
      await navigator.share({ title: '나의 경산 흰곰 탐험 기록', text, url: location.href });
    } else {
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      showToast('공유 문구를 클립보드에 복사했습니다.');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('공유 기능을 사용할 수 없습니다.');
  }
}

function resetProgress() {
  if (!confirm('방문 기록, 구매 아이템, 포인트를 모두 초기화할까요?')) return;
  state = structuredClone(DEFAULT_STATE);
  localStorage.removeItem(STORAGE_KEY);
  elements.locationTitle.textContent = '현재 위치를 확인해 주세요';
  elements.locationText.textContent = 'GPS 인증은 HTTPS 환경에서 작동합니다.';
  elements.locateButton.textContent = '내 위치 확인';
  elements.hiddenCodeMessage.textContent = '';
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
$('#hiddenCodeButton').addEventListener('click', redeemHiddenItem);
elements.hiddenCodeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    redeemHiddenItem();
  }
});
$('#demoAllButton').addEventListener('click', () => {
  LANDMARKS.forEach((item) => { if (!state.visited.includes(item.id)) state.visited.push(item.id); });
  saveState();
  renderAll();
  showToast('모든 장소와 방문 보상을 해금했습니다. 상점 구매는 포인트를 사용합니다.');
});
$('#shareButton').addEventListener('click', shareProgress);

window.addEventListener('hashchange', () => {
  const target = location.hash.slice(1);
  if (['explore', 'character', 'shop', 'collection', 'mission'].includes(target)) navigate(target);
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

renderAll();
const initialTarget = location.hash.slice(1);
if (['explore', 'character', 'shop', 'collection', 'mission'].includes(initialTarget)) navigate(initialTarget);
