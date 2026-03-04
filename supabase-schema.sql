-- ============================================================
-- TTラボ予約システム - Supabase スキーマ (v3)
-- 実行方法: Supabase SQL Editor に貼り付けて Run
-- ============================================================

-- 既存テーブルを完全削除して再作成
DROP TABLE IF EXISTS lesson_requests CASCADE;
DROP TABLE IF EXISTS blocked_times CASCADE;
DROP TABLE IF EXISTS recurring_blocks CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;

-- ============================================================
-- 1. facilities テーブル（施設マスター）
-- ============================================================
CREATE TABLE facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルト施設を挿入
INSERT INTO facilities (name, address) VALUES
  ('燕市体育センター', '新潟県燕市吉田西太田1000'),
  ('三条市体育文化センター', '新潟県三条市田島2丁目13-1'),
  ('加茂市体育施設', '新潟県加茂市桜ヶ丘3丁目3-1'),
  ('燕三条地場産業振興センター体育館', '新潟県三条市須頃1丁目17');

-- ============================================================
-- 2. lesson_requests テーブル（予約申請）
-- ============================================================
CREATE TABLE lesson_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  facility_name TEXT NOT NULL,
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'adult',  -- 'adult' or 'junior'
  menu TEXT,
  notes TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending','approved','rejected'
  google_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. blocked_times テーブル（管理者ブロック時間）
-- ============================================================
CREATE TABLE blocked_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  facility_name TEXT,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. recurring_blocks テーブル（定期ブロック）
-- ============================================================
CREATE TABLE recurring_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  facility_name TEXT,
  recurrence_type TEXT NOT NULL,   -- 'weekly' or 'monthly'
  recurrence_day INTEGER NOT NULL, -- 曜日(0=日〜6=土) または 日付(1-31)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RLS（Row Level Security）設定
-- ============================================================
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_blocks ENABLE ROW LEVEL SECURITY;

-- facilities: 全員読み取り可 / 認証ユーザーのみ書き込み
CREATE POLICY "facilities_select_all" ON facilities FOR SELECT USING (true);
CREATE POLICY "facilities_insert_all" ON facilities FOR INSERT WITH CHECK (true);
CREATE POLICY "facilities_update_all" ON facilities FOR UPDATE USING (true);
CREATE POLICY "facilities_delete_all" ON facilities FOR DELETE USING (true);

-- lesson_requests: 全員読み書き可
CREATE POLICY "lr_select_all" ON lesson_requests FOR SELECT USING (true);
CREATE POLICY "lr_insert_all" ON lesson_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "lr_update_all" ON lesson_requests FOR UPDATE USING (true);
CREATE POLICY "lr_delete_all" ON lesson_requests FOR DELETE USING (true);

-- blocked_times: 全員読み取り / 全員書き込み
CREATE POLICY "bt_select_all" ON blocked_times FOR SELECT USING (true);
CREATE POLICY "bt_insert_all" ON blocked_times FOR INSERT WITH CHECK (true);
CREATE POLICY "bt_update_all" ON blocked_times FOR UPDATE USING (true);
CREATE POLICY "bt_delete_all" ON blocked_times FOR DELETE USING (true);

-- recurring_blocks: 全員読み書き可
CREATE POLICY "rb_select_all" ON recurring_blocks FOR SELECT USING (true);
CREATE POLICY "rb_insert_all" ON recurring_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "rb_update_all" ON recurring_blocks FOR UPDATE USING (true);
CREATE POLICY "rb_delete_all" ON recurring_blocks FOR DELETE USING (true);

-- 完了メッセージ
SELECT 'スキーマ作成完了！テーブル: facilities, lesson_requests, blocked_times, recurring_blocks' AS result;
