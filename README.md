# 新潟卓球ラボ - 個人レッスン予約管理システム

新潟のフリーランス卓球コーチ「ともき」さんのための完全自動化レッスン予約管理システムです。

## 🎯 主要機能

### 顧客向け機能（booking.html）
- ✅ **2つの予約パターン**
  - パターンA: 施設を選んで空き時間を確認
  - パターンB: 希望日時を選んで対応可能な施設を確認
- ✅ **Google Maps Distance Matrix API連携**
  - コーチの前後の予定から移動時間を自動計算
  - 移動時間的に到達可能な施設のみ表示
- ✅ **リアルタイム空き状況確認**
  - コーチのスケジュールと照合
  - 月曜日（定休日）の自動チェック
- ✅ **自動料金計算**
  - ジュニア/社会人別料金
  - 個人/グループレッスン別料金
  - 参加人数に応じた料金計算
- ✅ **完全レスポンシブデザイン**

### 管理者向け機能（admin.html）
- ✅ **Supabase認証**によるセキュアなログイン
- ✅ **ダッシュボード統計**
  - 新着申請数
  - 今月の承認数
  - 今月の売上
- ✅ **予約申請管理**
  - 申請一覧表示
  - ワンクリック承認/却下
  - 詳細確認モーダル
- ✅ **Google Calendar API自動連携**
  - 承認時に自動でGoogleカレンダーに予定追加
  - 2時間前リマインダー自動設定
  - レッスン詳細を自動記載
- ✅ **LINE通知メッセージ自動生成**
  - 承認時にコピー可能なLINEメッセージを自動生成
  - お客様情報、日時、施設、料金を自動記載
- ✅ **施設予約サポート**
  - 電話番号・予約URL自動表示
  - 施設予約完了チェック機能
- ✅ **プライベート予定管理**
  - ラボ出稽古、家族、自主練などの予定追加
  - 追加した予定は自動でブロック
- ✅ **施設マスタ管理**
  - 施設の追加・編集・削除
  - 住所、電話番号、予約URL管理

## 🛠️ 技術スタック

### フロントエンド
- HTML5 + CSS3
- JavaScript (Vanilla)
- Font Awesome 6.4.0
- 完全自己完結型（全CSS/JSをHTMLに埋め込み）

### バックエンド/データベース
- Supabase (PostgreSQL)
  - Row Level Security (RLS) 有効
  - リアルタイムデータ同期

### 外部API
- **Google Maps Distance Matrix API**
  - 移動時間計算
  - APIキー: `AIzaSyBM0HaVsfDpQtSqDiHI1cBo3hh-kG6UYpU`
- **Google Calendar API**
  - 予定の自動登録
  - 2時間前リマインダー設定
  - OAuth Client ID: `279588794018-s0o2gh9rk2mkl8lhjldon7bn5o41pl6h.apps.googleusercontent.com`

### デプロイ
- Vercel (推奨)
- GitHub Pages
- その他静的ホスティング

## 📦 セットアップ手順

### 1. Supabaseプロジェクト設定

