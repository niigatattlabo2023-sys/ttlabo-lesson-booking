// 新潟卓球ラボ 個人レッスン予約システム - 予約フォームスクリプト

// グローバル変数
let currentStep = 1;
let searchMethod = null;
let facilities = [];
let blockedTimes = [];
let selectedFacilityId = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadFacilities();
    await loadBlockedTimes();
    setupEventListeners();
    generateTimeOptions();
});

// 施設データを読み込み
async function loadFacilities() {
    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .order('name');
        
        if (error) throw error;
        facilities = data || [];
        populateFacilitySelects();
    } catch (error) {
        console.error('Error loading facilities:', error);
        showToast('施設情報の読み込みに失敗しました', 'error');
    }
}

// ブロック時間を読み込み
async function loadBlockedTimes() {
    try {
        const { data, error } = await supabase
            .from('blocked_times')
            .select('*');
        
        if (error) throw error;
        blockedTimes = data || [];
    } catch (error) {
        console.error('Error loading blocked times:', error);
    }
}

// 施設セレクトボックスに値を設定
function populateFacilitySelects() {
    const facilitySelect = document.getElementById('facilitySelect');
    facilitySelect.innerHTML = '<option value="">施設を選択してください</option>';
    
    facilities.forEach(facility => {
        const option = document.createElement('option');
        option.value = facility.id;
        option.textContent = facility.name;
        facilitySelect.appendChild(option);
    });
}

// 時間選択肢を生成（9:00〜21:00、30分刻み）
function generateTimeOptions() {
    const timeSelects = ['bookingTime1', 'bookingTime2'];
    
    timeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">時間を選択してください</option>';
        
        for (let hour = 9; hour <= 21; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 21 && minute > 0) break; // 21:00まで
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = timeStr;
                option.textContent = timeStr;
                select.appendChild(option);
            }
        }
    });
}

// イベントリスナー設定
function setupEventListeners() {
    // ラジオボタンの変更
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            radio.closest('.radio-card').parentElement
                .querySelectorAll('.radio-card').forEach(card => {
                    card.classList.remove('selected');
                });
            radio.closest('.radio-card').classList.add('selected');
        });
    });
    
    // 施設選択時
    document.getElementById('facilitySelect')?.addEventListener('change', (e) => {
        selectedFacilityId = e.target.value;
        if (selectedFacilityId) {
            updateAvailableDates();
        }
    });
    
    // 日時選択時（日時優先フロー）
    document.getElementById('bookingDate2')?.addEventListener('change', checkAvailableFacilities);
    document.getElementById('bookingTime2')?.addEventListener('change', checkAvailableFacilities);
    document.getElementById('duration')?.addEventListener('change', checkAvailableFacilities);
    
    // フォーム送信
    document.getElementById('bookingForm')?.addEventListener('submit', handleSubmit);
}

// 検索方法を選択
function selectSearchMethod(method) {
    searchMethod = method;
    document.getElementById('searchMethodSection').classList.add('hidden');
    document.getElementById('bookingFormSection').classList.remove('hidden');
    
    if (method === 'facility') {
        document.getElementById('facilityFirstFlow').classList.remove('hidden');
        document.getElementById('datetimeFirstFlow').classList.add('hidden');
    } else {
        document.getElementById('facilityFirstFlow').classList.add('hidden');
        document.getElementById('datetimeFirstFlow').classList.remove('hidden');
    }
}

// 次のステップへ
function nextStep() {
    if (currentStep === 1) {
        if (!validateStep1()) return;
    } else if (currentStep === 2) {
        if (!validateStep2()) return;
    } else if (currentStep === 3) {
        if (!validateStep3()) return;
        showConfirmation();
    }
    
    if (currentStep < 4) {
        document.getElementById(`formStep${currentStep}`).classList.add('hidden');
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`formStep${currentStep}`).classList.remove('hidden');
        document.getElementById(`step${currentStep}`).classList.add('active');
    }
}

