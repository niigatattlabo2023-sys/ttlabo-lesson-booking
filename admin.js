// 新潟卓球ラボ 個人レッスン予約システム - 管理画面スクリプト

// グローバル変数
let currentUser = null;
let requests = [];
let facilities = [];

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
});

// 認証チェック
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        currentUser = user;
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('adminName').textContent = user.email;
        await loadDashboard();
    } else {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }
}

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
}

// ログイン
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showToast('ログインしました', 'success');
        await checkAuth();
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('ログインに失敗しました', 'error');
    }
}

// ログアウト
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        showToast('ログアウトしました', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showToast('ログアウトに失敗しました', 'error');
    }
}

// ダッシュボード読み込み
async function loadDashboard() {
    await Promise.all([
        loadRequests(),
        loadFacilities(),
        updateStats()
    ]);
}

// 予約申請を読み込み
async function loadRequests() {
    try {
        const { data, error } = await supabase
            .from('lesson_requests')
            .select(`
                *,
                facility:facilities(*)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        requests = data || [];
        displayRequests();
        
    } catch (error) {
        console.error('Error loading requests:', error);
        showToast('予約申請の読み込みに失敗しました', 'error');
    }
}

// 予約申請を表示
function displayRequests() {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';
    
    if (requests.length === 0) {
        requestsList.innerHTML = '<p class="text-gray-500 text-center py-8">予約申請はありません</p>';
        return;
    }
    
    requests.forEach(request => {
        const card = createRequestCard(request);
        requestsList.appendChild(card);
    });
}

// 予約カードを作成
function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = `request-card ${request.status}`;
    
    const statusBadge = getStatusBadge(request.status);
    const startTime = new Date(request.start_time);
    const dateStr = startTime.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
    });
    const timeStr = startTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-xl font-bold text-gray-800">${request.customer_name}</h3>
                <p class="text-gray-600">${dateStr} ${timeStr}〜（${formatDuration(request.duration_minutes)}）</p>
            </div>
            ${statusBadge}
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <p class="text-sm text-gray-600">施設</p>
                <p class="font-bold">${request.facility?.name || '未設定'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">料金</p>
                <p class="font-bold text-blue-600">${formatCurrency(request.coach_fee)}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">参加人数</p>
                <p class="font-bold">${request.participants}名</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">施設予約担当</p>
                <p class="font-bold">${request.facility_booking_by === 'customer' ? '顧客' : 'コーチ'}</p>
            </div>
        </div>
        ${request.status === 'pending' ? `
            <div class="flex space-x-3">
                <button onclick="viewRequestDetail('${request.id}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    <i class="fas fa-eye mr-2"></i>詳細を見る
                </button>
                <button onclick="approveRequest('${request.id}')" class="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition">
                    <i class="fas fa-check mr-2"></i>承認
                </button>
                <button onclick="rejectRequest('${request.id}')" class="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition">
                    <i class="fas fa-times mr-2"></i>却下
                </button>
            </div>
        ` : `
            <button onclick="viewRequestDetail('${request.id}')" class="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition">
                <i class="fas fa-eye mr-2"></i>詳細を見る
            </button>
        `}
    `;
    
    return card;
}

// ステータスバッジを取得
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full font-bold text-sm">保留中</span>',
        approved: '<span class="bg-green-100 text-green-800 px-4 py-1 rounded-full font-bold text-sm">承認済み</span>',
        rejected: '<span class="bg-red-100 text-red-800 px-4 py-1 rounded-full font-bold text-sm">却下</span>',
        cancelled: '<span class="bg-gray-100 text-gray-800 px-4 py-1 rounded-full font-bold text-sm">キャンセル</span>',
        alternative_proposed: '<span class="bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-bold text-sm">別日提案</span>'
    };
    return badges[status] || '';
}

