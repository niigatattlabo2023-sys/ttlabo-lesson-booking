-- 新潟卓球ラボ Supabase スキーマ
-- Supabase Dashboard > SQL Editor で実行してください

-- 施設テーブル
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- レッスン申請テーブル
CREATE TABLE IF NOT EXISTS lesson_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  lesson_type TEXT DEFAULT '基礎練習',
  participants INTEGER DEFAULT 1,
  notes TEXT,
  price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ブロック時間テーブル
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS有効化
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- 施設: 誰でも読める、認証済みのみ書ける
CREATE POLICY "facilities_read" ON facilities FOR SELECT USING (true);
CREATE POLICY "facilities_write" ON facilities FOR ALL USING (auth.role() = 'authenticated');

-- 申請: 誰でも読める・挿入できる、更新削除は認証済みのみ
CREATE POLICY "requests_read" ON lesson_requests FOR SELECT USING (true);
CREATE POLICY "requests_insert" ON lesson_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "requests_update" ON lesson_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "requests_delete" ON lesson_requests FOR DELETE USING (auth.role() = 'authenticated');

-- ブロック時間: 認証済みのみ全操作
CREATE POLICY "blocked_read" ON blocked_times FOR SELECT USING (true);
CREATE POLICY "blocked_write" ON blocked_times FOR ALL USING (auth.role() = 'authenticated');

-- 初期施設データ
INSERT INTO facilities (name, address, phone) VALUES
  ('燕市体育センター', '新潟県燕市吉田日之出町1-1', '0256-77-2111'),
  ('三条市体育文化センター', '新潟県三条市上須頃5765', '0256-32-3511'),
  ('加茂市体育施設', '新潟県加茂市新保古川58-1', '0256-52-0013'),
  ('燕三条地場産業振興センター体育館', '新潟県三条市須頃1-17', '0256-32-5811')
ON CONFLICT DO NOTHING;
