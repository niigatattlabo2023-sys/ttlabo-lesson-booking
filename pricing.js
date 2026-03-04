// 料金計算ロジック

// 料金データ
const PRICING = {
    adult: {
        1: { 1: 3000, 2: 6000, 3: 9000 },
        2: { 1: 1750, 2: 3500, 3: 5250 },
        3: { 1: 1300, 2: 2600, 3: 3900 },
        4: { 1: 1150, 2: 2300, 3: 3450 }
    },
    junior: {
        1: { 1: 2500, 2: 5000, 3: 7500 },
        2: { 1: 1500, 2: 3000, 3: 4500 },
        3: { 1: 1200, 2: 2400, 3: 3600 },
        4: { 1: 1000, 2: 2000, 3: 3000 }
    }
};

/**
 * コーチ料金を計算
 * @param {string} customerType - 'adult' または 'junior'
 * @param {number} participants - 参加人数 (1-4)
 * @param {number} hours - 時間数 (1, 2, 3)
 * @returns {number} - 料金（円）
 */
function calculateCoachFee(customerType, participants, hours) {
    // 入力値のバリデーション
    if (!PRICING[customerType]) {
        console.error('Invalid customer type:', customerType);
        return 0;
    }
    
    if (participants < 1 || participants > 4) {
        console.error('Invalid number of participants:', participants);
        return 0;
    }
    
    if (![1, 2, 3].includes(hours)) {
        console.error('Invalid hours:', hours);
        return 0;
    }
    
    // 料金取得
    const pricePerPerson = PRICING[customerType][participants][hours];
    
    // 1名の場合は料金そのまま、2名以上の場合は人数分の合計
    if (participants === 1) {
        return pricePerPerson;
    } else {
        return pricePerPerson * participants;
    }
}

/**
 * 時間（分）から料金計算用の時間数を取得
 * @param {number} durationMinutes - 時間（分）
 * @returns {number} - 料金計算用の時間数 (1, 2, または 3)
 */
function getHoursForPricing(durationMinutes) {
    if (durationMinutes <= 60) {
        return 1;
    } else if (durationMinutes <= 120) {
        return 2;
    } else {
        return 3;
    }
}

/**
 * レッスン詳細から料金を計算
 * @param {Object} lessonDetails
 * @param {string} lessonDetails.customerType - 'adult' または 'junior'
 * @param {number} lessonDetails.participants - 参加人数
 * @param {number} lessonDetails.durationMinutes - レッスン時間（分）
 * @returns {Object} - { coachFee, hours }
 */
function calculateLessonPrice(lessonDetails) {
    const { customerType, participants, durationMinutes } = lessonDetails;
    
    const hours = getHoursForPricing(durationMinutes);
    const coachFee = calculateCoachFee(customerType, participants, hours);
    
    return {
        coachFee,
        hours
    };
}

/**
 * 料金を表示用にフォーマット
 * @param {number} amount - 金額
 * @returns {string} - フォーマット済み金額 (例: "¥3,000")
 */
function formatPrice(amount) {
    return '¥' + amount.toLocaleString('ja-JP');
}

/**
 * レッスン料金サマリーを生成
 * @param {Object} lessonDetails
 * @returns {Object} - { coachFee, hours, formattedCoachFee, priceBreakdown }
 */
function generatePriceSummary(lessonDetails) {
    const { coachFee, hours } = calculateLessonPrice(lessonDetails);
    const { customerType, participants } = lessonDetails;
    
    let priceBreakdown = '';
    
    if (participants === 1) {
        priceBreakdown = `${customerType === 'adult' ? '社会人' : 'ジュニア'} ${hours}時間 × 1名`;
    } else {
        const pricePerPerson = PRICING[customerType][participants][hours];
        priceBreakdown = `${customerType === 'adult' ? '社会人' : 'ジュニア'} ${hours}時間 × ${participants}名 (${formatPrice(pricePerPerson)}/人)`;
    }
    
    return {
        coachFee,
        hours,
        formattedCoachFee: formatPrice(coachFee),
        priceBreakdown
    };
}

// エクスポート（グローバルスコープで利用可能にする）
if (typeof window !== 'undefined') {
    window.PricingUtils = {
        calculateCoachFee,
        getHoursForPricing,
        calculateLessonPrice,
        formatPrice,
        generatePriceSummary,
        PRICING
    };
}
