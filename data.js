export const CHARACTER = {
  name: '하곰',
  image: './assets/hagom.png',
  fallbackImage: './assets/hagom-placeholder.svg'
};

export const LANDMARKS = [
  {
    id: 'yu', name: '영남대학교', shortName: '영남대', category: '캠퍼스',
    description: '대학도시 경산을 상징하는 캠퍼스 탐험지',
    story: '캠퍼스를 걸으며 경산의 청년 문화를 발견해 보세요.',
    lat: 35.8359, lng: 128.7530, radius: 500, qrCode: 'YU2026', points: 100,
    rewards: [
      { id: 'yu-cap', name: '영대 학사모', emoji: '🎓', slot: 'hat' },
      { id: 'yu-jacket', name: '캠퍼스 점퍼', emoji: '🧥', slot: 'chest' },
      { id: 'yu-notebook', name: '탐험 노트', emoji: '📓', slot: 'hand' }
    ]
  },
  {
    id: 'nammaeji', name: '남매지', shortName: '남매지', category: '자연',
    description: '도심 속 수변 산책로를 따라 걷는 휴식 코스',
    story: '호수 주변을 천천히 걸으며 오늘의 풍경을 기록해 보세요.',
    lat: 35.8188, lng: 128.7411, radius: 500, qrCode: 'LAKE2026', points: 120,
    rewards: [
      { id: 'lake-lotus', name: '연꽃 머리핀', emoji: '🪷', slot: 'hat' },
      { id: 'lake-duck', name: '오리 인형', emoji: '🦆', slot: 'hand' },
      { id: 'lake-ribbon', name: '물빛 리본', emoji: '🎀', slot: 'neck' }
    ]
  },
  {
    id: 'market', name: '경산시장', shortName: '경산시장', category: '상권',
    description: '지역의 생활과 먹거리를 만나는 전통시장',
    story: '시장 골목을 둘러보고 지역 상점의 이야기를 찾아보세요.',
    lat: 35.8207, lng: 128.7358, radius: 500, qrCode: 'MARKET26', points: 150,
    rewards: [
      { id: 'market-basket', name: '시장 장바구니', emoji: '🧺', slot: 'hand' },
      { id: 'market-jujube', name: '경산 대추', emoji: '🍎', slot: 'hand' },
      { id: 'market-apron', name: '시장 앞치마', emoji: '👕', slot: 'chest' }
    ]
  },
  {
    id: 'samsung', name: '삼성현역사문화공원', shortName: '삼성현공원', category: '역사',
    description: '경산의 세 성현을 콘텐츠로 만나는 역사공원',
    story: '지역 인물과 역사를 알아보고 지혜의 기록을 수집해 보세요.',
    lat: 35.7816, lng: 128.8163, radius: 600, qrCode: 'HISTORY3', points: 180,
    rewards: [
      { id: 'history-book', name: '지혜의 책', emoji: '📕', slot: 'hand' },
      { id: 'history-brush', name: '선비 붓', emoji: '🖌️', slot: 'hand' },
      { id: 'history-hat', name: '역사 탐험 갓', emoji: '🎩', slot: 'hat' }
    ]
  },
  {
    id: 'bangokji', name: '반곡지', shortName: '반곡지', category: '자연',
    description: '왕버들과 수면 풍경으로 알려진 사진 명소',
    story: '물가의 풍경을 사진으로 남기고 나만의 시선을 발견해 보세요.',
    lat: 35.7509, lng: 128.8350, radius: 600, qrCode: 'PHOTO26', points: 180,
    rewards: [
      { id: 'bangok-camera', name: '탐험 카메라', emoji: '📷', slot: 'neck' },
      { id: 'bangok-leaf', name: '왕버들 잎', emoji: '🍃', slot: 'hat' },
      { id: 'bangok-picnic', name: '피크닉 가방', emoji: '🧳', slot: 'hand' }
    ]
  },
  {
    id: 'gatbawi', name: '팔공산 갓바위', shortName: '갓바위', category: '문화',
    description: '산길과 문화유산을 함께 경험하는 경산 대표 명소',
    story: '안전하게 산길을 걸으며 지역의 문화유산을 만나보세요.',
    lat: 35.9710, lng: 128.7438, radius: 800, qrCode: 'GATBAWI', points: 250,
    rewards: [
      { id: 'gatbawi-wish', name: '소원 뱃지', emoji: '🏅', slot: 'chest' },
      { id: 'gatbawi-hiking', name: '등산 모자', emoji: '🥾', slot: 'hat' },
      { id: 'gatbawi-lantern', name: '산길 등불', emoji: '🏮', slot: 'hand' }
    ]
  }
];

