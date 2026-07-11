import {
  CATEGORIES,
  CHARACTER,
  DEMO_FRIENDS,
  FRIENDSHIP_BADGE,
  HIDDEN_DRAW_COST,
  HIDDEN_GACHA_ITEMS,
  LANDMARKS,
  MISSIONS,
  SHOP_ITEMS
} from './data.js';

const STORAGE_KEY = 'dongne-hanbakwi-hagom-state-v3';
const LEGACY_KEY = 'dongne-hanbakwi-state-v1';
const NAV_TARGETS = ['explore', 'character', 'shop', 'friends', 'collection', 'mission'];

const LANDMARK_ITEMS = LANDMARKS.flatMap((landmark) => landmark.rewards.map((item) => ({ ...item, source: landmark.shortName, unlockType: 'visit' })));
const SHOP_CATALOG = SHOP_ITEMS.map((item) => ({ ...item, source: '포인트 상점', unlockType: 'shop' }));
const ITEM_CATALOG = [...LANDMARK_ITEMS, ...SHOP_CATALOG, ...HIDDEN_GACHA_ITEMS, FRIENDSHIP_BADGE];
const ITEM_BY_ID = new Map(ITEM_CATALOG.map((item) => [item.id, item]));

const DEFAULT_STATE = {
  visitCounts: {},
  inventoryCounts: {},
  equipped: { hat: null, hand: null, neck: null, chest: null, back: null },
  claimedMissions: [],
  purchasedItems: [],
  pointsEarned: 0,
  spentPoints: 0,
  selectedCategory: '전체',
  currentLocation: null,
  friends: [],
  profile: { id: '', name: '하곰' }
};