// 予約詳細を表示
async function viewRequestDetail(requestId) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    const modal = document.getElementById('requestDetailModal');
    const content = document.getElementById('requestDetailContent');
    
    const startTime = new Date(request.start_time);
    const dateStr = startTime.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
    });
    const timeStr = startTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // 施設予約サポート機能（強化版）
    let facilityBookingHTML = '';
    if (request.facility_booking_by === 'coach' && request.status === 'approved' && request.facility) {
        facilityBookingHTML = `
            <div class="facility-booking-support">
                <h4><i class="fas fa-phone-square-alt"></i>施設予約が必要です</h4>
                <p class="text-gray-700 mb-4">${request.facility.name}</p>
                
                <div class="facility-booking-actions">
                    ${request.facility.phone ? `
                        <a href="tel:${request.facility.phone}" class="facility-action-btn phone" target="_blank">
                            <i class="fas fa-phone"></i>
                            <span>電話をかける<br><small>${request.facility.phone}</small></span>
                        </a>
                    ` : ''}
                    
                    ${request.facility.booking_url ? `
                        <a href="${request.facility.booking_url}" class="facility-action-btn web" target="_blank">
                            <i class="fas fa-globe"></i>
                            <span>Web予約ページ<br><small>を開く</small></span>
                        </a>
                    ` : ''}
                </div>
                
                <div class="facility-booking-checkbox">
                    <input type="checkbox" id="facilityBooked_${request.id}" 
                           onchange="markFacilityBooked('${request.id}', this.checked)">
                    <label for="facilityBooked_${request.id}">施設予約を完了しました ✅</label>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-orange-100 to-blue-100 p-6 rounded-lg">
                <h4 class="text-2xl font-bold text-gray-800 mb-4">${request.customer_name} 様</h4>
                <div class="grid grid-cols-2 gap-4 text-gray-700">
                    <div>
                        <p class="text-sm text-gray-600">区分</p>
                        <p class="font-bold">${request.customer_type === 'junior' ? 'ジュニア（中学生以下）' : '社会人'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">レッスン種別</p>
                        <p class="font-bold">${request.lesson_type === 'individual' ? '個人レッスン' : 'グループレッスン'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">日時</p>
                        <p class="font-bold">${dateStr}<br>${timeStr}〜</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">レッスン時間</p>
                        <p class="font-bold">${formatDuration(request.duration_minutes)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">施設</p>
                        <p class="font-bold">${request.facility?.name || '未設定'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">参加人数</p>
                        <p class="font-bold">${request.participants}名</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">施設予約担当</p>
                        <p class="font-bold">${request.facility_booking_by === 'customer' ? '顧客が予約' : 'コーチが予約'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">料金</p>
                        <p class="font-bold text-2xl text-blue-600">${formatCurrency(request.coach_fee)}</p>
                    </div>
                </div>
                ${request.notes ? `
                    <div class="mt-4 pt-4 border-t-2 border-gray-300">
                        <p class="text-sm text-gray-600">備考</p>
                        <p class="font-bold">${request.notes}</p>
                    </div>
                ` : ''}
            </div>
            
            ${facilityBookingHTML}
            
            ${request.status === 'approved' ? `
                <div class="bg-green-50 p-6 rounded-lg">
                    <h4 class="text-lg font-bold text-green-800 mb-3"><i class="fas fa-comment-dots mr-2"></i>LINE確認メッセージ</h4>
                    <div class="bg-white p-4 rounded-lg border-2 border-green-300 mb-4">
                        <pre id="lineMessage_${request.id}" class="whitespace-pre-wrap text-sm text-gray-700">${generateLineMessage(request)}</pre>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="copyLineMessage('${request.id}')" class="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition">
                            <i class="fas fa-copy mr-2"></i>コピーする
                        </button>
                        <button onclick="addToGoogleCalendar('${request.id}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                            <i class="fab fa-google mr-2"></i>Googleカレンダーに追加
                        </button>
                    </div>
                </div>
            ` : ''}
            
            ${request.status === 'pending' ? `
                <div class="grid grid-cols-3 gap-4">
                    <button onclick="approveRequest('${request.id}')" class="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                        <i class="fas fa-check mr-2"></i>承認
                    </button>
                    <button onclick="proposeAlternative('${request.id}')" class="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                        <i class="fas fa-calendar-alt mr-2"></i>別日提案
                    </button>
                    <button onclick="rejectRequest('${request.id}')" class="bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
                        <i class="fas fa-times mr-2"></i>却下
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

// LINE確認メッセージを生成
function generateLineMessage(request) {
    const startTime = new Date(request.start_time);
    const endTime = new Date(startTime.getTime() + request.duration_minutes * 60000);
    
    const dateStr = startTime.toLocaleDateString('ja-JP', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
    });
    const startTimeStr = startTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const endTimeStr = endTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `${request.customer_name} 様

${dateStr} ${startTimeStr}〜${endTimeStr}のレッスン予約を承りました✅

📍会場：${request.facility?.name || '未定'}
💰料金：${formatCurrency(request.coach_fee)}
👥人数：${request.participants}名

当日よろしくお願いします！🏓`;
}

