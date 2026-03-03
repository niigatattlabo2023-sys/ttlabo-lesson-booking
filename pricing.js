// 新潟卓球ラボ 個人レッスン予約システム - 料金計算モジュール

// 料金表（コーチ料）
const PRICING = {
    adult: {
        individual: {
            1: { 60: 3000, 90: 4500, 120: 6000, 150: 7500, 180: 9000 },
            2: { 60: 1750, 90: 2625, 120: 3500, 150: 4375, 180: 5250 },
            3: { 60: 1300, 90: 1950, 120: 2600, 150: 3250, 180: 3900 },
            4: { 60: 1150, 90: 1725, 120: 2300, 150: 2875, 180: 3450 }
        },
        group: {
            1: { 60: 5000, 90: 7500, 120: 10000, 150: 12500, 180: 15000 }
        }
    },
    junior: {
        individual: {
            1: { 60: 2500, 90: 3750, 120: 5000, 150: 6250, 180: 7500 },
            2: { 60: 1500, 90: 2250, 120: 3000, 150: 3750, 180: 4500 },
            3: { 60: 1200, 90: 1800, 120: 2400, 150: 3000, 180: 3600 },
            4: { 60: 1000, 90: 1500, 120: 2000, 150: 2500, 180: 3000 }
        },
        group: {
            1: { 60: 5000, 90: 7500, 120: 10000, 150: 12500, 180: 15000 }
        }
    }
};

/**
 * コーチ料を計算
 * @param {string} customerType - 'adult' or 'junior'
 * @param {string} lessonType - 'individual' or 'group'
 * @param {number} participants - 1〜4
 * @param {number} duration - 60, 90, 120, 150, 180（分）
 * @returns {number} - コーチ料（円）
 */
function calculateCoachFee(customerType, lessonType, participants, duration) {
    try {
        if (!PRICING[customerType]) {
            throw new Error(`Invalid customer type: ${customerType}`);
        }
        
        if (!PRICING[customerType][lessonType]) {
            throw new Error(`Invalid lesson type: ${lessonType}`);
        }
        
        // グループレッスンの場合は参加人数は1として扱う
        const participantKey = lessonType === 'group' ? 1 : participants;
        
        if (!PRICING[customerType][lessonType][participantKey]) {
            throw new Error(`Invalid participants: ${participants}`);
        }
        
        if (!PRICING[customerType][lessonType][participantKey][duration]) {
            throw new Error(`Invalid duration: ${duration}`);
        }
        
        const fee = PRICING[customerType][lessonType][participantKey][duration];
        
        // グループレッスンでない場合は、1人あたりの料金×人数
        if (lessonType === 'individual' && participants > 1) {
            return fee * participants;
        }
        
        return fee;
    } catch (error) {
        console.error('Error calculating coach fee:', error);
        return 0;
    }
}

/**
 * 料金を日本円フォーマットで表示
 * @param {number} amount - 金額
 * @returns {string} - フォーマットされた金額（例：¥3,000）
 */
function formatCurrency(amount) {
    return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * 時間（分）を読みやすい形式に変換
 * @param {number} minutes - 分
 * @returns {string} - フォーマットされた時間（例：1時間、1.5時間）
 */
function formatDuration(minutes) {
    if (minutes === 60) return '1時間';
    if (minutes === 90) return '1.5時間';
    if (minutes === 120) return '2時間';
    if (minutes === 150) return '2.5時間';
    if (minutes === 180) return '3時間';
    return `${minutes}分`;
}

/**
 * 料金の詳細内訳を取得
 * @param {string} customerType - 'adult' or 'junior'
 * @param {string} lessonType - 'individual' or 'group'
 * @param {number} participants - 1〜4
 * @param {number} duration - 60, 90, 120, 150, 180（分）
 * @returns {object} - { perPerson: number, total: number, formattedTotal: string }
 */
function getPriceBreakdown(customerType, lessonType, participants, duration) {
    const total = calculateCoachFee(customerType, lessonType, participants, duration);
    const perPerson = lessonType === 'individual' && participants > 1 
        ? total / participants 
        : total;
    
    return {
        perPerson: Math.round(perPerson),
        total: total,
        formattedTotal: formatCurrency(total),
        formattedPerPerson: formatCurrency(Math.round(perPerson))
    };
}

/**
 * 料金情報のHTMLを生成
 * @param {string} customerType - 'adult' or 'junior'
 * @param {string} lessonType - 'individual' or 'group'
 * @param {number} participants - 1〜4
 * @param {number} duration - 60, 90, 120, 150, 180（分）
 * @returns {string} - HTML文字列
 */
function generatePriceHTML(customerType, lessonType, participants, duration) {
    const breakdown = getPriceBreakdown(customerType, lessonType, participants, duration);
    
    let html = `<div class="price-display">`;
    
    if (lessonType === 'individual' && participants > 1) {
        html += `
            <div class="price-breakdown">
                <p class="text-gray-600 mb-2">
                    ${breakdown.formattedPerPerson} × ${participants}名 = ${breakdown.formattedTotal}
                </p>
            </div>
        `;
    }
    
    html += `
        <div class="total-price">
            <p class="text-4xl font-bold text-blue-600">${breakdown.formattedTotal}</p>
            <p class="text-sm text-gray-600 mt-2">※コーチ料のみ（施設利用料は当日ご確認ください）</p>
        </div>
    `;
    
    html += `</div>`;
    
    return html;
}

// エクスポート（グローバルスコープで利用可能にする）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateCoachFee,
        formatCurrency,
        formatDuration,
        getPriceBreakdown,
        generatePriceHTML,
        PRICING
    };
}