let state = loadState();
let activeLandmarkId = null;
let activeFriendId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  uniqueVisitedCount: $('#uniqueVisitedCount'), totalVisitCount: $('#totalVisitCount'), itemCount: $('#itemCount'),
  pointCount: $('#pointCount'), shopPointCount: $('#shopPointCount'), locationTitle: $('#locationTitle'),
  locationText: $('#locationText'), locateButton: $('#locateButton'), filters: $('#categoryFilters'),
  landmarkList: $('#landmarkList'), heroCharacter: $('#heroCharacter'), characterStage: $('#characterStage'),
  inventoryGrid: $('#inventoryGrid'), shopGrid: $('#shopGrid'), collectionGrid: $('#collectionGrid'),
  missionList: $('#missionList'), collectionProgress: $('#collectionProgress'), collectionProgressBar: $('#collectionProgressBar'),
  ownedSummary: $('#ownedSummary'), couponCard: $('#couponCard'), couponCode: $('#couponCode'),
  verifyDialog: $('#verifyDialog'), verifyTitle: $('#verifyTitle'), verifyDescription: $('#verifyDescription'),
  verifyMessage: $('#verifyMessage'), qrCodeInput: $('#qrCodeInput'), resultDialog: $('#resultDialog'),
  resultEyebrow: $('#resultEyebrow'), resultArt: $('#resultArt'), resultTitle: $('#resultTitle'),
  resultDescription: $('#resultDescription'), hiddenDrawButton: $('#hiddenDrawButton'), hiddenDrawMessage: $('#hiddenDrawMessage'),
  friendCount: $('#friendCount'), friendList: $('#friendList'), profileNameInput: $('#profileNameInput'),
  myFriendCode: $('#myFriendCode'), friendCodeInput: $('#friendCodeInput'), friendMessage: $('#friendMessage'),
  friendDialog: $('#friendDialog'), friendDialogTitle: $('#friendDialogTitle'), friendDialogCharacter: $('#friendDialogCharacter'),
  friendDialogItems: $('#friendDialogItems'), toast: $('#toast')
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `hagom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeCountMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, count]) => typeof key === 'string' && Number.isFinite(Number(count)) && Number(count) > 0)
    .map(([key, count]) => [key, Math.floor(Number(count))]));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      const merged = {
        ...cloneDefaultState(), ...saved,
        visitCounts: normalizeCountMap(saved.visitCounts),
        inventoryCounts: normalizeCountMap(saved.inventoryCounts),
        equipped: { ...DEFAULT_STATE.equipped, ...(saved.equipped || {}) },
        claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
        purchasedItems: Array.isArray(saved.purchasedItems) ? saved.purchasedItems : [],
        friends: Array.isArray(saved.friends) ? saved.friends.filter(validFriendSnapshot) : [],
        profile: { ...DEFAULT_STATE.profile, ...(saved.profile || {}) },
        pointsEarned: Math.max(0, Number(saved.pointsEarned) || 0),
        spentPoints: Math.max(0, Number(saved.spentPoints) || 0)
      };
      if (!merged.profile.id) merged.profile.id = randomId();
      return merged;
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy) return migrateLegacyState(legacy);
  } catch {
    // Corrupted browser state is replaced by a clean state.
  }

  const fresh = cloneDefaultState();
  fresh.profile.id = randomId();
  return fresh;
}

function migrateLegacyState(legacy) {
  const migrated = cloneDefaultState();
  migrated.profile.id = randomId();
  const visited = Array.isArray(legacy.visited) ? legacy.visited : [];
  visited.forEach((id) => {
    const landmark = LANDMARKS.find((item) => item.id === id);
    if (!landmark) return;
    migrated.visitCounts[id] = 1;
    migrated.pointsEarned += landmark.points;
    addInventoryTo(migrated.inventoryCounts, landmark.rewards[0].id, 1);
  });
  const purchased = Array.isArray(legacy.purchasedItems) ? legacy.purchasedItems : [];
  purchased.forEach((id) => {
    if (SHOP_ITEMS.some((item) => item.id === id)) {
      migrated.purchasedItems.push(id);
      addInventoryTo(migrated.inventoryCounts, id, 1);
    }
  });
  migrated.claimedMissions = Array.isArray(legacy.claimedMissions) ? legacy.claimedMissions : [];
  migrated.pointsEarned += Math.max(0, Number(legacy.bonusPoints) || 0);
  migrated.spentPoints = Math.max(0, Number(legacy.spentPoints) || 0);
  migrated.equipped = { ...DEFAULT_STATE.equipped, ...(legacy.equipped || {}) };
  saveStateObject(migrated);
  return migrated;
}

function saveStateObject(targetState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targetState));
}

function saveState() {
  saveStateObject(state);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function addInventoryTo(target, itemId, amount = 1) {
  target[itemId] = (target[itemId] || 0) + amount;
}

function addInventory(itemId, amount = 1) {
  if (!ITEM_BY_ID.has(itemId)) return;
  addInventoryTo(state.inventoryCounts, itemId, amount);
}

function uniqueVisitCount() {
  return Object.values(state.visitCounts).filter((count) => count > 0).length;
}

function totalVisitCount() {
  return Object.values(state.visitCounts).reduce((sum, count) => sum + count, 0);
}

function availablePoints() {
  return Math.max(0, state.pointsEarned - state.spentPoints);
}

function ownedItems() {
  return ITEM_CATALOG.filter((item) => (state.inventoryCounts[item.id] || 0) > 0);
}

function getEquippedItems() {
  return Object.values(state.equipped)
    .map((id) => ITEM_BY_ID.get(id))
    .filter((item) => item && (state.inventoryCounts[item.id] || 0) > 0);
}

function totalCollectibleCount() {
  const hiddenFriendshipBonus = (state.inventoryCounts[FRIENDSHIP_BADGE.id] || 0) > 0 ? 1 : 0;
  return LANDMARK_ITEMS.length + SHOP_ITEMS.length + HIDDEN_GACHA_ITEMS.length + hiddenFriendshipBonus;
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const R = 6371e3;
  const toRad = (value) => value * Math.PI / 180;
  const phi1 = toRad(aLat);
  const phi2 = toRad(bLat);
  const deltaPhi = toRad(bLat - aLat);
  const deltaLambda = toRad(bLng - aLng);
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '거리 확인 필요';
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

function secureRandom() {
  if (!crypto?.getRandomValues) return Math.random();
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967296;
}

function randomFrom(items) {
  return items[Math.floor(secureRandom() * items.length)];
}

function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = secureRandom() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor < 0) return item;
  }
  return items.at(-1);
}

function characterMarkup(size = 'normal', equippedItems = getEquippedItems()) {
  const layers = equippedItems.map((item) =>
    `<span class="equipped-item slot-${escapeHTML(item.slot)}" aria-label="${escapeHTML(item.name)}">${escapeHTML(item.emoji)}</span>`
  ).join('');

  return `<div class="character ${escapeHTML(size)}" aria-label="아이템을 착용한 ${escapeHTML(CHARACTER.name)} 캐릭터">
    <div class="character-shadow"></div>
    <img class="hagom-base" src="${escapeHTML(CHARACTER.image)}" alt="${escapeHTML(CHARACTER.name)}" onerror="this.onerror=null;this.src='${escapeHTML(CHARACTER.fallbackImage)}';" />
    ${layers}
  </div>`;
}

function renderCharacter() {
  elements.heroCharacter.innerHTML = characterMarkup('small');
  elements.characterStage.innerHTML = characterMarkup('large');
}

function renderStats() {
  const itemKinds = ownedItems().length;
  const progress = Math.round((itemKinds / totalCollectibleCount()) * 100);
  elements.uniqueVisitedCount.textContent = uniqueVisitCount();
  elements.totalVisitCount.textContent = totalVisitCount();
  elements.itemCount.textContent = itemKinds;
  elements.pointCount.textContent = availablePoints().toLocaleString('ko-KR');
  elements.shopPointCount.textContent = availablePoints().toLocaleString('ko-KR');
  elements.collectionProgress.textContent = `${progress}%`;
  elements.collectionProgressBar.style.width = `${progress}%`;
  elements.ownedSummary.textContent = `${itemKinds}종 보유`;
}

function renderFilters() {
  elements.filters.innerHTML = CATEGORIES.map((category) =>
    `<button type="button" class="filter-chip ${state.selectedCategory === category ? 'active' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`
  ).join('');
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
    const count = state.visitCounts[item.id] || 0;
    const distance = landmarkDistance(item);
    return `<article class="landmark-card ${count ? 'visited' : ''}">
      <div class="landmark-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="landmark-copy">
        <div class="landmark-meta"><span>${escapeHTML(item.category)}</span>${count ? `<strong>${count}회 방문</strong>` : ''}</div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <div class="reward-pool">
          <div class="mystery-stack" aria-hidden="true">${item.rewards.map(() => '<span>?</span>').join('')}</div>
          <span><small>매 방문 랜덤 보상</small><strong>${item.rewards.length}종 중 1개 · ${item.points}P</strong></span>
        </div>
      </div>
      <div class="landmark-actions">
        <span class="distance-label">${distance === null ? 'GPS 미확인' : formatDistance(distance)}</span>
        <button class="${count ? 'secondary-button' : 'primary-button'} compact" type="button" data-verify="${item.id}">${count ? '다시 방문' : '방문 인증'}</button>
        <button class="text-button map-button" type="button" data-map="${escapeHTML(item.name)}">지도 검색</button>
      </div>
    </article>`;
  }).join('');

  elements.landmarkList.querySelectorAll('[data-verify]').forEach((button) =>
    button.addEventListener('click', () => openVerify(button.dataset.verify))
  );
  elements.landmarkList.querySelectorAll('[data-map]').forEach((button) =>
    button.addEventListener('click', () => window.open(`https://map.naver.com/p/search/${encodeURIComponent(button.dataset.map + ' 경산')}`, '_blank', 'noopener,noreferrer'))
  );
}

