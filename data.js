export const LANDMARKS = [
  {
    id: 'yu',
    name: '영남대학교',
    shortName: '영남대',
    category: '캠퍼스',
    description: '대학도시 경산을 상징하는 캠퍼스 탐험지',
    story: '캠퍼스를 걸으며 경산의 청년 문화를 발견해 보세요.',
    lat: 35.8359,
    lng: 128.7530,
    radius: 500,
    qrCode: 'YU2026',
    reward: { id: 'cap', name: '학사모', emoji: '🎓', slot: 'hat' },
    points: 100
  },
  {
    id: 'nammaeji',
    name: '남매지',
    shortName: '남매지',
    category: '자연',
    description: '도심 속 수변 산책로를 따라 걷는 휴식 코스',
    story: '호수 주변을 천천히 걸으며 오늘의 풍경을 기록해 보세요.',
    lat: 35.8188,
    lng: 128.7411,
    radius: 500,
    qrCode: 'LAKE2026',
    reward: { id: 'lotus', name: '연꽃 머리핀', emoji: '🪷', slot: 'hat' },
    points: 120
  },
  {
    id: 'market',
    name: '경산시장',
    shortName: '경산시장',
    category: '상권',
    description: '지역의 생활과 먹거리를 만나는 전통시장',
    story: '시장 골목을 둘러보고 지역 상점의 이야기를 찾아보세요.',
    lat: 35.8207,
    lng: 128.7358,
    radius: 500,
    qrCode: 'MARKET26',
    reward: { id: 'basket', name: '시장 장바구니', emoji: '🧺', slot: 'hand' },
    points: 150
  },
  {
    id: 'samsung',
    name: '삼성현역사문화공원',
    shortName: '삼성현공원',
    category: '역사',
    description: '경산의 세 성현을 콘텐츠로 만나는 역사공원',
    story: '지역 인물과 역사를 알아보고 지혜의 기록을 수집해 보세요.',
    lat: 35.7816,
    lng: 128.8163,
    radius: 600,
    qrCode: 'HISTORY3',
    reward: { id: 'book', name: '지혜의 책', emoji: '📕', slot: 'hand' },
    points: 180
  },
  {
    id: 'bangokji',
    name: '반곡지',
    shortName: '반곡지',
    category: '자연',
    description: '왕버들과 수면 풍경으로 알려진 사진 명소',
    story: '물가의 풍경을 사진으로 남기고 나만의 시선을 발견해 보세요.',
    lat: 35.7509,
    lng: 128.8350,
    radius: 600,
    qrCode: 'PHOTO26',
    reward: { id: 'camera', name: '탐험 카메라', emoji: '📷', slot: 'neck' },
    points: 180
  },
  {
    id: 'gatbawi',
    name: '팔공산 갓바위',
    shortName: '갓바위',
    category: '문화',
    description: '산길과 문화유산을 함께 경험하는 경산 대표 명소',
    story: '안전하게 산길을 걸으며 지역의 문화유산을 만나보세요.',
    lat: 35.9710,
    lng: 128.7438,
    radius: 800,
    qrCode: 'GATBAWI',
    reward: { id: 'badge', name: '소원 배지', emoji: '🏅', slot: 'chest' },
    points: 250
  }
];

export const MISSIONS = [
  { id: 'first', title: '첫 발자국', description: '랜드마크 1곳 방문하기', target: 1, reward: 50 },
  { id: 'three', title: '경산 초보 탐험가', description: '서로 다른 랜드마크 3곳 방문하기', target: 3, reward: 150 },
  { id: 'all', title: '경산 한 바퀴', description: '등록된 랜드마크 모두 방문하기', target: LANDMARKS.length, reward: 500 }
];

export const CATEGORIES = ['전체', ...new Set(LANDMARKS.map((item) => item.category))];
