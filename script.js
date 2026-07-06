const KampoParser = window.KampoEngine.Parser;
const KampoNormalizer = window.KampoEngine.Normalizer;
const KampoRecommendationEngine = window.KampoEngine.RecommendationEngine;
const KampoExcelFormulaKb = window.EXCEL_FORMULA_KB || [];

// Script file for Kampo Clinical Selector

// ==========================================
// 1. DATABASE DEFINITION (六證、五臟、方劑)
// ==========================================

// Six Syndromes (六證) Database
const SYNDROME_DB = {
    qi_xu: {
        name: '氣虛',
        threshold: 30,
        symptoms: [
            { id: 'qx_倦怠', label: '倦怠', score: 10 },
            { id: 'qx_無力', label: '無力', score: 10 },
            { id: 'qx_易疲勞', label: '易疲勞', score: 10 },
            { id: 'qx_內臟下垂', label: '內臟下垂', score: 10 },
            { id: 'qx_胖大舌', label: '胖大舌', score: 8 },
            { id: 'qx_脈弱', label: '脈弱', score: 8 },
            { id: 'qx_腹力弱', label: '腹力弱', score: 8 },
            { id: 'qx_易感冒', label: '易感冒', score: 8 },
            { id: 'qx_欲睡', label: '欲睡', score: 6 },
            { id: 'qx_小腹不仁', label: '小腹不仁', score: 6 },
            { id: 'qx_目光無力', label: '目光無力', score: 6 },
            { id: 'qx_食欲不振', label: '食欲不振', score: 4 },
            { id: 'qx_易驚', label: '易驚', score: 4 },
            { id: 'qx_腹瀉', label: '腹瀉', score: 4 }
        ]
    },
    qi_ni: {
        name: '氣逆',
        threshold: 30,
        symptoms: [
            { id: 'qn_上熱下寒烘熱', label: '上熱下寒烘熱', score: 14 },
            { id: 'qn_臍上悸動', label: '臍上悸動', score: 14 },
            { id: 'qn_顏面潮紅', label: '顏面潮紅', score: 10 },
            { id: 'qn_咳喘', label: '咳喘', score: 10 },
            { id: 'qn_心悸', label: '心悸', score: 8 },
            { id: 'qn_焦躁', label: '焦躁', score: 8 },
            { id: 'qn_頭痛', label: '頭痛', score: 8 },
            { id: 'qn_嘔吐', label: '嘔吐', score: 8 },
            { id: 'qn_易驚', label: '易驚', score: 6 },
            { id: 'qn_腹痛', label: '腹痛', score: 6 },
            { id: 'qn_足冷', label: '足冷', score: 4 },
            { id: 'qn_手足汗', label: '手足汗', score: 4 }
        ]
    },
    qi_yu: {
        name: '氣郁',
        threshold: 30,
        symptoms: [
            { id: 'qy_抑鬱傾向', label: '抑鬱傾向', score: 18 },
            { id: 'qy_喉部堵塞感', label: '喉部堵塞感', score: 12 },
            { id: 'qy_頭重眩暈', label: '頭重眩暈', score: 8 },
            { id: 'qy_症狀隨時間變', label: '症狀隨時間變', score: 8 },
            { id: 'qy_晨起困難', label: '晨起困難', score: 8 },
            { id: 'qy_胸悶', label: '胸悶', score: 8 },
            { id: 'qy_脇脹', label: '脇脹', score: 8 },
            { id: 'qy_腹脹', label: '腹脹', score: 8 },
            { id: 'qy_腹部鼓音', label: '腹部鼓音', score: 8 },
            { id: 'qy_矢氣多', label: '矢氣多', score: 6 },
            { id: 'qy_噯氣', label: '噯氣', score: 4 },
            { id: 'qy_尿不盡', label: '尿不盡', score: 4 }
        ]
    },
    xue_xu: {
        name: '血虛',
        threshold: 30,
        symptoms: [
            { id: 'xx_皮膚乾燥', label: '皮膚乾燥', score: 14 },
            { id: 'xx_眼疲勞', label: '眼疲勞', score: 12 },
            { id: 'xx_面色不佳', label: '面色不佳', score: 10 },
            { id: 'xx_小腿抽筋', label: '小腿抽筋', score: 10 },
            { id: 'xx_眩暈', label: '眩暈', score: 8 },
            { id: 'xx_脫髮', label: '脫髮', score: 8 },
            { id: 'xx_爪甲異常', label: '爪甲異常', score: 8 },
            { id: 'xx_注意力不集中', label: '注意力不集中', score: 6 },
            { id: 'xx_失眠', label: '失眠', score: 6 },
            { id: 'xx_知覺障礙', label: '知覺障礙', score: 6 },
            { id: 'xx_經少', label: '經少', score: 6 },
            { id: 'xx_腹直肌拘攣', label: '腹直肌拘攣', score: 6 }
        ]
    },
    yu_xue: {
        name: '瘀血',
        threshold: 20,
        symptoms: [
            { id: 'yx_舌暗紫', label: '舌暗紫', score: 10, scoreFemale: 10 },
            { id: 'yx_齒齦暗紅', label: '齒齦暗紅', score: 10, scoreFemale: 5 },
            { id: 'yx_痔瘡', label: '痔瘡', score: 10, scoreFemale: 5 },
            { id: 'yx_眼瞼色素', label: '眼瞼色素', score: 10, scoreFemale: 10 },
            { id: 'yx_月經不調', label: '月經不調', score: 0, scoreFemale: 10 },
            { id: 'yx_皮下出血', label: '皮下出血', score: 2, scoreFemale: 10 },
            { id: 'yx_皮膚甲錯', label: '皮膚甲錯', score: 2, scoreFemale: 5 },
            { id: 'yx_手掌紅斑', label: '手掌紅斑', score: 2, scoreFemale: 5 },
            { id: 'yx_細絡', label: '細絡', score: 5, scoreFemale: 5 },
            { id: 'yx_腹部壓痛抵抗', label: '腹部壓痛抵抗 (根據部位 5-10)', score: 8, scoreFemale: 8 }
        ]
    },
    shui_zhi: {
        name: '水滯',
        threshold: 13,
        symptoms: [
            { id: 'sz_浮腫傾向_胃部振水音', label: '浮腫傾向/胃部振水音', score: 15 },
            { id: 'sz_胸腹水', label: '胸腹水', score: 15 },
            { id: 'sz_尿減少', label: '尿減少', score: 7 },
            { id: 'sz_關節晨僵', label: '關節晨僵', score: 7 },
            { id: 'sz_眩暈感', label: '眩暈感', score: 5 },
            { id: 'sz_易暈車', label: '易暈車', score: 5 },
            { id: 'sz_水樣便', label: '水樣便', score: 5 },
            { id: 'sz_多尿', label: '多尿', score: 5 },
            { id: 'sz_臍上悸動', label: '臍上悸動', score: 5 },
            { id: 'sz_頭痛', label: '頭痛', score: 4 },
            { id: 'sz_沫痰', label: '沫痰', score: 4 },
            { id: 'sz_重著感', label: '重著感', score: 3 },
            { id: 'sz_噁心', label: '噁心', score: 3 },
            { id: 'sz_水鼻涕', label: '水鼻涕', score: 3 }
        ]
    }
};

