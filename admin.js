// Supabase設定
const SUPABASE_URL = 'https://lwbysesbbehholrojonc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YnlzZXNiYmVoaG9scm9qb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjcxNjMsImV4cCI6MjA4ODAwMzE2M30.2NwutCuF7mODQ3bZUlDumn-wx2zHLWR_gP1tjHQuNqg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// グローバル変数
let currentUser = null;
let requests = [];
let facilities = [];
let blockedTimes = [];
let currentRequestId = null;

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    // 認証チェック
    await checkAuth();
    
    // ログインフォーム
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // ログアウトボタン
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // タブ切り替え
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // 施設追加ボタン
    document.getElementById('add-facility-btn').addEventListener('click', openFacilityModal);
    document.getElementById('facility-form').addEventListener('submit', handleFacilitySave);
    
    // 予定追加ボタン
    document.getElementById('add-event-btn').addEventListener('click', openEventModal);
    document.getElementById('event-form').addEventListener('submit', handleEventSave);
});

// 認証チェック
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        currentUser = user;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        await loadDashboard();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('admin-content').style.display = 'none';
    }
}

// ログイン処理
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showToast('ログインしました', 'success');
        await checkAuth();
    } catch (error) {
        console.error('ログインエラー:', error);
        showToast('ログインに失敗しました。メールアドレスとパスワードを確認してください。', 'error');
    }
}

// ログアウト処理
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('admin-content').style.display = 'none';
    showToast('ログアウトしました', 'success');
}

// ダッシュボード読み込み
async function loadDashboard() {
    await Promise.all([
        loadRequests(),
        loadFacilities(),
        loadBlockedTimes(),
        updateStats()
    ]);
}

