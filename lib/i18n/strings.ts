import type { Locale } from "./locales";

export type StringKey =
  | "brand_country"
  | "nav_methodology"
  | "nav_legal"
  | "nav_open_menu"
  | "nav_close_menu"
  | "nav_menu_title"
  | "menu_all_cities"
  | "menu_legal_full"
  | "home_subtitle"
  | "home_cta_title"
  | "home_cta_desc"
  | "home_cta_button"
  | "home_cta_locating"
  | "home_pick_city"
  | "home_cities_count"
  | "dq_title"
  | "dq_live"
  | "dq_calibrated"
  | "dq_seeded"
  | "dq_empty"
  | "dq_live_desc"
  | "dq_calibrated_desc"
  | "dq_seeded_desc"
  | "dq_empty_desc"
  | "city_back"
  | "city_subtitle"
  | "city_map_hint"
  | "city_data_quality"
  | "city_use_location"
  | "city_locating"
  | "night_day"
  | "night_night"
  | "rank_high_day"
  | "rank_high_night"
  | "rank_low_day"
  | "rank_low_night"
  | "badge_per_area"
  | "badge_city_stats"
  | "badge_absconders"
  | "badge_geometry_only"
  | "lang_label";

export type Dict = Record<StringKey, string>;

const en: Dict = {
  brand_country: "India",
  nav_methodology: "Methodology",
  nav_legal: "Legal",
  nav_open_menu: "Open menu",
  nav_close_menu: "Close menu",
  nav_menu_title: "Menu",
  menu_all_cities: "All cities",
  menu_legal_full: "Legal & takedown",
  home_subtitle:
    "Ward-level safety estimates for Indian cities, sourced from official police publications where they exist.",
  home_cta_title: "In one of these cities? Get your area's stats.",
  home_cta_desc:
    "Tap below — we'll detect which city you're in and jump to your ward's report. Your location stays in the browser; we don't log or send it.",
  home_cta_button: "Find my area",
  home_cta_locating: "Finding your area…",
  home_pick_city: "Or pick a city",
  home_cities_count: "{n} cities",
  dq_title: "Data quality scale",
  dq_live: "live",
  dq_calibrated: "calibrated",
  dq_seeded: "seeded",
  dq_empty: "empty",
  dq_live_desc:
    "automated ingest, per-area data from official police feeds.",
  dq_calibrated_desc:
    "real city-aggregate counts from official sources, apportioned to areas via editorial relative weights.",
  dq_seeded_desc: "editorial estimates, no real-data calibration yet.",
  dq_empty_desc:
    "ward boundaries shown, but no per-area data ingested.",
  city_back: "All cities",
  city_subtitle:
    "Estimated risk per {unit} with a night-time multiplier applied per crime type.",
  city_map_hint: "Tap any {unit} to open its full report. Pinch to zoom.",
  city_data_quality: "Data quality",
  city_use_location: "Use my location",
  city_locating: "Locating…",
  night_day: "Day",
  night_night: "Night",
  rank_high_day: "Highest risk · day",
  rank_high_night: "Highest risk · night",
  rank_low_day: "Lowest risk · day",
  rank_low_night: "Lowest risk · night",
  badge_per_area: "{n} per-area",
  badge_city_stats: "city stats",
  badge_absconders: "{n} absconders",
  badge_geometry_only: "geometry only",
  lang_label: "Language",
};

const hi: Dict = {
  brand_country: "भारत",
  nav_methodology: "पद्धति",
  nav_legal: "कानूनी",
  nav_open_menu: "मेनू खोलें",
  nav_close_menu: "मेनू बंद करें",
  nav_menu_title: "मेनू",
  menu_all_cities: "सभी शहर",
  menu_legal_full: "कानूनी और हटाने का अनुरोध",
  home_subtitle:
    "भारतीय शहरों के लिए वार्ड-स्तरीय सुरक्षा अनुमान, जहाँ उपलब्ध हो, सरकारी पुलिस प्रकाशनों से लिए गए।",
  home_cta_title:
    "इनमें से किसी शहर में हैं? अपने इलाके के आँकड़े पाएँ।",
  home_cta_desc:
    "नीचे दबाएँ — हम पता लगा लेंगे कि आप किस शहर में हैं और सीधे आपके वार्ड की रिपोर्ट पर ले जाएँगे। आपकी लोकेशन ब्राउज़र में रहती है, हम उसे न लॉग करते हैं न भेजते हैं।",
  home_cta_button: "मेरा इलाका ढूँढें",
  home_cta_locating: "इलाका ढूँढ रहे हैं…",
  home_pick_city: "या कोई शहर चुनें",
  home_cities_count: "{n} शहर",
  dq_title: "डेटा गुणवत्ता स्केल",
  dq_live: "लाइव",
  dq_calibrated: "अंशशोधित",
  dq_seeded: "अनुमानित",
  dq_empty: "खाली",
  dq_live_desc: "स्वचालित अंतर्ग्रहण, सरकारी पुलिस फ़ीड से प्रति-क्षेत्र डेटा।",
  dq_calibrated_desc:
    "सरकारी स्रोतों से शहर-स्तरीय गिनती, सम्पादकीय भारों के अनुसार क्षेत्रों में बाँटी गई।",
  dq_seeded_desc:
    "सम्पादकीय अनुमान, अभी कोई वास्तविक डेटा अंशशोधन नहीं।",
  dq_empty_desc:
    "वार्ड सीमाएँ दिख रही हैं, परंतु प्रति-क्षेत्र डेटा नहीं लिया गया।",
  city_back: "सभी शहर",
  city_subtitle:
    "प्रति {unit} अनुमानित जोखिम, प्रत्येक अपराध प्रकार पर रात के गुणक के साथ।",
  city_map_hint:
    "किसी भी {unit} को दबाकर उसकी पूरी रिपोर्ट खोलें। ज़ूम के लिए पिंच करें।",
  city_data_quality: "डेटा गुणवत्ता",
  city_use_location: "मेरी लोकेशन उपयोग करें",
  city_locating: "ढूँढ रहे हैं…",
  night_day: "दिन",
  night_night: "रात",
  rank_high_day: "उच्चतम जोखिम · दिन",
  rank_high_night: "उच्चतम जोखिम · रात",
  rank_low_day: "न्यूनतम जोखिम · दिन",
  rank_low_night: "न्यूनतम जोखिम · रात",
  badge_per_area: "{n} प्रति-क्षेत्र",
  badge_city_stats: "शहर के आँकड़े",
  badge_absconders: "{n} फरार",
  badge_geometry_only: "केवल भूगोल",
  lang_label: "भाषा",
};