// LINEメッセージをコピー
function copyLineMessage(requestId) {
    const message = document.getElementById(`lineMessage_${requestId}`).textContent;
    navigator.clipboard.writeText(message).then(() => {
        showToast('LINEメッセージをコピーしました', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('コピーに失敗しました', 'error');
    });
}

// 施設予約完了をマーク
async function markFacilityBooked(requestId, isBooked) {
    try {
        // 後で実装：DBに施設予約完了フラグを保存
        showToast(isBooked ? '施設予約を完了としてマークしました' : 'マークを解除しました', 'success');
    } catch (error) {
        console.error('Error marking facility booked:', error);
        showToast('保存に失敗しました', 'error');
    }
}

// 予約を承認
async function approveRequest(requestId) {
    try {
        const { error } = await supabase
            .from('lesson_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showToast('予約を承認しました', 'success');
        await loadRequests();
        closeModal('requestDetailModal');
        
    } catch (error) {
        console.error('Error approving request:', error);
        showToast('承認に失敗しました', 'error');
    }
}

// 予約を却下
async function rejectRequest(requestId) {
    const reason = prompt('却下理由を入力してください（任意）');
    
    try {
        const { error } = await supabase
            .from('lesson_requests')
            .update({ 
                status: 'rejected', 
                rejection_reason: reason,
                updated_at: new Date().toISOString() 
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showToast('予約を却下しました', 'success');
        await loadRequests();
        closeModal('requestDetailModal');
        
    } catch (error) {
        console.error('Error rejecting request:', error);
        showToast('却下に失敗しました', 'error');
    }
}

// 別日提案
async function proposeAlternative(requestId) {
    // 後で実装
    showToast('別日提案機能は開発中です', 'info');
}

// Googleカレンダーに追加
function addToGoogleCalendar(requestId) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    const startTime = new Date(request.start_time);
    const endTime = new Date(startTime.getTime() + request.duration_minutes * 60000);
    
    const title = `レッスン - ${request.customer_name}`;
    const description = `参加人数: ${request.participants}名\n料金: ${formatCurrency(request.coach_fee)}`;
    const location = request.facility?.name || '';
    
    const startStr = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    
    window.open(url, '_blank');
}

// 施設を読み込み
async function loadFacilities() {
    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        facilities = data || [];
        displayFacilities();
        
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

// 施設を表示
function displayFacilities() {
    const facilitiesList = document.getElementById('facilitiesList');
    if (!facilitiesList) return;
    
    facilitiesList.innerHTML = '';
    
    if (facilities.length === 0) {
        facilitiesList.innerHTML = '<p class="text-gray-500 text-center py-8">施設が登録されていません</p>';
        return;
    }
    
    facilities.forEach(facility => {
        const card = document.createElement('div');
        card.className = 'bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${facility.name}</h3>
                    <p class="text-gray-600 mb-2">${facility.address || '住所未登録'}</p>
                    <div class="flex space-x-4 text-sm">
                        ${facility.phone ? `<span><i class="fas fa-phone text-blue-500 mr-1"></i>${facility.phone}</span>` : ''}
                        ${facility.booking_method ? `<span><i class="fas fa-tag text-green-500 mr-1"></i>${facility.booking_method === 'phone' ? '電話予約' : facility.booking_method === 'web' ? 'Web予約' : '電話/Web予約'}</span>` : ''}
                    </div>
                </div>
                <button onclick="editFacility('${facility.id}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        facilitiesList.appendChild(card);
    });
}

// 統計を更新
async function updateStats() {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // 新着申請数
        const pendingRequests = requests.filter(r => r.status === 'pending');
        document.getElementById('pendingCount').textContent = pendingRequests.length;
        
        // 今月の承認数
        const approvedThisMonth = requests.filter(r => 
            r.status === 'approved' && 
            new Date(r.updated_at) >= new Date(firstDayOfMonth)
        );
        document.getElementById('approvedCount').textContent = approvedThisMonth.length;
        
        // 今月の売上
        const monthlyRevenue = approvedThisMonth.reduce((sum, r) => sum + (r.coach_fee || 0), 0);
        document.getElementById('monthlyRevenue').textContent = formatCurrency(monthlyRevenue);
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// 予約申請を更新
async function refreshRequests() {
    showToast('更新中...', 'info');
    await loadRequests();
    showToast('更新しました', 'success');
}

// タブ切り替え
function switchTab(tabName) {
    // タブボタンのアクティブ状態を変更
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
    
    // タブコンテンツの表示/非表示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
}

// モーダルを閉じる
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
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
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// その他の関数（showAddEventModal, showAddFacilityModal, editFacilityなど）は後で実装
function showAddEventModal() {
    showToast('予定追加機能は開発中です', 'info');
}

function showAddFacilityModal() {
    showToast('施設追加機能は開発中です', 'info');
}

function editFacility(facilityId) {
    showToast('施設編集機能は開発中です', 'info');
}