export const MISSIONS = [
  { id: 'first', title: '첫 발자국', description: '랜드마크 1회 방문하기', type: 'total', target: 1, reward: 50 },
  { id: 'three', title: '경산 초보 탐험가', description: '서로 다른 랜드마크 3곳 방문하기', type: 'unique', target: 3, reward: 150 },
  { id: 'repeat', title: '다시 찾은 동네', description: '누적 방문 8회 달성하기', type: 'total', target: 8, reward: 250 },
  { id: 'all', title: '경산 한 바퀴', description: '등록된 랜드마크 모두 방문하기', type: 'unique', target: LANDMARKS.length, reward: 500 }
];

export const SHOP_ITEMS = [
  { id: 'red-scarf', name: '빨간 목도리', emoji: '🧣', slot: 'neck', price: 180, description: '하곰의 포인트 컬러' },
  { id: 'green-cap', name: '초록 탐험 모자', emoji: '🧢', slot: 'hat', price: 220, description: '동네 탐험에 어울리는 모자' },
  { id: 'heart-balloon', name: '하트 풍선', emoji: '🎈', slot: 'hand', price: 260, description: '탐험 사진을 특별하게 만드는 소품' },
  { id: 'clover-badge', name: '행운 클로버', emoji: '🍀', slot: 'chest', price: 160, description: '오늘의 탐험에 행운을 더하는 뱃지' },
  { id: 'gold-crown', name: '황금 왕관', emoji: '👑', slot: 'hat', price: 420, description: '포인트를 모은 탐험가의 상징' },
  { id: 'travel-bag', name: '여행 가방', emoji: '🎒', slot: 'hand', price: 300, description: '다음 동네로 떠날 준비' }
];

export const HIDDEN_DRAW_COST = 250;

// 잠금 상태에서는 이름·이미지·개수를 화면에 노출하지 않습니다.
export const HIDDEN_GACHA_ITEMS = [
  { id: 'hidden-moon', name: '달빛 후드', emoji: '🌙', slot: 'hat', weight: 36 },
  { id: 'hidden-star', name: '별빛 지팡이', emoji: '✨', slot: 'hand', weight: 30 },
  { id: 'hidden-aurora', name: '오로라 목도리', emoji: '🌌', slot: 'neck', weight: 22 },
  { id: 'hidden-crown', name: '밤하늘 왕관', emoji: '💫', slot: 'hat', weight: 12 }
];

export const FRIENDSHIP_BADGE = {
  id: 'friendship-badge', name: '우정 뱃지', emoji: '🤝', slot: 'chest', hiddenAchievement: true
};

export const DEMO_FRIENDS = [
  {
    id: 'demo-bora', name: '보라의 하곰',
    equippedItems: [
      { id: 'green-cap', name: '초록 탐험 모자', emoji: '🧢', slot: 'hat' },
      { id: 'red-scarf', name: '빨간 목도리', emoji: '🧣', slot: 'neck' }
    ]
  },
  {
    id: 'demo-mimo', name: '미모의 하곰',
    equippedItems: [
      { id: 'lake-lotus', name: '연꽃 머리핀', emoji: '🪷', slot: 'hat' },
      { id: 'heart-balloon', name: '하트 풍선', emoji: '🎈', slot: 'hand' }
    ]
  },
  {
    id: 'demo-dodo', name: '도도의 하곰',
    equippedItems: [
      { id: 'gold-crown', name: '황금 왕관', emoji: '👑', slot: 'hat' },
      { id: 'clover-badge', name: '행운 클로버', emoji: '🍀', slot: 'chest' }
    ]
  }
];

export const CATEGORIES = ['전체', ...new Set(LANDMARKS.map((item) => item.category))];