const bn: Dict = {
  brand_country: "ভারত",
  nav_methodology: "পদ্ধতি",
  nav_legal: "আইনি",
  nav_open_menu: "মেনু খুলুন",
  nav_close_menu: "মেনু বন্ধ করুন",
  nav_menu_title: "মেনু",
  menu_all_cities: "সব শহর",
  menu_legal_full: "আইনি ও সরানোর অনুরোধ",
  home_subtitle:
    "ভারতীয় শহরগুলির জন্য ওয়ার্ড-স্তরের নিরাপত্তা অনুমান, যেখানে উপলব্ধ, সরকারি পুলিশ প্রকাশনা থেকে।",
  home_cta_title:
    "এই শহরগুলির একটিতে আছেন? আপনার এলাকার পরিসংখ্যান নিন।",
  home_cta_desc:
    "নিচে ট্যাপ করুন — আমরা শনাক্ত করব আপনি কোন শহরে আছেন এবং সরাসরি আপনার ওয়ার্ডের রিপোর্টে নিয়ে যাব। আপনার অবস্থান ব্রাউজারেই থাকে; আমরা তা সংরক্ষণ বা পাঠাই না।",
  home_cta_button: "আমার এলাকা খুঁজুন",
  home_cta_locating: "আপনার এলাকা খুঁজছি…",
  home_pick_city: "অথবা একটি শহর বেছে নিন",
  home_cities_count: "{n}টি শহর",
  dq_title: "ডেটা গুণমান স্কেল",
  dq_live: "লাইভ",
  dq_calibrated: "ক্যালিব্রেটেড",
  dq_seeded: "অনুমিত",
  dq_empty: "খালি",
  dq_live_desc: "স্বয়ংক্রিয় ইনজেস্ট, সরকারি পুলিশ ফিড থেকে এলাকা-ভিত্তিক ডেটা।",
  dq_calibrated_desc:
    "সরকারি উৎস থেকে শহর-স্তরের গণনা, সম্পাদকীয় ভারে এলাকাগুলিতে বণ্টন।",
  dq_seeded_desc:
    "সম্পাদকীয় অনুমান, এখনও কোনো প্রকৃত ডেটা ক্যালিব্রেশন নেই।",
  dq_empty_desc:
    "ওয়ার্ড সীমানা দেখানো হয়েছে, তবে এলাকা-ভিত্তিক ডেটা নেই।",
  city_back: "সব শহর",
  city_subtitle:
    "প্রতি {unit} অনুমিত ঝুঁকি, প্রতিটি অপরাধ প্রকারে রাতের গুণক প্রয়োগ করে।",
  city_map_hint:
    "যেকোনো {unit}-এ ট্যাপ করুন তার পূর্ণ রিপোর্ট খুলতে। জুম করতে পিঞ্চ করুন।",
  city_data_quality: "ডেটা গুণমান",
  city_use_location: "আমার অবস্থান ব্যবহার করুন",
  city_locating: "খুঁজছি…",
  night_day: "দিন",
  night_night: "রাত",
  rank_high_day: "সর্বোচ্চ ঝুঁকি · দিন",
  rank_high_night: "সর্বোচ্চ ঝুঁকি · রাত",
  rank_low_day: "সর্বনিম্ন ঝুঁকি · দিন",
  rank_low_night: "সর্বনিম্ন ঝুঁকি · রাত",
  badge_per_area: "{n} এলাকা-ভিত্তিক",
  badge_city_stats: "শহরের পরিসংখ্যান",
  badge_absconders: "{n} পলাতক",
  badge_geometry_only: "শুধু সীমানা",
  lang_label: "ভাষা",
};

const mr: Dict = {
  brand_country: "भारत",
  nav_methodology: "पद्धत",
  nav_legal: "कायदेशीर",
  nav_open_menu: "मेनू उघडा",
  nav_close_menu: "मेनू बंद करा",
  nav_menu_title: "मेनू",
  menu_all_cities: "सर्व शहरे",
  menu_legal_full: "कायदेशीर व हटवण्याची विनंती",
  home_subtitle:
    "भारतीय शहरांसाठी वॉर्ड-स्तरीय सुरक्षा अंदाज, जिथे उपलब्ध तिथे शासकीय पोलिस प्रकाशनातून.",
  home_cta_title: "यापैकी एखाद्या शहरात आहात? आपल्या भागाची आकडेवारी पहा.",
  home_cta_desc:
    "खाली टॅप करा — आपण कोणत्या शहरात आहात ते आम्ही ओळखू व थेट आपल्या वॉर्डच्या अहवालावर नेऊ. आपले स्थान ब्राऊझरमध्येच राहते; आम्ही ते कुठेही पाठवत किंवा साठवत नाही.",
  home_cta_button: "माझा भाग शोधा",
  home_cta_locating: "भाग शोधत आहोत…",
  home_pick_city: "किंवा एखादे शहर निवडा",
  home_cities_count: "{n} शहरे",
  dq_title: "डेटा गुणवत्ता मापन",
  dq_live: "लाईव्ह",
  dq_calibrated: "अंशशोधित",
  dq_seeded: "अंदाजित",
  dq_empty: "रिकामे",
  dq_live_desc: "स्वयंचलित अंतर्ग्रहण, अधिकृत पोलिस फीडमधून प्रति-क्षेत्र डेटा.",
  dq_calibrated_desc:
    "अधिकृत स्रोतांकडून शहर-स्तरीय आकडे, संपादकीय वजनांप्रमाणे क्षेत्रांत वाटून.",
  dq_seeded_desc:
    "संपादकीय अंदाज, अद्याप वास्तविक डेटाशी जुळवणी झालेली नाही.",
  dq_empty_desc:
    "वॉर्ड सीमा दिसतात, परंतु प्रति-क्षेत्र डेटा नाही.",
  city_back: "सर्व शहरे",
  city_subtitle:
    "प्रति {unit} अंदाजित जोखीम, प्रत्येक गुन्हा प्रकारास रात्रीच्या गुणकासह.",
  city_map_hint:
    "कोणत्याही {unit}वर टॅप करा त्याचा पूर्ण अहवाल पाहण्यासाठी. झूम करायला पिंच करा.",
  city_data_quality: "डेटा गुणवत्ता",
  city_use_location: "माझे स्थान वापरा",
  city_locating: "शोधत आहोत…",
  night_day: "दिवस",
  night_night: "रात्र",
  rank_high_day: "सर्वाधिक जोखीम · दिवस",
  rank_high_night: "सर्वाधिक जोखीम · रात्र",
  rank_low_day: "सर्वात कमी जोखीम · दिवस",
  rank_low_night: "सर्वात कमी जोखीम · रात्र",
  badge_per_area: "{n} प्रति-क्षेत्र",
  badge_city_stats: "शहराचे आकडे",
  badge_absconders: "{n} फरारी",
  badge_geometry_only: "केवळ भूगोल",
  lang_label: "भाषा",
};