// Five Organs (五臟) Database
const ORGAN_DB = {
    liver: {
        name: '肝臟異常',
        description: '主要管理神經調節、肌肉痙攣、情緒及血行阻滯狀態。',
        symptoms: [
            { id: 'liv_神經過敏', label: '神經過敏，易怒，不安穩多動', score: 1 },
            { id: 'liv_肌肉痙攣', label: '肌肉痙攣，平滑肌/骨骼肌痙攣，小兒夜啼', score: 1 },
            { id: 'liv_胃部振水音', label: '胃腸虛弱，胃部振水音，易疲勞', score: 1 },
            { id: 'liv_頭痛眩暈', label: '頭痛，眩暈感，眼痛，健忘，高血壓', score: 1 },
            { id: 'liv_精神不安', label: '精神不安，焦躁感，陣發性發熱，月經異常', score: 1 },
            { id: 'liv_咽喉炎', label: '頭痛，上逆感，口腔/咽喉炎症，胸脇苦滿', score: 1 },
            { id: 'liv_結膜充血', label: '頭痛，眼結膜充血，耳鳴，尿路感染', score: 1 },
            { id: 'liv_胸脇苦滿', label: '頭痛，痙攣，肩凝，易怒，胸脇苦滿', score: 1 },
            { id: 'liv_肢冷月經', label: '易疲勞，食欲不振，肢冷症，月經不調，貧血', score: 1 },
            { id: 'liv_腹直肌緊張', label: '兩側腹直肌緊張', score: 1 }
        ]
    },
    heart: {
        name: '心臟異常',
        description: '管理血液循環、精神狀態、心神安寧及虛熱狀態。',
        symptoms: [
            { id: 'hrt_顏面潮紅', label: '顏面潮紅，煩躁不安，出血，心窩部抵抗，便秘，熱感', score: 1 },
            { id: 'hrt_下腹壓痛', label: '顏面潮紅，煩躁不安，熱感，抑鬱傾向，下腹部廣泛壓痛', score: 1 },
            { id: 'hrt_胸內苦悶', label: '胸內苦悶感，焦躁感，失眠，熱感', score: 1 },
            { id: 'hrt_腹鳴嘔吐', label: '精神不安，神經過敏，腹鳴，噁心，嘔吐，泛酸，心窩部抵抗', score: 1 },
            { id: 'hrt_甘草瀉心', label: '精神不安，偏執，神經過敏，噁心，嘔吐，腹瀉，心窩部抵抗', score: 1 },
            { id: 'hrt_下尿道症', label: '神經過敏，下尿道神經症，抑鬱，全身倦怠', score: 1 },
            { id: 'hrt_酸棗仁症', label: '虛弱，失眠，微熱，口乾，時有咳嗽，嗜睡', score: 1 },
            { id: 'hrt_失眠多夢', label: '失眠，眠淺，多夢', score: 1 },
            { id: 'hrt_口乾心悸', label: '失眠，口內乾燥，皮膚枯燥，心悸，胸內苦悶感', score: 1 },
            { id: 'hrt_脈結代', label: '心悸，氣短，脈結代，皮膚枯燥，口乾，易疲勞', score: 1 },
            { id: 'hrt_生脈飲症', label: '口渴，脈結代，低血壓，心功能不全', score: 1 }
        ]
    },
    spleen: {
        name: '脾臟異常',
        description: '主運化，主管消化吸收、營養輸送、水液代謝及四肢肌肉。',
        symptoms: [
            { id: 'spl_食欲不振', label: '食慾不振，少量進食即胃部脹滿，噁心，嘔吐，腹瀉，易疲勞', score: 1 },
            { id: 'spl_心窩膨滿', label: '食慾不振，心窩部膨滿感，噁心，嘔吐，胃部振水音', score: 1 },
            { id: 'spl_上腹疼痛', label: '上腹部疼痛，胸痛，腹瀉傾向，心下痞硬', score: 1 },
            { id: 'spl_軟便無熱', label: '腹瀉，軟便，無裡急後重，無熱候', score: 1 },
            { id: 'spl_歸脾症狀', label: '面色欠佳，精神不安，健忘，失眠，抑鬱，胃部脹滿', score: 1 },
            { id: 'spl_肢冷嘔吐', label: '頭痛，嘔吐，腹痛，腹瀉傾向，胃部振水音，心下痞硬，肢冷證', score: 1 },
            { id: 'spl_食後倦怠', label: '頭重，頭痛，眩暈感，肢冷證，食後倦怠感顯著', score: 1 },
            { id: 'spl_口內炎', label: '口渴，喜冷飲，口內炎，胃部脹滿，舌痛症', score: 1 },
            { id: 'spl_黃芪建中', label: '盜汗，臍周痛，全身倦怠，食慾不振，兩側腹直肌拘攣', score: 1 },
            { id: 'spl_小建中', label: '臍周痛，兩側腹直肌拘攣，皮膚淺黑，時有手足發熱', score: 1 },
            { id: 'spl_人參養榮', label: '盜汗，臍周痛，羸瘦，手足發冷，皮膚枯燥', score: 1 },
            { id: 'spl_十全大補', label: '貧血，羸瘦，手足發冷，皮膚枯燥', score: 1 }
        ]
    },
    lung: {
        name: '肺臟異常',
        description: '主呼吸，主宣發肅降，調理水液通道及皮膚禦寒屏障。',
        symptoms: [
            { id: 'lng_小青龍', label: '水樣鼻涕，泡沫樣痰，惡寒，發熱，胃部振水音', score: 1 },
            { id: 'lng_苓甘五味', label: '喘鳴，咳嗽，水樣痰，氣短，浮腫，胃部振水音', score: 1 },
            { id: 'lng_麻黃附子', label: '水樣鼻涕，咳嗽，咽痛，惡寒，四肢發冷', score: 1 },
            { id: 'lng_桂枝去芍', label: '胸部塞窒感，咳嗽，發冷，心窩部廣泛抵抗', score: 1 },
            { id: 'lng_甘草乾姜', label: '泡沫樣痰，胸內滿悶，喘鳴，尿量增加，發冷', score: 1 },
            { id: 'lng_麥門冬', label: '咽喉乾燥感，痙攣性咳嗽，咽喉狹窄感，嗆逆感', score: 1 },
            { id: 'lng_竹葉石膏', label: '咽喉乾燥/嗆逆感，口渴，口內乾燥，微熱，心窩部痞塞', score: 1 },
            { id: 'lng_滋陰降火', label: '晨起/傍晚咳嗽頻繁，上呼吸道乾燥，乾性咳嗽', score: 1 },
            { id: 'lng_滋陰至寶', label: '乾性咳嗽，上呼吸道乾燥，羸瘦，皮膚枯燥，易疲勞', score: 1 }
        ]
    },
    kidney: {
        name: '腎臟異常',
        description: '主骨生髓，藏精，主管水液代謝，管理生殖發育與下肢溫煦。',
        symptoms: [
            { id: 'kid_右歸飲', label: '易疲勞，腹痛，腰痛，下肢發冷，陽萎', score: 1 },
            { id: 'kid_濟生腎氣', label: '易疲勞，腰痛，下肢痛，浮腫，陽萎，下肢發冷明顯', score: 1 },
            { id: 'kid_六味地黃', label: '頭暈感，耳鳴，咽痛，口渴，腰腿肌力低下，手足煩熱，遺精', score: 1 },
            { id: 'kid_左歸飲', label: '腰腿肌力低下，口內乾燥，盜汗，口渴，皮膚枯燥', score: 1 },
            { id: 'kid_杞菊地黃', label: '視力低下，雙目乾燥感，頭暈感，腰腿肌力低下', score: 1 },
            { id: 'kid_八味腎氣', label: '易疲勞，思考力下降，健忘，腰痛，下肢痛，陽萎，口渴，全身發冷，浮腫，夜尿頻', score: 1 }
        ]
    }
};

