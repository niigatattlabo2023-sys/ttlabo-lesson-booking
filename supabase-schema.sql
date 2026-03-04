-- 施設マスタテーブル
CREATE TABLE IF NOT EXISTS facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    booking_url TEXT,
    booking_method TEXT DEFAULT 'phone',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ブロック済み時間テーブル（レッスン・プライベート予定など）
CREATE TABLE IF NOT EXISTS blocked_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    student_name TEXT,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    participants INTEGER,
    customer_type TEXT,
    lesson_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レッスン予約申請テーブル
CREATE TABLE IF NOT EXISTS lesson_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_type TEXT NOT NULL,
    lesson_type TEXT NOT NULL,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    participants INTEGER NOT NULL DEFAULT 1,
    facility_booking_by TEXT NOT NULL DEFAULT 'customer',
    coach_fee INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    alternative_start_time TIMESTAMPTZ,
    rejection_reason TEXT,
    facility_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) を有効化
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;

-- 施設テーブルのポリシー
-- 誰でも施設リストを閲覧可能
CREATE POLICY "facilities_select_all" ON facilities
    FOR SELECT USING (true);

-- 認証済みユーザーのみ施設を追加・更新・削除可能
CREATE POLICY "facilities_insert_auth" ON facilities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "facilities_update_auth" ON facilities
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "facilities_delete_auth" ON facilities
    FOR DELETE USING (auth.role() = 'authenticated');

-- レッスン予約申請のポリシー
-- 誰でも予約申請を作成可能
CREATE POLICY "requests_insert_all" ON lesson_requests
    FOR INSERT WITH CHECK (true);

-- 認証済みユーザーのみ申請を閲覧・更新可能
CREATE POLICY "requests_select_auth" ON lesson_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "requests_update_auth" ON lesson_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ブロック済み時間のポリシー
-- 誰でも閲覧可能（ただし詳細は隠す）
CREATE POLICY "blocked_select_all" ON blocked_times
    FOR SELECT USING (true);

-- 認証済みユーザーのみ作成・更新・削除可能
CREATE POLICY "blocked_insert_auth" ON blocked_times
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "blocked_update_auth" ON blocked_times
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "blocked_delete_auth" ON blocked_times
    FOR DELETE USING (auth.role() = 'authenticated');

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_lesson_requests_status ON lesson_requests(status);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_created_at ON lesson_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_times_start_time ON blocked_times(start_time);
CREATE INDEX IF NOT EXISTS idx_blocked_times_facility ON blocked_times(facility_id);
