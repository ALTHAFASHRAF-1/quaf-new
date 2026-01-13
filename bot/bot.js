// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      if (mobileMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
        mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        document.body.style.overflow = '';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  }
});

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  mobileMenu.classList.remove('active');
  document.body.style.overflow = '';
  if (mobileMenuBtn) {
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
  }
}

function toggleMobileSubMenu(element) {
  element.classList.toggle('active');
  const subMenu = element.nextElementSibling;
  if (subMenu && subMenu.classList.contains('mobile-sub-menu')) {
    subMenu.classList.toggle('show');
  }
}

// Rest of your existing JavaScript code continues here...


setTimeout(() => {
      document.getElementById("intro").style.display = "none";
      document.getElementById("main").style.display = "block";
    }, 5000); // Adjust time based on your video length
    
// Section management
function showSection(sectionName) {
  // List all sections and buttons
  const sections = [
    "homeSection",
    "quranSection",
    "translationSection",
    "exegesisSection",
    "documentsSection"
  ];
  const buttons = [
    "homeBtn",
    "quranBtn",
    "translationBtn",
    "exegesisBtn",
    "documentsBtn"
  ];

  // Hide all sections
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Remove active class from all buttons
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  // Handle section logic
  switch (sectionName) {
    case "home":
      document.getElementById("homeSection").classList.remove("hidden");
      document.getElementById("homeBtn").classList.add("active");
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
      document.body.style.overflow = "auto";
      break;

    case "quran":
      document.getElementById("quranSection").classList.remove("hidden");
      document.getElementById("quranBtn").classList.add("active");
      document.documentElement.setAttribute("dir", "ltr"); // Quran is Arabic
      document.documentElement.setAttribute("lang", "ar");
      document.body.style.overflow = "auto";

      if (!window.quranLoaded) {
        loadQuranData();
      }
      break;

    case "translation":
      document.getElementById("translationSection").classList.remove("hidden");
      document.getElementById("translationBtn").classList.add("active");
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
      document.body.style.overflow = "auto";

      if (!window.quranLoaded) {
        loadQuranData().then(() => {
          if (!window.translationInitialized) {
            initializeTranslationSection();
            window.translationInitialized = true;
          }
        });
      } else if (!window.translationInitialized) {
        initializeTranslationSection();
        window.translationInitialized = true;
      }
      break;

    case "exegesis":
      document.getElementById("exegesisSection").classList.remove("hidden");
      document.getElementById("exegesisBtn").classList.add("active");
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
      document.body.style.overflow = "auto";

      if (!window.quranLoaded) {
        loadQuranData().then(() => {
          if (!window.exegesisInitialized) {
            initializeExegesisSection();
            window.exegesisInitialized = true;
          }
        });
      } else if (!window.exegesisInitialized) {
        initializeExegesisSection();
        window.exegesisInitialized = true;
      }
      break;

    case "documents":
      document.getElementById("documentsSection").classList.remove("hidden");
      document.getElementById("documentsBtn").classList.add("active");
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
      document.body.style.overflow = "auto";

      if (!window.documentsInitialized) {
        initializeDocumentsSection();
        window.documentsInitialized = true;
      }
      break;

    default:
      console.warn("Unknown section:", sectionName);
  }

  // Keep navigation menu fixed
  const navMenu = document.querySelector(".navigation-menu");
  if (navMenu) {
    navMenu.style.display = "flex";
    navMenu.style.zIndex = "1000";
    navMenu.style.position = "fixed";
  }
}

// Audio Control
const speakerControl = document.getElementById('speakerControl');
const speakerIcon = document.getElementById('speakerIcon');
const backgroundAudio = document.getElementById('backgroundAudio');
let isPlaying = false;

speakerControl.addEventListener('click', function() {
if (isPlaying) {
backgroundAudio.pause();
speakerIcon.className = 'fas fa-volume-mute';
isPlaying = false;
} else {
backgroundAudio.play().catch(e => console.log('Audio play failed:', e));
speakerIcon.className = 'fas fa-volume-up';
isPlaying = true;
}
});



// Scroll animations for home section
const observerOptions = {
threshold: 0.1,
rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add('animate');
}
});
}, observerOptions);

// Observe GIF showcase
const gifShowcase = document.getElementById('gifShowcase');
if (gifShowcase) observer.observe(gifShowcase);

// Observe feature cards
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
card.style.transitionDelay = `${index * 0.1}s`;
observer.observe(card);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function (e) {
e.preventDefault();
const target = document.querySelector(this.getAttribute('href'));
if (target) {
target.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
}
});
});

// Add parallax effect to floating dots
window.addEventListener('scroll', () => {
const scrolled = window.pageYOffset;
const dots = document.querySelectorAll('.dot');

dots.forEach((dot, index) => {
const speed = 0.5 + (index * 0.1);
dot.style.transform = `translateY(${scrolled * speed}px)`;
});
});

