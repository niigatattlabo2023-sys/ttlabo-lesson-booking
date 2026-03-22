-- tournaments テーブルに accompany カラムを追加
-- 既存のテーブルがある場合

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS accompany TEXT DEFAULT 'no';

-- 新規作成の場合（完全版）
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  venue TEXT NOT NULL,
  fee TEXT,
  real_deadline DATE NOT NULL,
  form_deadline DATE NOT NULL,
  categories TEXT,
  description TEXT,
  pdf_url TEXT,
  gform_url TEXT,
  sheet_url TEXT,
  accompany TEXT DEFAULT 'no', -- 'yes' または 'no'
  created_at TIMESTAMP DEFAULT NOW()
);

-- コメントを追加
COMMENT ON COLUMN tournaments.accompany IS '小林の帯同有無: yes=帯同する, no=帯同しない';