function renderInventory() {
  const items = ownedItems();
  if (!items.length) {
    elements.inventoryGrid.innerHTML = '<div class="empty-state">아직 보유한 아이템이 없습니다.<br />탐험하거나 포인트 상점을 이용해 보세요.</div>';
    return;
  }

  elements.inventoryGrid.innerHTML = items.map((item) => {
    const equipped = state.equipped[item.slot] === item.id;
    const count = state.inventoryCounts[item.id] || 0;
    return `<button class="inventory-item ${equipped ? 'equipped' : ''}" type="button" data-equip="${item.id}">
      ${count > 1 ? `<i class="count-badge">×${count}</i>` : ''}
      <span>${escapeHTML(item.emoji)}</span><strong>${escapeHTML(item.name)}</strong><small>${equipped ? '착용 중 · 눌러서 해제' : '눌러서 착용'}</small>
    </button>`;
  }).join('');

  elements.inventoryGrid.querySelectorAll('[data-equip]').forEach((button) =>
    button.addEventListener('click', () => toggleEquip(button.dataset.equip))
  );
}

function renderShop() {
  const balance = availablePoints();
  elements.shopGrid.innerHTML = SHOP_ITEMS.map((item) => {
    const purchased = state.purchasedItems.includes(item.id);
    const affordable = balance >= item.price;
    const buttonText = purchased ? '구매 완료' : affordable ? `${item.price}P로 구매` : `${item.price - balance}P 부족`;
    return `<article class="shop-item ${purchased ? 'purchased' : ''}">
      <div class="shop-item-art">${escapeHTML(item.emoji)}</div>
      <div class="shop-item-copy"><span>${slotLabel(item.slot)}</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p></div>
      <div class="shop-item-footer"><strong>${item.price}P</strong><button class="${purchased ? 'secondary-button' : 'primary-button'} compact" type="button" data-buy="${item.id}" ${purchased || !affordable ? 'disabled' : ''}>${buttonText}</button></div>
    </article>`;
  }).join('');
  elements.shopGrid.querySelectorAll('[data-buy]').forEach((button) =>
    button.addEventListener('click', () => buyItem(button.dataset.buy))
  );

  const canDraw = balance >= HIDDEN_DRAW_COST;
  elements.hiddenDrawButton.disabled = !canDraw;
  elements.hiddenDrawButton.innerHTML = canDraw ? `${HIDDEN_DRAW_COST}P로 뽑기` : `${HIDDEN_DRAW_COST - balance}P 부족`;
}

