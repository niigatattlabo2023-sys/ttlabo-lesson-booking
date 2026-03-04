// Supabase設定
const SUPABASE_URL = 'https://lwbysesbbehholrojonc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YnlzZXNiYmVoaG9scm9qb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjcxNjMsImV4cCI6MjA4ODAwMzE2M30.2NwutCuF7mODQ3bZUlDumn-wx2zHLWR_gP1tjHQuNqg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// グローバル状態
let selectedPattern = null;
let selectedFacility = null;
let selectedDate = null;
let selectedTime = null;
let selectedDuration = null;
let facilities = [];
let blockedTimes = [];

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    // 今日の日付を最小値として設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('desired-date').min = today;
    document.getElementById('lesson-date').min = today;
    
    // 時刻選択肢を生成（9:00-21:00、30分刻み）
    generateTimeOptions();
    
    // パターン選択
    document.querySelectorAll('.pattern-card').forEach(card => {
        card.addEventListener('click', function() {
            selectPattern(this.dataset.pattern);
        });
    });
    
    // 施設リストを読み込み
    await loadFacilities();
    
    // パターンB: 施設検索ボタン
    document.getElementById('check-facilities-btn').addEventListener('click', searchAvailableFacilities);
    
    // フォームイベント
    document.getElementById('lesson-date').addEventListener('change', handleDateChange);
    document.getElementById('duration').addEventListener('change', validateCommonForm);
    document.getElementById('participants').addEventListener('change', updatePrice);
    document.querySelectorAll('input[name="customer-type"]').forEach(radio => {
        radio.addEventListener('change', updatePrice);
    });
    document.querySelectorAll('input[name="lesson-type"]').forEach(radio => {
        radio.addEventListener('change', validateDetailsForm);
    });
    document.querySelectorAll('input[name="booking-by"]').forEach(radio => {
        radio.addEventListener('change', validateDetailsForm);
    });
    document.getElementById('customer-name').addEventListener('input', validateDetailsForm);
    
    // 送信ボタン
    document.getElementById('submit-btn').addEventListener('click', handleSubmit);
});

// 時刻選択肢を生成
function generateTimeOptions() {
    const select = document.getElementById('desired-time');
    for (let hour = 9; hour < 21; hour++) {
        for (let min = 0; min < 60; min += 30) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeStr;
            option.textContent = timeStr;
            select.appendChild(option);
        }
    }
}

// 施設リストを読み込み
async function loadFacilities() {
    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        facilities = data || [];
        renderFacilityList();
    } catch (error) {
        console.error('施設読み込みエラー:', error);
        showToast('施設情報の読み込みに失敗しました', 'error');
    }
}

// 施設リストを表示
function renderFacilityList() {
    const container = document.getElementById('facility-list');
    container.innerHTML = '';
    
    if (facilities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">施設がまだ登録されていません。管理者に連絡してください。</p>';
        return;
    }
    
    facilities.forEach(facility => {
        const item = document.createElement('div');
        item.className = 'facility-item';
        item.dataset.facilityId = facility.id;
        item.innerHTML = `
            <h4><i class="fas fa-map-marker-alt"></i> ${facility.name}</h4>
            <p>${facility.address || '住所未登録'}</p>
        `;
        item.addEventListener('click', function() {
            selectFacility(facility);
        });
        container.appendChild(item);
    });
}