// QURAN FUNCTIONALITY
let quranData = {};
let chapterNames = {
1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة", 6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر", 16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان", 26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر", 36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية", 46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن", 56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق", 66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة", 76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج", 86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين", 96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل", 106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

// Juz data with starting chapter and verse for each Juz
let juzData = {
1: { name: "الجزء الأول", startChapter: 1, startVerse: 1 },
2: { name: "الجزء الثاني", startChapter: 2, startVerse: 142 },
3: { name: "الجزء الثالث", startChapter: 2, startVerse: 253 },
4: { name: "الجزء الرابع", startChapter: 3, startVerse: 93 },
5: { name: "الجزء الخامس", startChapter: 4, startVerse: 24 },
6: { name: "الجزء السادس", startChapter: 4, startVerse: 148 },
7: { name: "الجزء السابع", startChapter: 5, startVerse: 82 },
8: { name: "الجزء الثامن", startChapter: 6, startVerse: 111 },
9: { name: "الجزء التاسع", startChapter: 7, startVerse: 88 },
10: { name: "الجزء العاشر", startChapter: 8, startVerse: 41 },
11: { name: "الجزء الحادي عشر", startChapter: 9, startVerse: 93 },
12: { name: "الجزء الثاني عشر", startChapter: 11, startVerse: 6 },
13: { name: "الجزء الثالث عشر", startChapter: 12, startVerse: 53 },
14: { name: "الجزء الرابع عشر", startChapter: 15, startVerse: 1 },
15: { name: "الجزء الخامس عشر", startChapter: 17, startVerse: 1 },
16: { name: "الجزء السادس عشر", startChapter: 18, startVerse: 75 },
17: { name: "الجزء السابع عشر", startChapter: 21, startVerse: 1 },
18: { name: "الجزء الثامن عشر", startChapter: 23, startVerse: 1 },
19: { name: "الجزء التاسع عشر", startChapter: 25, startVerse: 21 },
20: { name: "الجزء العشرون", startChapter: 27, startVerse: 56 },
21: { name: "الجزء الحادي والعشرون", startChapter: 29, startVerse: 46 },
22: { name: "الجزء الثاني والعشرون", startChapter: 33, startVerse: 31 },
23: { name: "الجزء الثالث والعشرون", startChapter: 36, startVerse: 28 },
24: { name: "الجزء الرابع والعشرون", startChapter: 39, startVerse: 32 },
25: { name: "الجزء الخامس والعشرون", startChapter: 41, startVerse: 47 },
26: { name: "الجزء السادس والعشرون", startChapter: 46, startVerse: 1 },
27: { name: "الجزء السابع والعشرون", startChapter: 51, startVerse: 31 },
28: { name: "الجزء الثامن والعشرون", startChapter: 58, startVerse: 1 },
29: { name: "الجزء التاسع والعشرون", startChapter: 67, startVerse: 1 },
30: { name: "الجزء الثلاثون", startChapter: 78, startVerse: 1 }
};

// Complete Quran page mapping (604 pages)
let pageData = {
// Your existing data
1: { startChapter: 1, startVerse: 1 },
2: { startChapter: 2, startVerse: 1 },
3: { startChapter: 2, startVerse: 6 },
4: { startChapter: 2, startVerse: 17 },
5: { startChapter: 2, startVerse: 25 },
6: { startChapter: 2, startVerse: 30 },
7: { startChapter: 2, startVerse: 38 },
8: { startChapter: 2, startVerse: 49 },
9: { startChapter: 2, startVerse: 58 },
10: { startChapter: 2, startVerse: 62 },

// Extended to cover the entire Quran
11: { startChapter: 2, startVerse: 70 },
12: { startChapter: 2, startVerse: 80 },
13: { startChapter: 2, startVerse: 90 },
14: { startChapter: 2, startVerse: 100 },
15: { startChapter: 2, startVerse: 110 },
16: { startChapter: 2, startVerse: 120 },
17: { startChapter: 2, startVerse: 130 },
18: { startChapter: 2, startVerse: 140 },
19: { startChapter: 2, startVerse: 150 },
20: { startChapter: 2, startVerse: 160 },
21: { startChapter: 2, startVerse: 170 },
22: { startChapter: 2, startVerse: 180 },
23: { startChapter: 2, startVerse: 190 },
24: { startChapter: 2, startVerse: 200 },
25: { startChapter: 2, startVerse: 210 },
26: { startChapter: 2, startVerse: 220 },
27: { startChapter: 2, startVerse: 230 },
28: { startChapter: 2, startVerse: 240 },
29: { startChapter: 2, startVerse: 250 },
30: { startChapter: 2, startVerse: 260 },
31: { startChapter: 2, startVerse: 270 },
32: { startChapter: 2, startVerse: 280 },
33: { startChapter: 3, startVerse: 1 },   // Al Imran (200 verses)
34: { startChapter: 3, startVerse: 10 },
35: { startChapter: 3, startVerse: 20 },
36: { startChapter: 3, startVerse: 30 },
37: { startChapter: 3, startVerse: 40 },
38: { startChapter: 3, startVerse: 50 },
39: { startChapter: 3, startVerse: 60 },
40: { startChapter: 3, startVerse: 70 },
41: { startChapter: 3, startVerse: 80 },
42: { startChapter: 3, startVerse: 90 },
43: { startChapter: 3, startVerse: 100 },
44: { startChapter: 3, startVerse: 110 },
45: { startChapter: 3, startVerse: 120 },
46: { startChapter: 3, startVerse: 130 },
47: { startChapter: 3, startVerse: 140 },
48: { startChapter: 3, startVerse: 150 },
49: { startChapter: 3, startVerse: 160 },
50: { startChapter: 3, startVerse: 170 },
51: { startChapter: 3, startVerse: 180 },
52: { startChapter: 3, startVerse: 190 },
53: { startChapter: 4, startVerse: 1 },   // An-Nisa (176 verses)
54: { startChapter: 4, startVerse: 10 },
55: { startChapter: 4, startVerse: 20 },
56: { startChapter: 4, startVerse: 30 },
57: { startChapter: 4, startVerse: 40 },
58: { startChapter: 4, startVerse: 50 },
59: { startChapter: 4, startVerse: 60 },
60: { startChapter: 4, startVerse: 70 },
61: { startChapter: 4, startVerse: 80 },
62: { startChapter: 4, startVerse: 90 },
63: { startChapter: 4, startVerse: 100 },
64: { startChapter: 4, startVerse: 110 },
65: { startChapter: 4, startVerse: 120 },
66: { startChapter: 4, startVerse: 130 },
67: { startChapter: 4, startVerse: 140 },
68: { startChapter: 4, startVerse: 150 },
69: { startChapter: 4, startVerse: 160 },
70: { startChapter: 4, startVerse: 170 },
71: { startChapter: 5, startVerse: 1 },   // Al-Maeda (120 verses)
72: { startChapter: 5, startVerse: 10 },
73: { startChapter: 5, startVerse: 20 },
74: { startChapter: 5, startVerse: 30 },
75: { startChapter: 5, startVerse: 40 },
76: { startChapter: 5, startVerse: 50 },
77: { startChapter: 5, startVerse: 60 },
78: { startChapter: 5, startVerse: 70 },
79: { startChapter: 5, startVerse: 80 },
80: { startChapter: 5, startVerse: 90 },
81: { startChapter: 5, startVerse: 100 },
82: { startChapter: 5, startVerse: 110 },
83: { startChapter: 6, startVerse: 1 },   // Al-Anaam (165 verses)
84: { startChapter: 6, startVerse: 10 },
85: { startChapter: 6, startVerse: 20 },
86: { startChapter: 6, startVerse: 30 },
87: { startChapter: 6, startVerse: 40 },
88: { startChapter: 6, startVerse: 50 },
89: { startChapter: 6, startVerse: 60 },
90: { startChapter: 6, startVerse: 70 },
91: { startChapter: 6, startVerse: 80 },
92: { startChapter: 6, startVerse: 90 },
93: { startChapter: 6, startVerse: 100 },
94: { startChapter: 6, startVerse: 110 },
95: { startChapter: 6, startVerse: 120 },
96: { startChapter: 6, startVerse: 130 },
97: { startChapter: 6, startVerse: 140 },
98: { startChapter: 6, startVerse: 150 },
99: { startChapter: 6, startVerse: 160 },
100: { startChapter: 7, startVerse: 1 },  // Al-Araf (206 verses)
101: { startChapter: 7, startVerse: 12 },
102: { startChapter: 7, startVerse: 23 },
103: { startChapter: 7, startVerse: 31 },
104: { startChapter: 7, startVerse: 40 },
105: { startChapter: 7, startVerse: 48 },
106: { startChapter: 7, startVerse: 56 },
107: { startChapter: 7, startVerse: 64 },
108: { startChapter: 7, startVerse: 73 },
109: { startChapter: 7, startVerse: 82 },
110: { startChapter: 7, startVerse: 88 },
111: { startChapter: 7, startVerse: 96 },
112: { startChapter: 7, startVerse: 105 },
113: { startChapter: 7, startVerse: 121 },
114: { startChapter: 7, startVerse: 131 },
115: { startChapter: 7, startVerse: 138 },
116: { startChapter: 7, startVerse: 144 },
117: { startChapter: 7, startVerse: 150 },
118: { startChapter: 7, startVerse: 156 },
119: { startChapter: 7, startVerse: 160 },
120: { startChapter: 7, startVerse: 164 },
121: { startChapter: 7, startVerse: 171 },
122: { startChapter: 7, startVerse: 179 },
123: { startChapter: 7, startVerse: 188 },
124: { startChapter: 7, startVerse: 196 },
125: { startChapter: 8, startVerse: 1 },   // Al-Anfal (75 verses)
126: { startChapter: 8, startVerse: 9 },
127: { startChapter: 8, startVerse: 17 },
128: { startChapter: 8, startVerse: 26 },
129: { startChapter: 8, startVerse: 34 },
130: { startChapter: 8, startVerse: 41 },
131: { startChapter: 8, startVerse: 48 },
132: { startChapter: 8, startVerse: 56 },
133: { startChapter: 8, startVerse: 64 },
134: { startChapter: 8, startVerse: 70 },
135: { startChapter: 9, startVerse: 1 },   // At-Tawbah (129 verses)
136: { startChapter: 9, startVerse: 7 },
137: { startChapter: 9, startVerse: 14 },
138: { startChapter: 9, startVerse: 21 },
139: { startChapter: 9, startVerse: 27 },
140: { startChapter: 9, startVerse: 32 },
141: { startChapter: 9, startVerse: 37 },
142: { startChapter: 9, startVerse: 41 },
143: { startChapter: 9, startVerse: 48 },
144: { startChapter: 9, startVerse: 54 },
145: { startChapter: 9, startVerse: 60 },
146: { startChapter: 9, startVerse: 65 },
147: { startChapter: 9, startVerse: 71 },
148: { startChapter: 9, startVerse: 77 },
149: { startChapter: 9, startVerse: 82 },
150: { startChapter: 9, startVerse: 87 },
151: { startChapter: 9, startVerse: 92 },
152: { startChapter: 9, startVerse: 100 },
153: { startChapter: 9, startVerse: 107 },
154: { startChapter: 9, startVerse: 112 },
155: { startChapter: 9, startVerse: 118 },
156: { startChapter: 9, startVerse: 123 },
157: { startChapter: 10, startVerse: 1 },  // Yunus (109 verses)
158: { startChapter: 10, startVerse: 7 },
159: { startChapter: 10, startVerse: 15 },
160: { startChapter: 10, startVerse: 21 },
161: { startChapter: 10, startVerse: 26 },
162: { startChapter: 10, startVerse: 34 },
163: { startChapter: 10, startVerse: 43 },
164: { startChapter: 10, startVerse: 54 },
165: { startChapter: 10, startVerse: 62 },
166: { startChapter: 10, startVerse: 71 },
167: { startChapter: 10, startVerse: 79 },
168: { startChapter: 10, startVerse: 89 },
169: { startChapter: 10, startVerse: 98 },
170: { startChapter: 11, startVerse: 1 },  // Hud (123 verses)
171: { startChapter: 11, startVerse: 6 },
172: { startChapter: 11, startVerse: 12 },
173: { startChapter: 11, startVerse: 20 },
174: { startChapter: 11, startVerse: 27 },
175: { startChapter: 11, startVerse: 35 },
176: { startChapter: 11, startVerse: 43 },
177: { startChapter: 11, startVerse: 52 },
178: { startChapter: 11, startVerse: 61 },
179: { startChapter: 11, startVerse: 69 },
180: { startChapter: 11, startVerse: 77 },
181: { startChapter: 11, startVerse: 84 },
182: { startChapter: 11, startVerse: 92 },
183: { startChapter: 11, startVerse: 100 },
184: { startChapter: 11, startVerse: 109 },
185: { startChapter: 11, startVerse: 116 },
186: { startChapter: 12, startVerse: 1 },  // Yusuf (111 verses)
187: { startChapter: 12, startVerse: 7 },
188: { startChapter: 12, startVerse: 15 },
189: { startChapter: 12, startVerse: 23 },
190: { startChapter: 12, startVerse: 31 },
191: { startChapter: 12, startVerse: 38 },
192: { startChapter: 12, startVerse: 44 },
193: { startChapter: 12, startVerse: 53 },
194: { startChapter: 12, startVerse: 64 },
195: { startChapter: 12, startVerse: 70 },
196: { startChapter: 12, startVerse: 76 },
197: { startChapter: 12, startVerse: 82 },
198: { startChapter: 12, startVerse: 87 },
199: { startChapter: 12, startVerse: 93 },
200: { startChapter: 12, startVerse: 101 },
201: { startChapter: 13, startVerse: 1 },  // Ar-Ra'd (43 verses)
202: { startChapter: 13, startVerse: 6 },
203: { startChapter: 13, startVerse: 14 },
204: { startChapter: 13, startVerse: 19 },
205: { startChapter: 13, startVerse: 29 },
206: { startChapter: 13, startVerse: 35 },
207: { startChapter: 14, startVerse: 1 },  // Ibrahim (52 verses)
208: { startChapter: 14, startVerse: 6 },
209: { startChapter: 14, startVerse: 11 },
210: { startChapter: 14, startVerse: 18 },
211: { startChapter: 14, startVerse: 25 },
212: { startChapter: 14, startVerse: 31 },
213: { startChapter: 14, startVerse: 35 },
214: { startChapter: 14, startVerse: 40 },
215: { startChapter: 14, startVerse: 46 },
216: { startChapter: 15, startVerse: 1 },  // Al-Hijr (99 verses)
217: { startChapter: 15, startVerse: 16 },
218: { startChapter: 15, startVerse: 32 },
219: { startChapter: 15, startVerse: 52 },
220: { startChapter: 15, startVerse: 71 },
221: { startChapter: 15, startVerse: 91 },
222: { startChapter: 16, startVerse: 1 },  // An-Nahl (128 verses)
223: { startChapter: 16, startVerse: 7 },
224: { startChapter: 16, startVerse: 15 },
225: { startChapter: 16, startVerse: 22 },
226: { startChapter: 16, startVerse: 28 },
227: { startChapter: 16, startVerse: 35 },
228: { startChapter: 16, startVerse: 41 },
229: { startChapter: 16, startVerse: 50 },
230: { startChapter: 16, startVerse: 58 },
231: { startChapter: 16, startVerse: 65 },
232: { startChapter: 16, startVerse: 72 },
233: { startChapter: 16, startVerse: 79 },
234: { startChapter: 16, startVerse: 88 },
235: { startChapter: 16, startVerse: 94 },
236: { startChapter: 16, startVerse: 103 },
237: { startChapter: 16, startVerse: 111 },
238: { startChapter: 16, startVerse: 119 },
239: { startChapter: 17, startVerse: 1 },  // Al-Isra (111 verses)
240: { startChapter: 17, startVerse: 8 },
241: { startChapter: 17, startVerse: 18 },
242: { startChapter: 17, startVerse: 28 },
243: { startChapter: 17, startVerse: 39 },
244: { startChapter: 17, startVerse: 50 },
245: { startChapter: 17, startVerse: 59 },
246: { startChapter: 17, startVerse: 67 },
247: { startChapter: 17, startVerse: 76 },
248: { startChapter: 17, startVerse: 87 },
249: { startChapter: 17, startVerse: 97 },
250: { startChapter: 17, startVerse: 105 },
251: { startChapter: 18, startVerse: 1 },  // Al-Kahf (110 verses)
252: { startChapter: 18, startVerse: 8 },
253: { startChapter: 18, startVerse: 17 },
254: { startChapter: 18, startVerse: 23 },
255: { startChapter: 18, startVerse: 32 },
256: { startChapter: 18, startVerse: 46 },
257: { startChapter: 18, startVerse: 54 },
258: { startChapter: 18, startVerse: 62 },
259: { startChapter: 18, startVerse: 75 },
260: { startChapter: 18, startVerse: 84 },
261: { startChapter: 18, startVerse: 98 },
262: { startChapter: 19, startVerse: 1 },  // Maryam (98 verses)
263: { startChapter: 19, startVerse: 12 },
264: { startChapter: 19, startVerse: 25 },
265: { startChapter: 19, startVerse: 39 },
266: { startChapter: 19, startVerse: 52 },
267: { startChapter: 19, startVerse: 65 },
268: { startChapter: 19, startVerse: 77 },
269: { startChapter: 19, startVerse: 96 },
270: { startChapter: 20, startVerse: 1 },  // Ta-Ha (135 verses)
271: { startChapter: 20, startVerse: 13 },
272: { startChapter: 20, startVerse: 38 },
273: { startChapter: 20, startVerse: 52 },
274: { startChapter: 20, startVerse: 65 },
275: { startChapter: 20, startVerse: 77 },
276: { startChapter: 20, startVerse: 90 },
277: { startChapter: 20, startVerse: 99 },
278: { startChapter: 20, startVerse: 114 },
279: { startChapter: 20, startVerse: 126 },
280: { startChapter: 21, startVerse: 1 },  // Al-Anbiya (112 verses)
281: { startChapter: 21, startVerse: 11 },
282: { startChapter: 21, startVerse: 25 },
283: { startChapter: 21, startVerse: 36 },
284: { startChapter: 21, startVerse: 45 },
285: { startChapter: 21, startVerse: 58 },
286: { startChapter: 21, startVerse: 73 },
287: { startChapter: 21, startVerse: 82 },
288: { startChapter: 21, startVerse: 91 },
289: { startChapter: 21, startVerse: 102 },
290: { startChapter: 22, startVerse: 1 },  // Al-Hajj (78 verses)
291: { startChapter: 22, startVerse: 6 },
292: { startChapter: 22, startVerse: 16 },
293: { startChapter: 22, startVerse: 24 },
294: { startChapter: 22, startVerse: 31 },
295: { startChapter: 22, startVerse: 39 },
296: { startChapter: 22, startVerse: 47 },
297: { startChapter: 22, startVerse: 56 },
298: { startChapter: 22, startVerse: 65 },
299: { startChapter: 22, startVerse: 73 },
300: { startChapter: 23, startVerse: 1 },  // Al-Mu'minun (118 verses)
301: { startChapter: 23, startVerse: 18 },
302: { startChapter: 23, startVerse: 28 },
303: { startChapter: 23, startVerse: 43 },
304: { startChapter: 23, startVerse: 60 },
305: { startChapter: 23, startVerse: 75 },
306: { startChapter: 23, startVerse: 90 },
307: { startChapter: 23, startVerse: 105 },
308: { startChapter: 24, startVerse: 1 },  // An-Nur (64 verses)
309: { startChapter: 24, startVerse: 11 },
310: { startChapter: 24, startVerse: 21 },
311: { startChapter: 24, startVerse: 28 },
312: { startChapter: 24, startVerse: 32 },
313: { startChapter: 24, startVerse: 37 },
314: { startChapter: 24, startVerse: 44 },
315: { startChapter: 24, startVerse: 54 },
316: { startChapter: 25, startVerse: 1 },  // Al-Furqan (77 verses)
317: { startChapter: 25, startVerse: 12 },
318: { startChapter: 25, startVerse: 21 },
319: { startChapter: 25, startVerse: 32 },
320: { startChapter: 25, startVerse: 44 },
321: { startChapter: 25, startVerse: 56 },
322: { startChapter: 25, startVerse: 68 },
323: { startChapter: 26, startVerse: 1 },  // Ash-Shu'ara (227 verses)
324: { startChapter: 26, startVerse: 20 },
325: { startChapter: 26, startVerse: 40 },
326: { startChapter: 26, startVerse: 61 },
327: { startChapter: 26, startVerse: 84 },
328: { startChapter: 26, startVerse: 112 },
329: { startChapter: 26, startVerse: 137 },
330: { startChapter: 26, startVerse: 160 },
331: { startChapter: 26, startVerse: 184 },
332: { startChapter: 26, startVerse: 207 },
333: { startChapter: 27, startVerse: 1 },  // An-Naml (93 verses)
334: { startChapter: 27, startVerse: 14 },
335: { startChapter: 27, startVerse: 23 },
336: { startChapter: 27, startVerse: 36 },
337: { startChapter: 27, startVerse: 45 },
338: { startChapter: 27, startVerse: 56 },
339: { startChapter: 27, startVerse: 64 },
340: { startChapter: 27, startVerse: 74 },
341: { startChapter: 27, startVerse: 83 },
342: { startChapter: 28, startVerse: 1 },  // Al-Qasas (88 verses)
343: { startChapter: 28, startVerse: 14 },
344: { startChapter: 28, startVerse: 22 },
345: { startChapter: 28, startVerse: 29 },
346: { startChapter: 28, startVerse: 36 },
347: { startChapter: 28, startVerse: 44 },
348: { startChapter: 28, startVerse: 51 },
349: { startChapter: 28, startVerse: 60 },
350: { startChapter: 28, startVerse: 71 },
351: { startChapter: 28, startVerse: 78 },
352: { startChapter: 29, startVerse: 1 },  // Al-Ankabut (69 verses)
353: { startChapter: 29, startVerse: 8 },
354: { startChapter: 29, startVerse: 15 },
355: { startChapter: 29, startVerse: 24 },
356: { startChapter: 29, startVerse: 31 },
357: { startChapter: 29, startVerse: 39 },
358: { startChapter: 29, startVerse: 46 },
359: { startChapter: 29, startVerse: 52 },
360: { startChapter: 29, startVerse: 64 },
361: { startChapter: 30, startVerse: 1 },  // Ar-Rum (60 verses)
362: { startChapter: 30, startVerse: 11 },
363: { startChapter: 30, startVerse: 20 },
364: { startChapter: 30, startVerse: 28 },
365: { startChapter: 30, startVerse: 36 },
366: { startChapter: 30, startVerse: 42 },
367: { startChapter: 30, startVerse: 51 },
368: { startChapter: 31, startVerse: 1 },  // Luqman (34 verses)
369: { startChapter: 31, startVerse: 12 },
370: { startChapter: 31, startVerse: 20 },
371: { startChapter: 31, startVerse: 29 },
372: { startChapter: 32, startVerse: 1 },  // As-Sajdah (30 verses)
373: { startChapter: 32, startVerse: 12 },
374: { startChapter: 32, startVerse: 23 },
375: { startChapter: 33, startVerse: 1 },  // Al-Ahzab (73 verses)
376: { startChapter: 33, startVerse: 7 },
377: { startChapter: 33, startVerse: 15 },
378: { startChapter: 33, startVerse: 21 },
379: { startChapter: 33, startVerse: 28 },
380: { startChapter: 33, startVerse: 31 },
381: { startChapter: 33, startVerse: 36 },
382: { startChapter: 33, startVerse: 44 },
383: { startChapter: 33, startVerse: 51 },
384: { startChapter: 33, startVerse: 55 },
385: { startChapter: 33, startVerse: 62 },
386: { startChapter: 33, startVerse: 69 },
387: { startChapter: 34, startVerse: 1 },  // Saba (54 verses)
388: { startChapter: 34, startVerse: 8 },
389: { startChapter: 34, startVerse: 15 },
390: { startChapter: 34, startVerse: 23 },
391: { startChapter: 34, startVerse: 32 },
392: { startChapter: 34, startVerse: 40 },
393: { startChapter: 34, startVerse: 49 },
394: { startChapter: 35, startVerse: 1 },  // Fatir (45 verses)
395: { startChapter: 35, startVerse: 9 },
396: { startChapter: 35, startVerse: 18 },
397: { startChapter: 35, startVerse: 31 },
398: { startChapter: 35, startVerse: 39 },
399: { startChapter: 36, startVerse: 1 },  // Ya-Sin (83 verses)
400: { startChapter: 36, startVerse: 13 },
401: { startChapter: 36, startVerse: 28 },
402: { startChapter: 36, startVerse: 41 },
403: { startChapter: 36, startVerse: 55 },
404: { startChapter: 36, startVerse: 71 },
405: { startChapter: 37, startVerse: 1 },  // As-Saffat (182 verses)
406: { startChapter: 37, startVerse: 22 },
407: { startChapter: 37, startVerse: 52 },
408: { startChapter: 37, startVerse: 77 },
409: { startChapter: 37, startVerse: 103 },
410: { startChapter: 37, startVerse: 127 },
411: { startChapter: 37, startVerse: 154 },
412: { startChapter: 37, startVerse: 171 },
413: { startChapter: 38, startVerse: 1 },  // Sad (88 verses)
414: { startChapter: 38, startVerse: 15 },
415: { startChapter: 38, startVerse: 27 },
416: { startChapter: 38, startVerse: 43 },
417: { startChapter: 38, startVerse: 62 },
418: { startChapter: 38, startVerse: 84 },
419: { startChapter: 39, startVerse: 1 },  // Az-Zumar (75 verses)
420: { startChapter: 39, startVerse: 6 },
421: { startChapter: 39, startVerse: 11 },
422: { startChapter: 39, startVerse: 22 },
423: { startChapter: 39, startVerse: 32 },
424: { startChapter: 39, startVerse: 41 },
425: { startChapter: 39, startVerse: 48 },
426: { startChapter: 39, startVerse: 57 },
427: { startChapter: 39, startVerse: 68 },
428: { startChapter: 40, startVerse: 1 },  // Ghafir (85 verses)
429: { startChapter: 40, startVerse: 8 },
430: { startChapter: 40, startVerse: 17 },
431: { startChapter: 40, startVerse: 26 },
432: { startChapter: 40, startVerse: 34 },
433: { startChapter: 40, startVerse: 41 },
434: { startChapter: 40, startVerse: 50 },
435: { startChapter: 40, startVerse: 59 },
436: { startChapter: 40, startVerse: 67 },
437: { startChapter: 40, startVerse: 78 },
438: { startChapter: 41, startVerse: 1 },  // Fussilat (54 verses)
439: { startChapter: 41, startVerse: 9 },
440: { startChapter: 41, startVerse: 19 },
441: { startChapter: 41, startVerse: 25 },
442: { startChapter: 41, startVerse: 30 },
443: { startChapter: 41, startVerse: 39 },
444: { startChapter: 41, startVerse: 46 },
445: { startChapter: 42, startVerse: 1 },  // Ash-Shura (53 verses)
446: { startChapter: 42, startVerse: 10 },
447: { startChapter: 42, startVerse: 15 },
448: { startChapter: 42, startVerse: 23 },
449: { startChapter: 42, startVerse: 32 },
450: { startChapter: 42, startVerse: 45 },
451: { startChapter: 43, startVerse: 1 },  // Az-Zukhruf (89 verses)
452: { startChapter: 43, startVerse: 11 },
453: { startChapter: 43, startVerse: 23 },
454: { startChapter: 43, startVerse: 34 },
455: { startChapter: 43, startVerse: 48 },
456: { startChapter: 43, startVerse: 57 },
457: { startChapter: 43, startVerse: 68 },
458: { startChapter: 43, startVerse: 80 },
459: { startChapter: 44, startVerse: 1 },  // Ad-Dukhan (59 verses)
460: { startChapter: 44, startVerse: 17 },
461: { startChapter: 44, startVerse: 40 },
462: { startChapter: 45, startVerse: 1 },  // Al-Jathiya (37 verses)
463: { startChapter: 45, startVerse: 13 },
464: { startChapter: 45, startVerse: 22 },
465: { startChapter: 45, startVerse: 32 },
466: { startChapter: 46, startVerse: 1 },  // Al-Ahqaf (35 verses)
467: { startChapter: 46, startVerse: 15 },
468: { startChapter: 46, startVerse: 21 },
469: { startChapter: 46, startVerse: 29 },
470: { startChapter: 47, startVerse: 1 },  // Muhammad (38 verses)
471: { startChapter: 47, startVerse: 12 },
472: { startChapter: 47, startVerse: 20 },
473: { startChapter: 47, startVerse: 29 },
474: { startChapter: 48, startVerse: 1 },  // Al-Fath (29 verses)
475: { startChapter: 48, startVerse: 10 },
476: { startChapter: 48, startVerse: 16 },
477: { startChapter: 48, startVerse: 24 },
478: { startChapter: 49, startVerse: 1 },  // Al-Hujurat (18 verses)
479: { startChapter: 49, startVerse: 9 },
480: { startChapter: 49, startVerse: 14 },
481: { startChapter: 50, startVerse: 1 },  // Qaf (45 verses)
482: { startChapter: 50, startVerse: 16 },
483: { startChapter: 50, startVerse: 27 },
484: { startChapter: 50, startVerse: 36 },
485: { startChapter: 51, startVerse: 1 },  // Adh-Dhariyat (60 verses)
486: { startChapter: 51, startVerse: 24 },
487: { startChapter: 51, startVerse: 31 },
488: { startChapter: 51, startVerse: 52 },
489: { startChapter: 52, startVerse: 1 },  // At-Tur (49 verses)
490: { startChapter: 52, startVerse: 15 },
491: { startChapter: 52, startVerse: 32 },
492: { startChapter: 53, startVerse: 1 },  // An-Najm (62 verses)
493: { startChapter: 53, startVerse: 27 },
494: { startChapter: 53, startVerse: 45 },
495: { startChapter: 54, startVerse: 1 },  // Al-Qamar (55 verses)
496: { startChapter: 54, startVerse: 9 },
497: { startChapter: 54, startVerse: 28 },
498: { startChapter: 54, startVerse: 50 },
499: { startChapter: 55, startVerse: 1 },  // Ar-Rahman (78 verses)
500: { startChapter: 55, startVerse: 17 },
501: { startChapter: 55, startVerse: 41 },
502: { startChapter: 55, startVerse: 62 },
503: { startChapter: 56, startVerse: 1 },  // Al-Waqi'ah (96 verses)
504: { startChapter: 56, startVerse: 17 },
505: { startChapter: 56, startVerse: 51 },
506: { startChapter: 56, startVerse: 77 },
507: { startChapter: 57, startVerse: 1 },  // Al-Hadid (29 verses)
508: { startChapter: 57, startVerse: 7 },
509: { startChapter: 57, startVerse: 15 },
510: { startChapter: 57, startVerse: 25 },
511: { startChapter: 58, startVerse: 1 },  // Al-Mujadila (22 verses)
512: { startChapter: 58, startVerse: 7 },
513: { startChapter: 58, startVerse: 14 },
514: { startChapter: 59, startVerse: 1 },  // Al-Hashr (24 verses)
515: { startChapter: 59, startVerse: 10 },
516: { startChapter: 59, startVerse: 18 },
517: { startChapter: 60, startVerse: 1 },  // Al-Mumtahina (13 verses)
518: { startChapter: 60, startVerse: 7 },
519: { startChapter: 61, startVerse: 1 },  // As-Saff (14 verses)
520: { startChapter: 61, startVerse: 6 },
521: { startChapter: 62, startVerse: 1 },  // Al-Jumu'ah (11 verses)
522: { startChapter: 62, startVerse: 9 },
523: { startChapter: 63, startVerse: 1 },  // Al-Munafiqun (11 verses)
524: { startChapter: 64, startVerse: 1 },  // At-Taghabun (18 verses)
525: { startChapter: 64, startVerse: 10 },
526: { startChapter: 65, startVerse: 1 },  // At-Talaq (12 verses)
527: { startChapter: 65, startVerse: 6 },
528: { startChapter: 66, startVerse: 1 },  // At-Tahrim (12 verses)
529: { startChapter: 66, startVerse: 8 },
530: { startChapter: 67, startVerse: 1 },  // Al-Mulk (30 verses)
531: { startChapter: 67, startVerse: 15 },
532: { startChapter: 68, startVerse: 1 },  // Al-Qalam (52 verses)
533: { startChapter: 68, startVerse: 16 },
534: { startChapter: 68, startVerse: 33 },
535: { startChapter: 69, startVerse: 1 },  // Al-Haqqah (52 verses)
536: { startChapter: 69, startVerse: 19 },
537: { startChapter: 69, startVerse: 38 },
538: { startChapter: 70, startVerse: 1 },  // Al-Ma'arij (44 verses)
539: { startChapter: 70, startVerse: 19 },
540: { startChapter: 70, startVerse: 40 },
541: { startChapter: 71, startVerse: 1 },  // Nuh (28 verses)
542: { startChapter: 71, startVerse: 11 },
543: { startChapter: 72, startVerse: 1 },  // Al-Jinn (28 verses)
544: { startChapter: 72, startVerse: 14 },
545: { startChapter: 73, startVerse: 1 },  // Al-Muzzammil (20 verses)
546: { startChapter: 73, startVerse: 10 },
547: { startChapter: 74, startVerse: 1 },  // Al-Muddaththir (56 verses)
548: { startChapter: 74, startVerse: 18 },
549: { startChapter: 74, startVerse: 32 },
550: { startChapter: 74, startVerse: 48 },
551: { startChapter: 75, startVerse: 1 },  // Al-Qiyamah (40 verses)
552: { startChapter: 75, startVerse: 20 },
553: { startChapter: 76, startVerse: 1 },  // Al-Insan (31 verses)
554: { startChapter: 76, startVerse: 19 },
555: { startChapter: 77, startVerse: 1 },  // Al-Mursalat (50 verses)
556: { startChapter: 77, startVerse: 20 },
557: { startChapter: 77, startVerse: 41 },
558: { startChapter: 78, startVerse: 1 },  // An-Naba (40 verses)
559: { startChapter: 78, startVerse: 17 },
560: { startChapter: 78, startVerse: 31 },
561: { startChapter: 79, startVerse: 1 },  // An-Nazi'at (46 verses)
562: { startChapter: 79, startVerse: 16 },
563: { startChapter: 79, startVerse: 27 },
564: { startChapter: 80, startVerse: 1 },  // Abasa (42 verses)
565: { startChapter: 80, startVerse: 17 },
566: { startChapter: 81, startVerse: 1 },  // At-Takwir (29 verses)
567: { startChapter: 82, startVerse: 1 },  // Al-Infitar (19 verses)
568: { startChapter: 83, startVerse: 1 },  // Al-Mutaffifin (36 verses)
569: { startChapter: 83, startVerse: 18 },
570: { startChapter: 84, startVerse: 1 },  // Al-Inshiqaq (25 verses)
571: { startChapter: 85, startVerse: 1 },  // Al-Buruj (22 verses)
572: { startChapter: 86, startVerse: 1 },  // At-Tariq (17 verses)
573: { startChapter: 87, startVerse: 1 },  // Al-A'la (19 verses)
574: { startChapter: 88, startVerse: 1 },  // Al-Ghashiyah (26 verses)
575: { startChapter: 89, startVerse: 1 },  // Al-Fajr (30 verses)
576: { startChapter: 89, startVerse: 15 },
577: { startChapter: 90, startVerse: 1 },  // Al-Balad (20 verses)
578: { startChapter: 91, startVerse: 1 },  // Ash-Shams (15 verses)
579: { startChapter: 92, startVerse: 1 },  // Al-Layl (21 verses)
580: { startChapter: 93, startVerse: 1 },  // Ad-Duha (11 verses)
581: { startChapter: 94, startVerse: 1 },  // Ash-Sharh (8 verses)
582: { startChapter: 95, startVerse: 1 },  // At-Tin (8 verses)
583: { startChapter: 96, startVerse: 1 },  // Al-Alaq (19 verses)
584: { startChapter: 97, startVerse: 1 },  // Al-Qadr (5 verses)
585: { startChapter: 98, startVerse: 1 },  // Al-Bayyina (8 verses)
586: { startChapter: 99, startVerse: 1 },  // Az-Zalzala (8 verses)
587: { startChapter: 100, startVerse: 1 }, // Al-Adiyat (11 verses)
588: { startChapter: 101, startVerse: 1 }, // Al-Qari'ah (11 verses)
589: { startChapter: 102, startVerse: 1 }, // At-Takathur (8 verses)
590: { startChapter: 103, startVerse: 1 }, // Al-Asr (3 verses)
591: { startChapter: 104, startVerse: 1 }, // Al-Humazah (9 verses)
592: { startChapter: 105, startVerse: 1 }, // Al-Fil (5 verses)
593: { startChapter: 106, startVerse: 1 }, // Quraysh (4 verses)
594: { startChapter: 107, startVerse: 1 }, // Al-Ma'un (7 verses)
595: { startChapter: 108, startVerse: 1 }, // Al-Kawthar (3 verses)
596: { startChapter: 109, startVerse: 1 }, // Al-Kafirun (6 verses)
597: { startChapter: 110, startVerse: 1 }, // An-Nasr (3 verses)
598: { startChapter: 111, startVerse: 1 }, // Al-Masad (5 verses)
599: { startChapter: 112, startVerse: 1 }, // Al-Ikhlas (4 verses)
600: { startChapter: 113, startVerse: 1 }, // Al-Falaq (5 verses)
601: { startChapter: 114, startVerse: 1 }, // An-Nas (6 verses)
602: { startChapter: 114, startVerse: 3 },
603: { startChapter: 114, startVerse: 5 },
604: { startChapter: 114, startVerse: 1 }
};

// Add verse counts per page for proper display
let pageVerseData = {     
1: { 1: [1, 7] }, // Page 1: Surah 1, verses 1-7     
2: { 2: [1, 5] }, // Page 2: Surah 2, verses 1-5     
3: { 2: [6, 16] }, // Page 3: Surah 2, verses 6-16     
4: { 2: [17, 24] }, // Page 4: Surah 2, verses 17-24     
5: { 2: [25, 29] }, // Page 5: Surah 2, verses 25-29     
6: { 2: [30, 37] }, // Page 6: Surah 2, verses 30-37     
7: { 2: [38, 48] }, // Page 7: Surah 2, verses 38-48     
8: { 2: [49, 57] }, // Page 8: Surah 2, verses 49-57     
9: { 2: [58, 61] }, // Page 9: Surah 2, verses 58-61     
10: { 2: [62, 69] }, // Page 10: Surah 2, verses 62-69     
11: { 2: [70, 76] }, // Page 11: Surah 2, verses 70-76     
12: { 2: [77, 83] }, // Page 12: Surah 2, verses 77-83     
13: { 2: [84, 88] }, // Page 13: Surah 2, verses 84-88     
14: { 2: [89, 93] }, // Page 14: Surah 2, verses 89-93     
15: { 2: [94, 101] }, // Page 15: Surah 2, verses 94-101     
16: { 2: [102, 105] }, // Page 16: Surah 2, verses 102-105     
17: { 2: [106, 112] }, // Page 17: Surah 2, verses 106-112     
18: { 2: [113, 119] }, // Page 18: Surah 2, verses 113-119     
19: { 2: [120, 126] }, // Page 19: Surah 2, verses 120-126     
20: { 2: [127, 134] }, // Page 20: Surah 2, verses 127-134     
21: { 2: [135, 141] }, // Page 21: Surah 2, verses 135-141     
22: { 2: [142, 145] }, // Page 22: Surah 2, verses 142-145     
23: { 2: [146, 153] }, // Page 23: Surah 2, verses 146-153     
24: { 2: [154, 163] }, // Page 24: Surah 2, verses 154-163     
25: { 2: [164, 169] }, // Page 25: Surah 2, verses 164-169     
26: { 2: [170, 176] }, // Page 26: Surah 2, verses 170-176     
27: { 2: [177, 181] }, // Page 27: Surah 2, verses 177-181     
28: { 2: [182, 186] }, // Page 28: Surah 2, verses 182-186     
29: { 2: [187, 190] }, // Page 29: Surah 2, verses 187-190     
30: { 2: [191, 196] }, // Page 30: Surah 2, verses 191-196     
31: { 2: [197, 202] }, // Page 31: Surah 2, verses 197-202     
32: { 2: [203, 210] }, // Page 32: Surah 2, verses 203-210     
33: { 2: [211, 215] }, // Page 33: Surah 2, verses 211-215     
34: { 2: [216, 219] }, // Page 34: Surah 2, verses 216-219     
35: { 2: [220, 224] }, // Page 35: Surah 2, verses 220-224     
36: { 2: [225, 230] }, // Page 36: Surah 2, verses 225-230     
37: { 2: [231, 233] }, // Page 37: Surah 2, verses 231-233     
38: { 2: [234, 237] }, // Page 38: Surah 2, verses 234-237     
39: { 2: [238, 245] }, // Page 39: Surah 2, verses 238-245     
40: { 2: [246, 248] }, // Page 40: Surah 2, verses 246-248     
41: { 2: [249, 252] }, // Page 41: Surah 2, verses 249-252     
42: { 2: [253, 256] }, // Page 42: Surah 2, verses 253-256     
43: { 2: [257, 259] }, // Page 43: Surah 2, verses 257-259     
44: { 2: [260, 264] }, // Page 44: Surah 2, verses 260-264     
45: { 2: [265, 269] }, // Page 45: Surah 2, verses 265-269     
46: { 2: [270, 274] }, // Page 46: Surah 2, verses 270-274     
47: { 2: [275, 281] }, // Page 47: Surah 2, verses 275-281     
48: { 2: [282, 282] }, // Page 48: Surah 2, verses 282-282     
49: { 2: [283, 286] }, // Page 49: Surah 2, verses 283-286     
50: { 3: [1, 9] }, // Page 50: Surah 3, verses 1-9     
51: { 3: [10, 15] }, // Page 51: Surah 3, verses 10-15     
52: { 3: [16, 22] }, // Page 52: Surah 3, verses 16-22     
53: { 3: [23, 29] }, // Page 53: Surah 3, verses 23-29     
54: { 3: [30, 37] }, // Page 54: Surah 3, verses 30-37     
55: { 3: [38, 45] }, // Page 55: Surah 3, verses 38-45     
56: { 3: [46, 52] }, // Page 56: Surah 3, verses 46-52     
57: { 3: [53, 61] }, // Page 57: Surah 3, verses 53-61     
58: { 3: [62, 70] }, // Page 58: Surah 3, verses 62-70     
59: { 3: [71, 77] }, // Page 59: Surah 3, verses 71-77     
60: { 3: [78, 83] }, // Page 60: Surah 3, verses 78-83     
61: { 3: [84, 91] }, // Page 61: Surah 3, verses 84-91     
62: { 3: [92, 100] }, // Page 62: Surah 3, verses 92-100     
63: { 3: [101, 108] }, // Page 63: Surah 3, verses 101-108     
64: { 3: [109, 115] }, // Page 64: Surah 3, verses 109-115     
65: { 3: [116, 121] }, // Page 65: Surah 3, verses 116-121     
66: { 3: [122, 132] }, // Page 66: Surah 3, verses 122-132     
67: { 3: [133, 140] }, // Page 67: Surah 3, verses 133-140     
68: { 3: [141, 148] }, // Page 68: Surah 3, verses 141-148     
69: { 3: [149, 153] }, // Page 69: Surah 3, verses 149-153     
70: { 3: [154, 157] }, // Page 70: Surah 3, verses 154-157     
71: { 3: [158, 165] }, // Page 71: Surah 3, verses 158-165     
72: { 3: [166, 173] }, // Page 72: Surah 3, verses 166-173     
73: { 3: [174, 180] }, // Page 73: Surah 3, verses 174-180     
74: { 3: [181, 186] }, // Page 74: Surah 3, verses 181-186     
75: { 3: [187, 194] }, // Page 75: Surah 3, verses 187-194     
76: { 3: [195, 200] }, // Page 76: Surah 3, verses 195-200     
77: { 4: [1, 6] }, // Page 77: Surah 4, verses 1-6     
78: { 4: [7, 11] }, // Page 78: Surah 4, verses 7-11     
79: { 4: [12, 14] }, // Page 79: Surah 4, verses 12-14     
80: { 4: [15, 19] }, // Page 80: Surah 4, verses 15-19     
81: { 4: [20, 23] }, // Page 81: Surah 4, verses 20-23     
82: { 4: [24, 26] }, // Page 82: Surah 4, verses 24-26     
83: { 4: [27, 33] }, // Page 83: Surah 4, verses 27-33     
84: { 4: [34, 37] }, // Page 84: Surah 4, verses 34-37     
85: { 4: [38, 44] }, // Page 85: Surah 4, verses 38-44     
86: { 4: [45, 51] }, // Page 86: Surah 4, verses 45-51     
87: { 4: [52, 59] }, // Page 87: Surah 4, verses 52-59     
88: { 4: [60, 65] }, // Page 88: Surah 4, verses 60-65     
89: { 4: [66, 74] }, // Page 89: Surah 4, verses 66-74     
90: { 4: [75, 79] }, // Page 90: Surah 4, verses 75-79     
91: { 4: [80, 86] }, // Page 91: Surah 4, verses 80-86     
92: { 4: [87, 91] }, // Page 92: Surah 4, verses 87-91     
93: { 4: [92, 94] }, // Page 93: Surah 4, verses 92-94     
94: { 4: [95, 101] }, // Page 94: Surah 4, verses 95-101     
95: { 4: [102, 105] }, // Page 95: Surah 4, verses 102-105     
96: { 4: [106, 113] }, // Page 96: Surah 4, verses 106-113     
97: { 4: [114, 121] }, // Page 97: Surah 4, verses 114-121     
98: { 4: [122, 127] }, // Page 98: Surah 4, verses 122-127     
99: { 4: [128, 134] }, // Page 99: Surah 4, verses 128-134     
100: { 4: [135, 140] }, // Page 100: Surah 4, verses 135-140     
101: { 4: [141, 147] }, // Page 101: Surah 4, verses 141-147     
102: { 4: [148, 154] }, // Page 102: Surah 4, verses 148-154     
103: { 4: [155, 162] }, // Page 103: Surah 4, verses 155-162     
104: { 4: [163, 170] }, // Page 104: Surah 4, verses 163-170     
105: { 4: [171, 175] }, // Page 105: Surah 4, verses 171-175     
106: { 4: [176, 176], 5: [1, 2] }, // Page 106: Surah 4 (176-176), Surah 5 (1-2)     
107: { 5: [3, 5] }, // Page 107: Surah 5, verses 3-5     
108: { 5: [6, 9] }, // Page 108: Surah 5, verses 6-9     
109: { 5: [10, 13] }, // Page 109: Surah 5, verses 10-13     
110: { 5: [14, 17] }, // Page 110: Surah 5, verses 14-17     
111: { 5: [18, 23] }, // Page 111: Surah 5, verses 18-23     
112: { 5: [24, 31] }, // Page 112: Surah 5, verses 24-31     
113: { 5: [32, 36] }, // Page 113: Surah 5, verses 32-36     
114: { 5: [37, 41] }, // Page 114: Surah 5, verses 37-41     
115: { 5: [42, 45] }, // Page 115: Surah 5, verses 42-45     
116: { 5: [46, 50] }, // Page 116: Surah 5, verses 46-50     
117: { 5: [51, 57] }, // Page 117: Surah 5, verses 51-57     
118: { 5: [58, 64] }, // Page 118: Surah 5, verses 58-64     
119: { 5: [65, 70] }, // Page 119: Surah 5, verses 65-70     
120: { 5: [71, 76] }, // Page 120: Surah 5, verses 71-76     
121: { 5: [77, 82] }, // Page 121: Surah 5, verses 77-82     
122: { 5: [83, 89] }, // Page 122: Surah 5, verses 83-89     
123: { 5: [90, 95] }, // Page 123: Surah 5, verses 90-95     
124: { 5: [96, 103] }, // Page 124: Surah 5, verses 96-103     
125: { 5: [104, 108] }, // Page 125: Surah 5, verses 104-108     
126: { 5: [109, 113] }, // Page 126: Surah 5, verses 109-113     
127: { 5: [114, 120] }, // Page 127: Surah 5, verses 114-120     
128: { 6: [1, 8] }, // Page 128: Surah 6, verses 1-8     
129: { 6: [9, 18] }, // Page 129: Surah 6, verses 9-18     
130: { 6: [19, 27] }, // Page 130: Surah 6, verses 19-27     
131: { 6: [28, 35] }, // Page 131: Surah 6, verses 28-35     
132: { 6: [36, 44] }, // Page 132: Surah 6, verses 36-44     
133: { 6: [45, 52] }, // Page 133: Surah 6, verses 45-52     
134: { 6: [53, 59] }, // Page 134: Surah 6, verses 53-59     
135: { 6: [60, 68] }, // Page 135: Surah 6, verses 60-68     
136: { 6: [69, 73] }, // Page 136: Surah 6, verses 69-73     
137: { 6: [74, 81] }, // Page 137: Surah 6, verses 74-81     
138: { 6: [82, 90] }, // Page 138: Surah 6, verses 82-90     
139: { 6: [91, 94] }, // Page 139: Surah 6, verses 91-94     
140: { 6: [95, 101] }, // Page 140: Surah 6, verses 95-101     
141: { 6: [102, 110] }, // Page 141: Surah 6, verses 102-110     
142: { 6: [111, 118] }, // Page 142: Surah 6, verses 111-118     
143: { 6: [119, 124] }, // Page 143: Surah 6, verses 119-124     
144: { 6: [125, 131] }, // Page 144: Surah 6, verses 125-131     
145: { 6: [132, 137] }, // Page 145: Surah 6, verses 132-137     
146: { 6: [138, 142] }, // Page 146: Surah 6, verses 138-142     
147: { 6: [143, 146] }, // Page 147: Surah 6, verses 143-146     
148: { 6: [147, 151] }, // Page 148: Surah 6, verses 147-151     
149: { 6: [152, 157] }, // Page 149: Surah 6, verses 152-157     
150: { 6: [158, 165] }, // Page 150: Surah 6, verses 158-165     
151: { 7: [1, 11] }, // Page 151: Surah 7, verses 1-11     
152: { 7: [12, 22] }, // Page 152: Surah 7, verses 12-22     
153: { 7: [23, 30] }, // Page 153: Surah 7, verses 23-30     
154: { 7: [31, 37] }, // Page 154: Surah 7, verses 31-37     
155: { 7: [38, 43] }, // Page 155: Surah 7, verses 38-43     
156: { 7: [44, 51] }, // Page 156: Surah 7, verses 44-51     
157: { 7: [52, 57] }, // Page 157: Surah 7, verses 52-57     
158: { 7: [58, 67] }, // Page 158: Surah 7, verses 58-67     
159: { 7: [68, 73] }, // Page 159: Surah 7, verses 68-73     
160: { 7: [74, 81] }, // Page 160: Surah 7, verses 74-81     
161: { 7: [82, 87] }, // Page 161: Surah 7, verses 82-87     
162: { 7: [88, 95] }, // Page 162: Surah 7, verses 88-95     
163: { 7: [96, 104] }, // Page 163: Surah 7, verses 96-104     
164: { 7: [105, 120] }, // Page 164: Surah 7, verses 105-120     
165: { 7: [121, 130] }, // Page 165: Surah 7, verses 121-130     
166: { 7: [131, 137] }, // Page 166: Surah 7, verses 131-137     
167: { 7: [138, 143] }, // Page 167: Surah 7, verses 138-143     
168: { 7: [144, 149] }, // Page 168: Surah 7, verses 144-149     
169: { 7: [150, 155] }, // Page 169: Surah 7, verses 150-155     
170: { 7: [156, 159] }, // Page 170: Surah 7, verses 156-159     
171: { 7: [160, 163] }, // Page 171: Surah 7, verses 160-163     
172: { 7: [164, 170] }, // Page 172: Surah 7, verses 164-170     
173: { 7: [171, 178] }, // Page 173: Surah 7, verses 171-178     
174: { 7: [179, 187] }, // Page 174: Surah 7, verses 179-187     
175: { 7: [188, 195] }, // Page 175: Surah 7, verses 188-195     
176: { 7: [196, 206] }, // Page 176: Surah 7, verses 196-206     
177: { 8: [1, 8] }, // Page 177: Surah 8, verses 1-8     
178: { 8: [9, 16] }, // Page 178: Surah 8, verses 9-16     
179: { 8: [17, 25] }, // Page 179: Surah 8, verses 17-25     
180: { 8: [26, 33] }, // Page 180: Surah 8, verses 26-33     
181: { 8: [34, 40] }, // Page 181: Surah 8, verses 34-40     
182: { 8: [41, 45] }, // Page 182: Surah 8, verses 41-45     
183: { 8: [46, 52] }, // Page 183: Surah 8, verses 46-52     
184: { 8: [53, 61] }, // Page 184: Surah 8, verses 53-61     
185: { 8: [62, 69] }, // Page 185: Surah 8, verses 62-69     
186: { 8: [70, 75] }, // Page 186: Surah 8, verses 70-75     
187: { 9: [1, 6] }, // Page 187: Surah 9, verses 1-6     
188: { 9: [7, 13] }, // Page 188: Surah 9, verses 7-13     
189: { 9: [14, 20] }, // Page 189: Surah 9, verses 14-20     
190: { 9: [21, 26] }, // Page 190: Surah 9, verses 21-26     
191: { 9: [27, 31] }, // Page 191: Surah 9, verses 27-31     
192: { 9: [32, 36] }, // Page 192: Surah 9, verses 32-36     
193: { 9: [37, 40] }, // Page 193: Surah 9, verses 37-40     
194: { 9: [41, 47] }, // Page 194: Surah 9, verses 41-47     
195: { 9: [48, 54] }, // Page 195: Surah 9, verses 48-54     
196: { 9: [55, 61] }, // Page 196: Surah 9, verses 55-61     
197: { 9: [62, 68] }, // Page 197: Surah 9, verses 62-68     
198: { 9: [69, 72] }, // Page 198: Surah 9, verses 69-72     
199: { 9: [73, 79] }, // Page 199: Surah 9, verses 73-79     
200: { 9: [80, 86] }, // Page 200: Surah 9, verses 80-86     
201: { 9: [87, 93] }, // Page 201: Surah 9, verses 87-93     
202: { 9: [94, 99] }, // Page 202: Surah 9, verses 94-99     
203: { 9: [100, 106] }, // Page 203: Surah 9, verses 100-106     
204: { 9: [107, 111] }, // Page 204: Surah 9, verses 107-111     
205: { 9: [112, 117] }, // Page 205: Surah 9, verses 112-117     
206: { 9: [118, 122] }, // Page 206: Surah 9, verses 118-122     
207: { 9: [123, 129] }, // Page 207: Surah 9, verses 123-129     
208: { 10: [1, 6] }, // Page 208: Surah 10, verses 1-6     
209: { 10: [7, 14] }, // Page 209: Surah 10, verses 7-14     
210: { 10: [15, 20] }, // Page 210: Surah 10, verses 15-20     
211: { 10: [21, 25] }, // Page 211: Surah 10, verses 21-25     
212: { 10: [26, 33] }, // Page 212: Surah 10, verses 26-33     
213: { 10: [34, 42] }, // Page 213: Surah 10, verses 34-42     
214: { 10: [43, 53] }, // Page 214: Surah 10, verses 43-53     
215: { 10: [54, 61] }, // Page 215: Surah 10, verses 54-61     
216: { 10: [62, 70] }, // Page 216: Surah 10, verses 62-70     
217: { 10: [71, 78] }, // Page 217: Surah 10, verses 71-78     
218: { 10: [79, 88] }, // Page 218: Surah 10, verses 79-88     
219: { 10: [89, 97] }, // Page 219: Surah 10, verses 89-97     
220: { 10: [98, 106] }, // Page 220: Surah 10, verses 98-106     
221: { 10: [107, 109], 11: [1, 5] }, // Page 221: Surah 10 (107-109), Surah 11 (1-5)     
222: { 11: [6, 12] }, // Page 222: Surah 11, verses 6-12     
223: { 11: [13, 19] }, // Page 223: Surah 11, verses 13-19     
224: { 11: [20, 28] }, // Page 224: Surah 11, verses 20-28     
225: { 11: [29, 37] }, // Page 225: Surah 11, verses 29-37     
226: { 11: [38, 45] }, // Page 226: Surah 11, verses 38-45     
227: { 11: [46, 53] }, // Page 227: Surah 11, verses 46-53     
228: { 11: [54, 62] }, // Page 228: Surah 11, verses 54-62     
229: { 11: [63, 71] }, // Page 229: Surah 11, verses 63-71     
230: { 11: [72, 81] }, // Page 230: Surah 11, verses 72-81     
231: { 11: [82, 88] }, // Page 231: Surah 11, verses 82-88     
232: { 11: [89, 97] }, // Page 232: Surah 11, verses 89-97     
233: { 11: [98, 108] }, // Page 233: Surah 11, verses 98-108     
234: { 11: [109, 117] }, // Page 234: Surah 11, verses 109-117     
235: { 11: [118, 123], 12: [1, 4] }, // Page 235: Surah 11 (118-123), Surah 12 (1-4)     
236: { 12: [5, 14] }, // Page 236: Surah 12, verses 5-14     
237: { 12: [15, 22] }, // Page 237: Surah 12, verses 15-22     
238: { 12: [23, 30] }, // Page 238: Surah 12, verses 23-30     
239: { 12: [31, 37] }, // Page 239: Surah 12, verses 31-37     
240: { 12: [38, 43] }, // Page 240: Surah 12, verses 38-43     
241: { 12: [44, 52] }, // Page 241: Surah 12, verses 44-52     
242: { 12: [53, 63] }, // Page 242: Surah 12, verses 53-63     
243: { 12: [64, 69] }, // Page 243: Surah 12, verses 64-69     
244: { 12: [70, 78] }, // Page 244: Surah 12, verses 70-78     
245: { 12: [79, 86] }, // Page 245: Surah 12, verses 79-86     
246: { 12: [87, 95] }, // Page 246: Surah 12, verses 87-95     
247: { 12: [96, 103] }, // Page 247: Surah 12, verses 96-103     
248: { 12: [104, 111] }, // Page 248: Surah 12, verses 104-111     
249: { 13: [1, 5] }, // Page 249: Surah 13, verses 1-5     
250: { 13: [6, 13] }, // Page 250: Surah 13, verses 6-13     
251: { 13: [14, 18] }, // Page 251: Surah 13, verses 14-18     
252: { 13: [19, 28] }, // Page 252: Surah 13, verses 19-28     
253: { 13: [29, 34] }, // Page 253: Surah 13, verses 29-34     
254: { 13: [35, 42] }, // Page 254: Surah 13, verses 35-42     
255: { 13: [43, 43], 14: [1, 5] }, // Page 255: Surah 13 (43-43), Surah 14 (1-5)     
256: { 14: [6, 10] }, // Page 256: Surah 14, verses 6-10     
257: { 14: [11, 18] }, // Page 257: Surah 14, verses 11-18     
258: { 14: [19, 24] }, // Page 258: Surah 14, verses 19-24     
259: { 14: [25, 33] }, // Page 259: Surah 14, verses 25-33     
260: { 14: [34, 42] }, // Page 260: Surah 14, verses 34-42     
261: { 14: [43, 52] }, // Page 261: Surah 14, verses 43-52     
262: { 15: [1, 15] }, // Page 262: Surah 15, verses 1-15     
263: { 15: [16, 31] }, // Page 263: Surah 15, verses 16-31     
264: { 15: [32, 51] }, // Page 264: Surah 15, verses 32-51     
265: { 15: [52, 70] }, // Page 265: Surah 15, verses 52-70     
266: { 15: [71, 90] }, // Page 266: Surah 15, verses 71-90     
267: { 15: [91, 99], 16: [1, 6] }, // Page 267: Surah 15 (91-99), Surah 16 (1-6)     
268: { 16: [7, 14] }, // Page 268: Surah 16, verses 7-14     
269: { 16: [15, 26] }, // Page 269: Surah 16, verses 15-26     
270: { 16: [27, 34] }, // Page 270: Surah 16, verses 27-34     
271: { 16: [35, 42] }, // Page 271: Surah 16, verses 35-42     
272: { 16: [43, 54] }, // Page 272: Surah 16, verses 43-54     
273: { 16: [55, 64] }, // Page 273: Surah 16, verses 55-64     
274: { 16: [65, 72] }, // Page 274: Surah 16, verses 65-72     
275: { 16: [73, 79] }, // Page 275: Surah 16, verses 73-79     
276: { 16: [80, 87] }, // Page 276: Surah 16, verses 80-87     
277: { 16: [88, 93] }, // Page 277: Surah 16, verses 88-93     
278: { 16: [94, 102] }, // Page 278: Surah 16, verses 94-102     
279: { 16: [103, 110] }, // Page 279: Surah 16, verses 103-110     
280: { 16: [111, 118] }, // Page 280: Surah 16, verses 111-118     
281: { 16: [119, 128] }, // Page 281: Surah 16, verses 119-128     
282: { 17: [1, 7] }, // Page 282: Surah 17, verses 1-7     
283: { 17: [8, 17] }, // Page 283: Surah 17, verses 8-17     
284: { 17: [18, 27] }, // Page 284: Surah 17, verses 18-27     
285: { 17: [28, 38] }, // Page 285: Surah 17, verses 28-38     
286: { 17: [39, 49] }, // Page 286: Surah 17, verses 39-49     
287: { 17: [50, 58] }, // Page 287: Surah 17, verses 50-58     
288: { 17: [59, 66] }, // Page 288: Surah 17, verses 59-66     
289: { 17: [67, 75] }, // Page 289: Surah 17, verses 67-75     
290: { 17: [76, 86] }, // Page 290: Surah 17, verses 76-86     
291: { 17: [87, 96] }, // Page 291: Surah 17, verses 87-96     
292: { 17: [97, 104] }, // Page 292: Surah 17, verses 97-104     
293: { 17: [105, 111], 18: [1, 4] }, // Page 293: Surah 17 (105-111), Surah 18 (1-4)     
294: { 18: [5, 15] }, // Page 294: Surah 18, verses 5-15     
295: { 18: [16, 20] }, // Page 295: Surah 18, verses 16-20     
296: { 18: [21, 27] }, // Page 296: Surah 18, verses 21-27     
297: { 18: [28, 34] }, // Page 297: Surah 18, verses 28-34     
298: { 18: [35, 45] }, // Page 298: Surah 18, verses 35-45     
299: { 18: [46, 53] }, // Page 299: Surah 18, verses 46-53     
300: { 18: [54, 61] }, // Page 300: Surah 18, verses 54-61     
301: { 18: [62, 74] }, // Page 301: Surah 18, verses 62-74     
302: { 18: [75, 83] }, // Page 302: Surah 18, verses 75-83     
303: { 18: [84, 97] }, // Page 303: Surah 18, verses 84-97     
304: { 18: [98, 110] }, // Page 304: Surah 18, verses 98-110     
305: { 19: [1, 11] }, // Page 305: Surah 19, verses 1-11     
306: { 19: [12, 25] }, // Page 306: Surah 19, verses 12-25     
307: { 19: [26, 38] }, // Page 307: Surah 19, verses 26-38     
308: { 19: [39, 51] }, // Page 308: Surah 19, verses 39-51     
309: { 19: [52, 64] }, // Page 309: Surah 19, verses 52-64     
310: { 19: [65, 76] }, // Page 310: Surah 19, verses 65-76     
311: { 19: [77, 95] }, // Page 311: Surah 19, verses 77-95     
312: { 19: [96, 98], 20: [1, 12] }, // Page 312: Surah 19 (96-98), Surah 20 (1-12)     
313: { 20: [13, 37] }, // Page 313: Surah 20, verses 13-37     
314: { 20: [38, 51] }, // Page 314: Surah 20, verses 38-51     
315: { 20: [52, 64] }, // Page 315: Surah 20, verses 52-64     
316: { 20: [65, 76] }, // Page 316: Surah 20, verses 65-76     
317: { 20: [77, 87] }, // Page 317: Surah 20, verses 77-87     
318: { 20: [88, 98] }, // Page 318: Surah 20, verses 88-98     
319: { 20: [99, 113] }, // Page 319: Surah 20, verses 99-113     
320: { 20: [114, 125] }, // Page 320: Surah 20, verses 114-125     
321: { 20: [126, 135] }, // Page 321: Surah 20, verses 126-135     
322: { 21: [1, 10] }, // Page 322: Surah 21, verses 1-10     
323: { 21: [11, 24] }, // Page 323: Surah 21, verses 11-24     
324: { 21: [25, 35] }, // Page 324: Surah 21, verses 25-35     
325: { 21: [36, 44] }, // Page 325: Surah 21, verses 36-44     
326: { 21: [45, 57] }, // Page 326: Surah 21, verses 45-57     
327: { 21: [58, 72] }, // Page 327: Surah 21, verses 58-72     
328: { 21: [73, 81] }, // Page 328: Surah 21, verses 73-81     
329: { 21: [82, 90] }, // Page 329: Surah 21, verses 82-90     
330: { 21: [91, 101] }, // Page 330: Surah 21, verses 91-101     
331: { 21: [102, 112] }, // Page 331: Surah 21, verses 102-112     
332: { 22: [1, 5] }, // Page 332: Surah 22, verses 1-5     
333: { 22: [6, 15] }, // Page 333: Surah 22, verses 6-15     
334: { 22: [16, 23] }, // Page 334: Surah 22, verses 16-23     
335: { 22: [24, 30] }, // Page 335: Surah 22, verses 24-30     
336: { 22: [31, 38] }, // Page 336: Surah 22, verses 31-38     
337: { 22: [39, 46] }, // Page 337: Surah 22, verses 39-46     
338: { 22: [47, 55] }, // Page 338: Surah 22, verses 47-55     
339: { 22: [56, 64] }, // Page 339: Surah 22, verses 56-64     
340: { 22: [65, 72] }, // Page 340: Surah 22, verses 65-72     
341: { 22: [73, 78] }, // Page 341: Surah 22, verses 73-78     
342: { 23: [1, 17] }, // Page 342: Surah 23, verses 1-17     
343: { 23: [18, 27] }, // Page 343: Surah 23, verses 18-27     
344: { 23: [28, 42] }, // Page 344: Surah 23, verses 28-42     
345: { 23: [43, 59] }, // Page 345: Surah 23, verses 43-59     
346: { 23: [60, 74] }, // Page 346: Surah 23, verses 60-74     
347: { 23: [75, 89] }, // Page 347: Surah 23, verses 75-89     
348: { 23: [90, 104] }, // Page 348: Surah 23, verses 90-104     
349: { 23: [105, 118] }, // Page 349: Surah 23, verses 105-118     
350: { 24: [1, 10] }, // Page 350: Surah 24, verses 1-10     
351: { 24: [11, 20] }, // Page 351: Surah 24, verses 11-20     
352: { 24: [21, 27] }, // Page 352: Surah 24, verses 21-27     
353: { 24: [28, 31] }, // Page 353: Surah 24, verses 28-31     
354: { 24: [32, 36] }, // Page 354: Surah 24, verses 32-36     
355: { 24: [37, 43] }, // Page 355: Surah 24, verses 37-43     
356: { 24: [44, 53] }, // Page 356: Surah 24, verses 44-53     
357: { 24: [54, 58] }, // Page 357: Surah 24, verses 54-58     
358: { 24: [59, 61] }, // Page 358: Surah 24, verses 59-61     
359: { 24: [62, 64], 25: [1, 2] }, // Page 359: Surah 24 (62-64), Surah 25 (1-2)     
360: { 25: [3, 11] }, // Page 360: Surah 25, verses 3-11     
361: { 25: [12, 20] }, // Page 361: Surah 25, verses 12-20     
362: { 25: [21, 32] }, // Page 362: Surah 25, verses 21-32     
363: { 25: [33, 43] }, // Page 363: Surah 25, verses 33-43     
364: { 25: [44, 55] }, // Page 364: Surah 25, verses 44-55     
365: { 25: [56, 67] }, // Page 365: Surah 25, verses 56-67     
366: { 25: [68, 77] }, // Page 366: Surah 25, verses 68-77     
367: { 26: [1, 19] }, // Page 367: Surah 26, verses 1-19     
368: { 26: [20, 39] }, // Page 368: Surah 26, verses 20-39     
369: { 26: [40, 60] }, // Page 369: Surah 26, verses 40-60     
370: { 26: [61, 83] }, // Page 370: Surah 26, verses 61-83     
371: { 26: [84, 111] }, // Page 371: Surah 26, verses 84-111     
372: { 26: [112, 136] }, // Page 372: Surah 26, verses 112-136     
373: { 26: [137, 159] }, // Page 373: Surah 26, verses 137-159     
374: { 26: [160, 183] }, // Page 374: Surah 26, verses 160-183     
375: { 26: [184, 206] }, // Page 375: Surah 26, verses 184-206     
376: { 26: [207, 227] }, // Page 376: Surah 26, verses 207-227     
377: { 27: [1, 13] }, // Page 377: Surah 27, verses 1-13     
378: { 27: [14, 22] }, // Page 378: Surah 27, verses 14-22     
379: { 27: [23, 35] }, // Page 379: Surah 27, verses 23-35     
380: { 27: [36, 44] }, // Page 380: Surah 27, verses 36-44     
381: { 27: [45, 55] }, // Page 381: Surah 27, verses 45-55     
382: { 27: [56, 63] }, // Page 382: Surah 27, verses 56-63     
383: { 27: [64, 76] }, // Page 383: Surah 27, verses 64-76     
384: { 27: [77, 88] }, // Page 384: Surah 27, verses 77-88     
385: { 27: [89, 93], 28: [1, 5] }, // Page 385: Surah 27 (89-93), Surah 28 (1-5)     
386: { 28: [6, 13] }, // Page 386: Surah 28, verses 6-13     
387: { 28: [14, 21] }, // Page 387: Surah 28, verses 14-21     
388: { 28: [22, 28] }, // Page 388: Surah 28, verses 22-28     
389: { 28: [29, 35] }, // Page 389: Surah 28, verses 29-35     
390: { 28: [36, 43] }, // Page 390: Surah 28, verses 36-43     
391: { 28: [44, 50] }, // Page 391: Surah 28, verses 44-50     
392: { 28: [51, 59] }, // Page 392: Surah 28, verses 51-59     
393: { 28: [60, 70] }, // Page 393: Surah 28, verses 60-70     
394: { 28: [71, 77] }, // Page 394: Surah 28, verses 71-77     
395: { 28: [78, 84] }, // Page 395: Surah 28, verses 78-84     
396: { 28: [85, 88], 29: [1, 6] }, // Page 396: Surah 28 (85-88), Surah 29 (1-6)     
397: { 29: [7, 14] }, // Page 397: Surah 29, verses 7-14     
398: { 29: [15, 23] }, // Page 398: Surah 29, verses 15-23     
399: { 29: [24, 30] }, // Page 399: Surah 29, verses 24-30     
400: { 29: [31, 38] }, // Page 400: Surah 29, verses 31-38     
401: { 29: [39, 45] }, // Page 401: Surah 29, verses 39-45     
402: { 29: [46, 52] }, // Page 402: Surah 29, verses 46-52     
403: { 29: [53, 63] }, // Page 403: Surah 29, verses 53-63     
404: { 29: [64, 69], 30: [1, 5] }, // Page 404: Surah 29 (64-69), Surah 30 (1-5)     
405: { 30: [6, 15] }, // Page 405: Surah 30, verses 6-15     
406: { 30: [16, 24] }, // Page 406: Surah 30, verses 16-24     
407: { 30: [25, 32] }, // Page 407: Surah 30, verses 25-32     
408: { 30: [33, 41] }, // Page 408: Surah 30, verses 33-41     
409: { 30: [42, 50] }, // Page 409: Surah 30, verses 42-50     
410: { 30: [51, 60] }, // Page 410: Surah 30, verses 51-60     
411: { 31: [1, 11] }, // Page 411: Surah 31, verses 1-11     
412: { 31: [12, 19] }, // Page 412: Surah 31, verses 12-19     
413: { 31: [20, 28] }, // Page 413: Surah 31, verses 20-28     
414: { 31: [29, 34] }, // Page 414: Surah 31, verses 29-34     
415: { 32: [1, 11] }, // Page 415: Surah 32, verses 1-11     
416: { 32: [12, 20] }, // Page 416: Surah 32, verses 12-20     
417: { 32: [21, 30] }, // Page 417: Surah 32, verses 21-30     
418: { 33: [1, 6] }, // Page 418: Surah 33, verses 1-6     
419: { 33: [7, 15] }, // Page 419: Surah 33, verses 7-15     
420: { 33: [16, 22] }, // Page 420: Surah 33, verses 16-22     
421: { 33: [23, 30] }, // Page 421: Surah 33, verses 23-30     
422: { 33: [31, 35] }, // Page 422: Surah 33, verses 31-35     
423: { 33: [36, 43] }, // Page 423: Surah 33, verses 36-43     
424: { 33: [44, 50] }, // Page 424: Surah 33, verses 44-50     
425: { 33: [51, 54] }, // Page 425: Surah 33, verses 51-54     
426: { 33: [55, 62] }, // Page 426: Surah 33, verses 55-62     
427: { 33: [63, 73] }, // Page 427: Surah 33, verses 63-73     
428: { 34: [1, 7] }, // Page 428: Surah 34, verses 1-7     
429: { 34: [8, 14] }, // Page 429: Surah 34, verses 8-14     
430: { 34: [15, 22] }, // Page 430: Surah 34, verses 15-22     
431: { 34: [23, 31] }, // Page 431: Surah 34, verses 23-31     
432: { 34: [32, 39] }, // Page 432: Surah 34, verses 32-39     
433: { 34: [40, 48] }, // Page 433: Surah 34, verses 40-48     
434: { 34: [49, 54], 35: [1, 3] }, // Page 434: Surah 34 (49-54), Surah 35 (1-3)     
435: { 35: [4, 11] }, // Page 435: Surah 35, verses 4-11     
436: { 35: [12, 18] }, // Page 436: Surah 35, verses 12-18     
437: { 35: [19, 30] }, // Page 437: Surah 35, verses 19-30     
438: { 35: [31, 38] }, // Page 438: Surah 35, verses 31-38     
439: { 35: [39, 44] }, // Page 439: Surah 35, verses 39-44     
440: { 35: [45, 45], 36: [1, 12] }, // Page 440: Surah 35 (45-45), Surah 36 (1-12)     
441: { 36: [13, 27] }, // Page 441: Surah 36, verses 13-27     
442: { 36: [28, 40] }, // Page 442: Surah 36, verses 28-40     
443: { 36: [41, 54] }, // Page 443: Surah 36, verses 41-54     
444: { 36: [55, 70] }, // Page 444: Surah 36, verses 55-70     
445: { 36: [71, 83] }, // Page 445: Surah 36, verses 71-83     
446: { 37: [1, 24] }, // Page 446: Surah 37, verses 1-24     
447: { 37: [25, 51] }, // Page 447: Surah 37, verses 25-51     
448: { 37: [52, 76] }, // Page 448: Surah 37, verses 52-76     
449: { 37: [77, 102] }, // Page 449: Surah 37, verses 77-102     
450: { 37: [103, 126] }, // Page 450: Surah 37, verses 103-126     
451: { 37: [127, 153] }, // Page 451: Surah 37, verses 127-153     
452: { 37: [154, 182] }, // Page 452: Surah 37, verses 154-182     
453: { 38: [1, 16] }, // Page 453: Surah 38, verses 1-16     
454: { 38: [17, 26] }, // Page 454: Surah 38, verses 17-26     
455: { 38: [27, 42] }, // Page 455: Surah 38, verses 27-42     
456: { 38: [43, 61] }, // Page 456: Surah 38, verses 43-61     
457: { 38: [62, 83] }, // Page 457: Surah 38, verses 62-83     
458: { 38: [84, 88], 39: [1, 5] }, // Page 458: Surah 38 (84-88), Surah 39 (1-5)     
459: { 39: [6, 10] }, // Page 459: Surah 39, verses 6-10     
460: { 39: [11, 21] }, // Page 460: Surah 39, verses 11-21     
461: { 39: [22, 31] }, // Page 461: Surah 39, verses 22-31     
462: { 39: [32, 40] }, // Page 462: Surah 39, verses 32-40     
463: { 39: [41, 47] }, // Page 463: Surah 39, verses 41-47     
464: { 39: [48, 56] }, // Page 464: Surah 39, verses 48-56     
465: { 39: [57, 67] }, // Page 465: Surah 39, verses 57-67     
466: { 39: [68, 74] }, // Page 466: Surah 39, verses 68-74     
467: { 39: [75, 75], 40: [1, 7] }, // Page 467: Surah 39 (75-75), Surah 40 (1-7)     
468: { 40: [8, 16] }, // Page 468: Surah 40, verses 8-16     
469: { 40: [17, 25] }, // Page 469: Surah 40, verses 17-25     
470: { 40: [26, 33] }, // Page 470: Surah 40, verses 26-33     
471: { 40: [34, 40] }, // Page 471: Surah 40, verses 34-40     
472: { 40: [41, 49] }, // Page 472: Surah 40, verses 41-49     
473: { 40: [50, 58] }, // Page 473: Surah 40, verses 50-58     
474: { 40: [59, 66] }, // Page 474: Surah 40, verses 59-66     
475: { 40: [67, 77] }, // Page 475: Surah 40, verses 67-77     
476: { 40: [78, 85] }, // Page 476: Surah 40, verses 78-85     
477: { 41: [1, 11] }, // Page 477: Surah 41, verses 1-11     
478: { 41: [12, 20] }, // Page 478: Surah 41, verses 12-20     
479: { 41: [21, 29] }, // Page 479: Surah 41, verses 21-29     
480: { 41: [30, 38] }, // Page 480: Surah 41, verses 30-38     
481: { 41: [39, 46] }, // Page 481: Surah 41, verses 39-46     
482: { 41: [47, 54] }, // Page 482: Surah 41, verses 47-54     
483: { 42: [1, 10] }, // Page 483: Surah 42, verses 1-10     
484: { 42: [11, 15] }, // Page 484: Surah 42, verses 11-15     
485: { 42: [16, 22] }, // Page 485: Surah 42, verses 16-22     
486: { 42: [23, 31] }, // Page 486: Surah 42, verses 23-31     
487: { 42: [32, 44] }, // Page 487: Surah 42, verses 32-44     
488: { 42: [45, 51] }, // Page 488: Surah 42, verses 45-51     
489: { 42: [52, 53], 43: [1, 10] }, // Page 489: Surah 42 (52-53), Surah 43 (1-10)     
490: { 43: [11, 22] }, // Page 490: Surah 43, verses 11-22     
491: { 43: [23, 33] }, // Page 491: Surah 43, verses 23-33     
492: { 43: [34, 47] }, // Page 492: Surah 43, verses 34-47     
493: { 43: [48, 60] }, // Page 493: Surah 43, verses 48-60     
494: { 43: [61, 73] }, // Page 494: Surah 43, verses 61-73     
495: { 43: [74, 89] }, // Page 495: Surah 43, verses 74-89     
496: { 44: [1, 18] }, // Page 496: Surah 44, verses 1-18     
497: { 44: [19, 39] }, // Page 497: Surah 44, verses 19-39     
498: { 44: [40, 59] }, // Page 498: Surah 44, verses 40-59     
499: { 45: [1, 13] }, // Page 499: Surah 45, verses 1-13     
500: { 45: [14, 22] }, // Page 500: Surah 45, verses 14-22     
501: { 45: [23, 32] }, // Page 501: Surah 45, verses 23-32     
502: { 45: [33, 37], 46: [1, 5] }, // Page 502: Surah 45 (33-37), Surah 46 (1-5)     
503: { 46: [6, 14] }, // Page 503: Surah 46, verses 6-14     
504: { 46: [15, 20] }, // Page 504: Surah 46, verses 15-20     
505: { 46: [21, 28] }, // Page 505: Surah 46, verses 21-28     
506: { 46: [29, 35] }, // Page 506: Surah 46, verses 29-35     
507: { 47: [1, 11] }, // Page 507: Surah 47, verses 1-11     
508: { 47: [12, 19] }, // Page 508: Surah 47, verses 12-19     
509: { 47: [20, 29] }, // Page 509: Surah 47, verses 20-29     
510: { 47: [30, 38] }, // Page 510: Surah 47, verses 30-38     
511: { 48: [1, 9] }, // Page 511: Surah 48, verses 1-9     
512: { 48: [10, 15] }, // Page 512: Surah 48, verses 10-15     
513: { 48: [16, 23] }, // Page 513: Surah 48, verses 16-23     
514: { 48: [24, 28] }, // Page 514: Surah 48, verses 24-28     
515: { 48: [29, 29], 49: [1, 4] }, // Page 515: Surah 48 (29-29), Surah 49 (1-4)     
516: { 49: [5, 11] }, // Page 516: Surah 49, verses 5-11     
517: { 49: [12, 18] }, // Page 517: Surah 49, verses 12-18     
518: { 50: [1, 15] }, // Page 518: Surah 50, verses 1-15     
519: { 50: [16, 35] }, // Page 519: Surah 50, verses 16-35     
520: { 50: [36, 45], 51: [1, 6] }, // Page 520: Surah 50 (36-45), Surah 51 (1-6)     
521: { 51: [7, 30] }, // Page 521: Surah 51, verses 7-30     
522: { 51: [31, 51] }, // Page 522: Surah 51, verses 31-51     
523: { 51: [52, 60], 52: [1, 14] }, // Page 523: Surah 51 (52-60), Surah 52 (1-14)     
524: { 52: [15, 31] }, // Page 524: Surah 52, verses 15-31     
525: { 52: [32, 49] }, // Page 525: Surah 52, verses 32-49     
526: { 53: [1, 26] }, // Page 526: Surah 53, verses 1-26     
527: { 53: [27, 44] }, // Page 527: Surah 53, verses 27-44     
528: { 53: [45, 62], 54: [1, 6] }, // Page 528: Surah 53 (45-62), Surah 54 (1-6)     
529: { 54: [7, 27] }, // Page 529: Surah 54, verses 7-27     
530: { 54: [28, 49] }, // Page 530: Surah 54, verses 28-49     
531: { 54: [50, 55], 55: [1, 16] }, // Page 531: Surah 54 (50-55), Surah 55 (1-16)     
532: { 55: [17, 40] }, // Page 532: Surah 55, verses 17-40     
533: { 55: [41, 67] }, // Page 533: Surah 55, verses 41-67     
534: { 55: [68, 78], 56: [1, 16] }, // Page 534: Surah 55 (68-78), Surah 56 (1-16)     
535: { 56: [17, 50] }, // Page 535: Surah 56, verses 17-50     
536: { 56: [51, 76] }, // Page 536: Surah 56, verses 51-76     
537: { 56: [77, 96], 57: [1, 3] }, // Page 537: Surah 56 (77-96), Surah 57 (1-3)     
538: { 57: [4, 11] }, // Page 538: Surah 57, verses 4-11     
539: { 57: [12, 18] }, // Page 539: Surah 57, verses 12-18     
540: { 57: [19, 24] }, // Page 540: Surah 57, verses 19-24     
541: { 57: [25, 29] }, // Page 541: Surah 57, verses 25-29     
542: { 58: [1, 6] }, // Page 542: Surah 58, verses 1-6     
543: { 58: [7, 11] }, // Page 543: Surah 58, verses 7-11     
544: { 58: [12, 21] }, // Page 544: Surah 58, verses 12-21     
545: { 58: [22, 22], 59: [1, 3] }, // Page 545: Surah 58 (22-22), Surah 59 (1-3)     
546: { 59: [4, 9] }, // Page 546: Surah 59, verses 4-9     
547: { 59: [10, 16] }, // Page 547: Surah 59, verses 10-16     
548: { 59: [17, 24] }, // Page 548: Surah 59, verses 17-24     
549: { 60: [1, 5] }, // Page 549: Surah 60, verses 1-5     
550: { 60: [6, 11] }, // Page 550: Surah 60, verses 6-11     
551: { 60: [12, 13], 61: [1, 5] }, // Page 551: Surah 60 (12-13), Surah 61 (1-5)     
552: { 61: [6, 14] }, // Page 552: Surah 61, verses 6-14     
553: { 62: [1, 8] }, // Page 553: Surah 62, verses 1-8     
554: { 62: [9, 11], 63: [1, 4] }, // Page 554: Surah 62 (9-11), Surah 63 (1-4)     
555: { 63: [5, 11] }, // Page 555: Surah 63, verses 5-11     
556: { 64: [1, 9] }, // Page 556: Surah 64, verses 1-9     
557: { 64: [10, 18] }, // Page 557: Surah 64, verses 10-18     
558: { 65: [1, 5] }, // Page 558: Surah 65, verses 1-5     
559: { 65: [6, 12] }, // Page 559: Surah 65, verses 6-12     
560: { 66: [1, 7] }, // Page 560: Surah 66, verses 1-7     
561: { 66: [8, 12] }, // Page 561: Surah 66, verses 8-12     
562: { 67: [1, 12] }, // Page 562: Surah 67, verses 1-12     
563: { 67: [13, 26] }, // Page 563: Surah 67, verses 13-26     
564: { 67: [27, 30], 68: [1, 15] }, // Page 564: Surah 67 (27-30), Surah 68 (1-15)     
565: { 68: [16, 42] }, // Page 565: Surah 68, verses 16-42     
566: { 68: [43, 52], 69: [1, 8] }, // Page 566: Surah 68 (43-52), Surah 69 (1-8)     
567: { 69: [9, 34] }, // Page 567: Surah 69, verses 9-34     
568: { 69: [35, 52], 70: [1, 10] }, // Page 568: Surah 69 (35-52), Surah 70 (1-10)     
569: { 70: [11, 39] }, // Page 569: Surah 70, verses 11-39     
570: { 70: [40, 44], 71: [1, 10] }, // Page 570: Surah 70 (40-44), Surah 71 (1-10)     
571: { 71: [11, 28] }, // Page 571: Surah 71, verses 11-28     
572: { 72: [1, 13] }, // Page 572: Surah 72, verses 1-13     
573: { 72: [14, 28] }, // Page 573: Surah 72, verses 14-28     
574: { 73: [1, 19] }, // Page 574: Surah 73, verses 1-19     
575: { 73: [20, 20], 74: [1, 17] }, // Page 575: Surah 73 (20-20), Surah 74 (1-17)     
576: { 74: [18, 47] }, // Page 576: Surah 74, verses 18-47     
577: { 74: [48, 56], 75: [1, 19] }, // Page 577: Surah 74 (48-56), Surah 75 (1-19)     
578: { 75: [20, 40], 76: [1, 5] }, // Page 578: Surah 75 (20-40), Surah 76 (1-5)     
579: { 76: [6, 25] }, // Page 579: Surah 76, verses 6-25     
580: { 76: [26, 31], 77: [1, 19] }, // Page 580: Surah 76 (26-31), Surah 77 (1-19)     
581: { 77: [20, 50] }, // Page 581: Surah 77, verses 20-50     
582: { 78: [1, 30] }, // Page 582: Surah 78, verses 1-30     
583: { 78: [31, 40], 79: [1, 15] }, // Page 583: Surah 78 (31-40), Surah 79 (1-15)     
584: { 79: [16, 46] }, // Page 584: Surah 79, verses 16-46     
585: { 80: [1, 42] }, // Page 585: Surah 80, verses 1-42     
586: { 81: [1, 29] }, // Page 586: Surah 81, verses 1-29     
587: { 82: [1, 19], 83: [1, 6] }, // Page 587: Surah 82 (1-19), Surah 83 (1-6)     
588: { 83: [7, 34] }, // Page 588: Surah 83, verses 7-34     
589: { 83: [35, 36], 84: [1, 25] }, // Page 589: Surah 83 (35-36), Surah 84 (1-25)     
590: { 85: [1, 22] }, // Page 590: Surah 85, verses 1-22     
591: { 86: [1, 17], 87: [1, 15] }, // Page 591: Surah 86 (1-17), Surah 87 (1-15)     
592: { 87: [16, 19], 88: [1, 26] }, // Page 592: Surah 87 (16-19), Surah 88 (1-26)     
593: { 89: [1, 23] }, // Page 593: Surah 89, verses 1-23     
594: { 89: [24, 30], 90: [1, 20] }, // Page 594: Surah 89 (24-30), Surah 90 (1-20)     
595: { 91: [1, 15], 92: [1, 14] }, // Page 595: Surah 91 (1-15), Surah 92 (1-14)     
596: { 92: [15, 21], 93: [1, 11], 94: [1, 8] }, // Page 596: Surah 92 (15-21), Surah 93 (1-11), Surah 94 (1-8)     
597: { 95: [1, 8], 96: [1, 19] }, // Page 597: Surah 95 (1-8), Surah 96 (1-19)     
598: { 97: [1, 5], 98: [1, 7] }, // Page 598: Surah 97 (1-5), Surah 98 (1-7)     
599: { 98: [8, 8], 99: [1, 8], 100: [1, 9] }, // Page 599: Surah 98 (8-8), Surah 99 (1-8), Surah 100 (1-9)     
600: { 100: [10, 11], 101: [1, 11], 102: [1, 8] }, // Page 600: Surah 100 (10-11), Surah 101 (1-11), Surah 102 (1-8)     
601: { 103: [1, 3], 104: [1, 9], 105: [1, 5] }, // Page 601: Surah 103 (1-3), Surah 104 (1-9), Surah 105 (1-5)     
602: { 106: [1, 4], 107: [1, 7], 108: [1, 3] }, // Page 602: Surah 106 (1-4), Surah 107 (1-7), Surah 108 (1-3)     
603: { 109: [1, 6], 110: [1, 3], 111: [1, 5] }, // Page 603: Surah 109 (1-6), Surah 110 (1-3), Surah 111 (1-5)     
604: { 112: [1, 4], 113: [1, 5], 114: [1, 6] } 
};
// Function to find current page based on chapter and verse
function getCurrentPage(chapter, verse) {
    // Direct lookup in pageVerseData
    for (let page = 1; page <= 604; page++) {
        const pageContent = pageVerseData[page];
        if (pageContent && pageContent[chapter]) {
            const verseRange = pageContent[chapter];
            if (verse >= verseRange[0] && verse <= verseRange[1]) {
                return page;
            }
        }
    }
    
    // If not found in pageVerseData, use pageData as fallback
    for (let page = 1; page <= 604; page++) {
        if (pageData[page] && pageData[page + 1]) {
            const currentPageStart = pageData[page];
            const nextPageStart = pageData[page + 1];
            
            if (chapter < nextPageStart.startChapter || 
                (chapter === nextPageStart.startChapter && verse < nextPageStart.startVerse)) {
                if (chapter > currentPageStart.startChapter || 
                    (chapter === currentPageStart.startChapter && verse >= currentPageStart.startVerse)) {
                    return page;
                }
            }
        }
    }
    
    // Handle last page
    const lastPageData = pageData[604];
    if (lastPageData && (chapter > lastPageData.startChapter || 
        (chapter === lastPageData.startChapter && verse >= lastPageData.startVerse))) {
        return 604;
    }
    
    return 1; // Default fallback
}

// Current page tracking
let currentPage = 1;

// Application state
let currentChapter = 1;
let currentVerse = 1;
let zoomLevel = 100;
let isFullscreen = false;
let bookmarks = [];
let searchResults = [];
window.quranLoaded = false;

// Load Quran data from JSON file
async function loadQuranData() {
  try {
    const response = await fetch('quran_structured.json');
    const rawData = await response.json();

    // Convert verse numbers from strings to integers for easier handling
    Object.keys(rawData).forEach(chapterNum => {
      const chapter = rawData[chapterNum];
      const newChapter = {};
      Object.keys(chapter).forEach(verseNum => {
        newChapter[parseInt(verseNum)] = chapter[verseNum];
      });
      quranData[parseInt(chapterNum)] = newChapter;
    });

    window.quranLoaded = true;
    displayPage();
    populateChapterSelector();
    loadQuranPreferences();
    return Promise.resolve(); // Return resolved promise
  } catch (error) {
    console.error('Error loading Quran data:', error);
    document.getElementById('content').innerHTML = 
      '<p style="text-align: center; font-size: 1.5em; color: #e74c3c;">خطأ في تحميل البيانات</p>';
    return Promise.reject(error);
  }
}

// Display current page instead of chapter
function displayPage() {
const content = document.getElementById('content');
const chapterInfo = document.getElementById('chapterInfo');

if (!pageData[currentPage]) {
content.innerHTML = '<p style="text-align: center; font-size: 1.5em; color: #e74c3c;">الصفحة غير متوفرة</p>';
return;
}

// Use pageVerseData for accurate page content
const pageContent = pageVerseData[currentPage];
if (!pageContent) {
content.innerHTML = '<p style="text-align: center; font-size: 1.5em; color: #e74c3c;">محتوى الصفحة غير متوفر</p>';
return;
}

let html = '';

// Process each chapter in the page
Object.keys(pageContent).forEach(chapterNum => {
const chapterNumber = parseInt(chapterNum);
const verseRange = pageContent[chapterNum];
const chapter = quranData[chapterNumber];
const chapterName = chapterNames[chapterNumber];

if (!chapter) return;

// Add chapter title for new chapter (except continuing chapters)
const isNewChapter = verseRange[0] === 1;
if (isNewChapter && chapterNumber !== 1) {
html += `<div class="chapter-title">${chapterName}</div>`;
}

// Add verses for this chapter in this page
for (let verseNum = verseRange[0]; verseNum <= verseRange[1]; verseNum++) {
if (chapter[verseNum]) {
const isCurrentVerse = (verseNum === currentVerse && chapterNumber === currentChapter);
const highlightClass = isCurrentVerse ? 'style="background: rgba(77, 192, 181, 0.2); border-color: #4dc0b5; box-shadow: 0 0 15px rgba(77, 192, 181, 0.3);"' : '';

html += `
                   <div class="verse" ${highlightClass} onclick="setCurrentVerse(${chapterNumber}, ${verseNum})">
                       <span class="verse-number">${verseNum}</span>
                       ${chapter[verseNum]}
                   </div>
               `;
}
}
});

content.innerHTML = html || '<p style="text-align: center;">لا توجد آيات في هذه الصفحة</p>';
content.className = 'quran-content-area fade-in';

// Update page info
chapterInfo.innerHTML = `صفحة ${currentPage} من 604`;

// Update navigation buttons
updatePageNavigation();
saveQuranPreferences();
}




// Populate chapter selector modal
function populateChapterSelector() {
const chapterGrid = document.getElementById('chapterGrid');
let html = '';

Object.keys(chapterNames).forEach(chapterNum => {
const num = parseInt(chapterNum);
const name = chapterNames[num];
const verseCount = quranData[num] ? Object.keys(quranData[num]).length : 0;

html += `
                   <div class="chapter-item" onclick="goToChapter(${num})">
                       <h4>${num}. ${name}</h4>
                       <p>${verseCount} آية</p>
                   </div>
               `;
});

chapterGrid.innerHTML = html;
}

// Show chapter selector modal
function showChapterSelector() {
document.getElementById('chapterModal').style.display = 'block';
}

// Hide chapter selector modal
function hideChapterSelector() {
document.getElementById('chapterModal').style.display = 'none';
}

// Populate juz selector modal
function populateJuzSelector() {
const juzGrid = document.getElementById('juzGrid');
let html = '';

Object.keys(juzData).forEach(juzNum => {
const num = parseInt(juzNum);
const juz = juzData[num];
const chapterName = chapterNames[juz.startChapter];

html += `
           <div class="chapter-item" onclick="goToJuz(${num})">
               <h4>${num}. ${juz.name}</h4>
               <p>يبدأ من سورة ${chapterName} - آية ${juz.startVerse}</p>
           </div>
       `;
});

juzGrid.innerHTML = html;
}

// Show juz selector modal
function showJuzSelector() {
populateJuzSelector();
document.getElementById('juzModal').style.display = 'block';
}

// Hide juz selector modal
function hideJuzSelector() {
document.getElementById('juzModal').style.display = 'none';
}

// Go to specific juz
function goToJuz(juzNumber) {
if (juzNumber && juzNumber >= 1 && juzNumber <= 30 && juzData[juzNumber]) {
const juz = juzData[juzNumber];
currentChapter = juz.startChapter;
currentVerse = juz.startVerse;
// Find the correct page for this juz
currentPage = getCurrentPage(currentChapter, currentVerse);
displayPage();
hideJuzSelector();
}
}

// Page navigation functions
function nextPage() {
if (currentPage < 604) {
currentPage++;
goToPage(currentPage);
}
}

function previousPage() {
if (currentPage > 1) {
currentPage--;
goToPage(currentPage);
}
}

function goToPage(pageNumber) {
if (pageNumber >= 1 && pageNumber <= 604 && pageData[pageNumber]) {
currentPage = pageNumber;
const pageStart = pageData[pageNumber];
currentChapter = pageStart.startChapter;
currentVerse = pageStart.startVerse;
displayChapter();
updatePageNavigation();
}
}

function goToPageByInput() {
const pageInput = document.getElementById('pageInput');
const pageNumber = parseInt(pageInput.value);

if (pageNumber && pageNumber >= 1 && pageNumber <= 604) {
goToPage(pageNumber);
hidePageSelector();
} else {
alert('يرجى إدخال رقم صفحة صحيح من 1 إلى 604');
}
}

// Show page selector modal
function showPageSelector() {
populatePageSelector();
document.getElementById('pageModal').style.display = 'block';
}

// Hide page selector modal
function hidePageSelector() {
document.getElementById('pageModal').style.display = 'none';
}

// Populate page selector with some key pages
function populatePageSelector() {
const pageGrid = document.getElementById('pageGrid');
let html = '';

// Show some key pages (every 20th page + juz starting pages)
const keyPages = [1, 21, 41, 61, 81, 101, 121, 141, 161, 181, 201, 221, 241, 261, 281, 301, 321, 341, 361, 381, 401, 421, 441, 461, 481, 501, 521, 541, 561, 581, 604];

keyPages.forEach(pageNum => {
if (pageData[pageNum]) {
const pageStart = pageData[pageNum];
const chapterName = chapterNames[pageStart.startChapter];

html += `
               <div class="chapter-item" onclick="goToPage(${pageNum})">
                   <h4>صفحة ${pageNum}</h4>
                   <p>سورة ${chapterName} - آية ${pageStart.startVerse}</p>
               </div>
           `;
}
});

pageGrid.innerHTML = html;
}

// Update page navigation buttons
function updatePageNavigation() {
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const prevPageBtnBottom = document.getElementById('prevPageBtnBottom');
const nextPageBtnBottom = document.getElementById('nextPageBtnBottom');

// Update button states
[prevPageBtn, prevPageBtnBottom].forEach(btn => {
if (btn) {
btn.style.opacity = currentPage === 1 ? '0.5' : '1';
btn.disabled = currentPage === 1;
}
});

[nextPageBtn, nextPageBtnBottom].forEach(btn => {
if (btn) {
btn.style.opacity = currentPage === 604 ? '0.5' : '1';
btn.disabled = currentPage === 604;
}
});
}

// Go to specific chapter
function goToChapter(chapterNumber = null) {
if (chapterNumber === null) {
const input = prompt('أدخل رقم السورة (1-114):');
chapterNumber = parseInt(input);
}

if (chapterNumber && chapterNumber >= 1 && chapterNumber <= 114 && quranData[chapterNumber]) {
currentChapter = chapterNumber;
currentVerse = 1;
// Find the correct page for this chapter
currentPage = getCurrentPage(currentChapter, currentVerse);
displayPage();
hideChapterSelector();
}
}

// In goToJuz function (around line 1050)
function goToJuz(juzNumber) {
if (juzNumber && juzNumber >= 1 && juzNumber <= 30 && juzData[juzNumber]) {
const juz = juzData[juzNumber];
currentChapter = juz.startChapter;
currentVerse = juz.startVerse;
        displayPage(); // Changed from displayChapter()
        // Find the correct page for this juz
        currentPage = getCurrentPage(currentChapter, currentVerse);
        displayPage();
hideJuzSelector();
}
}

// In goToPage function (around line 990)
function goToPage(pageNumber) {
if (pageNumber >= 1 && pageNumber <= 604 && pageData[pageNumber]) {
currentPage = pageNumber;
const pageStart = pageData[pageNumber];
currentChapter = pageStart.startChapter;
currentVerse = pageStart.startVerse;
displayPage();
updatePageNavigation();
}
}

function setCurrentVerse(chapterNum, verseNumber) {
    currentChapter = chapterNum;
    currentVerse = verseNumber;
    
    // Find the correct page using the improved getCurrentPage function
    currentPage = getCurrentPage(chapterNum, verseNumber);
    
    displayPage();
    
    // Scroll to the specific verse after display
    setTimeout(() => {
        scrollToCurrentVerse();
    }, 100);
}

// Navigation functions
function nextVerse() {
const chapter = quranData[currentChapter];
if (chapter) {
const verses = Object.keys(chapter).map(v => parseInt(v)).sort((a, b) => a - b);
const maxVerse = Math.max(...verses);

if (currentVerse < maxVerse) {
currentVerse++;
displayPage(); // Changed from displayChapter()
} else {
nextChapter();
}
}
}

function previousVerse() {
if (currentVerse > 1) {
currentVerse--;
displayPage(); // Changed from displayChapter()
} else {
previousChapter();
}
}

function nextChapter() {
const chapterNumbers = Object.keys(quranData).map(Number).sort((a, b) => a - b);
const currentIndex = chapterNumbers.indexOf(currentChapter);

if (currentIndex < chapterNumbers.length - 1) {
currentChapter = chapterNumbers[currentIndex + 1];
currentVerse = 1;
// Find the page for this chapter
currentPage = getCurrentPage(currentChapter, currentVerse);
displayPage(); // Changed from displayChapter()
}
}

function previousChapter() {
const chapterNumbers = Object.keys(quranData).map(Number).sort((a, b) => a - b);
const currentIndex = chapterNumbers.indexOf(currentChapter);

if (currentIndex > 0) {
currentChapter = chapterNumbers[currentIndex - 1];
const chapter = quranData[currentChapter];
const verses = Object.keys(chapter).map(v => parseInt(v)).sort((a, b) => a - b);
currentVerse = Math.max(...verses);
// Find the page for this chapter and verse
currentPage = getCurrentPage(currentChapter, currentVerse);
displayPage(); // Changed from displayChapter()
}
}

// Update navigation buttons
function updateNavigationButtons() {
const chapterNumbers = Object.keys(quranData).map(Number).sort((a, b) => a - b);
const currentIndex = chapterNumbers.indexOf(currentChapter);

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtnBottom = document.getElementById('prevBtnBottom');
const nextBtnBottom = document.getElementById('nextBtnBottom');

// Disable/enable buttons based on position
const isFirstChapter = currentIndex === 0;
const isLastChapter = currentIndex === chapterNumbers.length - 1;

[prevBtn, prevBtnBottom].forEach(btn => {
if (btn) {
btn.style.opacity = isFirstChapter ? '0.5' : '1';
btn.disabled = isFirstChapter;
}
});

[nextBtn, nextBtnBottom].forEach(btn => {
if (btn) {
btn.style.opacity = isLastChapter ? '0.5' : '1';
btn.disabled = isLastChapter;
}
});
}

// Zoom functions
function zoomIn() {
if (zoomLevel < 200) {
zoomLevel += 10;
applyZoom();
}
}

function zoomOut() {
if (zoomLevel > 50) {
zoomLevel -= 10;
applyZoom();
}
}

function resetZoom() {
zoomLevel = 100;
applyZoom();
}

function applyZoom() {
const content = document.getElementById('content');
if (content) {
content.style.fontSize = `${zoomLevel}%`;
saveQuranPreferences();
}
}

// Fullscreen functionality
function toggleFullscreen() {
const quranContainer = document.querySelector('.quran-container');

if (!isFullscreen) {
quranContainer.style.position = 'fixed';
quranContainer.style.top = '0';
quranContainer.style.left = '0';
quranContainer.style.width = '100vw';
quranContainer.style.height = '100vh';
quranContainer.style.zIndex = '10000';
quranContainer.style.overflow = 'auto';
document.getElementById('fullscreenBtn').textContent = '❌';
isFullscreen = true;
} else {
quranContainer.style.position = 'static';
quranContainer.style.width = 'auto';
quranContainer.style.height = 'auto';
quranContainer.style.zIndex = 'auto';
document.getElementById('fullscreenBtn').textContent = '📺';
isFullscreen = false;
}

saveQuranPreferences();
}

// Search functionality
// Enhanced search functionality
let searchTimeout;
let allSearchResults = [];
let currentSearchQuery = '';

function handleSearchInput(event) {
const query = event.target.value.trim();

// Clear previous timeout
clearTimeout(searchTimeout);

// If query is empty, restore normal view
if (query.length === 0) {
clearSearch();
return;
}

// Show clear button
document.getElementById('clearSearchBtn').style.display = 'inline-block';

// Debounce search to avoid excessive searching while typing
searchTimeout = setTimeout(() => {
performSearch(query);
}, 300);
}

function performSearch(query) {
if (query.length < 2) {
displaySearchMessage('يرجى إدخال حرفين على الأقل للبحث');
return;
}

currentSearchQuery = query;
allSearchResults = [];

// Show loading
showSearchLoading();

// Normalize the search query
const normalizedQuery = normalizeForSearch(query);

// Search through all chapters and verses
Object.keys(quranData).forEach(chapterNum => {
const chapter = quranData[chapterNum];
Object.keys(chapter).forEach(verseNum => {
const verseText = chapter[verseNum];
const normalizedVerse = normalizeForSearch(verseText);

// Check if normalized verse contains the normalized search query
if (normalizedVerse.includes(normalizedQuery)) {
allSearchResults.push({
chapter: parseInt(chapterNum),
verse: parseInt(verseNum),
text: verseText,
chapterName: chapterNames[parseInt(chapterNum)]
});
}
});
});

// Sort results by chapter and verse number
allSearchResults.sort((a, b) => {
if (a.chapter !== b.chapter) {
return a.chapter - b.chapter;
}
return a.verse - b.verse;
});

displaySearchResults();
}

function showSearchLoading() {
const content = document.getElementById('content');
const searchStats = document.getElementById('searchStats');

content.innerHTML = `
       <div class="chapter-title">جارٍ البحث...</div>
       <div style="text-align: center; margin: 50px 0;">
           <div class="loading"></div>
           <p style="color: #888; margin-top: 20px;">يتم البحث في القرآن الكريم...</p>
       </div>
   `;

searchStats.style.display = 'none';
}

function displaySearchResults() {
const content = document.getElementById('content');
const chapterInfo = document.getElementById('chapterInfo');
const searchStats = document.getElementById('searchStats');

if (allSearchResults.length === 0) {
content.innerHTML = `
           <div class="chapter-title">نتائج البحث</div>
           <div style="text-align: center; margin: 50px 0;">
               <div style="font-size: 3em; margin-bottom: 20px;">🔍</div>
               <p style="font-size: 1.3em; color: #888;">
                   لم يتم العثور على نتائج للبحث: "<span style="color: #4dc0b5;">${currentSearchQuery}</span>"
               </p>
               <p style="color: #666; margin-top: 10px;">
                   جرب البحث بكلمات أخرى أو تأكد من الإملاء
               </p>
           </div>
       `;
chapterInfo.innerHTML = 'لا توجد نتائج';
searchStats.style.display = 'none';
return;
}

// Show search statistics
searchStats.innerHTML = `
       تم العثور على <strong style="color: #4dc0b5;">${allSearchResults.length}</strong> 
       نتيجة للبحث عن "<strong style="color: #4dc0b5;">${currentSearchQuery}</strong>"
   `;
searchStats.style.display = 'block';

let html = `<div class="chapter-title">نتائج البحث</div>`;
html += '<div class="search-results-container">';

allSearchResults.forEach((result, index) => {
// Highlight search term in the verse text
const highlightedText = highlightSearchTerm(result.text, currentSearchQuery);

html += `
           <div class="search-result-item" onclick="goToSearchResult(${result.chapter}, ${result.verse})" 
                onmouseover="this.style.background='rgba(77, 192, 181, 0.25)'" 
                onmouseout="this.style.background='rgba(77, 192, 181, 0.1)'">
               <div class="search-result-header">
                   <span>سورة ${result.chapterName}</span>
                   <span style="background: rgba(77, 192, 181, 0.3); padding: 4px 8px; border-radius: 12px; font-size: 0.9em;">
                       آية ${result.verse}
                   </span>
               </div>
               <div class="search-result-text">
                   ${highlightedText}
               </div>
           </div>
       `;
});

html += '</div>';
content.innerHTML = html;
content.className = 'quran-content-area fade-in';
chapterInfo.innerHTML = `${allSearchResults.length} نتيجة`;
}

function highlightSearchTerm(text, searchTerm) {
if (!searchTerm || searchTerm.length === 0) return text;

// Normalize both text and search term for comparison
const normalizedText = normalizeForSearch(text);
const normalizedSearchTerm = normalizeForSearch(searchTerm);

// Find all matches in the normalized text
const matches = [];
let index = 0;

while (index < normalizedText.length) {
const matchIndex = normalizedText.indexOf(normalizedSearchTerm, index);
if (matchIndex === -1) break;

matches.push({
start: matchIndex,
end: matchIndex + normalizedSearchTerm.length
});

index = matchIndex + 1;
}

if (matches.length === 0) return text;

// Apply highlighting by working backwards through matches
let highlightedText = text;

// Create a mapping of normalized positions to original positions
const normalizedToOriginal = [];
let normalizedPos = 0;

for (let i = 0; i < text.length; i++) {
const char = text[i];
const normalizedChar = normalizeForSearch(char);

if (normalizedChar.length > 0) {
normalizedToOriginal[normalizedPos] = i;
normalizedPos++;
}
}

// Add the final position
normalizedToOriginal[normalizedPos] = text.length;

// Apply highlights from end to beginning to preserve positions
for (let i = matches.length - 1; i >= 0; i--) {
const match = matches[i];
const originalStart = normalizedToOriginal[match.start] || 0;
let originalEnd = normalizedToOriginal[match.end] || text.length;

// Find the actual end position in original text
while (originalEnd < text.length && 
normalizeForSearch(text.substring(originalStart, originalEnd + 1)).length <= normalizedSearchTerm.length) {
originalEnd++;
}

const beforeMatch = highlightedText.substring(0, originalStart);
const matchText = highlightedText.substring(originalStart, originalEnd);
const afterMatch = highlightedText.substring(originalEnd);

highlightedText = beforeMatch + 
'<span class="search-highlight">' + matchText + '</span>' + 
afterMatch;
}

return highlightedText;
}

function escapeRegExp(string) {
return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to remove Arabic diacritics for better search
function normalizeArabicText(text) {
if (!text) return '';

// Remove all Arabic diacritics (harakat)
return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

// Function to normalize search query and text for comparison
function normalizeForSearch(text) {
if (!text) return '';

// Remove diacritics and trim whitespace
let normalized = normalizeArabicText(text.trim());

// Also handle common Arabic letter variations
normalized = normalized
.replace(/أ|إ|آ/g, 'ا')  // Normalize Alif variations
.replace(/ة/g, 'ه')       // Ta Marbuta to Ha
.replace(/ى/g, 'ي');      // Alif Maksura to Ya

return normalized;
}

function goToSearchResult(chapterNum, verseNum) {
    // Clear search first
    clearSearch();
    
    // Set the current position
    currentChapter = chapterNum;
    currentVerse = verseNum;
    
    // Find and set the correct page
    currentPage = getCurrentPage(chapterNum, verseNum);
    
    // Display the page
    displayPage();
    
    // Highlight and scroll to the specific verse
    setTimeout(() => {
        highlightAndScrollToVerse(chapterNum, verseNum);
    }, 200);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    document.getElementById('searchStats').style.display = 'none';
    currentSearchQuery = '';
    allSearchResults = [];
    
    // Make sure we're on the correct page for current chapter/verse
    currentPage = getCurrentPage(currentChapter, currentVerse);
    displayPage();
}

function displaySearchMessage(message) {
const content = document.getElementById('content');
content.innerHTML = `
       <div class="chapter-title">البحث</div>
       <div style="text-align: center; margin: 50px 0;">
           <p style="font-size: 1.2em; color: #888;">${message}</p>
       </div>
   `;
}

// Scroll to current verse
function scrollToCurrentVerse() {
setTimeout(() => {
const verses = document.querySelectorAll('.verse');
verses.forEach(verse => {
if (verse.style.background && verse.style.background.includes('rgba(77, 192, 181, 0.2)')) {
verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
});
}, 100);
}

// Enhanced function to highlight and scroll to specific verse
function highlightAndScrollToVerse(chapterNum, verseNum) {
    const verses = document.querySelectorAll('.verse');
    let targetVerse = null;
    
    verses.forEach(verse => {
        // Remove existing highlights
        verse.style.background = '';
        verse.style.borderColor = '';
        verse.style.boxShadow = '';
        
        // Check if this is the target verse by looking at the onclick attribute
        const onclickAttr = verse.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`setCurrentVerse(${chapterNum}, ${verseNum})`)) {
            // Highlight the target verse
            verse.style.background = 'rgba(77, 192, 181, 0.3)';
            verse.style.borderColor = '#4dc0b5';
            verse.style.boxShadow = '0 0 20px rgba(77, 192, 181, 0.5)';
            targetVerse = verse;
        }
    });
    
    // Scroll to the highlighted verse
    if (targetVerse) {
        targetVerse.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
        
        // Add a pulsing effect
        targetVerse.style.animation = 'pulse 2s ease-in-out 3';
    }
}

// Save and load Quran preferences
function saveQuranPreferences() {
const preferences = {
currentChapter,
currentVerse,
currentPage,
zoomLevel,
isFullscreen
};
localStorage.setItem('quranReaderPrefs', JSON.stringify(preferences));
}

function loadQuranPreferences() {
const saved = localStorage.getItem('quranReaderPrefs');
if (saved) {
const preferences = JSON.parse(saved);
currentChapter = preferences.currentChapter || 1;
currentVerse = preferences.currentVerse || 1;
currentPage = preferences.currentPage || 1;
zoomLevel = preferences.zoomLevel || 100;
isFullscreen = preferences.isFullscreen || false;

// Apply saved zoom
applyZoom();

// Apply fullscreen state if needed
if (isFullscreen) {
const quranContainer = document.querySelector('.quran-container');
quranContainer.style.position = 'fixed';
quranContainer.style.top = '0';
quranContainer.style.left = '0';
quranContainer.style.width = '100vw';
quranContainer.style.height = '100vh';
quranContainer.style.zIndex = '10000';
quranContainer.style.overflow = 'auto';
document.getElementById('fullscreenBtn').textContent = '❌';
}
}
}

// Close modal when clicking outside
window.onclick = function(event) {
const chapterModal = document.getElementById('chapterModal');
const juzModal = document.getElementById('juzModal');
const pageModal = document.getElementById('pageModal');

if (event.target === chapterModal) {
hideChapterSelector();
}
if (event.target === juzModal) {
hideJuzSelector();
}
if (event.target === pageModal) {
hidePageSelector();
}
}

// Loading Animation Handler
document.addEventListener('DOMContentLoaded', function() {
  const loadingScreen = document.getElementById('loadingScreen');
  const mainContent = document.getElementById('mainContent');
  const loadingVideo = document.getElementById('loadingVideo');
  
  // Minimum loading time (3 seconds)
  const minLoadingTime = 3000;
  const startTime = Date.now();
  
  // Function to hide loading screen
  function hideLoadingScreen() {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        mainContent.classList.remove('main-content-hidden'); 
        mainContent.classList.add('main-content-visible');
      }, 800); // Wait for fade-out animation
    }, remainingTime);
  }
  
  // Handle video loading
  if (loadingVideo) {
    loadingVideo.addEventListener('loadeddata', function() {
      // Video is ready, but respect minimum loading time
      hideLoadingScreen();
    });
    
    loadingVideo.addEventListener('error', function() {
      // If video fails to load, still hide loading screen
      console.warn('Loading video failed to load');
      hideLoadingScreen();
    });
    
    // Fallback: hide loading screen after maximum time even if video doesn't load
    setTimeout(() => {
      if (loadingScreen.style.display !== 'none') {
        hideLoadingScreen();
      }
    }, 6000); // 8 second maximum
  } else {
    // If no video element found, hide loading screen after minimum time
    hideLoadingScreen();
  }
});
// Initialize with Home active
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('homeBtn').classList.add('active');
}); 
 