// Kampo Formulas Database (對應所有 Excel Sheets)
const FORMULA_DB = [
    // --- 水滯 皮膚關節型 ---
    { name: '越婢湯', type: '虛實夾雜', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '發熱，口渴，自然汗出傾向，浮腫，關節痛' },
    { name: '越婢加術湯', type: '虛實夾雜', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '顏面浮腫，尿量減少，口渴，關節痛' },
    { name: '桂枝二越婢一湯', type: '虛實夾雜', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '顏面潮紅，輕度口渴，自然汗出，關節痛，尿量減少' },
    { name: '薏苡仁湯', type: '虛實夾雜', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '關節痛，關節腫脹，熱感，關節晨僵，無口渴' },
    { name: '防己黃芪湯', type: '虛證', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '虛胖，下肢浮腫，面頰潮紅，身體沉重疲憊感，尿量減少，無口渴' },
    { name: '防己茯苓湯', type: '虛證', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '虛胖，肌肉松軟，面頰潮紅，關節痛，關節晨僵，肌肉拘攣' },
    { name: '桂枝加術附湯', type: '虛證', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '四肢發冷，肌肉拘攣，自然汗出，關節痛，關節晨僵，尿量減少' },
    { name: '大防風湯', type: '虛證', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '關節痛，下肢浮腫，貧血傾向，易疲勞，下肢肌力低下' },
    { name: '麻黃附子細辛湯', type: '虛證', category: 'water_stasis_skin_joint', syndrome: 'shui_zhi',
      indications: '惡寒，頭痛，易疲勞，咳嗽，咽痛，關節痛，面色蒼白' },

    // --- 水滯 全身型 ---
    { name: '防風通聖散', type: '實證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '腹部膨隆有力，便秘，關節痛，關節晨僵' },
    { name: '龍膽瀉肝湯', type: '實證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '排尿痛，排尿困難，尿頻，帶下，陰部熱感、充血' },
    { name: '豬苓湯', type: '虛實夾雜', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '尿量減少，口渴，排尿痛，精神不安，無自然汗出' },
    { name: '柴苓湯', type: '虛實夾雜', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '胸脇苦滿，口渴，尿量減少，食欲不振，浮腫' },
    { name: '澤瀉湯', type: '虛實夾雜', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '眩暈發作，眩暈感，頭昏蒙感，胃部振水音，尿量減少' },
    { name: '五苓散', type: '虛實夾雜', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '口渴，尿量減少，自然汗出傾向，嘔吐，腹瀉，頭痛，胃部振水音' },
    { name: '苓桂術甘湯', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '直立性眩暈，上熱下寒烘熱，胃部振水音，臍上悸動，心悸' },
    { name: '苓薑術甘湯', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '腰與下肢發冷，腰部沉重感，多尿、低張尿，浮腫' },
    { name: '當歸芍藥散', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '貧血傾向，月經不調，四肢發冷，浮腫，腹痛，臍旁壓痛，胃部振水音' },
    { name: '八味腎氣丸', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '小腹不仁，易疲勞，小便異常，夜尿頻，腰膝發冷，浮腫傾向' },
    { name: '濟生腎氣丸', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '小腹不仁，易疲勞，小便異常，夜尿頻，腰膝發冷，膝關節痛，浮腫明顯' },
    { name: '附子湯', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '易疲勞，背部惡寒，肌肉痛，關節痛，關節晨僵，尿量減少，浮腫' },
    { name: '真武湯', type: '虛證', category: 'water_stasis_general', syndrome: 'shui_zhi',
      indications: '易疲勞，眩暈感，尿量減少，浮腫，腹瀉，全身發冷' },

    // --- 水滯 心下型 胃內型 ---
    { name: '枳術湯', type: '虛實夾雜', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '心窩部廣泛抵抗，噁心，嘔吐，胃痛，胸痛' },
    { name: '胃苓湯', type: '虛實夾雜', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '食物中毒，暑熱導致的腹瀉，尿量減少' },
    { name: '茵陳五苓散', type: '虛實夾雜', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '黃疸，口渴，尿量減少' },
    { name: '茯苓飲', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '心窩部抵抗，嘔吐，食欲不振，胃部振水音' },
    { name: '茯苓澤瀉湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '胃部飽滿感，噁心，嘔吐，口渴，心悸，烘熱感，眩暈感' },
    { name: '良枳湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '焦躁感，心悸，胃痛，臍上悸動，胃部振水音，心下支結' },
    { name: '二陳湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '胃部振水音，噁心，嘔吐，頭痛，心悸' },
    { name: '小半夏加茯苓湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '劇烈噁心，嘔吐，胃部振水音，尿量減少' },
    { name: '啟脾湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '慢性腹瀉，無里急後重，腹瀉多泡沫' },
    { name: '吳茱萸湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '心窩部抵抗、壓痛，頭痛，嘔吐，手足發冷' },
    { name: '人參湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '心窩部抵抗、壓痛，胃痛，胸痛，腹瀉，易疲勞，手足發冷' },
    { name: '半夏白朮天麻湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '胃腸虛弱，肢冷症，頭痛，頭重，易疲勞，倦怠，抑鬱，胃部振水音' },
    { name: '桂枝去桂加茯苓白朮湯', type: '虛證', category: 'water_stasis_epigastric_gastric', syndrome: 'shui_zhi',
      indications: '心窩部不適感，頸後強凝，頭痛' },

    // --- 水滯 胸內型 ---
    { name: '木防己湯', type: '實證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '心窩部廣泛抵抗，呼吸困難，喘息，咳嗽，浮腫，口渴，尿量減少' },
    { name: '射干麻黃湯', type: '實證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '喘息，咳嗽，咳水樣痰，頭痛，頭重，顏面浮腫' },
    { name: '越婢加半夏湯', type: '實證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '咳嗽（痙攣性咳嗽，劇烈嗆咳），口渴，尿量減少' },
    { name: '神秘湯', type: '虛實夾雜', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '咳嗽，喘息，胸悶感，口苦，噁心，胸脇苦滿，微熱' },
    { name: '九味檳榔湯', type: '虛實夾雜', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '呼吸困難，胸悶感，下肢浮腫，尿量減少' },
    { name: '變制心氣飲', type: '虛實夾雜', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '呼吸困難，浮腫，尿量減少，心窩部抵抗' },
    { name: '蘇子降氣湯', type: '虛證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '呼吸困難，咳嗽，上熱下寒烘熱感，下肢肌力低下' },
    { name: '小青龍湯', type: '虛證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '喘息，咳嗽，水樣鼻涕，咳水樣痰，胃部振水音，自然汗出' },
    { name: '茯苓杏仁甘草湯', type: '虛證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '胸內苦悶，呼吸困難，心窩部抵抗，顏面浮腫' },
    { name: '苓甘五味加薑辛半夏杏仁湯', type: '虛證', category: 'water_stasis_chest', syndrome: 'shui_zhi',
      indications: '喘息，咳嗽，咳水樣痰，面色蒼白，易疲勞，肢冷症' },

    // --- 瘀血 方 ---
    { name: '抵當湯', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '下腹部、深部壓痛，精神症狀' },
    { name: '通導散', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '頭痛、眩暈、肩凝、下腹部痛' },
    { name: '桃核承氣湯', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '臍旁壓痛，左下腹按搓壓痛，伴有氣逆，上熱下寒性烘熱，精神不安，便秘' },
    { name: '大黃牡丹皮湯', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '臍旁和右下腹壓痛、腫塊' },
    { name: '腸癰湯', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '右下腹壓痛、腫塊，腹部膨滿，食欲不振' },
    { name: '治打撲一方', type: '實證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '跌打損傷致腫脹、疼痛' },
    { name: '桂枝茯苓丸', type: '虛實夾雜', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '臍旁壓痛、腫塊，伴氣逆，月經不調，或有肩膀酸痛、頭痛' },
    { name: '加味逍遙散', type: '虛實夾雜', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '臍旁壓痛、腫塊，伴氣逆、氣郁，精神不安，失眠，陣發性發熱/烘熱' },
    { name: '疏經活血湯', type: '虛實夾雜', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '精神不安、輕度胸脇苦滿，關節痛，知覺、運動麻痹，神經痛，有血虛傾向' },
    { name: '芎歸膠艾湯', type: '虛證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '左下腹壓痛，貧血，各種出血，伴血虛，陰道/痔/尿道出血' },
    { name: '當歸芍藥散', type: '虛證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '肢冷症，痛經，貧血，伴血虛、水滯，臍旁壓痛，胃部振水音' },
    { name: '薏苡附子敗醬散', type: '虛證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '腹部、下腹冷痛，右下腹壓痛' },
    { name: '大黃蟅蟲丸', type: '虛證', category: 'blood_stasis', syndrome: 'yu_xue',
      indications: '下腹部深部壓痛，消瘦，肌膚甲錯' },

    // --- 氣逆 方劑 ---
    { name: '苓桂甘棗湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '易驚、焦躁、心悸、臍上悸動' },
    { name: '良枳湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '心下支結、心窩部疼痛、嘔吐，臍上悸動' },
    { name: '苓桂味甘湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '顏面潮紅、咳嗽、下肢發冷、尿量減少' },
    { name: '苓桂術甘湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '直立性眩暈、胃部振水音、上熱下寒、尿少，臍上悸動，心悸' },
    { name: '桂枝加桂湯', type: '虛實夾雜', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '陣發性烘熱、搏動性頭痛' },
    { name: '桂枝加龍骨牡蠣湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '精神不安、失眠、臍上悸動' },
    { name: '奔豚湯（肘後方）', type: '虛實夾雜', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '陣發性心悸、焦躁、臍上悸動' },
    { name: '桂枝人參湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '搏動性頭痛、腹瀉、心窩部疼痛，發冷' },
    { name: '黃連湯', type: '虛實夾雜', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '噁心、嘔吐、胃痛、上熱下寒性烘熱' },
    { name: '吳茱萸湯', type: '虛證', category: 'qi_counterflow', syndrome: 'qi_ni',
      indications: '頭痛、胃痛、胃部振水音，心下痞硬，發冷，劇烈嘔吐' },

    // --- 氣郁 方劑 ---
    { name: '香蘇散', type: '虛證', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '胃腸虛弱、食欲不振、頭痛、鼻塞、精神不安，胸悶' },
    { name: '柴胡疏肝湯', type: '虛實夾雜', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '側腹部脹滿感、胸脇苦滿、腹部鼓音、肩凝、精神不安，脇脹，氣鬱' },
    { name: '女神散', type: '虛實夾雜', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '頭重感、烘熱感、失眠、腰痛、下肢發冷、下腹部壓痛，產後精神不安' },
    { name: '半夏厚朴湯', type: '虛實夾雜', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '咽喉部堵塞感、異物感、胃腸虛弱、腹部脹滿感' },
    { name: '柴朴湯', type: '實證', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '咽喉部堵塞感、異物感、胃腸虛弱，加之胸脇苦滿、口苦、微熱，咳嗽喘息' },
    { name: '柴胡加龍骨牡蠣湯', type: '實證', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '抑郁、失眠、精神不安、胸脇苦滿、臍上悸動，驚恐' },
    { name: '黃連解毒湯', type: '實證', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '抑郁、精神不安、烘熱感、中暑感、下腹部壓痛，熱盛煩躁' },
    { name: '葛根湯', type: '實證', category: 'qi_stagnation', syndrome: 'qi_yu',
      indications: '抑郁、肩凝、頭重感，無汗惡寒' },

    // --- 血虛 方劑 ---
    { name: '四物湯', type: '虛證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '體力低下、腹力軟弱且臍上悸動（基本補血方），皮膚乾燥，面色不佳' },
    { name: '當歸飲子', type: '虛證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '伴有皮膚枯燥的瘙癢、濕疹，血虛體質' },
    { name: '溫清飲', type: '虛實夾雜', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '皮炎、濕疹、月經不調，伴有熱證（上半身烘熱、煩躁）' },
    { name: '七物降下湯', type: '虛證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '高血壓、肩凝、頭重、眩暈感，偏虛證體質' },
    { name: '荊芥連翹湯', type: '實證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '上半身炎症（中耳炎、副鼻竇炎、痤瘡）、手掌足底汗出，青年期體質' },
    { name: '潤腸湯', type: '虛實夾雜', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '便乾如兔糞、便秘、脫水傾向，老年人或體虛者' },
    { name: '十全大補湯', type: '虛證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '病後、術後體虛、貧血、倦怠、無力、盜汗、手足發冷，氣血雙補' },
    { name: '歸脾湯', type: '虛證', category: 'blood_deficiency', syndrome: 'xue_xu',
      indications: '精神不安、失眠、皮下出血、貧血，面色欠佳，健忘' },

    // --- 氣虛 方劑 ---
    { name: '四君子湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '食欲不振、胃部脹滿感、發冷情況少，易疲勞，倦怠無力' },
    { name: '六君子湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '食欲不振、噁心、嘔吐、胃部振水音，易疲勞，胃腸虛弱' },
    { name: '半夏白朮天麻湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '頭重、頭痛、眩暈、怕冷、飯後倦怠感加重，胃部振水音' },
    { name: '補中益氣湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '食欲不振、倦怠感、微熱、輕度胸脇苦滿，內臟下垂，目光無力，易感冒' },
    { name: '清暑益氣湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '苦夏、夏天消瘦、食欲不振、腹瀉傾向、有時發熱，倦怠無力' },
    { name: '桂枝加黃芪湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '盜汗、皮疹、頸部強直、兩側腹直肌輕度拘攣，表虛自汗' },
    { name: '小建中湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '臍周疼痛、兩側腹直肌拘攣、膚色淺黑、有時手足發熱' },
    { name: '黃芪建中湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '盜汗、臍周疼痛、全身倦怠感、滲出性炎症、皮疹' },
    { name: '當歸建中湯', type: '虛證', category: 'qi_deficiency', syndrome: 'qi_xu',
      indications: '腹痛（側腹部/下腹部）、發冷、痔瘡出血、陰道出血' },

    // --- 臟腑特異性方劑 (肝、心、脾、肺、腎中未包含於上者) ---
    { name: '抑肝散', type: '虛實夾雜', category: 'organ_liver', syndrome: 'liver',
      indications: '神經過敏，易怒，不安穩多動，肌肉痙攣，磨牙' },
    { name: '抑肝散加陳皮半夏', type: '虛證', category: 'organ_liver', syndrome: 'liver',
      indications: '神經過敏，易怒，不安穩多動，肌肉痙攣，兼有胃腸虛弱、胃部振水音、易疲勞' },
    { name: '鉤藤散', type: '虛實夾雜', category: 'organ_liver', syndrome: 'liver',
      indications: '頭痛，眩暈感，眼痛，神經過敏，健忘，高血壓（清晨頭痛顯著）' },
    { name: '柴胡清肝湯', type: '實證', category: 'organ_liver', syndrome: 'liver',
      indications: '頭痛，上逆感，口腔、咽喉炎症，胸脇苦滿，腺體腫大' },
    { name: '芍藥甘草湯', type: '虛實夾雜', category: 'organ_liver', syndrome: 'liver',
      indications: '骨骼肌、平滑肌痙攣，兩側腹直肌緊張，急迫性疼痛，小腿抽筋，小兒夜啼' },
    { name: '三黃瀉心湯', type: '實證', category: 'organ_heart', syndrome: 'heart',
      indications: '顏面潮紅，煩躁不安，出血（鼻衄、痔血），心窩部抵抗，便秘，熱感' },
    { name: '梔子豉湯', type: '實證', category: 'organ_heart', syndrome: 'heart',
      indications: '胸內苦悶感，焦躁感，虛煩失眠，熱感' },
    { name: '半夏瀉心湯', type: '虛實夾雜', category: 'organ_heart', syndrome: 'heart',
      indications: '精神不安，神經過敏，腹鳴，惡心，嘔吐，泛酸，心窩部抵抗（心下痞）' },
    { name: '甘草瀉心湯', type: '虛實夾雜', category: 'organ_heart', syndrome: 'heart',
      indications: '精神不安，偏執，神經過敏，惡心，嘔吐，腹瀉，心窩部抵抗，口內炎' },
    { name: '清心蓮子飲', type: '虛證', category: 'organ_heart', syndrome: 'heart',
      indications: '神經過敏，下尿道神經症，排尿痛，尿不盡，口乾，抑鬱，全身倦怠' },
    { name: '酸棗仁湯', type: '虛證', category: 'organ_heart', syndrome: 'heart',
      indications: '虛弱，失眠（難入睡），微熱，口干，時有咳嗽，嗜睡，盜汗' },
    { name: '朱砂安神丸', type: '虛實夾雜', category: 'organ_heart', syndrome: 'heart',
      indications: '失眠，眠淺，多夢，心悸，燥熱' },
    { name: '黃連阿膠湯', type: '虛證', category: 'organ_heart', syndrome: 'heart',
      indications: '心煩失眠，口內乾燥，皮膚枯燥，心悸，胸內苦悶感，舌紅無苔' },
    { name: '炙甘草湯', type: '虛證', category: 'organ_heart', syndrome: 'heart',
      indications: '心悸，氣短，脈結代（心律不整），皮膚枯燥，口干，易疲勞，嬴瘦' },
    { name: '生脈飲', type: '虛證', category: 'organ_heart', syndrome: 'heart',
      indications: '口渴，脈結代，氣陰兩虛，低血壓，心功能不全，汗多氣短' },
    { name: '清熱補氣湯', type: '實證', category: 'organ_spleen', syndrome: 'spleen',
      indications: '口渴，喜冷飲，口內炎，胃部脹滿，舌痛症' },
    { name: '人參養榮湯', type: '虛證', category: 'organ_spleen', syndrome: 'spleen',
      indications: '盜汗，臍周痛，羸瘦，手足發冷，皮膚枯燥，咳嗽，健忘' },
    { name: '甘草乾姜湯', type: '虛證', category: 'organ_lung', syndrome: 'lung',
      indications: '泡沫樣痰，胸內滿悶，喘鳴，尿量增加，發冷，流涎' },
    { name: '麥門冬湯', type: '虛證', category: 'organ_lung', syndrome: 'lung',
      indications: '咽喉乾燥感，痙攣性咳嗽，咽喉狹窄感，嗆逆感，痰少黏稠' },
    { name: '竹葉石膏湯', type: '虛實夾雜', category: 'organ_lung', syndrome: 'lung',
      indications: '熱病後咽喉乾燥感，痙攣性咳嗽，口渴，口內乾燥，微熱，心窩部痞塞' },
    { name: '滋陰降火湯', type: '虛證', category: 'organ_lung', syndrome: 'lung',
      indications: '晨起、傍晚咳嗽頻繁，上呼吸道乾燥，乾性咳嗽，痰黏，微熱，盜汗' },
    { name: '滋陰至寶湯', type: '虛證', category: 'organ_lung', syndrome: 'lung',
      indications: '乾性咳嗽，上呼吸道乾燥，嬴瘦，皮膚枯燥，易疲勞，微熱，抑鬱' },
    { name: '右歸飲', type: '虛證', category: 'organ_kidney', syndrome: 'kidney',
      indications: '腎陽虛，易疲勞，腹痛，腰痛，下肢發冷，陽萎，大便溏薄' },
    { name: '六味地黃丸', type: '虛證', category: 'organ_kidney', syndrome: 'kidney',
      indications: '腎陰虛，頭暈感，耳鳴，咽痛，口渴，腰腿肌力低下，手足煩熱，遺精' },
    { name: '左歸飲', type: '虛證', category: 'organ_kidney', syndrome: 'kidney',
      indications: '腎陰精不足，腰腿肌力低下，口內乾燥，盜汗，口渴，皮膚枯燥' },
    { name: '杞菊地黃丸', type: '虛證', category: 'organ_kidney', syndrome: 'kidney',
      indications: '視力低下，雙目乾燥感，頭暈感，腰腿肌力低下，耳鳴，畏光' }
];

// ==========================================
// 1.5 CHECKBOX NORMALIZATION HELPERS
// ==========================================

const COMPOUND_SYMPTOM_SEPARATOR = /[，,、\/]/;

function splitSymptomLabel(label) {
    return String(label || '').split(COMPOUND_SYMPTOM_SEPARATOR).map(part => part.trim()).filter(Boolean);
}

function makeSplitSymptomId(sym, term) {
    return sym.id + '__' + term.replace(/[\s()（）]+/g, '').replace(/[\/，,、]+/g, '_');
}

function expandSymptom(sym) {
    const parts = splitSymptomLabel(sym.label);
    if (parts.length <= 1) return [{ ...sym, scoreGroupId: sym.id, sourceLabel: sym.label, isSplitChild: false }];
    return parts.map(part => ({
        ...sym,
        id: makeSplitSymptomId(sym, part),
        label: part,
        scoreGroupId: sym.id,
        sourceLabel: sym.label,
        isSplitChild: true,
    }));
}

// Dedup by trimmed term label ACROSS the whole array passed in (one call = one
// panel: SYNDROME_DB.xxx.symptoms or ORGAN_DB.xxx.symptoms). The same single
// term (e.g. 頭痛) legitimately appears in several compound-label groups within
// one panel (see ORGAN_DB.liver); rendering/scoring all of them would let one
// checked symptom inflate that panel's score by +N instead of +1. Groups are
// walked in array order and only the FIRST occurrence of each label is kept;
// the kept child retains the scoreGroupId of the group it first occurred in,
// so isSymptomGroupChecked's per-group +1 behavior is unaffected. Cross-panel
// duplicates (different symptoms/organ arrays) are untouched by design, since
// every call site here passes a single panel's symptoms array.
function getRenderableSymptoms(symptoms) {
    const seenLabels = new Set();
    const result = [];
    symptoms.forEach(sym => {
        expandSymptom(sym).forEach(item => {
            const label = String(item.label || '').trim();
            if (seenLabels.has(label)) return;
            seenLabels.add(label);
            result.push(item);
        });
    });
    return result;
}

function isSymptomGroupChecked(sym) {
    if (appState.checkedSymptoms.has(sym.id)) return true;
    return expandSymptom(sym).some(item => appState.checkedSymptoms.has(item.id));
}

function getSymptomScore(sym) {
    if (sym.scoreFemale !== undefined && appState.gender === 'female') return sym.scoreFemale;
    return sym.score;
}

function getCheckedRenderableSymptoms(symptoms) {
    return getRenderableSymptoms(symptoms).filter(sym => appState.checkedSymptoms.has(sym.id));
}
// ==========================================
// 2. STATE MANAGEMENT (應用程式狀態管理)
// ==========================================

let appState = {
    gender: 'male', // 'male' or 'female'
    checkedSymptoms: new Set(), // Set of checked symptom IDs
    activeTab: 'qi_xu', // Active tab in symptom questionnaire
    activeOrgan: 'liver', // Active tab in organ panel
    syndromeScores: {}, // Calculated scores for each of 6 syndromes
    diagnosedSyndromes: [], // List of syndromes crossing threshold
    organScores: {}, // Count of checked symptoms for each organ
    activeOrganPathology: {}, // Identified organ pathology (e.g. kidney -> "腎陽虛")
    caseKeywords: [],
    parsedCaseItems: [],
    autoCheckedSymptoms: new Set(), // symptom-checkbox ids turned on by case parsing (vs. clicked manually)
    lastRecommendations: [], // final on-screen X4 recommendation list (rx cards); print report reuses this verbatim
};

// ==========================================
// 3. UI RENDERING & LOGIC (UI 渲染與操控)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    calculateAndRender();
});

// Initialize Application
function initApp() {
    // 1. Render Six Syndromes Symptoms inside tab panels
    for (const [syndromeKey, db] of Object.entries(SYNDROME_DB)) {
        const container = document.getElementById(`list-${syndromeKey}`);
        if (container) {
            container.innerHTML = '';
            getRenderableSymptoms(db.symptoms).forEach(sym => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'symptom-item';
                itemDiv.dataset.id = sym.id;
                if (sym.scoreGroupId !== sym.id) itemDiv.dataset.scoreGroup = sym.scoreGroupId;
                
                // Gender dependent scores label
                let scoreText = sym.score;
                if (syndromeKey === 'yu_xue') {
                    scoreText = `男${sym.score}/女${sym.scoreFemale}`;
                }
                
                itemDiv.innerHTML = `
                    <input type="checkbox" id="${sym.id}" value="${sym.id}">
                    <span class="symptom-label" for="${sym.id}">${sym.label}</span>
                    <span class="symptom-score">+${scoreText}</span>
                `;
                container.appendChild(itemDiv);
            });
        }
    }

    // 2. Render active organ panel
    renderOrganPanel();
}

// Setup Event Listeners
function setupEventListeners() {
    // Helper to switch sections (synchronized between desktop sidebar and mobile bottom nav)
    function switchSection(targetId) {
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');

        // Sync Desktop Sidebar
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Sync Mobile Bottom Nav
        document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Scroll to top on page switch
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // 1. Navigation Clicks (both Sidebar Nav & Mobile Bottom Nav)
    document.querySelectorAll('.sidebar-nav .nav-item, .mobile-bottom-nav .mobile-nav-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const targetId = btn.dataset.target;
            switchSection(targetId);
        });
    });

    // 2. Patient Gender Toggle
    const maleLabel = document.getElementById('gender-male-label');
    const femaleLabel = document.getElementById('gender-female-label');
    
    document.getElementById('gender-male').addEventListener('change', () => {
        appState.gender = 'male';
        maleLabel.classList.add('active');
        femaleLabel.classList.remove('active');
        calculateAndRender();
    });

    document.getElementById('gender-female').addEventListener('change', () => {
        appState.gender = 'female';
        femaleLabel.classList.add('active');
        maleLabel.classList.remove('active');
        calculateAndRender();
    });

    // 3. Six Syndromes Tabs
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');
            
            appState.activeTab = btn.dataset.syndrome;
            document.querySelectorAll('.syndrome-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`panel-${appState.activeTab}`).classList.add('active');
        });
    });

    // 4. Checkbox interactions (Six Syndromes)
    document.querySelector('.syndrome-panels').addEventListener('click', (e) => {
        const item = e.target.closest('.symptom-item');
        if (item) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            const id = item.dataset.id;
            if (checkbox.checked) {
                appState.checkedSymptoms.add(id);
                item.classList.add('checked');
            } else {
                appState.checkedSymptoms.delete(id);
                item.classList.remove('checked');
            }
            calculateAndRender();
        }
    });

    // 5. Organ Tabs
    document.querySelectorAll('.organ-tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            document.querySelectorAll('.organ-tab-btn').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');
            
            appState.activeOrgan = btn.dataset.organ;
            renderOrganPanel();
        });
    });

    // 6. Checkbox interactions (Organ Symptoms)
    document.getElementById('organ-symptom-list').addEventListener('click', (e) => {
        const item = e.target.closest('.symptom-item');
        if (item) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            const id = item.dataset.id;
            if (checkbox.checked) {
                appState.checkedSymptoms.add(id);
                item.classList.add('checked');
            } else {
                appState.checkedSymptoms.delete(id);
                item.classList.remove('checked');
            }
            calculateAndRender();
        }
    });

    // 7. Reset Button (Desktop & Mobile)
    const handleReset = () => {
        if (confirm('確定要清空所有勾選的症狀與患者資料嗎？')) {
            appState.checkedSymptoms.clear();
            appState.autoCheckedSymptoms.clear();
            document.querySelectorAll('.symptom-item').forEach(item => {
                item.classList.remove('checked');
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
            });
            document.getElementById('patient-name').value = '臨床案例';
            document.getElementById('patient-age').value = '';
            document.getElementById('gender-male').checked = true;
            appState.gender = 'male';
            maleLabel.classList.add('active');
            femaleLabel.classList.remove('active');
            
            // Filters reset
            document.getElementById('rx-constitution-filter').value = 'all';
            document.getElementById('rx-search-input').value = '';
            const caseInput = document.getElementById('case-input');
            if (caseInput) caseInput.value = '';
            appState.caseKeywords = [];
            appState.parsedCaseItems = [];
            renderCaseKeywordPanel();
            
            calculateAndRender();
            renderOrganPanel();
        }
    };
    const resetBtn = document.getElementById('btn-reset');
    const resetMobileBtn = document.getElementById('btn-reset-mobile');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (resetMobileBtn) resetMobileBtn.addEventListener('click', handleReset);

    // 8. Print Button (Desktop & Mobile)
    const handlePrint = () => {
        preparePrintReport();
        window.print();
    };
    const printBtn = document.getElementById('btn-print');
    const printMobileBtn = document.getElementById('btn-print-mobile');
    if (printBtn) printBtn.addEventListener('click', handlePrint);
    if (printMobileBtn) printMobileBtn.addEventListener('click', handlePrint);

    // 9. Prescription Filters
    document.getElementById('rx-constitution-filter').addEventListener('change', () => {
        renderPrescriptions();
    });
    document.getElementById('rx-search-input').addEventListener('input', () => {
        renderPrescriptions();
    });

    const parseCaseBtn = document.getElementById('btn-parse-case');
    const addKeywordBtn = document.getElementById('btn-add-keyword');
    const caseKeywordInput = document.getElementById('case-keyword-input');
    // caseKeywords keeps the RAW matched terms (item.source), not the old engine's
    // coarse canonical buckets: the X4 matcher's ontology resolves raw terms like
    // \u5614\u5410/\u80f8\u8107\u82e6\u6eff directly, while bucket names like \u6c23\u9006 mean nothing to it.
    // Negated hits (e.g. \u672a\u767c\u73fe\u660e\u986f\u7684\u80f8\u8105\u82e6\u6eff) start unchecked.
    if (parseCaseBtn) { parseCaseBtn.addEventListener('click', () => { const caseText = document.getElementById('case-input')?.value || ''; appState.parsedCaseItems = mergeParsedCaseItems(KampoParser.parseCaseText(caseText), parseCaseTextWithOntology(caseText)); appState.caseKeywords = [...new Set(appState.parsedCaseItems.filter(item => !item.negated).map(item => item.source))]; renderCaseKeywordPanel(); syncCaseSymptomsToCheckboxes(); }); }
    if (addKeywordBtn && caseKeywordInput) { addKeywordBtn.addEventListener('click', () => { const keyword = (caseKeywordInput.value || '').trim(); if (keyword && !appState.caseKeywords.includes(keyword)) { appState.caseKeywords.push(keyword); appState.parsedCaseItems.push({ keyword: KampoNormalizer.normalizeKeyword(keyword), source: keyword, weight: 1, negated: false }); caseKeywordInput.value = ''; renderCaseKeywordPanel(); syncCaseSymptomsToCheckboxes(); } }); }
}

// Render Organ Panel dynamically based on current selected organ
function renderOrganPanel() {
    const organKey = appState.activeOrgan;
    const db = ORGAN_DB[organKey];
    if (!db) return;

    // Render Header
    const headerContainer = document.getElementById('active-organ-header');
    
    // Calculate active symptoms in this organ
    let checkedInOrgan = 0;
    db.symptoms.forEach(sym => {
        if (isSymptomGroupChecked(sym)) checkedInOrgan++;
    });
    
    let statusClass = 'status-inactive badge-qi_xu';
    let statusText = '未有明顯異常';
    if (checkedInOrgan >= 4) {
        statusClass = 'status-active bg-qi_ni text-white';
        statusText = '高度疑似異常';
    } else if (checkedInOrgan >= 2) {
        statusClass = 'status-active bg-qi_xu text-white';
        statusText = '中度疑似異常';
    }
    
    headerContainer.innerHTML = `
        <div class="organ-panel-title">
            <h3>${db.name}辨證</h3>
            <p>${db.description}</p>
        </div>
        <div class="organ-pathology-status">
            <span class="${statusClass}">${statusText}</span>
            <p>已勾選症狀: ${checkedInOrgan} / ${db.symptoms.length}</p>
        </div>
    `;

    // Render Checklist
    const listContainer = document.getElementById('organ-symptom-list');
    listContainer.innerHTML = '';
    
    getRenderableSymptoms(db.symptoms).forEach(sym => {
        const isChecked = appState.checkedSymptoms.has(sym.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = `symptom-item ${isChecked ? 'checked' : ''}`;
        itemDiv.dataset.id = sym.id;
        if (sym.scoreGroupId !== sym.id) itemDiv.dataset.scoreGroup = sym.scoreGroupId;
        
        itemDiv.innerHTML = `
            <input type="checkbox" id="${sym.id}" value="${sym.id}" ${isChecked ? 'checked' : ''}>
            <span class="symptom-label" for="${sym.id}">${sym.label}</span>
            <span class="symptom-score"><i class="fa-solid fa-notes-medical"></i></span>
        `;
        listContainer.appendChild(itemDiv);
    });
}

// ==========================================
// 4. SCORING & RECOMMENDATION ENGINE
// ==========================================

function calculateAndRender() {
    // 1. Calculate Six Syndromes Scores
    appState.diagnosedSyndromes = [];
    
    for (const [syndromeKey, db] of Object.entries(SYNDROME_DB)) {
        let score = 0;
        db.symptoms.forEach(sym => {
            if (isSymptomGroupChecked(sym)) {
                score += getSymptomScore(sym);
            }
        });
        
        appState.syndromeScores[syndromeKey] = score;
        if (score >= db.threshold) {
            appState.diagnosedSyndromes.push(syndromeKey);
        }
    }

    // 2. Calculate Organ Scores (Dysfunction level)
    for (const [organKey, db] of Object.entries(ORGAN_DB)) {
        let checkedCount = 0;
        db.symptoms.forEach(sym => {
            if (isSymptomGroupChecked(sym)) {
                checkedCount++;
            }
        });
        appState.organScores[organKey] = checkedCount;
    }

    // 3. Render Gauges in Dashboard
    renderDashboardGauges();

    // 4. Render Prescription Recommendations
    renderPrescriptions();

    // 5. Update Organ Panel indicators dynamically
    if (document.getElementById('organ-section').classList.contains('active')) {
        renderOrganPanel();
    }
}

// Render Dashboard Gauges & Summary Box
function renderDashboardGauges() {
    const grid = document.getElementById('dashboard-gauge-grid');
    grid.innerHTML = '';

    for (const [key, db] of Object.entries(SYNDROME_DB)) {
        const score = appState.syndromeScores[key] || 0;
        const isDiagnosed = score >= db.threshold;
        
        // Calculate fill percentage (clamp to 100)
        // Set maximum gauge limit to twice the threshold to show overflow
        const maxLimit = db.threshold * 2;
        const percentage = Math.min((score / maxLimit) * 100, 100);
        const thresholdLinePos = (db.threshold / maxLimit) * 100;
        
        const gaugeItem = document.createElement('div');
        gaugeItem.className = `gauge-item ${isDiagnosed ? 'diagnosed' : ''}`;
        if (isDiagnosed) {
            gaugeItem.style.color = `var(--color-${key})`;
            gaugeItem.style.borderColor = `var(--color-${key})`;
            gaugeItem.style.backgroundColor = `rgba(255,255,255,1)`;
        }
        
        const statusBadge = isDiagnosed 
            ? `<span class="gauge-status badge-${key} status-active">診斷成立</span>` 
            : `<span class="gauge-status status-inactive">未達標</span>`;
            
        gaugeItem.innerHTML = `
            <div class="gauge-header">
                <span class="gauge-name"><i class="fa-solid ${getSyndromeIcon(key)} text-${key}"></i> ${db.name}</span>
                ${statusBadge}
            </div>
            <div class="gauge-bar-bg">
                <div class="gauge-threshold" style="left: ${thresholdLinePos}%"></div>
                <div class="gauge-bar-fill bg-${key}" style="width: ${percentage}%"></div>
            </div>
            <div class="gauge-header mt-1">
                <span class="text-muted" style="font-size:0.75rem;">閾值: ${db.threshold}分</span>
                <span class="gauge-score text-${key}">${score} <span class="text-muted" style="font-size:0.8rem; font-weight:normal;">分</span></span>
            </div>
        `;
        grid.appendChild(gaugeItem);
    }

    // Update Summary Box
    const summaryBox = document.getElementById('dx-summary-box');
    if (appState.diagnosedSyndromes.length === 0) {
        summaryBox.innerHTML = `
            <div class="summary-heading"><i class="fa-solid fa-circle-exclamation text-primary"></i> 診斷總結</div>
            <p style="font-size:0.9rem; color:var(--text-muted);">目前無任何證型達到診斷標準。請繼續收集勾選症狀。</p>
        `;
    } else {
        const listItems = appState.diagnosedSyndromes.map(key => {
            const name = SYNDROME_DB[key].name;
            const score = appState.syndromeScores[key];
            return `<li><i class="fa-solid fa-circle-check text-${key}"></i> <strong>${name}證</strong> (得分: ${score} 分)</li>`;
        }).join('');
        
        summaryBox.innerHTML = `
            <div class="summary-heading"><i class="fa-solid fa-circle-check text-success"></i> 臨床診斷成立</div>
            <ul class="summary-list">
                ${listItems}
            </ul>
        `;
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
}

function parseCaseTextWithOntology(text = '') {
    const ontology = window.X4KbData?.ontology;
    if (!Array.isArray(ontology) || !ontology.length) return [];
    const source = String(text || '');
    const matchesByCanonical = new Map();
    ontology.forEach(entry => {
        [entry.canonical, ...(Array.isArray(entry.aliases) ? entry.aliases : [])].forEach(term => {
            const label = String(term || '').trim();
            if (!label) return;
            const index = source.indexOf(label);
            if (index < 0) return;
            const canonical = entry.canonical || label;
            const current = matchesByCanonical.get(canonical);
            if (!current || index < current.index || (index === current.index && label.length > current.term.length)) {
                matchesByCanonical.set(canonical, { term: label, canonical, index });
            }
        });
    });
    return [...matchesByCanonical.values()]
        .sort((a, b) => a.index - b.index || b.term.length - a.term.length)
        .map(({ canonical }) => ({ source: canonical, keyword: canonical, weight: 1, negated: false }));
}

function mergeParsedCaseItems(...groups) {
    const merged = [];
    const indexBySource = new Map();
    groups.flat().forEach(item => {
        if (!item || !item.source) return;
        const source = item.source;
        const existingIndex = indexBySource.get(source);
        if (existingIndex !== undefined) {
            const existing = merged[existingIndex];
            if (existing.negated || !item.negated) return;
            merged[existingIndex] = item;
            return;
        }
        indexBySource.set(source, merged.length);
        merged.push(item);
    });
    return merged;
}

let symptomTermIndexCache = null;
// Maps an exact symptom term (e.g. "頭痛") to every checkbox id whose label is
// made up of that term (SYNDROME_DB/ORGAN_DB reuse the same term across
// several checkboxes and databases, e.g. 頭痛 appears under both 氣逆 and
// 水滯). Only whole comma/、-separated parts count as a match, so a single
// word doesn't light up an unrelated multi-symptom checkbox like
// 頭痛，眩暈感，眼痛，健忘，高血壓 just because it shares one term.
// Case terms that don't literally match any single-symptom checkbox label,
// but clinically indicate the same checkbox (e.g. 經痛/痛經 are forms of
// 月經不調), so they should auto-check it too. Keyed by the checkbox's own
// canonical label.
const SYMPTOM_TERM_ALIASES = {
    '月經不調': ['經痛', '痛經', '月經痛', '月經疼痛', '月事不調', '月經失調', '月經不順', '經期不順', '月經紊亂', '經期紊亂', '月經延遲', '月經遲延', '經期延後'],
};

function getSymptomTermIndex() {
    if (symptomTermIndexCache) return symptomTermIndexCache;
    const index = new Map();
    const addDb = (db) => {
        for (const group of Object.values(db)) {
            for (const sym of getRenderableSymptoms(group.symptoms)) {
                const term = sym.label.trim();
                if (!term) continue;
                if (!index.has(term)) index.set(term, []);
                index.get(term).push(sym.id);
            }
        }
    };
    addDb(SYNDROME_DB);
    addDb(ORGAN_DB);
    Object.entries(SYMPTOM_TERM_ALIASES).forEach(([canonicalTerm, aliases]) => {
        const ids = index.get(canonicalTerm);
        if (!ids || !ids.length) return;
        aliases.forEach(alias => {
            if (!index.has(alias)) index.set(alias, []);
            const bucket = index.get(alias);
            ids.forEach(id => { if (!bucket.includes(id)) bucket.push(id); });
        });
    });
    symptomTermIndexCache = index;
    return index;
}

// Auto-checks (and auto-unchecks) the 六證/五臟 checkboxes that exactly match
// the case's currently-active keyword chips, so typing/confirming e.g. 頭痛
// in the case box reflects onto the 頭痛 checkbox instead of only feeding the
// X4 query text. Only touches checkboxes it previously auto-checked itself,
// so a user's own manual clicks are never overridden.
function syncCaseSymptomsToCheckboxes() {
    const index = getSymptomTermIndex();
    const matchedIds = new Set();
    appState.caseKeywords.forEach(term => {
        (index.get(term) || []).forEach(id => matchedIds.add(id));
    });

    const toUncheck = [...appState.autoCheckedSymptoms].filter(id => !matchedIds.has(id));
    const toCheck = [...matchedIds].filter(id => !appState.checkedSymptoms.has(id));

    toUncheck.forEach(id => appState.checkedSymptoms.delete(id));
    toCheck.forEach(id => appState.checkedSymptoms.add(id));
    appState.autoCheckedSymptoms = matchedIds;

    // Syndrome checkboxes are all rendered up front (six tabs, always in the
    // DOM); reflect the new state directly. Organ checkboxes are rendered
    // per active tab from appState.checkedSymptoms, so renderOrganPanel()
    // below already picks the change up.
    [...toUncheck, ...toCheck].forEach(id => {
        const item = document.querySelector(`.symptom-item[data-id="${id}"]`);
        if (!item) return;
        const checkbox = item.querySelector('input[type="checkbox"]');
        const isChecked = appState.checkedSymptoms.has(id);
        if (checkbox) checkbox.checked = isChecked;
        item.classList.toggle('checked', isChecked);
    });

    calculateAndRender();
    renderOrganPanel();
}

function getCheckedSymptomLabels() {
    const labels = [];
    for (const syndrome of Object.values(SYNDROME_DB)) {
        getCheckedRenderableSymptoms(syndrome.symptoms).forEach(sym => labels.push(sym.label));
    }
    for (const organ of Object.values(ORGAN_DB)) {
        getCheckedRenderableSymptoms(organ.symptoms).forEach(sym => labels.push(sym.label));
    }
    return labels;
}

function renderCaseKeywordPanel() {
    const panel = document.getElementById('case-keyword-panel');
    if (!panel) return;
    const seen = new Set();
    const chipItems = appState.parsedCaseItems.filter(item => {
        if (seen.has(item.source)) return false;
        seen.add(item.source);
        return true;
    });
    if (!chipItems.length) {
        panel.innerHTML = '<p class="text-muted case-empty">\u5c1a\u672a\u89e3\u6790\u75c5\u4f8b\u3002\u8f38\u5165\u75c5\u4f8b\u5f8c\u6309\u300c\u89e3\u6790\u75c5\u4f8b\u300d\uff0c\u7cfb\u7d71\u6703\u5217\u51fa\u53ef\u78ba\u8a8d\u7684\u6a19\u6e96\u5316\u95dc\u9375\u5b57\u3002</p>';
        return;
    }
    panel.innerHTML = chipItems.map(item => {
        const checked = appState.caseKeywords.includes(item.source) ? ' checked' : '';
        const negatedHint = item.negated ? '\uff08\u75c5\u4f8b\u63cf\u8ff0\u70ba\u9670\u6027\uff09' : '';
        return ['<label class="case-keyword-chip">','<input type="checkbox" value="' + escapeHtml(item.source) + '"' + checked + '>','<span>' + escapeHtml(item.source) + '</span>','<small>' + escapeHtml(item.keyword + negatedHint) + '</small>','</label>'].join('');
    }).join('');
    panel.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            const active = Array.from(panel.querySelectorAll('input[type="checkbox"]:checked')).map(item => item.value);
            appState.caseKeywords = active;
            syncCaseSymptomsToCheckboxes();
        });
    });
}

function formatVectorEntries(entries) { return entries && entries.length ? entries.join('\u3001') : '\u7121\u660e\u986f\u547d\u4e2d'; }

function getPrimarySymptoms(symptomLabels, limit = 3) {
    const primary = symptomLabels.slice(0, limit);
    return primary.length ? primary.join('、') : '未列出';
}

function percentFromScore(value) {
    return Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
}

function buildFitBars(scoreParts = {}) {
    const rows = [
        { label: '關鍵症狀', value: percentFromScore(scoreParts.symptomMatch), className: 'symptom' },
        { label: '六證', value: percentFromScore(scoreParts.patternSimilarity), className: 'pattern' },
        { label: '五臟', value: percentFromScore(scoreParts.zangFuSimilarity), className: 'zangfu' },
    ];
    return [
        '<div class="case-fit-bars" aria-label="方劑契合分數拆解">',
        rows.map(row => [
            '<div class="case-fit-row case-fit-' + row.className + '">',
            '<span class="case-fit-label">' + escapeHtml(row.label) + '</span>',
            '<span class="case-fit-track"><i style="width:' + row.value + '%"></i></span>',
            '<strong>' + row.value + '%</strong>',
            '</div>',
        ].join('')).join(''),
        '</div>',
    ].join('');
}

// Draft single-herb "add/strengthen" suggestions for whichever key symptoms
// the formula doesn't cover (see x4-adapter.js getHerbSuggestions()). This
// KB layer is explicitly draft/non-clinical (kb/kb_metadata.json), so the
// disclaimer line is always rendered, never hidden behind a tooltip.
function buildHerbSuggestionsHtml(herbSuggestions) {
    if (!herbSuggestions || !herbSuggestions.length) return '';
    const rows = herbSuggestions.map(herb => {
        const directionClass = herb.alreadyInFormula ? 'rx-herb-tag-strengthen' : 'rx-herb-tag-add';
        const directionLabel = herb.alreadyInFormula ? '可加重方向' : '可加入方向';
        return [
            '<div class="rx-herb-row">',
            '<span class="rx-herb-tag ' + directionClass + '">' + escapeHtml(directionLabel) + '</span>',
            '<strong>' + escapeHtml(herb.name) + '</strong>',
            '<span class="rx-herb-covers">覆蓋：' + escapeHtml(herb.coveredSymptoms.join('、')) + '</span>',
            '</div>',
        ].join('');
    }).join('');
    return [
        '<div class="rx-herb-suggestions">',
        '<strong><i class="fa-solid fa-leaf"></i> 可補足單味藥方向：</strong>',
        rows,
        '<p class="rx-herb-disclaimer">草稿方向建議，非劑量／安全性建議，須由醫師覆核。</p>',
        '</div>',
    ].join('');
}

function getFormulaKnowledgeBase() {
    // KampoExcelFormulaKb is generated from kb/formulas.json (scripts/generate_frontend_kb.mjs),
    // the validated X4 knowledge base. FORMULA_DB is the older hand-embedded list, kept only
    // as a fallback in case the generated file fails to load.
    return KampoExcelFormulaKb.length ? KampoExcelFormulaKb : FORMULA_DB;
}

function getRecommendedFormulas(limit = 5) {
    const args = { formulas: getFormulaKnowledgeBase(), syndromeDb: SYNDROME_DB, organDb: ORGAN_DB, checkedSymptomLabels: getCheckedSymptomLabels(), syndromeScores: appState.syndromeScores, organScores: appState.organScores, diagnosedSyndromes: appState.diagnosedSyndromes, constitutionFilter: document.getElementById('rx-constitution-filter')?.value || 'all', searchText: document.getElementById('rx-search-input')?.value || '', caseKeywords: appState.caseKeywords };
    // X4Adapter wraps the validated X4 matcher (src/kampo2/x4-matcher.mjs); fall back to the
    // older heuristic engine only if the X4 bundle failed to load for some reason.
    const engine = (typeof X4Adapter !== 'undefined' && X4Adapter.isAvailable()) ? X4Adapter : KampoRecommendationEngine;
    return engine.recommend(args).slice(0, limit);
}

const RADAR_AXES = [
    { id: 'QI_XU', label: '氣虛' },
    { id: 'QI_NI', label: '氣逆' },
    { id: 'QI_YU', label: '氣鬱' },
    { id: 'XUE_XU', label: '血虛' },
    { id: 'YU_XUE', label: '瘀血' },
    { id: 'SUI_ZHI', label: '水滯' },
];

// Six-axis 六證 radar comparing the patient's pattern vector against a formula's,
// so the overlap of the two shapes reads as "fit". Colors are hue-preserving,
// checked variants of the app's own sage-green/gold theme (validated with the
// dataviz skill's palette checker against this card's cream surface).
function buildRadarChartSvg(patientVector, formulaVector, formulaName) {
    const size = 220;
    const center = size / 2;
    const maxR = 78;
    const n = RADAR_AXES.length;
    const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const pointFor = (i, value) => {
        const r = maxR * Math.max(0, Math.min(1, value));
        const a = angleFor(i);
        return [center + r * Math.cos(a), center + r * Math.sin(a)];
    };

    const gridRings = [0.25, 0.5, 0.75, 1].map(frac => {
        const pts = RADAR_AXES.map((_, i) => pointFor(i, frac).join(',')).join(' ');
        return '<polygon points="' + pts + '" fill="none" stroke="var(--radar-grid)" stroke-width="1"></polygon>';
    }).join('');
    const axisLines = RADAR_AXES.map((axis, i) => {
        const [x, y] = pointFor(i, 1);
        return '<line x1="' + center + '" y1="' + center + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--radar-grid)" stroke-width="1"></line>';
    }).join('');
    const axisLabels = RADAR_AXES.map((axis, i) => {
        const [x, y] = pointFor(i, 1.28);
        return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle" class="radar-axis-label">' + escapeHtml(axis.label) + '</text>';
    }).join('');

    function seriesMarkup(vector, colorVar) {
        const points = RADAR_AXES.map((axis, i) => pointFor(i, vector?.[axis.id] || 0));
        const polygon = '<polygon points="' + points.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="' + colorVar + '" fill-opacity="0.12" stroke="' + colorVar + '" stroke-width="2" stroke-linejoin="round"></polygon>';
        const dots = points.map((p, i) => {
            const value = vector?.[RADAR_AXES[i].id] || 0;
            return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="' + colorVar + '" stroke="var(--radar-surface)" stroke-width="2"><title>' + escapeHtml(RADAR_AXES[i].label) + '：' + Math.round(value * 100) + '%</title></circle>';
        }).join('');
        return polygon + dots;
    }

    const tableRows = RADAR_AXES.map(axis => {
        const pv = Math.round((patientVector?.[axis.id] || 0) * 100);
        const fv = Math.round((formulaVector?.[axis.id] || 0) * 100);
        return '<tr><td>' + escapeHtml(axis.label) + '</td><td>' + pv + '%</td><td>' + fv + '%</td></tr>';
    }).join('');

    return [
        '<div class="radar-chart">',
        '<div class="radar-title">六證重疊圖</div>',
        '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="病人與' + escapeHtml(formulaName) + '的六證契合度雷達圖">',
        gridRings, axisLines,
        seriesMarkup(formulaVector, 'var(--radar-formula)'),
        seriesMarkup(patientVector, 'var(--radar-patient)'),
        axisLabels,
        '</svg>',
        '<div class="radar-legend">',
        '<span class="radar-legend-item"><i style="background:var(--radar-patient)"></i>病人</span>',
        '<span class="radar-legend-item"><i style="background:var(--radar-formula)"></i>' + escapeHtml(formulaName) + '</span>',
        '</div>',
        '<details class="radar-table-toggle"><summary>查看六證數值表</summary>',
        '<table><thead><tr><th>六證</th><th>病人</th><th>' + escapeHtml(formulaName) + '</th></tr></thead><tbody>' + tableRows + '</tbody></table>',
        '</details>',
        '</div>',
    ].join('');
}

// Render Prescriptions based on active syndromes, organ abnormalities, and matching symptoms
function renderCaseSummary(recommendedFormulas) {
    const panel = document.getElementById('case-summary');
    if (!panel) return;
    const symptomLabels = [...new Set([...appState.caseKeywords, ...getCheckedSymptomLabels()])];
    if (!symptomLabels.length) {
        panel.innerHTML = '';
        return;
    }
    if (!recommendedFormulas.length) {
        panel.innerHTML = '<div class="case-summary-card compact">目前症狀：<strong>' + escapeHtml(getPrimarySymptoms(symptomLabels, 3)) + '</strong>。尚無符合條件的方劑，請調整病例關鍵字或篩選條件。</div>';
        return;
    }
    const top = recommendedFormulas[0];
    const xuShiText = (top.explanation?.xuShi || [])[0] || '未定';
    const primarySymptoms = getPrimarySymptoms(symptomLabels, 3);
    const moreCount = Math.max(0, symptomLabels.length - 3);
    const radar = top.patternVectors ? buildRadarChartSvg(top.patternVectors.patient, top.patternVectors.formula, top.name) : '';
    const fitBars = buildFitBars(top.scoreParts);
    panel.innerHTML = [
        '<div class="case-summary-card case-summary-fit-card">',
        '<div class="case-summary-text">',
        '<span class="case-summary-title">病例總摘要</span>',
        '<div class="case-summary-line">主要症狀：<strong>' + escapeHtml(primarySymptoms) + '</strong>' + (moreCount ? '<span class="case-summary-more">另 ' + moreCount + ' 項</span>' : '') + '</div>',
        '<div class="case-summary-line">首選方劑：<strong>' + escapeHtml(top.name) + '</strong><span class="case-score-pill">' + top.totalScore + ' 分</span></div>',
        '<div class="case-summary-line">虛實傾向：<strong>' + escapeHtml(xuShiText) + '</strong><span class="case-summary-type">' + escapeHtml(top.type || '') + '</span></div>',
        fitBars,
        '</div>',
        radar,
        '</div>',
    ].join('');
}

function renderPrescriptions() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    container.innerHTML = '';
    const recommendedFormulas = getRecommendedFormulas(5);
    // Stash the exact on-screen ranking (name/totalScore/matchedSymptoms/herbSuggestions/
    // explanation) so the print report can reuse it verbatim instead of recomputing its
    // own (potentially disagreeing) list from the legacy FORMULA_DB keyword heuristic.
    appState.lastRecommendations = recommendedFormulas;
    renderCaseSummary(recommendedFormulas);
    if (recommendedFormulas.length === 0) {
        container.innerHTML = '<div class="card text-center py-5" style="grid-column: span 2;"><p class="text-muted"><i class="fa-solid fa-folder-open" style="font-size:2rem; margin-bottom:1rem; display:block;"></i> \u6c92\u6709\u7b26\u5408\u76ee\u524d\u75c5\u4f8b\u5411\u91cf\u6216\u641c\u5c0b\u689d\u4ef6\u7684\u65b9\u5291\u3002\u8acb\u8abf\u6574\u75c7\u72c0\u3001\u75c5\u4f8b\u95dc\u9375\u5b57\u6216\u7be9\u9078\u689d\u4ef6\u3002</p></div>';
        const badgeDesktop = document.getElementById('rx-count-badge');
        const badgeMobile = document.getElementById('rx-count-badge-mobile');
        if (badgeDesktop) badgeDesktop.textContent = '0';
        if (badgeMobile) badgeMobile.textContent = '0';
        return;
    }
    const countStr = recommendedFormulas.length.toString();
    const badgeDesktop = document.getElementById('rx-count-badge');
    const badgeMobile = document.getElementById('rx-count-badge-mobile');
    if (badgeDesktop) badgeDesktop.textContent = countStr;
    if (badgeMobile) badgeMobile.textContent = countStr;
    recommendedFormulas.forEach((item, index) => {
        const card = document.createElement('div');
        const hasMatches = item.matchedCount > 0;
        card.className = 'rx-card ' + (hasMatches ? 'matched' : '');
        let sourceName = '';
        let iconHtml = '';
        if (SYNDROME_DB[item.syndrome]) { sourceName = SYNDROME_DB[item.syndrome].name + '\u8b49\u65b9'; iconHtml = '<i class="fa-solid ' + getSyndromeIcon(item.syndrome) + ' text-' + item.syndrome + '"></i>'; }
        else if (ORGAN_DB[item.syndrome]) { sourceName = ORGAN_DB[item.syndrome].name + '\u65b9'; iconHtml = '<i class="fa-solid ' + getOrganIcon(item.syndrome) + ' text-primary"></i>'; }
        const tagClass = item.type === '\u5be6\u8b49' ? 'tag-excess' : item.type === '\u865b\u5be6\u593e\u96dc' ? 'tag-mixed' : 'tag-deficiency';
        const scoreParts = item.scoreParts || {};
        const explanation = item.explanation || {};
        const matchedSymptomsHtml = hasMatches ? '<div class="rx-matched-symptoms"><strong><i class="fa-solid fa-circle-check"></i> \u75c7\u72c0\u547d\u4e2d\uff1a</strong><span>' + escapeHtml(item.matchedSymptoms.join('\u3001')) + '</span></div>' : '<div class="rx-matched-symptoms muted"><strong><i class="fa-solid fa-circle-info"></i> \u75c7\u72c0\u547d\u4e2d\uff1a</strong><span>\u672a\u547d\u4e2d\u6587\u5b57\u75c7\u72c0\uff0c\u4f9d\u8fa8\u8b49\u5411\u91cf\u6392\u5e8f</span></div>';
        const herbSuggestionsHtml = buildHerbSuggestionsHtml(item.herbSuggestions);
        card.innerHTML = ['<span class="rx-score-badge">Top ' + (index + 1) + ' \u00b7 ' + item.totalScore + ' \u5206</span>','<div>','<div class="rx-card-header"><span class="rx-name">' + escapeHtml(item.name) + '</span><span class="rx-tag ' + tagClass + '">' + escapeHtml(item.type) + '</span></div>','<div class="rx-source">' + iconHtml + ' ' + sourceName + '</div>','<div class="rx-indications"><strong>\u81e8\u5e8a\u6307\u5fb5\uff1a</strong> ' + escapeHtml(item.indications) + '</div>','</div>','<div class="rx-score-grid">','<div><strong>\u516d\u8b49</strong><span>' + Math.round((scoreParts.patternSimilarity || 0) * 100) + '%</span></div>','<div><strong>\u865b\u5be6</strong><span>' + (scoreParts.xuShiLabel ? escapeHtml(scoreParts.xuShiLabel) : Math.round((scoreParts.xuShiSimilarity || 0) * 100) + '%') + '</span></div>','<div><strong>\u4e94\u81df</strong><span>' + Math.round((scoreParts.zangFuSimilarity || 0) * 100) + '%</span></div>','<div><strong>\u75c7\u72c0</strong><span>' + Math.round((scoreParts.symptomMatch || 0) * 100) + '%</span></div>','</div>', matchedSymptomsHtml, herbSuggestionsHtml, '<div class="rx-explainability">','<div><strong>\u516d\u8b49\u547d\u4e2d\uff1a</strong>' + escapeHtml(formatVectorEntries(explanation.patterns)) + '</div>','<div><strong>\u865b\u5be6\u5224\u65b7\uff1a</strong>' + escapeHtml(formatVectorEntries(explanation.xuShi)) + '</div>','<div><strong>\u4e94\u81df\u547d\u4e2d\uff1a</strong>' + escapeHtml(formatVectorEntries(explanation.zangFu)) + '</div>','<div><strong>\u7279\u6b8a\u6307\u5fb5\uff1a</strong>' + escapeHtml(formatVectorEntries(explanation.specialHits)) + '</div>','<div><strong>\u7981\u5fcc / \u6392\u9664\u8b66\u793a\uff1a</strong>' + escapeHtml(formatVectorEntries(explanation.contraindicationHits)) + '</div>','<div><strong>\u70ba\u4ec0\u9ebc\u63a8\u85a6\uff1a</strong>' + escapeHtml(explanation.reason || '') + '</div>','</div>'].join('');
        container.appendChild(card);
    });
}

// Helper: Get font awesome icons for syndromes
function getSyndromeIcon(key) {
    switch (key) {
        case 'qi_xu': return 'fa-wind';
        case 'qi_ni': return 'fa-circle-up';
        case 'qi_yu': return 'fa-smog';
        case 'xue_xu': return 'fa-droplet';
        case 'yu_xue': return 'fa-circle';
        case 'shui_zhi': return 'fa-water';
        default: return 'fa-stethoscope';
    }
}

// Helper: Get font awesome icons for organs
function getOrganIcon(key) {
    switch (key) {
        case 'liver': return 'fa-seedling';
        case 'heart': return 'fa-fire-flame-curved';
        case 'spleen': return 'fa-cubes';
        case 'lung': return 'fa-feather-pointed';
        case 'kidney': return 'fa-dna';
        default: return 'fa-heart-pulse';
    }
}

// ==========================================
// 5. REPORT GENERATION & PRINT PREVIEW
// ==========================================

function preparePrintReport() {
    // 1. Meta Info
    const name = document.getElementById('patient-name').value || '未填寫';
    const age = document.getElementById('patient-age').value || '未填寫';
    const genderText = appState.gender === 'male' ? '男性' : '女性';
    const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    
    document.getElementById('print-meta-info').innerHTML = `
        <strong>患者姓名：</strong> ${name} &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>性別：</strong> ${genderText} &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>年齡：</strong> ${age} 歲 <br>
        <strong>列印日期：</strong> ${today}
    `;
    document.getElementById('print-date').textContent = today;

    // 2. Six Syndromes Table
    const tbody = document.querySelector('#print-six-syndromes-table tbody');
    tbody.innerHTML = '';
    
    for (const [key, db] of Object.entries(SYNDROME_DB)) {
        const score = appState.syndromeScores[key] || 0;
        const isDiagnosed = score >= db.threshold;
        
        // Find checked symptoms in this syndrome
        const checked = getCheckedRenderableSymptoms(db.symptoms).map(sym => sym.label);
        const checkedText = checked.length > 0 ? checked.join('、') : '無';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${db.name}證</strong></td>
            <td>${score} 分</td>
            <td>≥ ${db.threshold} 分</td>
            <td><span class="${isDiagnosed ? 'print-badge-active' : ''}">${isDiagnosed ? '★ 診斷成立' : '未達標準'}</span></td>
            <td>${checkedText}</td>
        `;
        tbody.appendChild(row);
    }

    // 3. Five Organs Dysfunction
    const organContent = document.getElementById('print-organ-content');
    organContent.innerHTML = '';
    
    let hasOrganAnomalies = false;
    for (const [key, db] of Object.entries(ORGAN_DB)) {
        const score = appState.organScores[key] || 0;
        if (score >= 2) {
            hasOrganAnomalies = true;
            const checked = getCheckedRenderableSymptoms(db.symptoms).map(sym => sym.label);
            
            const level = score >= 4 ? '高度疑似異常' : '中度疑似異常';
            
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <strong>${db.name}定位 (${level})：</strong> 
                已勾選 ${score} 項症候群（${checked.join('、')}）
            `;
            organContent.appendChild(div);
        }
    }
    
    if (!hasOrganAnomalies) {
        organContent.innerHTML = '<p style="font-size:10pt; color:#666;">未發現明顯臟腑異常體質指徵。</p>';
    }

    // 4. Prescriptions recommendations in print layout.
    // Prefer the exact on-screen X4 recommendation list (appState.lastRecommendations,
    // stashed by renderPrescriptions()) so the printed ranking can never disagree with
    // what the clinician just reviewed on screen. Only fall back to recomputing from
    // the legacy FORMULA_DB keyword heuristic when that list is unavailable/empty
    // (e.g. print triggered before any recommendation has ever been rendered).
    const rxContent = document.getElementById('print-prescription-content');
    rxContent.innerHTML = '';

    if (appState.lastRecommendations && appState.lastRecommendations.length > 0) {
        renderPrintPrescriptionsFromRecommendations(rxContent, appState.lastRecommendations.slice(0, 3));
    } else {
        renderPrintPrescriptionsLegacyFallback(rxContent);
    }
}

// Renders the print report's prescription section straight from the same final
// array rendered on screen by renderPrescriptions() (see also buildHerbSuggestionsHtml
// for the on-screen equivalent). Each item carries
// name/totalScore/matchedSymptoms/herbSuggestions/explanation.
function renderPrintPrescriptionsFromRecommendations(rxContent, topList) {
    topList.forEach(item => {
        const printCard = document.createElement('div');
        printCard.className = 'print-prescription-card';

        let sourceName = '';
        if (SYNDROME_DB[item.syndrome]) {
            sourceName = SYNDROME_DB[item.syndrome].name + '證方';
        } else if (ORGAN_DB[item.syndrome]) {
            sourceName = ORGAN_DB[item.syndrome].name + '方';
        }

        const matchedText = (item.matchedSymptoms && item.matchedSymptoms.length)
            ? item.matchedSymptoms.join('、')
            : '未命中文字症狀，依辨證向量排序';

        let herbHtml = '';
        if (item.herbSuggestions && item.herbSuggestions.length) {
            const herbLines = item.herbSuggestions.map(herb => {
                const covered = (herb.coveredSymptoms || []).join('、');
                return `<div>可補足單味藥方向：${herb.name}（覆蓋：${covered}）</div>`;
            }).join('');
            herbHtml = `
                <div style="margin-top:6px; font-size:9pt; color:#333;">
                    ${herbLines}
                    <div style="color:#666;">草稿方向建議，非劑量／安全性建議，須由醫師覆核。</div>
                </div>
            `;
        }

        printCard.innerHTML = `
            <div class="print-prescription-name">【${item.name}】 <span style="font-size:9pt; font-weight:normal; color:#444;">(${item.totalScore} 分${item.type ? ' / ' + item.type : ''}${sourceName ? ' / ' + sourceName : ''})</span></div>
            <div class="print-prescription-details">
                <strong>症狀命中：</strong> ${matchedText}
                ${herbHtml}
            </div>
        `;
        rxContent.appendChild(printCard);
    });
}

// Legacy FORMULA_DB keyword heuristic — retained ONLY as a fallback for when
// appState.lastRecommendations hasn't been populated yet (e.g. print called
// before renderPrescriptions() has ever run once).
function renderPrintPrescriptionsLegacyFallback(rxContent) {
    const activeSymptomsText = getCheckedSymptomLabels();

    const recommendedFormulas = [];
    FORMULA_DB.forEach(formula => {
        let isRelevant = false;
        if (appState.diagnosedSyndromes.includes(formula.syndrome)) isRelevant = true;
        if (formula.syndrome === 'liver' && appState.organScores['liver'] >= 2) isRelevant = true;
        if (formula.syndrome === 'heart' && appState.organScores['heart'] >= 2) isRelevant = true;
        if (formula.syndrome === 'spleen' && appState.organScores['spleen'] >= 2) isRelevant = true;
        if (formula.syndrome === 'lung' && appState.organScores['lung'] >= 2) isRelevant = true;
        if (formula.syndrome === 'kidney' && appState.organScores['kidney'] >= 2) isRelevant = true;

        const matchedSymptoms = [];
        activeSymptomsText.forEach(symText => {
            const keywords = symText.split(/[，、\/()（）\s+]/).filter(k => k.length >= 2);
            keywords.forEach(keyword => {
                if (formula.indications.includes(keyword) && !matchedSymptoms.includes(keyword)) {
                    matchedSymptoms.push(keyword);
                }
            });
        });

        if (isRelevant || matchedSymptoms.length > 0) {
            recommendedFormulas.push({
                ...formula,
                matchedCount: matchedSymptoms.length,
                matchedSymptoms: matchedSymptoms,
                isPrimary: isRelevant
            });
        }
    });

    recommendedFormulas.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return b.matchedCount - a.matchedCount;
    });

    // Render print cards
    if (recommendedFormulas.length === 0) {
        rxContent.innerHTML = '<p style="font-size:10pt; color:#666;">無適用推薦方劑，建議臨床辨證施治。</p>';
    } else {
        // Show top 6 recommended prescriptions for print to fit cleanly on pages
        const printLimitList = recommendedFormulas.slice(0, 6);
        printLimitList.forEach(item => {
            const printCard = document.createElement('div');
            printCard.className = 'print-prescription-card';

            const matchedText = item.matchedCount > 0
                ? ` (與症狀吻合：${item.matchedSymptoms.join('、')})`
                : '';

            let sourceName = '';
            if (SYNDROME_DB[item.syndrome]) {
                sourceName = SYNDROME_DB[item.syndrome].name + '證方';
            } else if (ORGAN_DB[item.syndrome]) {
                sourceName = ORGAN_DB[item.syndrome].name + '方';
            }

            printCard.innerHTML = `
                <div class="print-prescription-name">【${item.name}】 <span style="font-size:9pt; font-weight:normal; color:#444;">(${item.type} / ${sourceName})</span></div>
                <div class="print-prescription-details">
                    <strong>臨床指徵：</strong> ${item.indications} ${matchedText ? `<br><span style="color:#d90429;">${matchedText}</span>` : ''}
                </div>
            `;
            rxContent.appendChild(printCard);
        });
    }
}