const ta: Dict = {
  brand_country: "இந்தியா",
  nav_methodology: "முறை",
  nav_legal: "சட்டப்பூர்வம்",
  nav_open_menu: "மெனுவை திற",
  nav_close_menu: "மெனுவை மூடு",
  nav_menu_title: "மெனு",
  menu_all_cities: "அனைத்து நகரங்கள்",
  menu_legal_full: "சட்டம் & நீக்க கோரிக்கை",
  home_subtitle:
    "இந்திய நகரங்களுக்கான வார்டு-நிலை பாதுகாப்பு மதிப்பீடுகள், அதிகாரப்பூர்வ காவல்துறை வெளியீடுகளிலிருந்து.",
  home_cta_title:
    "இந்த நகரங்களில் ஒன்றில் இருக்கிறீர்களா? உங்கள் பகுதியின் புள்ளிவிவரங்களைப் பெறுங்கள்.",
  home_cta_desc:
    "கீழே தட்டவும் — நீங்கள் எந்த நகரில் இருக்கிறீர்கள் என்பதைக் கண்டறிந்து உங்கள் வார்டின் அறிக்கைக்கு நேராக அழைத்துச் செல்வோம். உங்கள் இருப்பிடம் உலாவியில் மட்டுமே இருக்கும்.",
  home_cta_button: "என் பகுதியைக் கண்டறி",
  home_cta_locating: "பகுதியைக் கண்டறிகிறது…",
  home_pick_city: "அல்லது ஒரு நகரத்தைத் தேர்வுசெய்",
  home_cities_count: "{n} நகரங்கள்",
  dq_title: "தரவு தர அளவீடு",
  dq_live: "நேரடி",
  dq_calibrated: "சீரமைக்கப்பட்டது",
  dq_seeded: "மதிப்பீடு",
  dq_empty: "காலியாக",
  dq_live_desc: "தானியங்கி உள்வாங்கல், காவல்துறை ஊட்டத்திலிருந்து பகுதி வாரியான தரவு.",
  dq_calibrated_desc:
    "அதிகாரப்பூர்வ மூலங்களிலிருந்து நகர மொத்த எண்ணிக்கைகள், ஆசிரியர் எடைகளால் பகுதிகளுக்குப் பிரிக்கப்பட்டது.",
  dq_seeded_desc:
    "ஆசிரியர் மதிப்பீடுகள், இன்னும் உண்மை தரவு சீரமைப்பு இல்லை.",
  dq_empty_desc:
    "வார்டு எல்லைகள் காட்டப்படுகின்றன, ஆனால் பகுதி தரவு இல்லை.",
  city_back: "அனைத்து நகரங்கள்",
  city_subtitle:
    "ஒவ்வொரு {unit}-க்கும் மதிப்பிடப்பட்ட ஆபத்து, ஒவ்வொரு குற்ற வகைக்கும் இரவு பெருக்கியோடு.",
  city_map_hint:
    "ஏதேனும் {unit}-ஐ தட்டவும் அதன் முழு அறிக்கையைப் பார்க்க. பெரிதாக்க பிஞ்ச் செய்யவும்.",
  city_data_quality: "தரவு தரம்",
  city_use_location: "என் இருப்பிடத்தைப் பயன்படுத்து",
  city_locating: "கண்டறிகிறது…",
  night_day: "பகல்",
  night_night: "இரவு",
  rank_high_day: "அதிக ஆபத்து · பகல்",
  rank_high_night: "அதிக ஆபத்து · இரவு",
  rank_low_day: "குறைந்த ஆபத்து · பகல்",
  rank_low_night: "குறைந்த ஆபத்து · இரவு",
  badge_per_area: "{n} பகுதி",
  badge_city_stats: "நகர புள்ளிவிவரம்",
  badge_absconders: "{n} தலைமறைவு",
  badge_geometry_only: "வரைபடம் மட்டும்",
  lang_label: "மொழி",
};

const te: Dict = {
  brand_country: "భారతదేశం",
  nav_methodology: "పద్ధతి",
  nav_legal: "న్యాయపరమైనది",
  nav_open_menu: "మెను తెరువు",
  nav_close_menu: "మెను మూసివేయి",
  nav_menu_title: "మెను",
  menu_all_cities: "అన్ని నగరాలు",
  menu_legal_full: "న్యాయపరమైనది & తొలగింపు",
  home_subtitle:
    "భారతీయ నగరాలకు వార్డు-స్థాయి భద్రతా అంచనాలు, అధికారిక పోలీసు ప్రచురణల నుండి తీసుకోబడ్డాయి.",
  home_cta_title:
    "ఈ నగరాలలో ఒకటిలో ఉన్నారా? మీ ప్రాంత గణాంకాలను పొందండి.",
  home_cta_desc:
    "క్రింద నొక్కండి — మీరు ఏ నగరంలో ఉన్నారో గుర్తించి నేరుగా మీ వార్డు నివేదికకు తీసుకువెళ్తాం. మీ స్థానం బ్రౌజర్‌లోనే ఉంటుంది.",
  home_cta_button: "నా ప్రాంతాన్ని కనుగొనండి",
  home_cta_locating: "మీ ప్రాంతాన్ని కనుగొంటున్నాం…",
  home_pick_city: "లేదా ఒక నగరాన్ని ఎంచుకోండి",
  home_cities_count: "{n} నగరాలు",
  dq_title: "డేటా నాణ్యత స్కేల్",
  dq_live: "లైవ్",
  dq_calibrated: "క్రమబద్ధీకరించబడింది",
  dq_seeded: "ప్రాథమికం",
  dq_empty: "ఖాళీ",
  dq_live_desc: "స్వయంచాలక గ్రహణం, అధికారిక పోలీసు ఫీడ్ నుండి ప్రాంత-వారీ డేటా.",
  dq_calibrated_desc:
    "అధికారిక మూలాల నుండి నగర-స్థాయి సంఖ్యలు, సంపాదకీయ బరువుల ద్వారా ప్రాంతాలకు పంపిణీ.",
  dq_seeded_desc:
    "సంపాదకీయ అంచనాలు, ఇంకా నిజ-డేటా క్రమబద్ధీకరణ లేదు.",
  dq_empty_desc:
    "వార్డు సరిహద్దులు చూపబడ్డాయి, కానీ ప్రాంత-వారీ డేటా లేదు.",
  city_back: "అన్ని నగరాలు",
  city_subtitle:
    "ప్రతి {unit}కి అంచనా ప్రమాదం, ప్రతి నేరం రకానికి రాత్రి గుణకంతో.",
  city_map_hint:
    "ఏదైనా {unitని టాప్ చేయండి దాని పూర్ణ నివేదికను తెరవడానికి. జూమ్ చేయడానికి పించ్.",
  city_data_quality: "డేటా నాణ్యత",
  city_use_location: "నా స్థానాన్ని ఉపయోగించండి",
  city_locating: "కనుగొంటున్నాం…",
  night_day: "పగలు",
  night_night: "రాత్రి",
  rank_high_day: "అత్యధిక ప్రమాదం · పగలు",
  rank_high_night: "అత్యధిక ప్రమాదం · రాత్రి",
  rank_low_day: "అత్యల్ప ప్రమాదం · పగలు",
  rank_low_night: "అత్యల్ప ప్రమాదం · రాత్రి",
  badge_per_area: "{n} ప్రాంత-వారీ",
  badge_city_stats: "నగర గణాంకాలు",
  badge_absconders: "{n} పరారీ",
  badge_geometry_only: "సరిహద్దులే",
  lang_label: "భాష",
};