// Translation functionality
let translationData = {};
let currentSelectedSurah = null;
let currentSelectedVerse = null;

// Language configuration with country flags
const languages = [
    { code: 'Albanian', name: 'Albanian', flag: '🇦🇱', file: 'sq.nahi.txt' },
    { code: 'Amazigh', name: 'Amazigh', flag: 'ⵣ', file: 'ber.mensur.txt' },
    { code: 'Amharic', name: 'Amharic', flag: '🇪🇹', file: 'am.sadiq.txt' },
    { code: 'Azerbaijani', name: 'Azerbaijani', flag: '🇦🇿', file: 'az.musayev.txt' },
    { code: 'Bengali', name: 'Bengali', flag: '🇧🇩', file: 'bn.hoque.txt' },
    { code: 'Bosnian', name: 'Bosnian', flag: '🇧🇦', file: 'bs.mlivo.txt' },
    { code: 'Bulgarian', name: 'Bulgarian', flag: '🇧🇬', file: 'bg.theophanov.txt' },
    { code: 'Chinese (Simplified)', name: 'Chinese (Simplified)', flag: '🇨🇳', file: 'zh.jian.txt' },
    { code: 'Chinese (Traditional)', name: 'Chinese (Traditional)', flag: '🇹🇼', file: 'zh.majian.txt' },
    { code: 'Czech', name: 'Czech', flag: '🇨🇿', file: 'cs.nykl.txt' },
    { code: 'Divehi', name: 'Divehi (Maldivian)', flag: '🇲🇻', file: 'dv.divehi.txt' },
    { code: 'Dutch', name: 'Dutch', flag: '🇳🇱', file: 'nl.keyzer.txt' },
    { code: 'English', name: 'English', flag: '🇬🇧', file: 'en.pickthall.txt' },
    { code: 'French', name: 'French', flag: '🇫🇷', file: 'fr.hamidullah.txt' },
    { code: 'German', name: 'German', flag: '🇩🇪', file: 'de.aburida.txt' },
    { code: 'Hausa', name: 'Hausa', flag: '🇳🇬', file: 'ha.gumi.txt' },
    { code: 'Hindi', name: 'Hindi', flag: '🇮🇳', file: 'hi.farooq.txt' },
    { code: 'Indonesian', name: 'Indonesian', flag: '🇮🇩', file: 'id.muntakhab.txt' },
    { code: 'Italian', name: 'Italian', flag: '🇮🇹', file: 'it.piccardo.txt' },
    { code: 'Japanese', name: 'Japanese', flag: '🇯🇵', file: 'ja.japanese.txt' },
    { code: 'Korean', name: 'Korean', flag: '🇰🇷', file: 'ko.korean.txt' },
    { code: 'Kurdish', name: 'Kurdish', flag: '🇮🇶', file: 'ku.asan.txt' },
    { code: 'Malay', name: 'Malay', flag: '🇲🇾', file: 'ms.basmeih.txt' },
    { code: 'Malayalam', name: 'Malayalam', flag: '🇮🇳', file: 'ml.abdulhameed.txt' },
    { code: 'Norwegian', name: 'Norwegian', flag: '🇳🇴', file: 'no.berg.txt' },
    { code: 'Pashto', name: 'Pashto', flag: '🇦🇫', file: 'ps.abdulwali.txt' },
    { code: 'Persian', name: 'Persian (Farsi)', flag: '🇮🇷', file: 'fa.makarem.txt' },
    { code: 'Polish', name: 'Polish', flag: '🇵🇱', file: 'pl.bielawskiego.txt' },
    { code: 'Portuguese', name: 'Portuguese', flag: '🇵🇹', file: 'pt.elhayek.txt' },
    { code: 'Romanian', name: 'Romanian', flag: '🇷🇴', file: 'ro.grigore.txt' },
    { code: 'Russian', name: 'Russian', flag: '🇷🇺', file: 'ru.muntahab.txt' },
    { code: 'Sindhi', name: 'Sindhi', flag: '🇵🇰', file: 'sd.amroti.txt' },
    { code: 'Somali', name: 'Somali', flag: '🇸🇴', file: 'so.abduh.txt' },
    { code: 'Spanish', name: 'Spanish', flag: '🇪🇸', file: 'es.garcia.txt' },
    { code: 'Swahili', name: 'Swahili', flag: '🇹🇿', file: 'sw.barwani.txt' },
    { code: 'Swedish', name: 'Swedish', flag: '🇸🇪', file: 'sv.bernstrom.txt' },
    { code: 'Tajik', name: 'Tajik', flag: '🇹🇯', file: 'tg.ayati.txt' },
    { code: 'Tamil', name: 'Tamil', flag: '🇮🇳', file: 'ta.tamil.txt' },
    { code: 'Tatar', name: 'Tatar', flag: '🇷🇺', file: 'tt.nugman.txt' },
    { code: 'Thai', name: 'Thai', flag: '🇹🇭', file: 'th.thai.txt' },
    { code: 'Turkish', name: 'Turkish', flag: '🇹🇷', file: 'tr.ozturk.txt' },
    { code: 'Urdu', name: 'Urdu', flag: '🇵🇰', file: 'ur.kanzuliman.txt' },
    { code: 'Uyghur', name: 'Uyghur', flag: '🇨🇳', file: 'ug.saleh.txt' },
    { code: 'Uzbek', name: 'Uzbek', flag: '🇺🇿', file: 'uz.sodik.txt' }
];