// パターン選択
function selectPattern(pattern) {
    selectedPattern = pattern;
    
    // カードの選択状態を更新
    document.querySelectorAll('.pattern-card').forEach(card => {
        if (card.dataset.pattern === pattern) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // フォームを表示
    document.getElementById('pattern-facility-form').classList.remove('active');
    document.getElementById('pattern-datetime-form').classList.remove('active');
    
    if (pattern === 'facility') {
        document.getElementById('pattern-facility-form').classList.add('active');
    } else {
        document.getElementById('pattern-datetime-form').classList.add('active');
    }
}

// 施設選択（パターンA）
function selectFacility(facility) {
    selectedFacility = facility;
    
    // 施設リストの選択状態を更新
    document.querySelectorAll('.facility-item').forEach(item => {
        if (item.dataset.facilityId === facility.id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // 共通フォームを表示
    document.getElementById('selected-facility-name').textContent = facility.name;
    document.getElementById('common-form').classList.add('active');
    
    // 詳細フォームも表示
    document.getElementById('details-form').classList.add('active');
    
    // スクロール
    document.getElementById('common-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 移動可能な施設を検索（パターンB）
async function searchAvailableFacilities() {
    const date = document.getElementById('desired-date').value;
    const time = document.getElementById('desired-time').value;
    const duration = parseInt(document.getElementById('desired-duration').value);
    
    if (!date || !time || !duration) {
        showToast('日時とレッスン時間を入力してください', 'error');
        return;
    }
    
    // ブロック済み予定を確認
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    
    await loadBlockedTimes(date);
    
    // 施設ごとに移動可能かチェック（簡易版：すべて表示）
    const availableFacilitiesContainer = document.getElementById('available-facilities');
    const listContainer = document.getElementById('available-facilities-list');
    listContainer.innerHTML = '';
    
    if (facilities.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">施設が登録されていません</p>';
        availableFacilitiesContainer.style.display = 'block';
        return;
    }
    
    facilities.forEach(facility => {
        const item = document.createElement('div');
        item.className = 'facility-item';
        item.dataset.facilityId = facility.id;
        item.innerHTML = `
            <h4><i class="fas fa-check-circle" style="color: var(--success-color);"></i> ${facility.name}</h4>
            <p>${facility.address || '住所未登録'}</p>
        `;
        item.addEventListener('click', function() {
            selectFacilityFromDatetime(facility, date, time, duration);
        });
        listContainer.appendChild(item);
    });
    
    availableFacilitiesContainer.style.display = 'block';
    availableFacilitiesContainer.scrollIntoView({ behavior: 'smooth' });
}

// パターンBから施設選択
function selectFacilityFromDatetime(facility, date, time, duration) {
    selectedFacility = facility;
    selectedDate = date;
    selectedTime = time;
    selectedDuration = duration;
    
    // 施設リストの選択状態を更新
    document.querySelectorAll('#available-facilities-list .facility-item').forEach(item => {
        if (item.dataset.facilityId === facility.id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // 共通フォームをスキップして詳細フォームへ
    document.getElementById('selected-facility-name').textContent = facility.name;
    document.getElementById('details-form').classList.add('active');
    
    // 期間を設定
    document.getElementById('duration').value = duration;
    
    // スクロール
    document.getElementById('details-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ブロック済み時間を読み込み
async function loadBlockedTimes(date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const { data, error } = await supabase
            .from('blocked_times')
            .select('*')
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString());
        
        if (error) throw error;
        
        blockedTimes = data || [];
    } catch (error) {
        console.error('予定読み込みエラー:', error);
        blockedTimes = [];
    }
}

// 日付変更時
async function handleDateChange() {
    const date = document.getElementById('lesson-date').value;
    if (!date) return;
    
    selectedDate = date;
    
    // その日がMonday（月曜日）かチェック
    const dateObj = new Date(date + 'T00:00:00');
    if (dateObj.getDay() === 1) {
        showToast('月曜日は定休日です。他の日付を選択してください。', 'error');
        document.getElementById('lesson-date').value = '';
        return;
    }
    
    // ブロック済み時間を読み込み
    await loadBlockedTimes(date);
    
    // 時間スロットを生成
    generateTimeSlots();
}

// 時間スロットを生成
function generateTimeSlots() {
    const container = document.getElementById('time-slots');
    container.innerHTML = '';
    
    for (let hour = 9; hour < 21; hour++) {
        for (let min = 0; min < 60; min += 30) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = timeStr;
            slot.dataset.time = timeStr;
            
            // ブロックされているかチェック
            if (isTimeBlocked(timeStr)) {
                slot.classList.add('disabled');
                slot.title = '予約不可';
            } else {
                slot.addEventListener('click', function() {
                    selectTimeSlot(this);
                });
            }
            
            container.appendChild(slot);
        }
    }
}

// 時間がブロックされているかチェック
function isTimeBlocked(timeStr) {
    if (!selectedDate || !selectedFacility) return false;
    
    const checkDateTime = new Date(`${selectedDate}T${timeStr}`);
    
    return blockedTimes.some(blocked => {
        const blockStart = new Date(blocked.start_time);
        const blockEnd = new Date(blocked.end_time);
        return checkDateTime >= blockStart && checkDateTime < blockEnd;
    });
}

// 時間スロット選択
function selectTimeSlot(slot) {
    if (slot.classList.contains('disabled')) return;
    
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    selectedTime = slot.dataset.time;
    
    validateCommonForm();
}

// 共通フォームのバリデーション
function validateCommonForm() {
    if (selectedDate && selectedTime && document.getElementById('duration').value) {
        // OK
    }
}

// 料金表示を更新
function updatePrice() {
    const customerType = document.querySelector('input[name="customer-type"]:checked')?.value;
    const participants = parseInt(document.getElementById('participants').value);
    const durationMinutes = selectedPattern === 'datetime' ? 
        selectedDuration : 
        parseInt(document.getElementById('duration').value);
    
    if (!customerType || !participants || !durationMinutes) {
        document.getElementById('price-display').style.display = 'none';
        return;
    }
    
    const { formattedCoachFee, priceBreakdown } = window.PricingUtils.generatePriceSummary({
        customerType,
        participants,
        durationMinutes
    });
    
    const priceDisplay = document.getElementById('price-display');
    priceDisplay.querySelector('.amount').textContent = formattedCoachFee;
    priceDisplay.querySelector('.breakdown').textContent = priceBreakdown;
    priceDisplay.style.display = 'block';
    
    validateDetailsForm();
}

// 詳細フォームのバリデーション
function validateDetailsForm() {
    const name = document.getElementById('customer-name').value.trim();
    const customerType = document.querySelector('input[name="customer-type"]:checked');
    const lessonType = document.querySelector('input[name="lesson-type"]:checked');
    const participants = document.getElementById('participants').value;
    const bookingBy = document.querySelector('input[name="booking-by"]:checked');
    
    const isValid = name && customerType && lessonType && participants && bookingBy;
    
    document.getElementById('submit-btn').disabled = !isValid;
}

// 予約申請を送信
async function handleSubmit() {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading"></div> 送信中...';
    
    try {
        const customerName = document.getElementById('customer-name').value.trim();
        const customerType = document.querySelector('input[name="customer-type"]:checked').value;
        const lessonType = document.querySelector('input[name="lesson-type"]:checked').value;
        const participants = parseInt(document.getElementById('participants').value);
        const bookingBy = document.querySelector('input[name="booking-by"]:checked').value;
        const notes = document.getElementById('notes').value.trim();
        
        // 日時を確定
        let finalDate, finalTime, finalDuration;
        
        if (selectedPattern === 'datetime') {
            finalDate = selectedDate;
            finalTime = selectedTime;
            finalDuration = selectedDuration;
        } else {
            finalDate = selectedDate;
            finalTime = selectedTime;
            finalDuration = parseInt(document.getElementById('duration').value);
        }
        
        const startDateTime = new Date(`${finalDate}T${finalTime}`);
        
        // 料金計算
        const { coachFee } = window.PricingUtils.calculateLessonPrice({
            customerType,
            participants,
            durationMinutes: finalDuration
        });
        
        // データベースに保存
        const { data, error } = await supabase
            .from('lesson_requests')
            .insert([{
                customer_name: customerName,
                customer_type: customerType,
                lesson_type: lessonType,
                facility_id: selectedFacility.id,
                start_time: startDateTime.toISOString(),
                duration_minutes: finalDuration,
                participants: participants,
                facility_booking_by: bookingBy,
                coach_fee: coachFee,
                status: 'pending',
                notes: notes || null
            }])
            .select();
        
        if (error) throw error;
        
        showToast('予約申請を送信しました！LINEで確定連絡をお待ちください。', 'success');
        
        // 3秒後にトップページへ
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('送信エラー:', error);
        showToast('予約申請の送信に失敗しました。もう一度お試しください。', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 予約申請を送信';
    }
}

// トースト通知
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