function slotLabel(slot) {
  return ({ hat: '머리', hand: '손', neck: '목', chest: '가슴', back: '등' })[slot] || '소품';
}

function renderCollection() {
  const knownCards = [...LANDMARK_ITEMS, ...SHOP_CATALOG].map((item) => collectionCard(item, (state.inventoryCounts[item.id] || 0) > 0));
  const acquiredHidden = HIDDEN_GACHA_ITEMS.filter((item) => (state.inventoryCounts[item.id] || 0) > 0)
    .map((item) => collectionCard({ ...item, source: '히든 뽑기' }, true));
  const hiddenLockedCount = HIDDEN_GACHA_ITEMS.length - acquiredHidden.length;
  const secretCard = hiddenLockedCount > 0 ? `<article class="collection-item locked secret-locked">
    <span class="collection-art">?</span><div><small>히든 뽑기</small><strong>획득 전 비공개</strong></div>
  </article>` : '';
  const friendshipCard = (state.inventoryCounts[FRIENDSHIP_BADGE.id] || 0) > 0
    ? collectionCard({ ...FRIENDSHIP_BADGE, source: '히든 업적' }, true) : '';
  elements.collectionGrid.innerHTML = [...knownCards, ...acquiredHidden, secretCard, friendshipCard].join('');
}

function collectionCard(item, unlocked) {
  return `<article class="collection-item ${unlocked ? 'unlocked' : 'locked'}">
    <span class="collection-art">${unlocked ? escapeHTML(item.emoji) : '？'}</span>
    <div><small>${unlocked ? escapeHTML(item.source || '획득 아이템') : escapeHTML(item.source || '미획득')}</small><strong>${unlocked ? escapeHTML(item.name) : '미획득 아이템'}</strong></div>
  </article>`;
}