// Language direction configuration
const languageDirections = {
    'Albanian': 'ltr', 'Amazigh': 'rtl','Amharic': 'ltr',
    'Azerbaijani': 'ltr', 'Bengali': 'ltr', 'Bosnian': 'ltr', 'Bulgarian': 'ltr',
    'Chinese (Simplified)': 'ltr', 'Chinese (Traditional)': 'ltr', 'Czech': 'ltr',
    'Divehi': 'rtl', 'Dutch': 'ltr', 'English': 'ltr', 'French': 'ltr',
    'German': 'ltr', 'Hausa': 'ltr', 'Hindi': 'ltr', 'Indonesian': 'ltr',
    'Italian': 'ltr', 'Japanese': 'ltr', 'Korean': 'ltr', 'Kurdish': 'rtl',
    'Malay': 'ltr', 'Malayalam': 'ltr', 'Norwegian': 'ltr', 'Pashto': 'rtl',
    'Persian (Farsi)': 'rtl', 'Polish': 'ltr', 'Portuguese': 'ltr', 'Romanian': 'ltr',
    'Russian': 'ltr', 'Sindhi': 'rtl', 'Somali': 'ltr', 'Spanish': 'ltr',
    'Swahili': 'ltr', 'Swedish': 'ltr', 'Tajik': 'ltr', 'Tamil': 'ltr',
    'Tatar': 'ltr', 'Thai': 'ltr', 'Turkish': 'ltr', 'Urdu': 'rtl',
    'Uyghur': 'rtl', 'Uzbek': 'ltr'
}; 

