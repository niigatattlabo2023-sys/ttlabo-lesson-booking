# セットアップガイド

このドキュメントでは、個人レッスン予約管理システムのセットアップ手順を説明します。

## ✅ 前提条件

- Supabaseアカウント
- GitHubアカウント
- Vercelアカウント

---

## 🔧 ステップ1: Supabaseのセットアップ

### 1-1. プロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてログイン
2. "New Project" をクリック
3. プロジェクト名を入力（例: ttlabo-lesson-booking）
4. データベースパスワードを設定
5. リージョンを選択（Northeast Asia (Tokyo) 推奨）
6. "Create new project" をクリック

### 1-2. データベーステーブルの作成

1. 左メニューから "SQL Editor" をクリック
2. "New query" をクリック
3. `supabase-schema.sql` の内容を**全てコピー**して貼り付け
4. 右下の "Run" ボタンをクリック
5. "Success. No rows returned" と表示されればOK

### 1-3. 管理者ユーザーの作成

1. 左メニューから "Authentication" をクリック
2. "Users" タブを選択
3. 右上の "Add user" → "Create new user" をクリック
4. 以下を入力：
   - **Email**: あなたのメールアドレス（例: niigata.ttlabo@icloud.com）
   - **Password**: 安全なパスワード（8文字以上）
   - ✅ **"Auto Confirm User" にチェックを入れる（重要！）**
5. "Create user" をクリック

### 1-4. APIキーの確認（すでに設定済み）

現在のプロジェクトでは以下のAPIキーが使用されています：
- **Project URL**: https://lwbysesbbehholrojonc.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（設定済み）

---

## 🚀 ステップ2: GitHubへのアップロード

### 2-1. リポジトリの作成

1. [GitHub](https://github.com) にログイン
2. 右上の "+" → "New repository" をクリック
3. Repository name を入力（例: ttlabo-lesson-booking）
4. "Private" を選択（推奨）
5. "Create repository" をクリック

### 2-2. ファイルのアップロード

1. 作成されたリポジトリのページで "uploading an existing file" をクリック
2. 以下のファイル・フォルダを**全て**ドラッグ&ドロップ：
   - `index.html`
   - `booking.html`
   - `admin.html`
   - `css/` フォルダ（style.css を含む）
   - `js/` フォルダ（pricing.js, booking.js, admin.js を含む）
   - `supabase-schema.sql`
   - `README.md`
3. "Commit changes" をクリック

---

## 🌐 ステップ3: Vercelへのデプロイ

### 3-1. Vercelアカウントの作成

1. [Vercel](https://vercel.com) にアクセス
2. "Sign Up" をクリック
3. "Continue with GitHub" を選択してGitHubアカウントと連携

### 3-2. プロジェクトのインポート

1. ダッシュボードで "Add New..." → "Project" をクリック
2. "Import Git Repository" から先ほど作成したGitHubリポジトリを選択
3. "Import" をクリック
4. **環境変数の設定は不要です**（APIキーはコードに直接記述済み）
5. "Deploy" をクリック

### 3-3. デプロイ完了

- 1〜2分でデプロイが完了します
- "Visit" ボタンをクリックしてサイトを確認
- URLは `https://ttlabo-lesson-booking.vercel.app` のような形式になります

---

## ✅ ステップ4: 動作確認

### 4-1. 顧客向けページの確認

1. デプロイされたURLを開く
2. "レッスンを予約する" ボタンをクリック
3. 予約フォームが正しく表示されることを確認

### 4-2. 管理画面の確認

1. `https://your-app.vercel.app/admin.html` を開く
2. ステップ1-3で作成したメールアドレスとパスワードでログイン
3. ダッシュボードが表示されることを確認

### 4-3. 施設の登録

1. 管理画面の「施設マスタ」タブをクリック
2. "施設を追加" ボタンをクリック
3. 施設情報を入力（例：亀田総合体育館）
   - 施設名: 亀田総合体育館
   - 住所: 新潟市江南区茅野山3-1-14
   - 電話番号: 025-382-5700
   - 予約方法: 電話予約
4. "保存" をクリック
5. 同様に他の施設も登録

---

## 🎉 完了！

これでセットアップは完了です。以下のことができるようになりました：

✅ 顧客がWebからレッスン予約を申請できる  
✅ 管理者が予約を承認・却下できる  
✅ 自動でLINE通知メッセージが生成される  
✅ 料金が自動計算される  
✅ プライベート予定を管理できる  

---

## 📱 次のステップ

### URLをLINEで共有

1. Vercelで発行されたURL（例: https://ttlabo-lesson-booking.vercel.app）をコピー
2. LINE公式アカウントのリッチメニューまたはプロフィールに設定
3. 顧客に案内

### 定期レッスンの登録

1. 管理画面の「予定管理」タブで定期レッスンを手動登録
2. カテゴリを「レッスン」に設定
3. 毎週同じ時間に繰り返す場合は、その都度登録

---

## ❓ トラブルシューティング

### ログインできない

**症状**: メールアドレスとパスワードを入力してもログインできない

**原因**: ユーザー作成時に "Auto Confirm User" にチェックを入れなかった

**解決方法**:
1. Supabase Dashboard > Authentication > Users を開く
2. 該当ユーザーを削除
3. もう一度ユーザーを作成（今度は "Auto Confirm User" にチェック）

---

### 施設が表示されない

**症状**: 予約フォームで施設が1つも表示されない

**解決方法**:
1. 管理画面にログイン
2. 「施設マスタ」タブで施設を最低1つ登録

---

### 予約申請が表示されない

**症状**: 管理画面で予約申請が0件のまま

**確認事項**:
1. 顧客側で予約申請を送信したか？
2. ブラウザをリロード（F5キー）してみる
3. Supabase Dashboard > Table Editor > lesson_requests でデータが保存されているか確認

---

### 料金が表示されない

**症状**: 予約フォームで料金が表示されない

**解決方法**:
1. ブラウザのキャッシュをクリア
2. F12キーを押して開発者ツールを開く
3. Console タブでエラーが出ていないか確認
4. `pricing.js` が正しく読み込まれているか確認

---

## 📞 サポート

それでも問題が解決しない場合は、README.md の技術スタックとエラーメッセージを添えて管理者に連絡してください。