function missionProgress(mission) {
  const raw = mission.type === 'total' ? totalVisitCount() : uniqueVisitCount();
  return Math.min(raw, mission.target);
}

function renderMissions() {
  elements.missionList.innerHTML = MISSIONS.map((mission) => {
    const progress = missionProgress(mission);
    const complete = progress >= mission.target;
    const claimed = state.claimedMissions.includes(mission.id);
    return `<article class="mission-card ${complete ? 'complete' : ''}">
      <div class="mission-check">${claimed ? '✓' : complete ? '!' : progress}</div>
      <div class="mission-copy"><h3>${escapeHTML(mission.title)}</h3><p>${escapeHTML(mission.description)}</p><div class="mini-progress"><span style="width:${progress / mission.target * 100}%"></span></div><small>${progress}/${mission.target} · 보상 ${mission.reward}P</small></div>
      <button class="${complete && !claimed ? 'primary-button' : 'secondary-button'} compact" type="button" data-claim="${mission.id}" ${!complete || claimed ? 'disabled' : ''}>${claimed ? '수령 완료' : complete ? '보상 받기' : '진행 중'}</button>
    </article>`;
  }).join('');
  elements.missionList.querySelectorAll('[data-claim]').forEach((button) =>
    button.addEventListener('click', () => claimMission(button.dataset.claim))
  );

  const couponUnlocked = uniqueVisitCount() >= 3;
  elements.couponCard.classList.toggle('unlocked', couponUnlocked);
  elements.couponCode.textContent = couponUnlocked ? 'LOCAL10' : 'LOCKED';
}

function renderFriendCode() {
  elements.profileNameInput.value = state.profile.name;
  elements.myFriendCode.textContent = createFriendCode();
}

function createFriendCode() {
  const payload = {
    v: 1,
    id: state.profile.id,
    name: state.profile.name,
    equippedItems: getEquippedItems().map(({ id, name, emoji, slot }) => ({ id, name, emoji, slot }))
  };
  return `HGM1.${encodeBase64Url(JSON.stringify(payload))}`;
}