const kn: Dict = {
  brand_country: "ಭಾರತ",
  nav_methodology: "ವಿಧಾನ",
  nav_legal: "ಕಾನೂನು",
  nav_open_menu: "ಮೆನು ತೆರೆಯಿರಿ",
  nav_close_menu: "ಮೆನು ಮುಚ್ಚಿ",
  nav_menu_title: "ಮೆನು",
  menu_all_cities: "ಎಲ್ಲಾ ನಗರಗಳು",
  menu_legal_full: "ಕಾನೂನು ಮತ್ತು ತೆಗೆದುಹಾಕುವಿಕೆ",
  home_subtitle:
    "ಭಾರತೀಯ ನಗರಗಳ ವಾರ್ಡ್-ಮಟ್ಟದ ಸುರಕ್ಷತಾ ಅಂದಾಜುಗಳು, ಲಭ್ಯವಿರುವಲ್ಲಿ ಅಧಿಕೃತ ಪೊಲೀಸ್ ಪ್ರಕಟಣೆಗಳಿಂದ.",
  home_cta_title:
    "ಈ ನಗರಗಳಲ್ಲಿ ಒಂದರಲ್ಲಿ ಇದ್ದೀರಾ? ನಿಮ್ಮ ಪ್ರದೇಶದ ಅಂಕಿಅಂಶ ಪಡೆಯಿರಿ.",
  home_cta_desc:
    "ಕೆಳಗೆ ಒತ್ತಿ — ನೀವು ಯಾವ ನಗರದಲ್ಲಿದ್ದೀರಿ ಎಂದು ಗುರುತಿಸಿ ನೇರವಾಗಿ ನಿಮ್ಮ ವಾರ್ಡ್ ವರದಿಗೆ ಕರೆದೊಯ್ಯುತ್ತೇವೆ.",
  home_cta_button: "ನನ್ನ ಪ್ರದೇಶ ಹುಡುಕಿ",
  home_cta_locating: "ಹುಡುಕುತ್ತಿದ್ದೇವೆ…",
  home_pick_city: "ಅಥವಾ ಒಂದು ನಗರ ಆಯ್ಕೆಮಾಡಿ",
  home_cities_count: "{n} ನಗರಗಳು",
  dq_title: "ಡೇಟಾ ಗುಣಮಟ್ಟ ಮಾಪನ",
  dq_live: "ಲೈವ್",
  dq_calibrated: "ಸಮನ್ವಯಗೊಳಿಸಲಾಗಿದೆ",
  dq_seeded: "ಅಂದಾಜು",
  dq_empty: "ಖಾಲಿ",
  dq_live_desc: "ಸ್ವಯಂಚಾಲಿತ ಗ್ರಹಣ, ಅಧಿಕೃತ ಪೊಲೀಸ್ ಫೀಡ್‌ನಿಂದ ಪ್ರದೇಶ-ವಾರು ಡೇಟಾ.",
  dq_calibrated_desc:
    "ಅಧಿಕೃತ ಮೂಲಗಳಿಂದ ನಗರ-ಮಟ್ಟದ ಎಣಿಕೆ, ಸಂಪಾದಕೀಯ ತೂಕದಿಂದ ಪ್ರದೇಶಗಳಿಗೆ ಹಂಚಲಾಗಿದೆ.",
  dq_seeded_desc:
    "ಸಂಪಾದಕೀಯ ಅಂದಾಜುಗಳು, ಇನ್ನೂ ನಿಜ ಡೇಟಾ ಸಮನ್ವಯ ಇಲ್ಲ.",
  dq_empty_desc:
    "ವಾರ್ಡ್ ಗಡಿಗಳು ತೋರಿಸಲಾಗಿದೆ, ಆದರೆ ಪ್ರದೇಶ-ವಾರು ಡೇಟಾ ಇಲ್ಲ.",
  city_back: "ಎಲ್ಲಾ ನಗರಗಳು",
  city_subtitle:
    "ಪ್ರತಿ {unit}ಗೆ ಅಂದಾಜು ಅಪಾಯ, ಪ್ರತಿ ಅಪರಾಧ ಪ್ರಕಾರಕ್ಕೆ ರಾತ್ರಿಯ ಗುಣಕದೊಂದಿಗೆ.",
  city_map_hint:
    "ಯಾವುದೇ {unit} ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ ಅದರ ಪೂರ್ಣ ವರದಿ ತೆರೆಯಲು. ಜೂಮ್‌ಗೆ ಪಿಂಚ್.",
  city_data_quality: "ಡೇಟಾ ಗುಣಮಟ್ಟ",
  city_use_location: "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
  city_locating: "ಹುಡುಕುತ್ತಿದ್ದೇವೆ…",
  night_day: "ಹಗಲು",
  night_night: "ರಾತ್ರಿ",
  rank_high_day: "ಅತಿ ಹೆಚ್ಚು ಅಪಾಯ · ಹಗಲು",
  rank_high_night: "ಅತಿ ಹೆಚ್ಚು ಅಪಾಯ · ರಾತ್ರಿ",
  rank_low_day: "ಅತಿ ಕಡಿಮೆ ಅಪಾಯ · ಹಗಲು",
  rank_low_night: "ಅತಿ ಕಡಿಮೆ ಅಪಾಯ · ರಾತ್ರಿ",
  badge_per_area: "{n} ಪ್ರದೇಶ-ವಾರು",
  badge_city_stats: "ನಗರ ಅಂಕಿಅಂಶ",
  badge_absconders: "{n} ಪರಾರಿ",
  badge_geometry_only: "ಗಡಿಗಳಷ್ಟೇ",
  lang_label: "ಭಾಷೆ",
};

