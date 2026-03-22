# TTラボ管理画面（大会案内管理機能追加版）

## 📋 概要

新潟卓球ラボの業務管理システム。レッスン予約管理、スケジュール管理、施設管理、そして**大会案内管理機能**を統合した管理画面です。

## 🎯 主な機能

### 既存機能
1. **📊 ダッシュボード** - 予約状況の統計表示
2. **📋 予約管理** - レッスン予約の承認・却下
3. **🗓️ スケジュール管理** - ブロック時間の設定
4. **🔁 定期予約** - 定期的なブロック設定
5. **📍 施設管理** - 施設情報の管理
6. **🛒 物販管理** - 準備中

### 🆕 新機能：大会案内管理

#### フロー
1. **📤 STEP 1: ファイルアップロード**
   - 大会要項PDF
   - 申込書（PDF/Excel/Word）

2. **🤖 STEP 2: AI解析（Gemini API）**
   - 大会名
   - 開催日時
   - 会場
   - 種目
   - 参加費
   - 実際の申込締切日
   - → フォームで内容を確認・編集

3. **📝 STEP 3: Googleフォーム自動生成**
   - フォーム説明文を自動生成
     - 締切日（実際の締切の5日前）
     - 大会情報
     - 大会要項PDFリンク
     - 回答状況スプレッドシートリンク
   - 質問項目を自動生成
     - 選手氏名
     - 学年
     - 参加種目
     - 保護者氏名
     - 緊急連絡先
     - メールアドレス

4. **💬 STEP 4: LINE案内文生成 & カレンダー登録**
   - LINE案内文を自動生成
     - `〆切 ○月○日（曜日）【大会名】 https://forms.gle/xxxxx`
   - Googleカレンダーに締切タスクを追加
     - 実際の締切日の5日前に終日タスク

5. **💾 保存**
   - Supabase `tournaments` テーブルに保存
   - 大会一覧で管理

---

## 🛠️ 技術スタック

- **Frontend**: HTML + JavaScript（Vanilla）
- **Backend**: Supabase（PostgreSQL）
- **AI**: Gemini API（情報抽出）
- **Calendar**: Google Calendar API
- **Forms**: Google Forms（手動作成 + 自動案内）

---

## 📊 データベース構造

### `tournaments` テーブル

| カラム名 | 型 | 説明 |
|---------|---|------|
| `id` | UUID | 主キー |
| `name` | TEXT | 大会名 |
| `event_date` | DATE | 開催日 |
| `event_time` | TIME | 開催時刻 |
| `venue` | TEXT | 会場 |
| `fee` | TEXT | 参加費 |
| `real_deadline` | DATE | 実際の申込締切日 |
| `form_deadline` | DATE | フォーム締切日（実際の5日前） |
| `categories` | TEXT | 種目（カンマ区切り） |
| `description` | TEXT | 大会概要 |
| `pdf_url` | TEXT | 大会要項PDFのURL |
| `gform_url` | TEXT | GoogleフォームURL |
| `sheet_url` | TEXT | 回答スプレッドシートURL |
| `created_at` | TIMESTAMP | 作成日時 |

---

## 🚀 セットアップ

### 1. Supabaseテーブル作成

```sql
CREATE TABLE tournaments (
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
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Gemini API キーの設定

`admin.html` の以下の行を編集：

```javascript
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // 実際のAPIキーに置き換え
```

### 3. Google Calendar API 連携

- 右上の「Gカレンダー連携」ボタンをクリック
- Googleアカウントでログイン
- カレンダーアクセスを許可

---

## 📝 使い方

### 大会案内の作成

1. **サイドバー** → **🏆 大会案内ツール** をクリック
2. **STEP 1**: 大会要項PDFと申込書をアップロード
3. **「🤖 AI解析を開始」** ボタンをクリック
4. **STEP 2**: AI解析結果を確認・編集
5. **「📝 STEP 3へ進む」** をクリック
6. **STEP 3**: 生成されたフォーム説明文と質問項目をコピー
   - Google Forms で新規フォーム作成
   - 説明文と質問を貼り付け
   - フォームURLとスプレッドシートURLを入力
7. **「💬 STEP 4へ進む」** をクリック
8. **STEP 4**: LINE案内文をコピー
   - LINEグループに送信
   - **「📅 Googleカレンダーに締切タスクを追加」** をクリック
9. **「💾 大会情報を保存して完了」** をクリック

---

## 🔧 TODO（将来の拡張）

### 大会案内機能の改善

- [ ] **実際のGemini API連携**（現在はダミーデータ）
- [ ] **ファイルのbase64エンコード**（Gemini APIへの送信）
- [ ] **Google Forms API連携**（フォーム自動作成）
- [ ] **Google Drive API連携**（PDF自動アップロード）
- [ ] **複数ファイル形式対応の強化**
  - Excel（.xlsx）の解析精度向上
  - Word（.docx）の解析精度向上
  - Googleスプレッドシート対応
  - Googleドキュメント対応

### その他の機能

- [ ] 物販管理機能の実装
- [ ] メール自動送信
- [ ] LINE Bot 連携

---

## 🌐 デプロイ

### Vercel へのデプロイ

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd <your-repo-name>

# Vercel CLI をインストール
npm i -g vercel

# デプロイ
vercel
```

### 環境変数の設定（Vercel）

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`

---

## 📞 サポート

問題や質問がある場合は、開発者に連絡してください。

---

## 📄 ライセンス

Proprietary - 新潟卓球ラボ専用