#### 1.1 データベース作成
1. [Supabase](https://supabase.com)にログイン
2. 既存プロジェクトを使用: `https://lwbysesbbehholrojonc.supabase.co`
3. SQLエディタを開く
4. `supabase-schema.sql`の内容を実行

#### 1.2 管理者ユーザー作成
1. Supabase Dashboard → Authentication → Users
2. 「Add user」→「Create new user」
3. Email: `niigata.ttlabo@icloud.com`（または任意）
4. Password: 任意の強力なパスワード
5. **「Auto Confirm User」にチェック**
6. 「Create User」

### 2. Google Cloud設定

#### 2.1 Google Maps Distance Matrix API
✅ **設定済み**
- APIキー: `AIzaSyBM0HaVsfDpQtSqDiHI1cBo3hh-kG6UYpU`
- Distance Matrix API: 有効

#### 2.2 Google Calendar API
✅ **設定済み**
- OAuth Client ID: `279588794018-s0o2gh9rk2mkl8lhjldon7bn5o41pl6h.apps.googleusercontent.com`
- 承認済みJavaScript生成元: `https://ttlabo-lesson-booking.vercel.app`
- Calendar API: 有効

### 3. デプロイ

#### GitHub経由でVercelにデプロイ

1. **GitHubリポジトリ作成**
   ```
   リポジトリ名: ttlabo-lesson-booking
   可視性: Private
   ```

2. **ファイルアップロード**
   - `index.html`
   - `booking.html`
   - `admin.html`
   
   ⚠️ **重要**: ルートディレクトリに直接配置

3. **Vercelにデプロイ**
   1. [Vercel](https://vercel.com)にログイン
   2. 「New Project」→ GitHubリポジトリを選択
   3. 「Deploy」クリック
   4. 自動デプロイ完了

4. **デプロイURL**
   - `https://ttlabo-lesson-booking.vercel.app`

### 4. 初回起動

#### 4.1 管理画面にログイン
1. `https://ttlabo-lesson-booking.vercel.app/admin.html`を開く
2. Supabaseで作成したメール・パスワードでログイン

#### 4.2 Googleカレンダー連携
1. 管理画面右上の「Googleカレンダー連携」ボタンをクリック
2. Googleアカウントでログイン・許可
3. 「連携しました」と表示されればOK

#### 4.3 施設マスタ登録
1. 「施設マスタ」タブを開く
2. 「施設を追加」ボタンをクリック
3. 施設情報を入力（サンプルデータが既に登録済み）

## 📱 使い方

### 顧客側（予約申請）

1. **トップページ**
   - `https://ttlabo-lesson-booking.vercel.app`
   - 「個人レッスン予約」カードをクリック

2. **予約パターン選択**
   - **パターンA（施設から選ぶ）**
     1. 施設を選択
     2. 希望日を選択
     3. 空き時間スロットが表示される（緑=空き、グレー=予約済み）
     4. 時間をクリック
   
   - **パターンB（日時から選ぶ）**
     1. 希望日を選択
     2. 希望開始時刻を選択
     3. レッスン時間を選択
     4. 移動時間的に対応可能な施設のみ表示される

3. **お客様情報入力**
   - 名前、区分（ジュニア/社会人）、レッスン種別、参加人数など
   - 料金が自動計算される

4. **予約申請送信**
   - 「予約を申請する」ボタンをクリック
   - コーチからの確定連絡を待つ

### 管理者側（予約管理）

1. **ログイン**
   - `https://ttlabo-lesson-booking.vercel.app/admin.html`
   - Supabaseで作成したメール・パスワードでログイン

2. **予約申請確認**
   - 「予約申請」タブで新着申請を確認
   - 詳細ボタンで内容確認

3. **承認処理**
   - 「承認」ボタンをクリック
   - 自動的に以下が実行される:
     - ✅ Googleカレンダーに予定追加（2時間前リマインダー付き）
     - ✅ LINEメッセージ自動生成（コピー可能）
   
4. **LINEでお客様に連絡**
   - 生成されたメッセージをコピー
   - LINEでお客様に送信

5. **施設予約**
   - 「コーチが予約」の場合、表示される電話番号・URLから予約
   - 予約完了後、チェックボックスをクリック

6. **プライベート予定管理**
   - 「予定管理」タブを開く
   - 「プライベート予定を追加」ボタンから追加
   - ラボ出稽古、家族、自主練などのカテゴリを選択

## 💰 料金体系

### 個人レッスン（1〜4名）

#### ジュニア（中学生以下）
| 人数 | 1時間あたり |
|------|------------|
| 1名 | ¥2,500 |
| 2名 | ¥1,500/人 (¥3,000) |
| 3名 | ¥1,200/人 (¥3,600) |
| 4名 | ¥1,000/人 (¥4,000) |

#### 社会人（高校生以上）
| 人数 | 1時間あたり |
|------|------------|
| 1名 | ¥3,000 |
| 2名 | ¥1,750/人 (¥3,500) |
| 3名 | ¥1,300/人 (¥3,900) |
| 4名 | ¥1,150/人 (¥4,600) |

### グループレッスン
- ¥2,200 / 1.5時間

※施設利用料は別途必要（施設・日により異なる）

## 🔒 セキュリティ

- ✅ Supabase Row Level Security (RLS) 有効
- ✅ 認証済みユーザーのみ管理機能にアクセス可能
- ✅ 予約申請は誰でも送信可能（顧客向け）
- ✅ Google OAuth 2.0によるカレンダーAPI認証

## 📊 データ構造

### テーブル

#### `facilities` - 施設マスタ
- `id`: UUID (主キー)
- `name`: 施設名
- `address`: 住所（Google Maps APIで使用）
- `phone`: 電話番号
- `booking_url`: 予約URL
- `booking_method`: 予約方法（phone/web/both）
- `notes`: 備考
- `created_at`: 作成日時

#### `lesson_requests` - レッスン申請
- `id`: UUID (主キー)
- `customer_name`: お客様名
- `customer_type`: 区分（junior/adult）
- `lesson_type`: レッスン種別（individual/group）
- `facility_id`: 施設ID（外部キー）
- `start_time`: 開始日時
- `duration_minutes`: 時間（分）
- `participants`: 参加人数
- `facility_booking_by`: 施設予約担当（customer/coach）
- `coach_fee`: コーチ料金
- `status`: ステータス（pending/approved/rejected）
- `notes`: 備考
- `calendar_event_id`: Googleカレンダーイベント ID
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### `blocked_times` - ブロック時間（プライベート予定）
- `id`: UUID (主キー)
- `title`: タイトル
- `category`: カテゴリ（lab/family/personal/other）
- `start_time`: 開始日時
- `end_time`: 終了日時
- `notes`: 備考
- `created_at`: 作成日時

## 🚀 今後の拡張予定

### 未実装機能
- ❌ 卓球用品卸売管理
  - Rallys、Rally ace、Pandaniの3社
  - 在庫管理
  - 発注管理
- ❌ 大会管理システム
  - 大会要項AI解析
  - Googleフォーム自動生成
  - 申込書自動作成
  - 大会主催への自動送信

### 改善予定
- [ ] LINE Messaging API直接連携
- [ ] 自動キャンセル機能
- [ ] 定期レッスン自動予約
- [ ] 売上レポート詳細化
- [ ] お客様向けマイページ
- [ ] 支払い管理機能

## 🛟 トラブルシューティング

### ログインできない
1. Supabaseでユーザーが作成されているか確認
2. 「Auto Confirm User」にチェックが入っているか確認
3. パスワードが正しいか確認

### Googleカレンダー連携できない
1. OAuth Client IDが正しく設定されているか確認
2. 承認済みJavaScript生成元にVercel URLが登録されているか確認
3. Calendar APIが有効化されているか確認

### 移動時間が計算されない
1. 施設マスタに住所が登録されているか確認
2. Google Maps Distance Matrix APIが有効化されているか確認
3. ブラウザのコンソールでエラーを確認

### 施設が表示されない
1. Supabaseで施設マスタにデータが登録されているか確認
2. RLSポリシーが正しく設定されているか確認

## 📞 サポート

問題が発生した場合は、以下を確認してください:
1. ブラウザのコンソール（F12）でエラーメッセージを確認
2. Supabaseダッシュボードでログを確認
3. Google Cloud Consoleで API使用状況を確認

---

## 📄 ライセンス

© 2026 新潟卓球ラボ - All Rights Reserved

このシステムは新潟卓球ラボ専用に開発されたものです。