const gu: Dict = {
  brand_country: "ભારત",
  nav_methodology: "પદ્ધતિ",
  nav_legal: "કાયદાકીય",
  nav_open_menu: "મેનુ ખોલો",
  nav_close_menu: "મેનુ બંધ કરો",
  nav_menu_title: "મેનુ",
  menu_all_cities: "બધાં શહેરો",
  menu_legal_full: "કાયદાકીય અને દૂર કરવાની વિનંતી",
  home_subtitle:
    "ભારતીય શહેરો માટે વોર્ડ-સ્તરના સલામતી અંદાજ, જ્યાં ઉપલબ્ધ ત્યાં સત્તાવાર પોલીસ પ્રકાશનોમાંથી.",
  home_cta_title: "આ શહેરોમાંથી એકમાં છો? તમારા વિસ્તારના આંકડા મેળવો.",
  home_cta_desc:
    "નીચે ટેપ કરો — અમે શોધી લઈશું કે તમે કયા શહેરમાં છો અને સીધા તમારા વોર્ડના રિપોર્ટ પર લઈ જઈશું. તમારું સ્થાન બ્રાઉઝરમાં જ રહે છે.",
  home_cta_button: "મારો વિસ્તાર શોધો",
  home_cta_locating: "વિસ્તાર શોધી રહ્યા છીએ…",
  home_pick_city: "અથવા એક શહેર પસંદ કરો",
  home_cities_count: "{n} શહેરો",
  dq_title: "ડેટા ગુણવત્તા સ્કેલ",
  dq_live: "લાઇવ",
  dq_calibrated: "સંતુલિત",
  dq_seeded: "અંદાજિત",
  dq_empty: "ખાલી",
  dq_live_desc: "ઑટોમેટિક ગ્રહણ, સત્તાવાર પોલીસ ફીડથી વિસ્તાર-આધારિત ડેટા.",
  dq_calibrated_desc:
    "સત્તાવાર સ્રોતોમાંથી શહેર-સ્તરનું ગણતરી, સંપાદકીય વજનો દ્વારા વિસ્તારોમાં વહેંચાયેલ.",
  dq_seeded_desc:
    "સંપાદકીય અંદાજો, હજુ સુધી વાસ્તવિક ડેટા સંતુલન નથી.",
  dq_empty_desc:
    "વોર્ડ સીમાઓ બતાવી છે, પણ વિસ્તાર-આધારિત ડેટા નથી.",
  city_back: "બધાં શહેરો",
  city_subtitle:
    "દરેક {unit} માટે અંદાજિત જોખમ, દરેક ગુનાના પ્રકાર પર રાત્રિના ગુણાંકસાથે.",
  city_map_hint:
    "કોઈપણ {unit} પર ટેપ કરો તેનો સંપૂર્ણ રિપોર્ટ ખોલવા. ઝૂમ માટે પિંચ કરો.",
  city_data_quality: "ડેટા ગુણવત્તા",
  city_use_location: "મારું સ્થાન વાપરો",
  city_locating: "શોધી રહ્યા છીએ…",
  night_day: "દિવસ",
  night_night: "રાત",
  rank_high_day: "ઉચ્ચતમ જોખમ · દિવસ",
  rank_high_night: "ઉચ્ચતમ જોખમ · રાત",
  rank_low_day: "ન્યૂનતમ જોખમ · દિવસ",
  rank_low_night: "ન્યૂનતમ જોખમ · રાત",
  badge_per_area: "{n} વિસ્તાર-આધારિત",
  badge_city_stats: "શહેરના આંકડા",
  badge_absconders: "{n} ફરાર",
  badge_geometry_only: "ફક્ત સીમાઓ",
  lang_label: "ભાષા",
};

const ur: Dict = {
  brand_country: "بھارت",
  nav_methodology: "طریقہ کار",
  nav_legal: "قانونی",
  nav_open_menu: "مینو کھولیں",
  nav_close_menu: "مینو بند کریں",
  nav_menu_title: "مینو",
  menu_all_cities: "تمام شہر",
  menu_legal_full: "قانونی اور ہٹانے کی درخواست",
  home_subtitle:
    "ہندوستانی شہروں کے لیے وارڈ-سطحی تحفظ کے تخمینے، جہاں دستیاب ہوں سرکاری پولیس اشاعتوں سے۔",
  home_cta_title: "ان شہروں میں سے کسی میں ہیں؟ اپنے علاقے کے اعدادوشمار حاصل کریں۔",
  home_cta_desc:
    "نیچے دبائیں — ہم پہچان لیں گے کہ آپ کس شہر میں ہیں اور سیدھے آپ کے وارڈ کی رپورٹ پر لے جائیں گے۔ آپ کا مقام براؤزر میں ہی رہتا ہے۔",
  home_cta_button: "میرا علاقہ تلاش کریں",
  home_cta_locating: "تلاش کر رہے ہیں…",
  home_pick_city: "یا کوئی شہر منتخب کریں",
  home_cities_count: "{n} شہر",
  dq_title: "ڈیٹا معیار اسکیل",
  dq_live: "لائیو",
  dq_calibrated: "متوازن",
  dq_seeded: "تخمینی",
  dq_empty: "خالی",
  dq_live_desc: "خودکار ادخال، سرکاری پولیس فیڈ سے علاقہ وار ڈیٹا۔",
  dq_calibrated_desc:
    "سرکاری ذرائع سے شہری اعداد، ادارتی وزن کے ذریعے علاقوں میں تقسیم۔",
  dq_seeded_desc:
    "ادارتی تخمینے، ابھی کوئی حقیقی ڈیٹا توازن نہیں۔",
  dq_empty_desc:
    "وارڈ کی حدیں دکھائی گئی ہیں، مگر علاقہ وار ڈیٹا نہیں۔",
  city_back: "تمام شہر",
  city_subtitle:
    "ہر {unit} کا تخمینی خطرہ، ہر جرم قسم پر رات کے ضرب کے ساتھ۔",
  city_map_hint:
    "کسی بھی {unit} پر ٹیپ کریں اس کی مکمل رپورٹ کے لیے۔ زوم کے لیے پنچ کریں۔",
  city_data_quality: "ڈیٹا معیار",
  city_use_location: "میرا مقام استعمال کریں",
  city_locating: "تلاش کر رہے ہیں…",
  night_day: "دن",
  night_night: "رات",
  rank_high_day: "بلند ترین خطرہ · دن",
  rank_high_night: "بلند ترین خطرہ · رات",
  rank_low_day: "کم ترین خطرہ · دن",
  rank_low_night: "کم ترین خطرہ · رات",
  badge_per_area: "{n} علاقہ وار",
  badge_city_stats: "شہر کے اعداد",
  badge_absconders: "{n} مفرور",
  badge_geometry_only: "صرف حدود",
  lang_label: "زبان",
};