// Initialize translation section
function initializeTranslationSection() {
    populateSurahSelect();
    populateLanguageGrid();
    setupTranslationEventListeners();
}

// Populate Surah dropdown
function populateSurahSelect() {
    const surahSelect = document.getElementById('surahSelect');
    let html = '<option value="">Select Surah</option>';
    
    Object.keys(chapterNames).forEach(chapterNum => {
        const name = chapterNames[chapterNum];
        html += `<option value="${chapterNum}">${chapterNum}. ${name}</option>`;
    });
    
    surahSelect.innerHTML = html;
}

// Populate verse dropdown based on selected surah
function populateVerseSelect(surahNumber) {
    const verseSelect = document.getElementById('verseSelect');
    
    if (!surahNumber || !quranData) {
        verseSelect.innerHTML = '<option value="">Select Verse</option>';
        verseSelect.disabled = true;
        return;
    }
    
    // Convert to integer
    const surahNum = parseInt(surahNumber);
    
    if (!quranData[surahNum]) {
        verseSelect.innerHTML = '<option value="">Select Verse</option>';
        verseSelect.disabled = true;
        return;
    }
    
    const verses = Object.keys(quranData[surahNum]).map(v => parseInt(v)).sort((a, b) => a - b);
    let html = '<option value="">Select Verse</option>';
    
    verses.forEach(verseNum => {
        html += `<option value="${verseNum}">Verse ${verseNum}</option>`;
    });
    
    verseSelect.innerHTML = html;
    verseSelect.disabled = false;
}

