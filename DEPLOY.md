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

---

# デプロイ先: Cloudflare Workers（Python）

## 前提

- [Node.js](https://nodejs.org/) と [uv](https://docs.astral.sh/uv/) をインストール済みであること
- Cloudflare アカウントがあること

**uv がパスにない場合**（PowerShell で `uv` と打って「認識されません」と出る場合）は、次のどちらかで実行できます。

- **方法A** いちどだけ PATH を足してから実行:
  ```powershell
  $env:Path = "C:\Users\jemin\AppData\Local\Python\pythoncore-3.14-64\Scripts;" + $env:Path
  ```
  その後、同じウィンドウで `uv run pywrangler deploy` などが使えます。

- **方法B** 毎回フルパスで実行:
  ```powershell
  & "C:\Users\jemin\AppData\Local\Python\pythoncore-3.14-64\Scripts\uv.exe" run pywrangler deploy
  ```

## 1. テンプレートを生成（app.py を更新したあと）

**必須。** `app.py` や `static/app.js` を変えたら毎回実行してください。

```powershell
cd "c:\Users\jemin\Downloads\files"
python scripts/extract_template.py
```

- `{{ booking_url }}` を `__BOOKING_URL__` に、`<script src="/static/app.js">` を `static/app.js` の内容でインライン化した HTML が `worker/src/template_str.py` に出力されます。

## 2. Worker のセットアップ（初回のみ）

```powershell
cd worker
uv tool install workers-py
uv sync
```

## 3. デプロイ

```powershell
cd worker
uv run pywrangler deploy
```

初回は Cloudflare にログインするよう促されます（ブラウザが開きます）。

## 4. API キーを設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. **hoshiyomi-no-yakata** を選択
3. **Settings** → **Variables and Secrets**
4. **Add** → **Secret** で `ANTHROPIC_API_KEY` を追加（Claude API キーを入力）

## 5. 完了後

- Worker の URL（例: `https://hoshiyomi-no-yakata.<あなたのサブドメイン>.workers.dev`）でサイトにアクセス
- カスタムドメインも Workers の設定から追加できます

---

## ⚠ Windows で「Python interpreter not found」が出る場合

Cloudflare Python Workers はビルドに Pyodide（WASM）を使うため、**Windows では `uv run pywrangler deploy` が失敗することがあります**（`pyodide-3.12.7-emscripten-wasm32-musl\python.exe` が存在しないため）。

**対処法:**

1. **Render でデプロイする**  
   同じリポジトリを Render に接続すれば、Flask 版（`app.py`）がそのまま動きます。Cloudflare より手軽です。

2. **WSL（Linux）からデプロイする**  
   WSL を入れたうえで、その中で `uv run pywrangler deploy` を実行すると成功しやすいです。

3. **Cloudflare の「Deploy with Git」を使う**  
   Dashboard の Workers & Pages で「Create Worker」→「Deploy with Git」でリポジトリを接続し、ビルドを Cloudflare 側で行う方法もあります（Python Worker が Git ビルドに対応している場合）。

4. **WSL からデプロイする（推奨）**  
   Windows で `uv run pywrangler deploy` が失敗する場合は、WSL 内でリポジトリをクローンし、`cd worker && uv tool install workers-py && uv sync && uv run pywrangler deploy` を実行すると成功しやすいです。

---

## Cloudflare「Deploy with Git」で「Could not detect static files」が出る場合

リポジトリルートで `npx wrangler deploy` が走ると、設定が見つからず上記エラーになります。

**対応（どちらか）:**

- **A) Root directory を `worker` にする**  
  1. Workers & Pages → 該当 Worker → **Settings** → **Builds & deployments**  
  2. **Root directory** を `worker` に設定（ルートではなく worker フォルダでビルド）  
  3. **Build command**: `uv tool install workers-py && uv sync`（uv が使える場合）  
  4. **Deploy command**: `uv run pywrangler deploy`  
  ビルド環境に uv がない場合は、先に uv を入れるステップを追加するか、公式の Python Worker 用イメージを指定してください。

- **B) ルートの wrangler.toml を使う**  
  リポジトリルートに `wrangler.toml` を置いてあり、`main = "worker/src/main.py"` を指定しています。  
  Deploy command を `npx wrangler deploy` のままにして再デプロイし、Python Worker としてビルドされるか確認してください。失敗する場合は A に切り替えてください。