const or: Dict = {
  brand_country: "ଭାରତ",
  nav_methodology: "ପଦ୍ଧତି",
  nav_legal: "ଆଇନଗତ",
  nav_open_menu: "ମେନୁ ଖୋଲନ୍ତୁ",
  nav_close_menu: "ମେନୁ ବନ୍ଦ କରନ୍ତୁ",
  nav_menu_title: "ମେନୁ",
  menu_all_cities: "ସମସ୍ତ ସହର",
  menu_legal_full: "ଆଇନଗତ ଓ ଅପସାରଣ",
  home_subtitle:
    "ଭାରତୀୟ ସହର ପାଇଁ ୱାର୍ଡ-ସ୍ତରୀୟ ସୁରକ୍ଷା ଆକଳନ, ସରକାରୀ ପୋଲିସ ପ୍ରକାଶନରୁ।",
  home_cta_title:
    "ଏହି ସହର ମଧ୍ୟରୁ କୌଣସିଟିରେ ଅଛନ୍ତି? ଆପଣଙ୍କ ଅଞ୍ଚଳର ତଥ୍ୟ ପାଆନ୍ତୁ।",
  home_cta_desc:
    "ତଳେ ଟ୍ୟାପ କରନ୍ତୁ — ଆମେ ଚିହ୍ନଟ କରିବୁ ଆପଣ କେଉଁ ସହରରେ ଅଛନ୍ତି ଏବଂ ସିଧାସଳଖ ଆପଣଙ୍କ ୱାର୍ଡ ରିପୋର୍ଟକୁ ନେଇଯିବୁ।",
  home_cta_button: "ମୋର ଅଞ୍ଚଳ ଖୋଜନ୍ତୁ",
  home_cta_locating: "ଖୋଜୁଛୁ…",
  home_pick_city: "କିମ୍ବା ଗୋଟିଏ ସହର ବାଛନ୍ତୁ",
  home_cities_count: "{n} ସହର",
  dq_title: "ତଥ୍ୟ ଗୁଣବତ୍ତା ସ୍କେଲ",
  dq_live: "ଲାଇଭ",
  dq_calibrated: "ସମନ୍ୱିତ",
  dq_seeded: "ଆକଳନ",
  dq_empty: "ଖାଲି",
  dq_live_desc: "ସ୍ୱୟଂଚାଳିତ ଗ୍ରହଣ, ସରକାରୀ ପୋଲିସ ଫିଡରୁ ଅଞ୍ଚଳ ଓ୍ୱାରୀ ତଥ୍ୟ।",
  dq_calibrated_desc:
    "ସରକାରୀ ସ୍ରୋତରୁ ସହର-ସ୍ତରୀୟ ଗଣନା, ସମ୍ପାଦକୀୟ ଓଜନରେ ଅଞ୍ଚଳରେ ବାଣ୍ଟିଅଛି।",
  dq_seeded_desc:
    "ସମ୍ପାଦକୀୟ ଆକଳନ, ଏବେ ସୁଦ୍ଧା ବାସ୍ତବ ତଥ୍ୟ ସମନ୍ୱୟ ନାହିଁ।",
  dq_empty_desc:
    "ୱାର୍ଡ ସୀମା ଦେଖାଯାଇଛି, କିନ୍ତୁ ଅଞ୍ଚଳ ତଥ୍ୟ ନାହିଁ।",
  city_back: "ସମସ୍ତ ସହର",
  city_subtitle:
    "ପ୍ରତି {unit}କୁ ଆକଳନ ଝୁଣ୍ଟି, ପ୍ରତ୍ୟେକ ଅପରାଧ ପ୍ରକାରକୁ ରାତି ଗୁଣକ ସହିତ।",
  city_map_hint:
    "ଯେକୌଣସି {unit} ଉପରେ ଟ୍ୟାପ କରନ୍ତୁ ସେଥିର ସମ୍ପୂର୍ଣ୍ଣ ରିପୋର୍ଟ ଖୋଲିବାକୁ। ଜୁମ ପାଇଁ ପିଞ୍ଚ କରନ୍ତୁ।",
  city_data_quality: "ତଥ୍ୟ ଗୁଣବତ୍ତା",
  city_use_location: "ମୋର ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ",
  city_locating: "ଖୋଜୁଛୁ…",
  night_day: "ଦିନ",
  night_night: "ରାତି",
  rank_high_day: "ସର୍ବାଧିକ ବିପଦ · ଦିନ",
  rank_high_night: "ସର୍ବାଧିକ ବିପଦ · ରାତି",
  rank_low_day: "ସର୍ବନିମ୍ନ ବିପଦ · ଦିନ",
  rank_low_night: "ସର୍ବନିମ୍ନ ବିପଦ · ରାତି",
  badge_per_area: "{n} ଅଞ୍ଚଳ ଓ୍ୱାରୀ",
  badge_city_stats: "ସହର ତଥ୍ୟ",
  badge_absconders: "{n} ଫରାର",
  badge_geometry_only: "କେବଳ ସୀମା",
  lang_label: "ଭାଷା",
};