// Setup event listeners for translation controls
function setupTranslationEventListeners() {
    const surahSelect = document.getElementById('surahSelect');
    const verseSelect = document.getElementById('verseSelect');
    
    if (surahSelect) {
        surahSelect.addEventListener('change', function() {
            const selectedSurah = this.value;
            console.log('Surah selected:', selectedSurah); // Debug log
            populateVerseSelect(selectedSurah);
            updateLanguageButtonsState();
        });
    }
    
    if (verseSelect) {
        verseSelect.addEventListener('change', function() {
            console.log('Verse selected:', this.value); // Debug log
            updateLanguageButtonsState();
        });
    }
}

// Populate language grid
function populateLanguageGrid() {
    const languageGrid = document.getElementById('languageGrid');
    let html = '';
    
    languages.forEach(lang => {
        html += `
            <button class="language-btn disabled" id="lang-${lang.code}" 
                    onclick="openTranslation('${lang.code}', '${lang.file}', '${lang.name}')">
                <span class="flag">${lang.flag}</span>
                <span class="language-name">${lang.name}</span>
            </button>
        `;
    });
    
    languageGrid.innerHTML = html;
}

// Update language buttons state based on selection
function updateLanguageButtonsState() {
    const surahSelect = document.getElementById('surahSelect');
    const verseSelect = document.getElementById('verseSelect');
    const loadBtn = document.getElementById('loadTranslationBtn');
    
    const surahSelected = surahSelect.value !== '';
    const verseSelected = verseSelect.value !== '';
    const bothSelected = surahSelected && verseSelected;
    
    // Update load button
    if (loadBtn) {
        loadBtn.style.opacity = bothSelected ? '1' : '0.5';
        loadBtn.disabled = !bothSelected;
    }
    
    // Update language buttons
    const langButtons = document.querySelectorAll('.language-btn');
    langButtons.forEach(btn => {
        if (bothSelected && currentSelectedSurah && currentSelectedVerse) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// Load selected translation values
function loadSelectedTranslation() {
    const surahSelect = document.getElementById('surahSelect');
    const verseSelect = document.getElementById('verseSelect');
    
    const surahValue = surahSelect.value;
    const verseValue = verseSelect.value;
    
    if (!surahValue || !verseValue) {
        alert('Please select both Surah and Verse');
        return;
    }
    
    currentSelectedSurah = parseInt(surahValue);
    currentSelectedVerse = parseInt(verseValue);
    
    updateLanguageButtonsState();
    
    // Show success message
    const loadBtn = document.getElementById('loadTranslationBtn');
    const originalText = loadBtn.textContent;
    loadBtn.textContent = '✓ Loaded!';
    loadBtn.style.background = 'linear-gradient(145deg, #27ae60, #2ecc71)';
    
    setTimeout(() => {
        loadBtn.textContent = originalText;
        loadBtn.style.background = '';
    }, 2000);
}

// Open translation for specific language with improved performance
async function openTranslation(langCode, fileName, langName) {
    // Check if selection is made
    if (!currentSelectedSurah || !currentSelectedVerse) {
        alert('Please select Surah and Verse first, then click "Load Translation"');
        return;
    }
    
    // Check if button is disabled
    const button = document.getElementById(`lang-${langCode}`);
    if (button.classList.contains('disabled')) {
        return;
    }
    
    try {
        // Show loading immediately
        showTranslationLoading(langName);
        
        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(async () => {
            try {
                // Load translation data if not already loaded
                if (!translationData[langCode]) {
                    const response = await fetch(fileName);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${langName} translation`);
                    }
                    const text = await response.text();
                    translationData[langCode] = parseTranslationFile(text);
                }
                
                // Get the specific verse translation
                const translation = getVerseTranslation(translationData[langCode], currentSelectedSurah, currentSelectedVerse);
                const arabicVerse = quranData[currentSelectedSurah][currentSelectedVerse];
                
                // Show translation with proper direction
                showTranslationBox(langName, arabicVerse, translation, currentSelectedSurah, currentSelectedVerse);
                
            } catch (error) {
                console.error('Error loading translation:', error);
                alert(`Error loading ${langName} translation. Please try again.`);
                hideTranslationLoading();
            }
        }, 10); // Small delay to allow UI update
        
    } catch (error) {
        console.error('Error loading translation:', error);
        alert(`Error loading ${langName} translation. Please try again.`);
        hideTranslationLoading();
    }
}

// Parse translation file with better performance
function parseTranslationFile(fileContent) {
    const translations = {};
    const lines = fileContent.split('\n');
    
    // Use a more efficient parsing approach
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const pipeIndex = line.indexOf('|');
            if (pipeIndex !== -1) {
                const secondPipeIndex = line.indexOf('|', pipeIndex + 1);
                if (secondPipeIndex !== -1) {
                    const chapter = parseInt(line.substring(0, pipeIndex));
                    const verse = parseInt(line.substring(pipeIndex + 1, secondPipeIndex));
                    const translation = line.substring(secondPipeIndex + 1).trim();
                    
                    if (!isNaN(chapter) && !isNaN(verse)) {
                        if (!translations[chapter]) {
                            translations[chapter] = {};
                        }
                        translations[chapter][verse] = translation;
                    }
                }
            }
        }
    }
    
    return translations;
}

// Get specific verse translation
function getVerseTranslation(translationData, chapter, verse) {
    if (translationData[chapter] && translationData[chapter][verse]) {
        return translationData[chapter][verse];
    }
    return 'Translation not available for this verse.';
}

// Show translation loading with better UX
function showTranslationLoading(langName) {
    const readingBox = document.getElementById('translationReadingBox');
    const title = document.getElementById('translationTitle');
    const arabicDisplay = document.getElementById('arabicVerseDisplay');
    const translationText = document.getElementById('translationText');
    
    title.textContent = `Loading ${langName} Translation...`;
    arabicDisplay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading" style="margin: 0 auto 15px;"></div>
            <div style="color: #888;">Preparing Arabic text...</div>
        </div>
    `;
    translationText.innerHTML = '<div class="translation-loading">Fetching translation data...</div>';
    
    readingBox.classList.remove('hidden');
}

// Hide translation loading
function hideTranslationLoading() {
    const readingBox = document.getElementById('translationReadingBox');
    readingBox.classList.add('hidden');
}

// Show translation box with proper text direction
function showTranslationBox(langName, arabicVerse, translation, chapter, verse) {
    const readingBox = document.getElementById('translationReadingBox');
    const title = document.getElementById('translationTitle');
    const arabicDisplay = document.getElementById('arabicVerseDisplay');
    const translationText = document.getElementById('translationText');
    
    const chapterName = chapterNames[chapter];
    const direction = languageDirections[langName] || 'ltr';
    
    title.textContent = `${langName} Translation`;
    arabicDisplay.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 0.8em; color: #888;">
            ${chapterName} - Verse ${verse}
        </div>
        ${arabicVerse}
    `;
    
    // Set proper direction and alignment for translation text
    translationText.textContent = translation;
    translationText.style.direction = direction;
    translationText.style.textAlign = direction === 'rtl' ? 'right' : 'left';
    translationText.style.fontFamily = direction === 'rtl' ? "'Amiri', serif" : "'Inter', sans-serif";
    
    // Also set direction for the entire translation box content
    const translationContent = readingBox.querySelector('.translation-content');
    if (translationContent) {
        translationContent.style.direction = direction;
    }
    
    readingBox.classList.remove('hidden');
}

// Close translation box
function closeTranslationBox() {
    const readingBox = document.getElementById('translationReadingBox');
    readingBox.classList.add('hidden');
}

// Close translation box when clicking outside
document.addEventListener('click', function(event) {
    const readingBox = document.getElementById('translationReadingBox');
    const target = event.target;
    
    if (readingBox && !readingBox.classList.contains('hidden')) {
        if (!readingBox.contains(target) && !target.classList.contains('language-btn')) {
            closeTranslationBox();
        }
    }
});

// Menu Toggle Functionality
const menuToggle = document.getElementById('menuToggle');
const navigationMenu = document.querySelector('.navigation-menu');
const menuBackdrop = document.getElementById('menuBackdrop');
let isMenuOpen = false;

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  
  if (isMenuOpen) {
    // Open menu
    menuToggle.classList.add('active');
    navigationMenu.classList.add('show');
    menuBackdrop.classList.add('show');
    
    // Add stagger animation to menu buttons
    const menuBtns = document.querySelectorAll('.nav-btn');
    menuBtns.forEach((btn, index) => {
      btn.style.transform = 'translateY(20px)';
      btn.style.opacity = '0';
      
      setTimeout(() => {
        btn.style.transform = 'translateY(0)';
        btn.style.opacity = '1';
        btn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      }, index * 100 + 200);
    });
  } else {
    // Close menu
    menuToggle.classList.remove('active');
    navigationMenu.classList.remove('show');
    menuBackdrop.classList.remove('show');
    
    // Reset button animations
    const menuBtns = document.querySelectorAll('.nav-btn');
    menuBtns.forEach(btn => {
      btn.style.transition = '';
    });
  }
}

// Event listeners
menuToggle.addEventListener('click', toggleMenu);
menuBackdrop.addEventListener('click', toggleMenu);

// Close menu when clicking on a nav button
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isMenuOpen) {
      setTimeout(() => toggleMenu(), 150); // Small delay for better UX
    }
  });
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen) {
    toggleMenu();
  }
});

// Exegesis functionality (ADD THESE VARIABLES)
let exegesisData = {};
let currentSelectedExegesisSurah = null;
let currentSelectedExegesisVerse = null;

// Exegesis configuration with 12 options (ADD THIS ARRAY)
const exegesisOptions = [
    { code: 'TafsirAlJalalayn', name: 'Tafsir Al Jalalayn', flag: '📖', file: 'ar.jalalayn.txt' }
];

// Exegesis direction configuration (ADD THIS OBJECT)
const exegesisDirections = {
    'Tafsir Al Jalalayn': 'rtl'
};

// ADD THESE FUNCTIONS FOR EXEGESIS

// Initialize exegesis section
function initializeExegesisSection() {
    populateExegesisSurahSelect();
    populateExegesisLanguageGrid();
    setupExegesisEventListeners();
}

// Populate Exegesis Surah dropdown
function populateExegesisSurahSelect() {
    const surahSelect = document.getElementById('exegesisSurahSelect');
    let html = '<option value="">Select Surah</option>';
    
    Object.keys(chapterNames).forEach(chapterNum => {
        const name = chapterNames[chapterNum];
        html += `<option value="${chapterNum}">${chapterNum}. ${name}</option>`;
    });
    
    surahSelect.innerHTML = html;
}

// Populate exegesis verse dropdown based on selected surah
function populateExegesisVerseSelect(surahNumber) {
    const verseSelect = document.getElementById('exegesisVerseSelect');
    
    if (!surahNumber || !quranData) {
        verseSelect.innerHTML = '<option value="">Select Verse</option>';
        verseSelect.disabled = true;
        return;
    }
    
    const surahNum = parseInt(surahNumber);
    
    if (!quranData[surahNum]) {
        verseSelect.innerHTML = '<option value="">Select Verse</option>';
        verseSelect.disabled = true;
        return;
    }
    
    const verses = Object.keys(quranData[surahNum]).map(v => parseInt(v)).sort((a, b) => a - b);
    let html = '<option value="">Select Verse</option>';
    
    verses.forEach(verseNum => {
        html += `<option value="${verseNum}">Verse ${verseNum}</option>`;
    });
    
    verseSelect.innerHTML = html;
    verseSelect.disabled = false;
}

// Setup event listeners for exegesis controls
function setupExegesisEventListeners() {
    const surahSelect = document.getElementById('exegesisSurahSelect');
    const verseSelect = document.getElementById('exegesisVerseSelect');
    
    if (surahSelect) {
        surahSelect.addEventListener('change', function() {
            const selectedSurah = this.value;
            populateExegesisVerseSelect(selectedSurah);
            updateExegesisButtonsState();
        });
    }
    
    if (verseSelect) {
        verseSelect.addEventListener('change', function() {
            updateExegesisButtonsState();
        });
    }
}

// Populate exegesis language grid
function populateExegesisLanguageGrid() {
    const languageGrid = document.getElementById('exegesisLanguageGrid');
    let html = '';
    
    exegesisOptions.forEach(option => {
        html += `
            <button class="language-btn disabled" id="exegesis-${option.code}" 
                    onclick="openExegesis('${option.code}', '${option.file}', '${option.name}')">
                <span class="flag">${option.flag}</span>
                <span class="language-name">${option.name}</span>
            </button>
        `;
    });
    
    languageGrid.innerHTML = html;
}

// Update exegesis buttons state based on selection
function updateExegesisButtonsState() {
    const surahSelect = document.getElementById('exegesisSurahSelect');
    const verseSelect = document.getElementById('exegesisVerseSelect');
    const loadBtn = document.getElementById('loadExegesisBtn');
    
    const surahSelected = surahSelect.value !== '';
    const verseSelected = verseSelect.value !== '';
    const bothSelected = surahSelected && verseSelected;
    
    // Update load button
    if (loadBtn) {
        loadBtn.style.opacity = bothSelected ? '1' : '0.5';
        loadBtn.disabled = !bothSelected;
    }
    
    // Update exegesis buttons
    const langButtons = document.querySelectorAll('#exegesisLanguageGrid .language-btn');
    langButtons.forEach(btn => {
        if (bothSelected && currentSelectedExegesisSurah && currentSelectedExegesisVerse) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// Load selected exegesis values
function loadSelectedExegesis() {
    const surahSelect = document.getElementById('exegesisSurahSelect');
    const verseSelect = document.getElementById('exegesisVerseSelect');
    
    const surahValue = surahSelect.value;
    const verseValue = verseSelect.value;
    
    if (!surahValue || !verseValue) {
        alert('Please select both Surah and Verse');
        return;
    }
    
    currentSelectedExegesisSurah = parseInt(surahValue);
    currentSelectedExegesisVerse = parseInt(verseValue);
    
    updateExegesisButtonsState();
    
    // Show success message
    const loadBtn = document.getElementById('loadExegesisBtn');
    const originalText = loadBtn.textContent;
    loadBtn.textContent = '✓ Loaded!';
    loadBtn.style.background = 'linear-gradient(145deg, #27ae60, #2ecc71)';
    
    setTimeout(() => {
        loadBtn.textContent = originalText;
        loadBtn.style.background = '';
    }, 2000);
}

// Open exegesis for specific option
async function openExegesis(optionCode, fileName, optionName) {
    // Check if selection is made
    if (!currentSelectedExegesisSurah || !currentSelectedExegesisVerse) {
        alert('Please select Surah and Verse first, then click "Load Exegesis"');
        return;
    }
    
    // Check if button is disabled
    const button = document.getElementById(`exegesis-${optionCode}`);
    if (button.classList.contains('disabled')) {
        return;
    }
    
    try {
        // Show loading immediately
        showExegesisLoading(optionName);
        
        setTimeout(async () => {
            try {
                // Load exegesis data if not already loaded
                if (!exegesisData[optionCode]) {
                    const response = await fetch(fileName);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${optionName} exegesis`);
                    }
                    const text = await response.text();
                    exegesisData[optionCode] = parseTranslationFile(text);
                }
                
                // Get the specific verse exegesis
                const exegesis = getVerseTranslation(exegesisData[optionCode], currentSelectedExegesisSurah, currentSelectedExegesisVerse);
                const arabicVerse = quranData[currentSelectedExegesisSurah][currentSelectedExegesisVerse];
                
                // Show exegesis with proper direction
                showExegesisBox(optionName, arabicVerse, exegesis, currentSelectedExegesisSurah, currentSelectedExegesisVerse);
                
            } catch (error) {
                console.error('Error loading exegesis:', error);
                alert(`Error loading ${optionName} exegesis. Please try again.`);
                hideExegesisLoading();
            }
        }, 10);
        
    } catch (error) {
        console.error('Error loading exegesis:', error);
        alert(`Error loading ${optionName} exegesis. Please try again.`);
        hideExegesisLoading();
    }
}

// Show exegesis loading
function showExegesisLoading(optionName) {
    const readingBox = document.getElementById('exegesisReadingBox');
    const title = document.getElementById('exegesisTitle');
    const arabicDisplay = document.getElementById('exegesisArabicVerseDisplay');
    const exegesisText = document.getElementById('exegesisText');
    
    title.textContent = `Loading ${optionName}...`;
    arabicDisplay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading" style="margin: 0 auto 15px;"></div>
            <div style="color: #888;">Preparing Arabic text...</div>
        </div>
    `;
    exegesisText.innerHTML = '<div class="translation-loading">Fetching exegesis data...</div>';
    
    readingBox.classList.remove('hidden');
}

// Hide exegesis loading
function hideExegesisLoading() {
    const readingBox = document.getElementById('exegesisReadingBox');
    readingBox.classList.add('hidden');
}

// Show exegesis box with proper text direction
function showExegesisBox(optionName, arabicVerse, exegesis, chapter, verse) {
    const readingBox = document.getElementById('exegesisReadingBox');
    const title = document.getElementById('exegesisTitle');
    const arabicDisplay = document.getElementById('exegesisArabicVerseDisplay');
    const exegesisText = document.getElementById('exegesisText');
    
    const chapterName = chapterNames[chapter];
    const direction = exegesisDirections[optionName] || 'rtl';
    
    title.textContent = `${optionName}`;
    arabicDisplay.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 0.8em; color: #888;">
            ${chapterName} - Verse ${verse}
        </div>
        ${arabicVerse}
    `;
    
    // Set proper direction and alignment for exegesis text
    exegesisText.textContent = exegesis;
    exegesisText.style.direction = direction;
    exegesisText.style.textAlign = direction === 'rtl' ? 'right' : 'left';
    exegesisText.style.fontFamily = direction === 'rtl' ? "'Amiri', serif" : "'Inter', sans-serif";
    
    // Also set direction for the entire exegesis box content
    const exegesisContent = readingBox.querySelector('.translation-content');
    if (exegesisContent) {
        exegesisContent.style.direction = direction;
    }
    
    readingBox.classList.remove('hidden');
}

// Close exegesis box
function closeExegesisBox() {
    const readingBox = document.getElementById('exegesisReadingBox');
    readingBox.classList.add('hidden');
}

  // Disable right-click
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  // Disable common inspect shortcuts
  document.addEventListener("keydown", function (e) {
    // F12
    if (e.key === "F12") {
      e.preventDefault();
    }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
      e.preventDefault();
    }
    // Ctrl+U (View source)
    if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
    }
    // Ctrl+S (Save page)
    if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
    }
  });