// 前のステップへ
function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`formStep${currentStep}`).classList.add('hidden');
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`formStep${currentStep}`).classList.remove('hidden');
        document.getElementById(`step${currentStep}`).classList.add('active');
    }
}

// ステップ1のバリデーション
function validateStep1() {
    const name = document.getElementById('customerName').value.trim();
    const customerType = document.querySelector('input[name="customerType"]:checked');
    const lessonType = document.querySelector('input[name="lessonType"]:checked');
    
    if (!name) {
        showToast('お名前を入力してください', 'error');
        return false;
    }
    if (!customerType) {
        showToast('区分を選択してください', 'error');
        return false;
    }
    if (!lessonType) {
        showToast('レッスン種別を選択してください', 'error');
        return false;
    }
    return true;
}

// ステップ2のバリデーション
function validateStep2() {
    if (searchMethod === 'facility') {
        const facility = document.getElementById('facilitySelect').value;
        const date = document.getElementById('bookingDate1').value;
        const time = document.getElementById('bookingTime1').value;
        
        if (!facility || !date || !time) {
            showToast('すべての項目を入力してください', 'error');
            return false;
        }
    } else {
        const date = document.getElementById('bookingDate2').value;
        const time = document.getElementById('bookingTime2').value;
        const duration = document.getElementById('duration').value;
        const selectedFacility = document.querySelector('input[name="selectedFacility"]:checked');
        
        if (!date || !time || !duration || !selectedFacility) {
            showToast('すべての項目を入力してください', 'error');
            return false;
        }
    }
    return true;
}

// ステップ3のバリデーション
function validateStep3() {
    const participants = document.getElementById('participants').value;
    const facilityBookingBy = document.querySelector('input[name="facilityBookingBy"]:checked');
    
    if (!participants || !facilityBookingBy) {
        showToast('すべての項目を入力してください', 'error');
        return false;
    }
    return true;
}

// 日時優先フロー：利用可能な施設をチェック
async function checkAvailableFacilities() {
    const date = document.getElementById('bookingDate2').value;
    const time = document.getElementById('bookingTime2').value;
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!date || !time || !duration) return;
    
    // Google Maps API連携は後で実装（現在はすべての施設を表示）
    const availableFacilitiesDiv = document.getElementById('availableFacilities');
    const facilityList = document.getElementById('facilityList');
    
    facilityList.innerHTML = '';
    
    facilities.forEach(facility => {
        const label = document.createElement('label');
        label.className = 'radio-card';
        label.innerHTML = `
            <input type="radio" name="selectedFacility" value="${facility.id}" class="hidden">
            <div class="radio-card-content">
                <i class="fas fa-building text-2xl text-blue-500 mb-2"></i>
                <p class="font-bold">${facility.name}</p>
                <p class="text-sm text-gray-600">${facility.address || ''}</p>
            </div>
        `;
        facilityList.appendChild(label);
    });
    
    availableFacilitiesDiv.classList.remove('hidden');
    
    // イベントリスナー再設定
    document.querySelectorAll('input[name="selectedFacility"]').forEach(radio => {
        radio.addEventListener('change', () => {
            selectedFacilityId = radio.value;
            radio.closest('.radio-card').parentElement
                .querySelectorAll('.radio-card').forEach(card => {
                    card.classList.remove('selected');
                });
            radio.closest('.radio-card').classList.add('selected');
        });
    });
}

