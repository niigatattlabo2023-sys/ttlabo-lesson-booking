-- 新潟卓球ラボ 個人レッスン予約システム - データベーススキーマ

-- 施設マスタ
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  booking_url TEXT,
  booking_method TEXT CHECK (booking_method IN ('phone', 'web', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 施設マスタのコメント
COMMENT ON TABLE facilities IS '施設マスタ：レッスン会場の情報を管理';
COMMENT ON COLUMN facilities.name IS '施設名';
COMMENT ON COLUMN facilities.address IS '住所（Google Maps API用）';
COMMENT ON COLUMN facilities.phone IS '電話番号（施設予約サポート用）';
COMMENT ON COLUMN facilities.booking_url IS 'Web予約URL（施設予約サポート用）';
COMMENT ON COLUMN facilities.booking_method IS '予約方法（phone=電話、web=Web、both=両方）';

-- ブロック時間（プライベート予定・定期レッスン）
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('lab', 'family', 'practice', 'regular_lesson', 'other')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブロック時間のコメント
COMMENT ON TABLE blocked_times IS 'コーチのプライベート予定や定期レッスンの時間をブロック';
COMMENT ON COLUMN blocked_times.category IS 'lab=ラボ出稽古、family=家族の予定、practice=自主練、regular_lesson=定期レッスン、other=その他';
COMMENT ON COLUMN blocked_times.is_recurring IS '繰り返しフラグ（毎週同じ時間など）';
COMMENT ON COLUMN blocked_times.recurrence_rule IS '繰り返しルール（RRULE形式）';

-- 予約申請
CREATE TABLE IF NOT EXISTS lesson_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('junior', 'adult')) NOT NULL,
  lesson_type TEXT CHECK (lesson_type IN ('individual', 'group')) NOT NULL,
  facility_id UUID REFERENCES facilities(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (60, 90, 120, 150, 180)),
  participants INTEGER NOT NULL CHECK (participants BETWEEN 1 AND 4),
  facility_booking_by TEXT CHECK (facility_booking_by IN ('customer', 'coach')) NOT NULL,
  facility_booked BOOLEAN DEFAULT FALSE,
  coach_fee INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'alternative_proposed')) DEFAULT 'pending',
  notes TEXT,
  alternative_start_time TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約申請のコメント
COMMENT ON TABLE lesson_requests IS 'お客さんからのレッスン予約申請';
COMMENT ON COLUMN lesson_requests.customer_type IS 'junior=ジュニア（中学生以下）、adult=社会人';
COMMENT ON COLUMN lesson_requests.lesson_type IS 'individual=個人レッスン、group=グループレッスン';
COMMENT ON COLUMN lesson_requests.duration_minutes IS 'レッスン時間（60, 90, 120, 150, 180分）';
COMMENT ON COLUMN lesson_requests.facility_booking_by IS 'customer=お客さんが施設予約、coach=コーチが施設予約';
COMMENT ON COLUMN lesson_requests.facility_booked IS '施設予約完了フラグ（コーチが予約した場合に使用）';
COMMENT ON COLUMN lesson_requests.coach_fee IS 'コーチ料（施設利用料は含まない）';
COMMENT ON COLUMN lesson_requests.status IS 'pending=保留中、approved=承認済み、rejected=却下、cancelled=キャンセル、alternative_proposed=別日提案';

-- 管理者設定
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者設定のコメント
COMMENT ON TABLE admin_settings IS 'システム設定（Google Maps APIキーなど）';

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lesson_requests_status ON lesson_requests(status);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_start_time ON lesson_requests(start_time);
CREATE INDEX IF NOT EXISTS idx_lesson_requests_created_at ON lesson_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_times_start_time ON blocked_times(start_time);
CREATE INDEX IF NOT EXISTS idx_blocked_times_end_time ON blocked_times(end_time);

-- Row Level Security (RLS) の有効化
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー：施設マスタ
-- お客さんは読み取りのみ、認証済みユーザー（コーチ）は全操作可能
CREATE POLICY "施設は全員が閲覧可能" ON facilities
  FOR SELECT USING (true);

CREATE POLICY "施設の追加は認証済みユーザーのみ" ON facilities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "施設の更新は認証済みユーザーのみ" ON facilities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "施設の削除は認証済みユーザーのみ" ON facilities
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLSポリシー：ブロック時間
-- 認証済みユーザー（コーチ）のみ全操作可能
CREATE POLICY "ブロック時間は認証済みユーザーのみ操作可能" ON blocked_times
  FOR ALL USING (auth.role() = 'authenticated');

-- RLSポリシー：予約申請
-- お客さんは新規作成と自分の予約の閲覧のみ、認証済みユーザー（コーチ）は全操作可能
CREATE POLICY "予約申請は全員が作成可能" ON lesson_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "予約申請は全員が閲覧可能" ON lesson_requests
  FOR SELECT USING (true);

CREATE POLICY "予約申請の更新は認証済みユーザーのみ" ON lesson_requests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "予約申請の削除は認証済みユーザーのみ" ON lesson_requests
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLSポリシー：管理者設定
-- 認証済みユーザー（コーチ）のみ全操作可能
CREATE POLICY "管理者設定は認証済みユーザーのみ操作可能" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- サンプルデータ挿入（オプション）
-- 施設のサンプル
INSERT INTO facilities (name, address, phone, booking_url, booking_method) VALUES
  ('亀田総合体育館', '新潟市江南区茅野山3-1-14', '025-382-3222', 'https://example.com/booking', 'both'),
  ('新潟市東総合スポーツセンター', '新潟市東区はなみずき2-8-8', '025-272-7677', NULL, 'phone'),
  ('江南区スポーツ広場', '新潟市江南区亀田向陽2-2-14', '025-381-1222', NULL, 'phone'),
  ('中央スポーツセンター', '新潟市中央区西小針台1-21-1', '025-266-2131', 'https://example.com/chuo', 'web'),
  ('新潟市体育館', '新潟市中央区一番堀通町3-1', '025-226-2200', NULL, 'phone')
ON CONFLICT DO NOTHING;

-- 完了メッセージ
DO $$ 
BEGIN
  RAISE NOTICE '✅ データベースのセットアップが完了しました！';
  RAISE NOTICE '次のステップ: Supabase Dashboard → Authentication → Users から管理者アカウントを作成してください';
END $$;
