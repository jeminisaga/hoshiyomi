# 星詠みの館 - デプロイ手順（Render）

## 1. GitHub にプッシュ

```bash
# GitHub で新規リポジトリ作成後（リポジトリ名は任意。例: hoshiyomi）
git remote add origin https://github.com/jeminisaga/リポジトリ名.git
git branch -M main
git push -u origin main

# 例: リポジトリ名が hoshiyomi の場合
# git remote add origin https://github.com/jeminisaga/hoshiyomi.git
```

## 2. Render でデプロイ

1. [Render Dashboard](https://dashboard.render.com) にログイン
2. **New** → **Blueprint**
3. GitHub のリポジトリを接続（認証して選択）
4. **Apply** で `render.yaml` を読み込み
5. **Environment** で `ANTHROPIC_API_KEY` を追加（Claude API キーを入力）
6. **Create Blueprint** でデプロイ開始

## 3. 完了後

- 表示された URL（例: `https://hoshiyomi-no-yakata.onrender.com`）でサイトにアクセス
- 無料プランはスリープするため、しばらくアクセスがないと初回表示が遅くなります