// 統計を更新
async function updateStats() {
    try {
        // 新着申請数
        const { count: pendingCount } = await supabase
            .from('lesson_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        document.getElementById('stat-pending').textContent = pendingCount || 0;
        
        // 今月の承認数
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const { count: approvedCount } = await supabase
            .from('lesson_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved')
            .gte('created_at', startOfMonth.toISOString());
        
        document.getElementById('stat-approved').textContent = approvedCount || 0;
        
        // 今月の売上
        const { data: approvedRequests } = await supabase
            .from('lesson_requests')
            .select('coach_fee')
            .eq('status', 'approved')
            .gte('created_at', startOfMonth.toISOString());
        
        const totalRevenue = (approvedRequests || []).reduce((sum, req) => sum + (req.coach_fee || 0), 0);
        document.getElementById('stat-revenue').textContent = window.PricingUtils.formatPrice(totalRevenue);
        
    } catch (error) {
        console.error('統計取得エラー:', error);
    }
}

// 予約申請を読み込み
async function loadRequests() {
    try {
        const { data, error } = await supabase
            .from('lesson_requests')
            .select('*, facilities(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        requests = data || [];
        renderRequests();
    } catch (error) {
        console.error('申請読み込みエラー:', error);
        showToast('申請の読み込みに失敗しました', 'error');
    }
}

// 予約申請を表示
function renderRequests() {
    const container = document.getElementById('requests-list');
    container.innerHTML = '';
    
    if (requests.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">予約申請はありません</p>';
        return;
    }
    
    requests.forEach(request => {
        const card = document.createElement('div');
        card.className = 'request-card';
        
        const startDate = new Date(request.start_time);
        const endDate = new Date(startDate.getTime() + request.duration_minutes * 60000);
        
        const statusText = {
            pending: '承認待ち',
            approved: '承認済み',
            rejected: '却下'
        };
        
        const bookingByText = request.facility_booking_by === 'customer' ? '顧客が予約' : 'コーチが予約';
        
        card.innerHTML = `
            <div class="request-header">
                <h4 style="color: var(--secondary-color);">${request.customer_name} 様</h4>
                <span class="request-badge ${request.status}">${statusText[request.status]}</span>
            </div>
            <div class="request-info">
                <div class="request-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${request.facilities?.name || '施設不明'}</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-clock"></i>
                    <span>${startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-users"></i>
                    <span>${request.participants}名（${request.customer_type === 'adult' ? '社会人' : 'ジュニア'}・${request.lesson_type === 'individual' ? '個人' : 'グループ'}）</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-phone"></i>
                    <span>${bookingByText}</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-yen-sign"></i>
                    <span>${window.PricingUtils.formatPrice(request.coach_fee)}</span>
                </div>
            </div>
            ${request.notes ? `<div style="margin-top: 10px; padding: 10px; background: var(--light-bg); border-radius: 6px;"><strong>備考:</strong> ${request.notes}</div>` : ''}
            <div class="request-actions">
                ${request.status === 'pending' ? `
                    <button class="btn btn-success btn-small" onclick="approveRequest('${request.id}')">
                        <i class="fas fa-check"></i> 承認
                    </button>
                    <button class="btn btn-danger btn-small" onclick="rejectRequest('${request.id}')">
                        <i class="fas fa-times"></i> 却下
                    </button>
                ` : ''}
                ${request.status === 'approved' && request.facility_booking_by === 'coach' && !request.facility_booked ? `
                    <button class="btn btn-secondary btn-small" onclick="markFacilityBooked('${request.id}')">
                        <i class="fas fa-check-double"></i> 施設予約完了
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// 予約を承認
async function approveRequest(requestId) {
    currentRequestId = requestId;
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return;
    
    const startDate = new Date(request.start_time);
    const endDate = new Date(startDate.getTime() + request.duration_minutes * 60000);
    
    const facilityInfo = request.facilities;
    const needsBooking = request.facility_booking_by === 'coach';
    
    const lineMessage = `【レッスン予約承認】

${request.customer_name} 様

お申し込みいただいたレッスンを承認いたしました。

📍 施設: ${facilityInfo?.name || '未設定'}
📅 日時: ${startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
⏰ 時間: ${startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
👥 人数: ${request.participants}名
💰 コーチ料金: ${window.PricingUtils.formatPrice(request.coach_fee)}

${needsBooking ? '※施設予約はこちらで行います。' : '※施設予約はご自身でお願いいたします。'}

施設利用料は当日ご確認ください。
よろしくお願いいたします。`;
    
    document.getElementById('action-modal-title').textContent = '予約を承認';
    document.getElementById('action-modal-body').innerHTML = `
        <p style="margin-bottom: 20px;">この予約申請を承認します。以下のLINEメッセージをコピーしてお客様に送信してください。</p>
        
        ${needsBooking ? `
        <div style="background: #FFF3CD; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--accent-color);">
            <h4 style="margin-bottom: 10px;"><i class="fas fa-phone"></i> 施設予約が必要です</h4>
            <p style="margin-bottom: 10px;"><strong>${facilityInfo?.name || '施設名未設定'}</strong></p>
            ${facilityInfo?.phone ? `<p><i class="fas fa-phone"></i> <a href="tel:${facilityInfo.phone}">${facilityInfo.phone}</a></p>` : ''}
            ${facilityInfo?.booking_url ? `<p><i class="fas fa-globe"></i> <a href="${facilityInfo.booking_url}" target="_blank">予約ページを開く</a></p>` : ''}
        </div>
        ` : ''}
        
        <div class="line-message-box">
            <button class="copy-btn" onclick="copyLineMessage()">
                <i class="fas fa-copy"></i> コピー
            </button>
            <pre id="line-message" style="white-space: pre-wrap; margin: 0; font-size: 14px;">${lineMessage}</pre>
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-success" style="flex: 1;" onclick="confirmApprove()">
                <i class="fas fa-check"></i> 承認を確定
            </button>
            <button class="btn btn-outline" onclick="closeActionModal()">
                キャンセル
            </button>
        </div>
    `;
    
    document.getElementById('action-modal').classList.add('active');
}

// 承認を確定
async function confirmApprove() {
    try {
        const request = requests.find(r => r.id === currentRequestId);
        
        // ステータスを更新
        const { error: updateError } = await supabase
            .from('lesson_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', currentRequestId);
        
        if (updateError) throw updateError;
        
        // blocked_timesにも追加
        const startTime = new Date(request.start_time);
        const endTime = new Date(startTime.getTime() + request.duration_minutes * 60000);
        
        const { error: blockError } = await supabase
            .from('blocked_times')
            .insert([{
                title: `${request.customer_name} 様のレッスン`,
                category: 'lesson',
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                student_name: request.customer_name,
                facility_id: request.facility_id,
                participants: request.participants,
                customer_type: request.customer_type,
                lesson_type: request.lesson_type
            }]);
        
        if (blockError) throw blockError;
        
        showToast('予約を承認しました', 'success');
        closeActionModal();
        await loadDashboard();
    } catch (error) {
        console.error('承認エラー:', error);
        showToast('承認に失敗しました', 'error');
    }
}

// 予約を却下
async function rejectRequest(requestId) {
    if (!confirm('この予約申請を却下しますか？')) return;
    
    try {
        const { error } = await supabase
            .from('lesson_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showToast('予約を却下しました', 'success');
        await loadDashboard();
    } catch (error) {
        console.error('却下エラー:', error);
        showToast('却下に失敗しました', 'error');
    }
}

// 施設予約完了をマーク
async function markFacilityBooked(requestId) {
    try {
        const { error } = await supabase
            .from('lesson_requests')
            .update({ facility_booked: true, updated_at: new Date().toISOString() })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showToast('施設予約完了としてマークしました', 'success');
        await loadRequests();
    } catch (error) {
        console.error('更新エラー:', error);
        showToast('更新に失敗しました', 'error');
    }
}

// LINEメッセージをコピー
function copyLineMessage() {
    const messageText = document.getElementById('line-message').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        showToast('コピーしました', 'success');
    });
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
        renderFacilities();
    } catch (error) {
        console.error('施設読み込みエラー:', error);
    }
}

// 施設リストを表示
function renderFacilities() {
    const container = document.getElementById('facilities-list');
    container.innerHTML = '';
    
    if (facilities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">施設がまだ登録されていません</p>';
        return;
    }
    
    facilities.forEach(facility => {
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.innerHTML = `
            <h4><i class="fas fa-map-marker-alt"></i> ${facility.name}</h4>
            <p><i class="fas fa-map"></i> ${facility.address || '住所未登録'}</p>
            ${facility.phone ? `<p><i class="fas fa-phone"></i> ${facility.phone}</p>` : ''}
            ${facility.booking_url ? `<p><i class="fas fa-globe"></i> <a href="${facility.booking_url}" target="_blank">予約ページ</a></p>` : ''}
            <p><i class="fas fa-info-circle"></i> 予約方法: ${getFacilityMethodText(facility.booking_method)}</p>
            ${facility.notes ? `<p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">${facility.notes}</p>` : ''}
            <div class="facility-actions">
                <button class="btn btn-primary btn-small" onclick="editFacility('${facility.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteFacility('${facility.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function getFacilityMethodText(method) {
    const methods = {
        phone: '電話予約',
        web: 'Web予約',
        both: '電話・Web両方'
    };
    return methods[method] || '未設定';
}

// ブロック時間を読み込み
async function loadBlockedTimes() {
    try {
        const { data, error } = await supabase
            .from('blocked_times')
            .select('*')
            .order('start_time', { ascending: false });
        
        if (error) throw error;
        
        blockedTimes = data || [];
        renderSchedule();
    } catch (error) {
        console.error('予定読み込みエラー:', error);
    }
}

// 予定リストを表示
function renderSchedule() {
    const container = document.getElementById('schedule-list');
    container.innerHTML = '';
    
    if (blockedTimes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">予定がありません</p>';
        return;
    }
    
    const categoryNames = {
        lesson: 'レッスン',
        lab: 'ラボ出稽古',
        family: '家族',
        personal: '自主練',
        other: 'その他'
    };
    
    blockedTimes.forEach(event => {
        const card = document.createElement('div');
        card.className = 'request-card';
        
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        
        card.innerHTML = `
            <div class="request-header">
                <h4 style="color: var(--secondary-color);">${event.title}</h4>
                <span class="request-badge ${event.category === 'lesson' ? 'approved' : 'pending'}">
                    ${categoryNames[event.category] || event.category}
                </span>
            </div>
            <div class="request-info">
                <div class="request-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                </div>
                <div class="request-info-item">
                    <i class="fas fa-clock"></i>
                    <span>${startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
            ${event.category !== 'lesson' ? `
                <div style="margin-top: 10px;">
                    <button class="btn btn-danger btn-small" onclick="deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            ` : ''}
        `;
        
        container.appendChild(card);
    });
}

// タブ切り替え
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `tab-${tabName}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// 施設モーダルを開く
function openFacilityModal(facilityId = null) {
    if (facilityId) {
        const facility = facilities.find(f => f.id === facilityId);
        if (!facility) return;
        
        document.getElementById('facility-modal-title').textContent = '施設を編集';
        document.getElementById('facility-id').value = facility.id;
        document.getElementById('facility-name').value = facility.name;
        document.getElementById('facility-address').value = facility.address || '';
        document.getElementById('facility-phone').value = facility.phone || '';
        document.getElementById('facility-url').value = facility.booking_url || '';
        document.getElementById('facility-method').value = facility.booking_method || 'phone';
        document.getElementById('facility-notes').value = facility.notes || '';
    } else {
        document.getElementById('facility-modal-title').textContent = '施設を追加';
        document.getElementById('facility-form').reset();
        document.getElementById('facility-id').value = '';
    }
    
    document.getElementById('facility-modal').classList.add('active');
}

function closeFacilityModal() {
    document.getElementById('facility-modal').classList.remove('active');
}

function editFacility(facilityId) {
    openFacilityModal(facilityId);
}

// 施設を保存
async function handleFacilitySave(e) {
    e.preventDefault();
    
    const facilityId = document.getElementById('facility-id').value;
    const facilityData = {
        name: document.getElementById('facility-name').value.trim(),
        address: document.getElementById('facility-address').value.trim(),
        phone: document.getElementById('facility-phone').value.trim() || null,
        booking_url: document.getElementById('facility-url').value.trim() || null,
        booking_method: document.getElementById('facility-method').value,
        notes: document.getElementById('facility-notes').value.trim() || null
    };
    
    try {
        if (facilityId) {
            // 更新
            const { error } = await supabase
                .from('facilities')
                .update(facilityData)
                .eq('id', facilityId);
            
            if (error) throw error;
            showToast('施設を更新しました', 'success');
        } else {
            // 新規作成
            const { error } = await supabase
                .from('facilities')
                .insert([facilityData]);
            
            if (error) throw error;
            showToast('施設を追加しました', 'success');
        }
        
        closeFacilityModal();
        await loadFacilities();
    } catch (error) {
        console.error('施設保存エラー:', error);
        showToast('施設の保存に失敗しました', 'error');
    }
}

// 施設を削除
async function deleteFacility(facilityId) {
    if (!confirm('この施設を削除しますか？関連する予約申請は削除されませんが、施設情報が表示されなくなります。')) return;
    
    try {
        const { error } = await supabase
            .from('facilities')
            .delete()
            .eq('id', facilityId);
        
        if (error) throw error;
        
        showToast('施設を削除しました', 'success');
        await loadFacilities();
    } catch (error) {
        console.error('削除エラー:', error);
        showToast('施設の削除に失敗しました', 'error');
    }
}

// 予定モーダルを開く
function openEventModal() {
    document.getElementById('event-form').reset();
    document.getElementById('event-modal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

// 予定を保存
async function handleEventSave(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('event-title').value.trim(),
        category: document.getElementById('event-category').value,
        start_time: new Date(document.getElementById('event-start').value).toISOString(),
        end_time: new Date(document.getElementById('event-end').value).toISOString(),
        notes: document.getElementById('event-notes').value.trim() || null
    };
    
    try {
        const { error } = await supabase
            .from('blocked_times')
            .insert([eventData]);
        
        if (error) throw error;
        
        showToast('予定を追加しました', 'success');
        closeEventModal();
        await loadBlockedTimes();
    } catch (error) {
        console.error('予定保存エラー:', error);
        showToast('予定の保存に失敗しました', 'error');
    }
}

// 予定を削除
async function deleteEvent(eventId) {
    if (!confirm('この予定を削除しますか？')) return;
    
    try {
        const { error } = await supabase
            .from('blocked_times')
            .delete()
            .eq('id', eventId);
        
        if (error) throw error;
        
        showToast('予定を削除しました', 'success');
        await loadBlockedTimes();
    } catch (error) {
        console.error('削除エラー:', error);
        showToast('予定の削除に失敗しました', 'error');
    }
}

// アクションモーダルを閉じる
function closeActionModal() {
    document.getElementById('action-modal').classList.remove('active');
    currentRequestId = null;
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