function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(text) {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseFriendCode(code) {
  const trimmed = code.trim();
  if (!trimmed.startsWith('HGM1.')) throw new Error('하곰 공유 코드 형식이 아닙니다.');
  const parsed = JSON.parse(decodeBase64Url(trimmed.slice(5)));
  const friend = normalizeFriendSnapshot(parsed);
  if (!validFriendSnapshot(friend)) throw new Error('친구 코드에 필요한 정보가 없습니다.');
  return friend;
}

function normalizeFriendSnapshot(value) {
  return {
    id: String(value?.id || '').slice(0, 80),
    name: String(value?.name || '친구의 하곰').slice(0, 18),
    equippedItems: Array.isArray(value?.equippedItems) ? value.equippedItems.slice(0, 5).map((item) => ({
      id: String(item?.id || '').slice(0, 80),
      name: String(item?.name || '아이템').slice(0, 30),
      emoji: String(item?.emoji || '•').slice(0, 8),
      slot: ['hat', 'hand', 'neck', 'chest', 'back'].includes(item?.slot) ? item.slot : 'hand'
    })) : []
  };
}

function validFriendSnapshot(friend) {
  return Boolean(friend && typeof friend.id === 'string' && friend.id && typeof friend.name === 'string' && Array.isArray(friend.equippedItems));
}

function renderFriends() {
  elements.friendCount.textContent = `${state.friends.length}명`;
  if (!state.friends.length) {
    elements.friendList.innerHTML = '<div class="empty-friends">아직 추가한 친구가 없습니다.<br />공유 코드를 교환하면 서로의 하곰 꾸미기를 볼 수 있습니다.</div>';
    return;
  }
  elements.friendList.innerHTML = state.friends.map((friend) => `<button class="friend-card" type="button" data-friend="${escapeHTML(friend.id)}">
    <div class="friend-preview">${characterMarkup('friend-size', friend.equippedItems)}</div>
    <div class="friend-card-copy"><small>FRIEND</small><h3>${escapeHTML(friend.name)}</h3><p>${friend.equippedItems.length ? escapeHTML(friend.equippedItems.map((item) => `${item.emoji} ${item.name}`).join(' · ')) : '착용한 아이템이 없습니다.'}</p><strong>꾸미기 자세히 보기 →</strong></div>
  </button>`).join('');
  elements.friendList.querySelectorAll('[data-friend]').forEach((button) =>
    button.addEventListener('click', () => openFriend(button.dataset.friend))
  );
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
  renderFriendCode();
  renderFriends();
}

function openVerify(id) {
  const landmark = LANDMARKS.find((item) => item.id === id);
  if (!landmark) return;
  activeLandmarkId = id;
  const visitNumber = (state.visitCounts[id] || 0) + 1;
  elements.verifyTitle.textContent = `${landmark.name} ${visitNumber}번째 방문`;
  elements.verifyDescription.textContent = `${landmark.radius}m 이내 GPS 또는 현장 QR 코드로 인증합니다. 반복 방문도 보상과 포인트가 지급됩니다.`;
  elements.verifyMessage.textContent = '';
  elements.qrCodeInput.value = '';
  elements.verifyDialog.showModal();
}

function completeVisit(id, method = 'GPS', { silent = false } = {}) {
  const landmark = LANDMARKS.find((item) => item.id === id);
  if (!landmark) return null;
  const reward = randomFrom(landmark.rewards);
  state.visitCounts[id] = (state.visitCounts[id] || 0) + 1;
  state.pointsEarned += landmark.points;
  addInventory(reward.id, 1);
  saveState();
  renderAll();
  if (elements.verifyDialog.open) elements.verifyDialog.close();
  if (!silent) {
    showReward({
      eyebrow: `${method} · ${state.visitCounts[id]}번째 방문`,
      art: reward.emoji,
      title: reward.name,
      description: `${landmark.name} 랜덤 보상 획득 · ${landmark.points}P 적립${state.inventoryCounts[reward.id] > 1 ? ` · 현재 ${state.inventoryCounts[reward.id]}개 보유` : ''}`
    });
  }
  return reward;
}

function verifyActiveByGps() {
  const landmark = LANDMARKS.find((item) => item.id === activeLandmarkId);
  if (!landmark) return;
  elements.verifyMessage.textContent = '위치를 확인하는 중입니다…';
  requestLocation(({ lat, lng, accuracy }) => {
    const distance = distanceMeters(lat, lng, landmark.lat, landmark.lng);
    const allowed = landmark.radius + Math.min(accuracy || 0, 200);
    if (distance <= allowed) completeVisit(landmark.id, 'GPS');
    else elements.verifyMessage.textContent = `현재 약 ${formatDistance(distance)} 떨어져 있습니다. 현장 반경 ${landmark.radius}m 안에서 다시 시도해 주세요.`;
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
    const messages = { 1: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.', 2: '현재 위치를 확인할 수 없습니다.', 3: '위치 확인 시간이 초과되었습니다.' };
    onError?.(messages[error.code] || '위치 확인 중 오류가 발생했습니다.');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

function toggleEquip(id) {
  const item = ITEM_BY_ID.get(id);
  if (!item || !(state.inventoryCounts[id] > 0)) return;
  state.equipped[item.slot] = state.equipped[item.slot] === id ? null : id;
  saveState();
  renderCharacter();
  renderInventory();
  renderFriendCode();
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
  addInventory(id, 1);
  saveState();
  renderAll();
  showReward({ eyebrow: 'POINT SHOP', art: item.emoji, title: item.name, description: `${item.price}P를 사용해 구매했습니다.` });
}

function drawHiddenItem() {
  if (availablePoints() < HIDDEN_DRAW_COST) {
    showToast('히든 뽑기에 필요한 포인트가 부족합니다.');
    return;
  }
  const item = weightedRandom(HIDDEN_GACHA_ITEMS);
  state.spentPoints += HIDDEN_DRAW_COST;
  addInventory(item.id, 1);
  saveState();
  renderAll();
  elements.hiddenDrawMessage.textContent = '히든 아이템을 획득했습니다. 다시 뽑으면 중복 아이템이 나올 수 있습니다.';
  showReward({
    eyebrow: 'HIDDEN DRAW', art: item.emoji, title: item.name,
    description: `히든 아이템 획득 · ${HIDDEN_DRAW_COST}P 사용${state.inventoryCounts[item.id] > 1 ? ` · 현재 ${state.inventoryCounts[item.id]}개 보유` : ''}`
  });
}

function claimMission(id) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || missionProgress(mission) < mission.target || state.claimedMissions.includes(id)) return;
  state.claimedMissions.push(id);
  state.pointsEarned += mission.reward;
  saveState();
  renderAll();
  showToast(`${mission.title} 보상 ${mission.reward}P를 받았습니다.`);
}

function saveProfileName() {
  const name = elements.profileNameInput.value.trim().slice(0, 18);
  if (!name) {
    showToast('하곰 이름을 입력해 주세요.');
    return;
  }
  state.profile.name = name;
  saveState();
  renderFriendCode();
  showToast('내 하곰 이름을 저장했습니다.');
}

async function copyFriendCode() {
  const code = createFriendCode();
  try {
    await navigator.clipboard.writeText(code);
    showToast('하곰 공유 코드를 복사했습니다.');
  } catch {
    window.prompt('아래 코드를 복사해 친구에게 보내세요.', code);
  }
}

function addFriendFromInput() {
  try {
    const friend = parseFriendCode(elements.friendCodeInput.value);
    if (friend.id === state.profile.id) throw new Error('내 코드는 친구로 추가할 수 없습니다.');
    upsertFriend(friend);
    elements.friendCodeInput.value = '';
    elements.friendMessage.textContent = `${friend.name}을(를) 친구 목록에 추가했습니다.`;
    elements.friendMessage.classList.add('success');
    afterFriendChanged();
  } catch (error) {
    elements.friendMessage.textContent = error.message || '친구 코드를 확인해 주세요.';
    elements.friendMessage.classList.remove('success');
  }
}

function upsertFriend(friend) {
  const normalized = normalizeFriendSnapshot(friend);
  const index = state.friends.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.friends[index] = normalized;
  else state.friends.push(normalized);
}

function addDemoFriends() {
  DEMO_FRIENDS.forEach(upsertFriend);
  elements.friendMessage.textContent = '발표용 친구 프로필을 추가했습니다.';
  elements.friendMessage.classList.add('success');
  afterFriendChanged();
}

function afterFriendChanged() {
  const badgeNew = state.friends.length >= 3 && !(state.inventoryCounts[FRIENDSHIP_BADGE.id] > 0);
  if (badgeNew) addInventory(FRIENDSHIP_BADGE.id, 1);
  saveState();
  renderAll();
  if (badgeNew) {
    showReward({ eyebrow: 'HIDDEN ACHIEVEMENT', art: FRIENDSHIP_BADGE.emoji, title: FRIENDSHIP_BADGE.name, description: '숨겨진 조건을 달성해 특별 아이템을 획득했습니다.' });
  }
}

function openFriend(id) {
  const friend = state.friends.find((item) => item.id === id);
  if (!friend) return;
  activeFriendId = id;
  elements.friendDialogTitle.textContent = friend.name;
  elements.friendDialogCharacter.innerHTML = characterMarkup('large', friend.equippedItems);
  elements.friendDialogItems.innerHTML = friend.equippedItems.length
    ? friend.equippedItems.map((item) => `<span>${escapeHTML(item.emoji)} ${escapeHTML(item.name)}</span>`).join('')
    : '<span>착용 아이템 없음</span>';
  elements.friendDialog.showModal();
}

function removeActiveFriend() {
  if (!activeFriendId) return;
  state.friends = state.friends.filter((friend) => friend.id !== activeFriendId);
  activeFriendId = null;
  saveState();
  renderFriends();
  elements.friendDialog.close();
  showToast('친구 목록에서 삭제했습니다.');
}

function showReward({ eyebrow, art, title, description }) {
  elements.resultEyebrow.textContent = eyebrow;
  elements.resultArt.textContent = art;
  elements.resultTitle.textContent = title;
  elements.resultDescription.textContent = description;
  elements.resultDialog.showModal();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2800);
}

function navigate(target) {
  if (!NAV_TARGETS.includes(target)) return;
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === target));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.target === target));
  if (location.hash !== `#${target}`) history.replaceState(null, '', `#${target}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function shareProgress() {
  const text = `동네 한 바퀴에서 하곰과 ${uniqueVisitCount()}곳을 탐험하고, 누적 ${totalVisitCount()}회 방문해 아이템 ${ownedItems().length}종을 모았어요! #동네한바퀴 #하곰 #경산탐험`;
  try {
    if (navigator.share) await navigator.share({ title: '하곰의 경산 탐험 기록', text, url: location.href });
    else {
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      showToast('공유 문구를 클립보드에 복사했습니다.');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('공유 기능을 사용할 수 없습니다.');
  }
}

function resetProgress() {
  if (!confirm('방문 기록, 아이템, 포인트, 친구 목록을 모두 초기화할까요?')) return;
  state = cloneDefaultState();
  state.profile.id = randomId();
  localStorage.removeItem(STORAGE_KEY);
  elements.locationTitle.textContent = '현재 위치를 확인해 주세요';
  elements.locationText.textContent = 'GPS 인증은 HTTPS 환경에서 작동합니다.';
  elements.locateButton.textContent = '내 위치 확인';
  elements.friendMessage.textContent = '';
  elements.hiddenDrawMessage.textContent = '결과는 무작위입니다. 이미 얻은 아이템이 다시 나올 수 있습니다.';
  saveState();
  renderAll();
  navigate('explore');
  showToast('진행 상황을 초기화했습니다.');
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.target)));
$('#resetButton').addEventListener('click', resetProgress);
$('#locateButton').addEventListener('click', () => requestLocation(() => showToast('현재 위치를 확인했습니다.'), showToast));
$('#gpsVerifyButton').addEventListener('click', verifyActiveByGps);
$('#demoVerifyButton').addEventListener('click', () => completeVisit(activeLandmarkId, '데모'));
$('#codeVerifyButton').addEventListener('click', () => {
  const landmark = LANDMARKS.find((item) => item.id === activeLandmarkId);
  const input = elements.qrCodeInput.value.trim().toUpperCase();
  if (landmark && input === landmark.qrCode.toUpperCase()) completeVisit(landmark.id, 'QR');
  else elements.verifyMessage.textContent = 'QR 코드 값이 일치하지 않습니다.';
});
$('#hiddenDrawButton').addEventListener('click', drawHiddenItem);
$('#demoAllButton').addEventListener('click', () => {
  LANDMARKS.forEach((landmark) => completeVisit(landmark.id, '데모', { silent: true }));
  showToast('모든 장소를 1회씩 방문하고 랜덤 보상을 받았습니다.');
});
$('#shareButton').addEventListener('click', shareProgress);
$('#saveProfileNameButton').addEventListener('click', saveProfileName);
$('#copyFriendCodeButton').addEventListener('click', copyFriendCode);
$('#addFriendButton').addEventListener('click', addFriendFromInput);
$('#addDemoFriendsButton').addEventListener('click', addDemoFriends);
$('#removeFriendButton').addEventListener('click', removeActiveFriend);
elements.friendCodeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); addFriendFromInput(); }
});
elements.profileNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); saveProfileName(); }
});
window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}

saveState();
renderAll();
const initialTarget = location.hash.slice(1);
if (NAV_TARGETS.includes(initialTarget)) navigate(initialTarget);