const ml: Dict = {
  brand_country: "ഇന്ത്യ",
  nav_methodology: "രീതി",
  nav_legal: "നിയമപരം",
  nav_open_menu: "മെനു തുറക്കുക",
  nav_close_menu: "മെനു അടയ്ക്കുക",
  nav_menu_title: "മെനു",
  menu_all_cities: "എല്ലാ നഗരങ്ങളും",
  menu_legal_full: "നിയമപരം & നീക്കം ചെയ്യൽ",
  home_subtitle:
    "ഇന്ത്യൻ നഗരങ്ങൾക്കായുള്ള വാർഡ്-തലത്തിലെ സുരക്ഷാ കണക്കുകൾ, ലഭ്യമെങ്കിൽ ഔദ്യോഗിക പോലീസ് പ്രസിദ്ധീകരണങ്ങളിൽ നിന്നും.",
  home_cta_title:
    "ഈ നഗരങ്ങളിലൊന്നിലാണോ? നിങ്ങളുടെ പ്രദേശത്തിന്റെ കണക്കുകൾ കാണുക.",
  home_cta_desc:
    "താഴെ ടാപ്പ് ചെയ്യുക — നിങ്ങൾ ഏത് നഗരത്തിലാണെന്ന് കണ്ടെത്തി നേരിട്ട് നിങ്ങളുടെ വാർഡ് റിപ്പോർട്ടിലേക്ക് കൊണ്ടുപോകും. നിങ്ങളുടെ സ്ഥാനം ബ്രൗസറിൽ മാത്രമേ ഉണ്ടാകൂ.",
  home_cta_button: "എന്റെ പ്രദേശം കണ്ടെത്തുക",
  home_cta_locating: "കണ്ടെത്തുന്നു…",
  home_pick_city: "അല്ലെങ്കിൽ ഒരു നഗരം തിരഞ്ഞെടുക്കുക",
  home_cities_count: "{n} നഗരങ്ങൾ",
  dq_title: "ഡാറ്റ ഗുണനിലവാര സ്കെയിൽ",
  dq_live: "ലൈവ്",
  dq_calibrated: "സന്തുലിതം",
  dq_seeded: "കണക്ക്",
  dq_empty: "ശൂന്യം",
  dq_live_desc: "ഓട്ടോമേറ്റഡ് ഇൻജസ്റ്റ്, ഔദ്യോഗിക പോലീസ് ഫീഡിൽ നിന്ന് പ്രദേശാടിസ്ഥാന ഡാറ്റ.",
  dq_calibrated_desc:
    "ഔദ്യോഗിക സ്രോതസ്സുകളിൽ നിന്ന് നഗര-തലത്തിലെ എണ്ണം, എഡിറ്റോറിയൽ വെയ്റ്റ് ഉപയോഗിച്ച് പ്രദേശങ്ങളിൽ വിതരണം.",
  dq_seeded_desc:
    "എഡിറ്റോറിയൽ കണക്ക്, ഇതുവരെ യഥാർത്ഥ ഡാറ്റ സന്തുലനം ഇല്ല.",
  dq_empty_desc:
    "വാർഡ് അതിർത്തി കാണിച്ചിരിക്കുന്നു, പക്ഷേ പ്രദേശാടിസ്ഥാന ഡാറ്റ ഇല്ല.",
  city_back: "എല്ലാ നഗരങ്ങളും",
  city_subtitle:
    "ഓരോ {unit}-നുമുള്ള കണക്കാക്കിയ അപായസാധ്യത, ഓരോ കുറ്റ വർഗ്ഗത്തിലും രാത്രി ഗുണകത്തോടെ.",
  city_map_hint:
    "ഏതെങ്കിലും {unit}-ൽ ടാപ്പ് ചെയ്ത് അതിന്റെ പൂർണ്ണ റിപ്പോർട്ട് തുറക്കുക. സൂം ചെയ്യാൻ പിഞ്ച്.",
  city_data_quality: "ഡാറ്റ ഗുണനിലവാരം",
  city_use_location: "എന്റെ സ്ഥാനം ഉപയോഗിക്കുക",
  city_locating: "കണ്ടെത്തുന്നു…",
  night_day: "പകൽ",
  night_night: "രാത്രി",
  rank_high_day: "ഏറ്റവും ഉയർന്ന അപായം · പകൽ",
  rank_high_night: "ഏറ്റവും ഉയർന്ന അപായം · രാത്രി",
  rank_low_day: "ഏറ്റവും കുറഞ്ഞ അപായം · പകൽ",
  rank_low_night: "ഏറ്റവും കുറഞ്ഞ അപായം · രാത്രി",
  badge_per_area: "{n} പ്രദേശം",
  badge_city_stats: "നഗര കണക്ക്",
  badge_absconders: "{n} ഒളിച്ചോടി",
  badge_geometry_only: "അതിർത്തി മാത്രം",
  lang_label: "ഭാഷ",
};

const pa: Dict = {
  brand_country: "ਭਾਰਤ",
  nav_methodology: "ਤਰੀਕਾ",
  nav_legal: "ਕਾਨੂੰਨੀ",
  nav_open_menu: "ਮੀਨੂ ਖੋਲ੍ਹੋ",
  nav_close_menu: "ਮੀਨੂ ਬੰਦ ਕਰੋ",
  nav_menu_title: "ਮੀਨੂ",
  menu_all_cities: "ਸਾਰੇ ਸ਼ਹਿਰ",
  menu_legal_full: "ਕਾਨੂੰਨੀ ਅਤੇ ਹਟਾਉਣ ਦੀ ਬੇਨਤੀ",
  home_subtitle:
    "ਭਾਰਤੀ ਸ਼ਹਿਰਾਂ ਲਈ ਵਾਰਡ-ਪੱਧਰੀ ਸੁਰੱਖਿਆ ਅੰਦਾਜ਼, ਜਿੱਥੇ ਉਪਲਬਧ ਉੱਥੇ ਸਰਕਾਰੀ ਪੁਲਿਸ ਪ੍ਰਕਾਸ਼ਨਾਂ ਤੋਂ।",
  home_cta_title:
    "ਇਨ੍ਹਾਂ ਸ਼ਹਿਰਾਂ ਵਿੱਚੋਂ ਇੱਕ ਵਿੱਚ ਹੋ? ਆਪਣੇ ਇਲਾਕੇ ਦੇ ਅੰਕੜੇ ਲਵੋ।",
  home_cta_desc:
    "ਹੇਠਾਂ ਟੈਪ ਕਰੋ — ਅਸੀਂ ਪਛਾਣ ਲਵਾਂਗੇ ਤੁਸੀਂ ਕਿਹੜੇ ਸ਼ਹਿਰ ਵਿੱਚ ਹੋ ਅਤੇ ਸਿੱਧੇ ਤੁਹਾਡੇ ਵਾਰਡ ਦੀ ਰਿਪੋਰਟ ਤੇ ਲੈ ਜਾਵਾਂਗੇ।",
  home_cta_button: "ਮੇਰਾ ਇਲਾਕਾ ਲੱਭੋ",
  home_cta_locating: "ਲੱਭ ਰਹੇ ਹਾਂ…",
  home_pick_city: "ਜਾਂ ਇੱਕ ਸ਼ਹਿਰ ਚੁਣੋ",
  home_cities_count: "{n} ਸ਼ਹਿਰ",
  dq_title: "ਡੇਟਾ ਗੁਣਵੱਤਾ ਸਕੇਲ",
  dq_live: "ਲਾਈਵ",
  dq_calibrated: "ਸੰਤੁਲਿਤ",
  dq_seeded: "ਅੰਦਾਜ਼",
  dq_empty: "ਖਾਲੀ",
  dq_live_desc: "ਆਟੋਮੈਟਿਕ ਇਨਜੈਸਟ, ਸਰਕਾਰੀ ਪੁਲਿਸ ਫੀਡ ਤੋਂ ਇਲਾਕਾ-ਅਧਾਰਿਤ ਡੇਟਾ।",
  dq_calibrated_desc:
    "ਸਰਕਾਰੀ ਸਰੋਤਾਂ ਤੋਂ ਸ਼ਹਿਰ-ਪੱਧਰੀ ਗਿਣਤੀ, ਸੰਪਾਦਕੀ ਭਾਰਾਂ ਨਾਲ ਇਲਾਕਿਆਂ ਵਿੱਚ ਵੰਡੀ ਹੋਈ।",
  dq_seeded_desc:
    "ਸੰਪਾਦਕੀ ਅੰਦਾਜ਼, ਅਜੇ ਅਸਲ ਡੇਟਾ ਸੰਤੁਲਨ ਨਹੀਂ।",
  dq_empty_desc:
    "ਵਾਰਡ ਸੀਮਾਵਾਂ ਦਿਖਾਈਆਂ ਗਈਆਂ, ਪਰ ਇਲਾਕਾ-ਅਧਾਰਿਤ ਡੇਟਾ ਨਹੀਂ।",
  city_back: "ਸਾਰੇ ਸ਼ਹਿਰ",
  city_subtitle:
    "ਹਰ {unit} ਲਈ ਅੰਦਾਜ਼ਨ ਖਤਰਾ, ਹਰ ਅਪਰਾਧ ਕਿਸਮ ਤੇ ਰਾਤ ਦੇ ਗੁਣਾਂਕ ਨਾਲ।",
  city_map_hint:
    "ਕਿਸੇ ਵੀ {unit} ਤੇ ਟੈਪ ਕਰੋ ਇਸ ਦੀ ਪੂਰੀ ਰਿਪੋਰਟ ਖੋਲ੍ਹਣ ਲਈ। ਜ਼ੂਮ ਲਈ ਪਿੰਚ ਕਰੋ।",
  city_data_quality: "ਡੇਟਾ ਗੁਣਵੱਤਾ",
  city_use_location: "ਮੇਰੀ ਥਾਂ ਵਰਤੋ",
  city_locating: "ਲੱਭ ਰਹੇ ਹਾਂ…",
  night_day: "ਦਿਨ",
  night_night: "ਰਾਤ",
  rank_high_day: "ਸਭ ਤੋਂ ਉੱਚ ਖਤਰਾ · ਦਿਨ",
  rank_high_night: "ਸਭ ਤੋਂ ਉੱਚ ਖਤਰਾ · ਰਾਤ",
  rank_low_day: "ਸਭ ਤੋਂ ਘੱਟ ਖਤਰਾ · ਦਿਨ",
  rank_low_night: "ਸਭ ਤੋਂ ਘੱਟ ਖਤਰਾ · ਰਾਤ",
  badge_per_area: "{n} ਇਲਾਕਾ-ਅਧਾਰਿਤ",
  badge_city_stats: "ਸ਼ਹਿਰ ਦੇ ਅੰਕੜੇ",
  badge_absconders: "{n} ਫਰਾਰ",
  badge_geometry_only: "ਕੇਵਲ ਸੀਮਾਵਾਂ",
  lang_label: "ਭਾਸ਼ਾ",
};

