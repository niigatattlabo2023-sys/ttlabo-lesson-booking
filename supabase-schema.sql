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

-- ブロック時間テーブル（プライベート予定）
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  student_name TEXT,
  facility_id UUID REFERENCES facilities(id),
  participants INTEGER,
  customer_type TEXT,
  lesson_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レッスン申請テーブル
CREATE TABLE IF NOT EXISTS lesson_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  facility_id UUID REFERENCES facilities(id),
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
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;

-- 施設テーブルのポリシー
CREATE POLICY "facilities_select_all" ON facilities FOR SELECT USING (true);
CREATE POLICY "facilities_insert_auth" ON facilities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "facilities_update_auth" ON facilities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "facilities_delete_auth" ON facilities FOR DELETE USING (auth.role() = 'authenticated');

-- レッスン申請テーブルのポリシー
CREATE POLICY "requests_insert_all" ON lesson_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "requests_select_auth" ON lesson_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "requests_update_auth" ON lesson_requests FOR UPDATE USING (auth.role() = 'authenticated');

-- ブロック時間テーブルのポリシー
CREATE POLICY "blocked_all_auth" ON blocked_times FOR ALL USING (auth.role() = 'authenticated');

-- インデックス作成
CREATE INDEX idx_lesson_requests_status ON lesson_requests(status);
CREATE INDEX idx_lesson_requests_start_time ON lesson_requests(start_time);
CREATE INDEX idx_blocked_times_start_time ON blocked_times(start_time);

-- サンプルデータ挿入（オプション）
INSERT INTO facilities (name, address, phone, booking_url, booking_method) VALUES
('亀田総合体育館', '新潟市江南区茜ケ丘7-1', '025-382-5550', 'https://www.kameda-sc.jp/', 'both'),
('新潟市体育館', '新潟市中央区一番堀通町1-1', '025-244-7811', NULL, 'phone'),
('鳥屋野総合体育館', '新潟市中央区神道寺南2-3-36', '025-286-1080', NULL, 'phone'),
('西川総合体育館', '新潟市西蒲区曽根1090', '0256-88-2311', NULL, 'phone'),
('豊栄体育センター', '新潟市北区白新町3-2-12', '025-387-4008', NULL, 'phone')
ON CONFLICT DO NOTHING;