// 確認画面の表示
function showConfirmation() {
    const name = document.getElementById('customerName').value;
    const customerType = document.querySelector('input[name="customerType"]:checked').value;
    const lessonType = document.querySelector('input[name="lessonType"]:checked').value;
    const participants = parseInt(document.getElementById('participants').value);
    const facilityBookingBy = document.querySelector('input[name="facilityBookingBy"]:checked').value;
    const notes = document.getElementById('notes').value;
    
    let date, time, duration, facilityId;
    
    if (searchMethod === 'facility') {
        facilityId = document.getElementById('facilitySelect').value;
        date = document.getElementById('bookingDate1').value;
        time = document.getElementById('bookingTime1').value;
        duration = 60; // デフォルト1時間（実際には選択させる必要あり）
    } else {
        facilityId = document.querySelector('input[name="selectedFacility"]:checked').value;
        date = document.getElementById('bookingDate2').value;
        time = document.getElementById('bookingTime2').value;
        duration = parseInt(document.getElementById('duration').value);
    }
    
    const facility = facilities.find(f => f.id === facilityId);
    
    // 料金計算
    const coachFee = calculateCoachFee(customerType, lessonType, participants, duration);
    
    // 確認内容の表示
    const confirmationDetails = document.getElementById('confirmationDetails');
    confirmationDetails.innerHTML = `
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>区分:</strong> ${customerType === 'junior' ? 'ジュニア（中学生以下）' : '社会人'}</p>
        <p><strong>レッスン種別:</strong> ${lessonType === 'individual' ? '個人レッスン' : 'グループレッスン'}</p>
        <p><strong>施設:</strong> ${facility.name}</p>
        <p><strong>日時:</strong> ${date} ${time}〜</p>
        <p><strong>レッスン時間:</strong> ${formatDuration(duration)}</p>
        <p><strong>参加人数:</strong> ${participants}名</p>
        <p><strong>施設予約担当:</strong> ${facilityBookingBy === 'customer' ? '自分で予約' : 'コーチに依頼'}</p>
        ${notes ? `<p><strong>備考:</strong> ${notes}</p>` : ''}
    `;
    
    // 料金表示
    const priceDisplay = document.getElementById('priceDisplay');
    priceDisplay.textContent = formatCurrency(coachFee);
}

// フォーム送信
async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const customerType = document.querySelector('input[name="customerType"]:checked').value;
    const lessonType = document.querySelector('input[name="lessonType"]:checked').value;
    const participants = parseInt(document.getElementById('participants').value);
    const facilityBookingBy = document.querySelector('input[name="facilityBookingBy"]:checked').value;
    const notes = document.getElementById('notes').value;
    
    let date, time, duration, facilityId;
    
    if (searchMethod === 'facility') {
        facilityId = document.getElementById('facilitySelect').value;
        date = document.getElementById('bookingDate1').value;
        time = document.getElementById('bookingTime1').value;
        duration = 60;
    } else {
        facilityId = document.querySelector('input[name="selectedFacility"]:checked').value;
        date = document.getElementById('bookingDate2').value;
        time = document.getElementById('bookingTime2').value;
        duration = parseInt(document.getElementById('duration').value);
    }
    
    const startTime = new Date(`${date}T${time}:00`);
    const coachFee = calculateCoachFee(customerType, lessonType, participants, duration);
    
    try {
        const { data, error } = await supabase
            .from('lesson_requests')
            .insert([{
                customer_name: name,
                customer_type: customerType,
                lesson_type: lessonType,
                facility_id: facilityId,
                start_time: startTime.toISOString(),
                duration_minutes: duration,
                participants: participants,
                facility_booking_by: facilityBookingBy,
                coach_fee: coachFee,
                status: 'pending',
                notes: notes
            }])
            .select();
        
        if (error) throw error;
        
        showToast('予約申請を送信しました！確定次第LINEでご連絡します', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting booking:', error);
        showToast('予約申請の送信に失敗しました', 'error');
    }
}

// フォームリセット
function resetForm() {
    currentStep = 1;
    searchMethod = null;
    selectedFacilityId = null;
    document.getElementById('bookingFormSection').classList.add('hidden');
    document.getElementById('searchMethodSection').classList.remove('hidden');
    document.getElementById('bookingForm').reset();
    
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`formStep${i}`).classList.add('hidden');
        document.getElementById(`step${i}`).classList.remove('active');
    }
    document.getElementById('formStep1').classList.remove('hidden');
    document.getElementById('step1').classList.add('active');
}

// 空き日時の更新（施設優先フロー用）
function updateAvailableDates() {
    // 後で実装：選択された施設の空き日時を表示
}

// トースト通知
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-xl ${
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'info' ? 'bg-blue-500' : 
        'bg-green-500'
    } text-white`;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 3000);
}