const as: Dict = {
  brand_country: "ভাৰত",
  nav_methodology: "পদ্ধতি",
  nav_legal: "আইনী",
  nav_open_menu: "মেনু খোলক",
  nav_close_menu: "মেনু বন্ধ কৰক",
  nav_menu_title: "মেনু",
  menu_all_cities: "সকলো নগৰ",
  menu_legal_full: "আইনী আৰু আঁতৰোৱা",
  home_subtitle:
    "ভাৰতীয় নগৰৰ বাবে ৱাৰ্ড-স্তৰৰ সুৰক্ষা অনুমান, য'ত উপলব্ধ চৰকাৰী পুলিচ প্ৰকাশনৰ পৰা।",
  home_cta_title:
    "এই নগৰবোৰৰ এটাত আছে নেকি? আপোনাৰ এলেকাৰ পৰিসংখ্যা পাওক।",
  home_cta_desc:
    "তলত টেপ কৰক — আমি চিনাক্ত কৰিম আপুনি কোনটো নগৰত আছে আৰু পোনে পোনে আপোনাৰ ৱাৰ্ডৰ ৰিপ'ৰ্টলৈ লৈ যাম। আপোনাৰ স্থান ব্ৰাউজাৰতে থাকে।",
  home_cta_button: "মোৰ এলেকা বিচাৰক",
  home_cta_locating: "বিচাৰিছোঁ…",
  home_pick_city: "অথবা এখন নগৰ বাছনি কৰক",
  home_cities_count: "{n} নগৰ",
  dq_title: "ডেটা গুণৰ মাপ",
  dq_live: "লাইভ",
  dq_calibrated: "সমন্বিত",
  dq_seeded: "অনুমান",
  dq_empty: "খালী",
  dq_live_desc: "স্বয়ংক্ৰিয় গ্ৰহণ, চৰকাৰী পুলিচ ফিডৰ পৰা এলেকা-ভিত্তিক ডেটা।",
  dq_calibrated_desc:
    "চৰকাৰী উৎসৰ পৰা নগৰ-স্তৰৰ গণনা, সম্পাদকীয় ওজনৰ দ্বাৰা এলেকাত বিতৰণ।",
  dq_seeded_desc:
    "সম্পাদকীয় অনুমান, এতিয়াও প্ৰকৃত ডেটা সমন্বয় নাই।",
  dq_empty_desc:
    "ৱাৰ্ডৰ সীমা দেখুৱাইছে, কিন্তু এলেকা-ভিত্তিক ডেটা নাই।",
  city_back: "সকলো নগৰ",
  city_subtitle:
    "প্ৰতি {unit}ৰ অনুমান বিপদ, প্ৰতিটো অপৰাধ ধৰণৰ ৰাতিৰ গুণকৰ সৈতে।",
  city_map_hint:
    "যিকোনো {unit}ত টেপ কৰক ইয়াৰ সম্পূৰ্ণ ৰিপ'ৰ্ট খুলিবলৈ। জুমৰ বাবে পিঞ্চ কৰক।",
  city_data_quality: "ডেটা গুণ",
  city_use_location: "মোৰ স্থান ব্যৱহাৰ কৰক",
  city_locating: "বিচাৰিছোঁ…",
  night_day: "দিন",
  night_night: "ৰাতি",
  rank_high_day: "সৰ্বোচ্চ বিপদ · দিন",
  rank_high_night: "সৰ্বোচ্চ বিপদ · ৰাতি",
  rank_low_day: "সৰ্বনিম্ন বিপদ · দিন",
  rank_low_night: "সৰ্বনিম্ন বিপদ · ৰাতি",
  badge_per_area: "{n} এলেকা-ভিত্তিক",
  badge_city_stats: "নগৰ পৰিসংখ্যা",
  badge_absconders: "{n} ফৰাৰ",
  badge_geometry_only: "কেৱল সীমা",
  lang_label: "ভাষা",
};

export const DICTIONARIES: Record<Locale, Dict> = {
  en,
  hi,
  bn,
  mr,
  te,
  ta,
  gu,
  ur,
  kn,
  or: or,
  ml,
  pa,
  as,
};
