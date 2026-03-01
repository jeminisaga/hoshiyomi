"""
星詠みの館 - AI占い鑑定サーバー
Flask + Anthropic Claude API
"""

import os
import random
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)

# ===== 設定 =====
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

# ===== タロット大アルカナ22枚 =====
TAROT_CARDS = [
    {"name": "愚者", "number": 0},
    {"name": "魔術師", "number": 1},
    {"name": "女教皇", "number": 2},
    {"name": "女帝", "number": 3},
    {"name": "皇帝", "number": 4},
    {"name": "教皇", "number": 5},
    {"name": "恋人", "number": 6},
    {"name": "戦車", "number": 7},
    {"name": "力", "number": 8},
    {"name": "隠者", "number": 9},
    {"name": "運命の輪", "number": 10},
    {"name": "正義", "number": 11},
    {"name": "吊るされた男", "number": 12},
    {"name": "死神", "number": 13},
    {"name": "節制", "number": 14},
    {"name": "悪魔", "number": 15},
    {"name": "塔", "number": 16},
    {"name": "星", "number": 17},
    {"name": "月", "number": 18},
    {"name": "太陽", "number": 19},
    {"name": "審判", "number": 20},
    {"name": "世界", "number": 21},
]

# ===== タロットカード画像URL（Wikimedia Commons RWS・パブリックドメイン） =====
TAROT_IMAGE_URLS = [
    "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg",
]

# ===== 十干（日干算出用） =====
HEAVENLY_STEMS = [
    {"name": "甲", "reading": "きのえ", "element": "木"},
    {"name": "乙", "reading": "きのと", "element": "木"},
    {"name": "丙", "reading": "ひのえ", "element": "火"},
    {"name": "丁", "reading": "ひのと", "element": "火"},
    {"name": "戊", "reading": "つちのえ", "element": "土"},
    {"name": "己", "reading": "つちのと", "element": "土"},
    {"name": "庚", "reading": "かのえ", "element": "金"},
    {"name": "辛", "reading": "かのと", "element": "金"},
    {"name": "壬", "reading": "みずのえ", "element": "水"},
    {"name": "癸", "reading": "みずのと", "element": "水"},
]


def get_day_stem(year, month, day):
    """生年月日から日干を算出（簡易版）"""
    from datetime import date
    base = date(1900, 1, 1)
    target = date(year, month, day)
    diff = (target - base).days
    index = (diff + 10) % 10
    return HEAVENLY_STEMS[index]


def draw_tarot():
    """タロットカードを1枚引く"""
    card = random.choice(TAROT_CARDS)
    is_upright = random.random() > 0.35
    return {
        "name": card["name"],
        "number": card["number"],
        "is_upright": is_upright,
        "position": "正位置" if is_upright else "逆位置",
    }


def generate_fortune_with_claude(name, birth_year, birth_month, birth_day, category, concern):
    """Claude APIで鑑定文を生成"""
    card = draw_tarot()
    stem = get_day_stem(birth_year, birth_month, birth_day)
    
    category_labels = {"love": "恋愛", "work": "仕事", "money": "金運"}
    cat_label = category_labels.get(category, "総合")
    
    system_prompt = """あなたは「星詠みの館」の占い師です。温かく寄り添う語り口で鑑定を行います。

【トーン】
- 親しみやすく、神秘的な雰囲気
- ポジティブ寄り（逆位置でも希望を添える）
- 「あなた」への語りかけ
- 具体的なアクション提案を必ず1つ入れる
- カードを目の前で開いているような臨場感

【構成（300-500文字厳守）】
1. 導入（共感・寄り添い）: 2-3文
2. タロットカードの結果と解釈: 3-4文
3. 四柱推命から見た本質: 2-3文
4. 具体的アドバイス: 2-3文
5. 締めの応援メッセージ: 1-2文（絵文字1つ添える）

【禁止事項】
- 不安を煽る表現（「危険」「最悪」など）
- 断定的な未来予測（「必ず〜になる」）
- 医療・法律に関わる助言
- 「AIが」「自動で」など技術的言及"""

    user_prompt = f"""以下の情報で占い鑑定文を生成してください。

【相談者】{name}さん
【生年月日】{birth_year}年{birth_month}月{birth_day}日
【カテゴリ】{cat_label}
【お悩み】{concern if concern else "（記載なし）"}
【引いたカード】{card['name']}（{card['position']}）
【日干】{stem['name']}（{stem['reading']}）— {stem['element']}の気質

300-500文字で鑑定文のみを出力してください。タイトルや見出しは不要です。"""

    # Claude API呼び出し
    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            response = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=800,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            fortune_text = response.content[0].text
        except Exception as e:
            fortune_text = generate_fallback_fortune(name, card, stem, category, concern)
    else:
        fortune_text = generate_fallback_fortune(name, card, stem, category, concern)

    return {
        "fortune_text": fortune_text,
        "card": card,
        "stem": {
            "name": stem["name"],
            "reading": stem["reading"],
            "element": stem["element"],
        },
    }


def generate_fallback_fortune(name, card, stem, category, concern):
    """API未設定時のフォールバック鑑定文"""
    openings = {
        "love": f"{name}さん、恋愛のことで胸がいっぱいなのですね。その想い、カードがしっかり受け止めてくれましたよ。",
        "work": f"{name}さん、お仕事のこと、真剣に向き合っていらっしゃるのですね。その姿勢が、すでに道を切り開く力になっています。",
        "money": f"{name}さん、金運アップへの意識が高いですね！その姿勢自体が、すでに豊かさを引き寄せ始めていますよ。",
    }
    opening = openings.get(category, f"{name}さん、ご相談ありがとうございます。")
    
    if card["is_upright"]:
        card_text = f"あなたに届いたカードは「{card['name']}」の正位置。今のあなたのエネルギーは正しい方向を向いていますよ。このカードは流れがあなたの味方だと告げています。"
    else:
        card_text = f"あなたに現れたカードは「{card['name']}」の逆位置。一見不安に感じるかもしれませんが、ご安心を。逆位置は変化の前触れ。思っているより穏やかに解決へ向かうサインです。"
    
    stem_text = f"四柱推命で見ると、あなたの日干は「{stem['name']}（{stem['reading']}）」。{stem['element']}の気質を活かすことが開運の鍵になります。"
    
    return f"{opening}\n\n{card_text}\n\n{stem_text}\n\n自分の心の声に耳を傾けて、一歩踏み出してみてください。星たちがあなたを応援しています✨"


# ===== HTMLテンプレート（LP） =====
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>星詠みの館 | AI占い鑑定</title>
<meta name="description" content="タロット×四柱推命×スピリチュアル。AIがあなただけの星の声をお届けします。完全無料・1分で鑑定。">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Noto+Sans+JP:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP',sans-serif;background:linear-gradient(180deg,#060114 0%,#0d0221 30%,#150735 60%,#0a0118 100%);color:#e8dff0;min-height:100vh}
.container{max-width:520px;margin:0 auto;padding:0 20px}
.stars{position:fixed;inset:0;pointer-events:none;z-index:0}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d) var(--del) infinite ease-in-out}
@keyframes twinkle{0%,100%{opacity:.1}50%{opacity:.8}}
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}

.landing,.form-section,.loading,.result{position:relative;z-index:1;animation:fadeIn .8s ease}
.landing{text-align:center;padding-top:80px}
.sub{font-size:14px;color:#b8860b;letter-spacing:6px;margin-bottom:16px}
h1{font-family:'Noto Serif JP',serif;font-size:36px;color:#f5e6c8;margin-bottom:8px}
.desc{color:#9b8ec4;font-size:14px;line-height:1.8;margin-bottom:40px}
.crystal{font-size:72px;animation:float 3s ease-in-out infinite;margin:20px 0 40px}
.features{background:rgba(184,134,11,.08);border:1px solid rgba(184,134,11,.2);border-radius:16px;padding:24px 20px;margin-bottom:40px;text-align:left;color:#c9b8e8;font-size:14px;line-height:2}
.features .gold{color:#daa520}
.btn-primary{width:100%;padding:18px 0;border-radius:50px;border:none;background:linear-gradient(135deg,#b8860b 0%,#daa520 50%,#b8860b 100%);color:#0d0221;font-size:17px;font-weight:700;font-family:'Noto Serif JP',serif;cursor:pointer;letter-spacing:2px;box-shadow:0 4px 24px rgba(184,134,11,.4);transition:transform .2s,box-shadow .2s}
.btn-primary:hover{transform:scale(1.03);box-shadow:0 6px 32px rgba(184,134,11,.6)}
.btn-secondary{width:100%;padding:14px 0;border-radius:50px;border:1px solid rgba(184,134,11,.3);background:transparent;color:#c9b8e8;font-size:14px;cursor:pointer;font-family:'Noto Serif JP',serif}
.privacy{color:#665c80;font-size:11px;margin-top:20px}
.disclaimer{margin-top:60px;padding:20px;border-top:1px solid rgba(184,134,11,.15);color:#665c80;font-size:11px;line-height:1.8}

/* Form */
.form-section{padding-top:40px}
.back-btn{background:none;border:none;color:#9b8ec4;font-size:14px;cursor:pointer;padding:8px 0;margin-bottom:16px}
h2{font-family:'Noto Serif JP',serif;color:#f5e6c8;font-size:24px;margin-bottom:8px}
.form-desc{color:#9b8ec4;font-size:13px;margin-bottom:32px}
label{display:block;color:#c9b8e8;font-size:13px;font-weight:600;margin-bottom:6px;font-family:'Noto Serif JP',serif}
input,textarea,select{width:100%;padding:14px 16px;border-radius:10px;border:1px solid rgba(184,134,11,.3);background:rgba(255,255,255,.05);color:#f5e6c8;font-size:16px;font-family:'Noto Sans JP',sans-serif;outline:none;transition:border-color .3s,box-shadow .3s}
input:focus,textarea:focus{border-color:rgba(184,134,11,.6);box-shadow:0 0 12px rgba(184,134,11,.15)}
.birth-row{display:flex;gap:8px}
.birth-row input:first-child{flex:2}
.birth-row input{flex:1}
.cat-row{display:flex;gap:10px}
.cat-btn{flex:1;padding:14px 0;border-radius:10px;border:2px solid rgba(184,134,11,.2);background:rgba(255,255,255,.03);color:#9b8ec4;font-size:14px;font-weight:600;cursor:pointer;transition:all .3s}
.cat-btn.active{border-color:#daa520;background:rgba(218,165,32,.12);color:#f5e6c8}
textarea{resize:none;line-height:1.8}
.char-count{text-align:right;color:#665c80;font-size:11px;margin-top:4px}
.field{margin-bottom:24px}

/* Loading */
.loading{padding-top:120px;text-align:center}
.spinner-wrap{position:relative;width:80px;height:80px;margin:0 auto 24px}
.spinner-outer{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#daa520;animation:spin 1.2s linear infinite}
.spinner-inner{position:absolute;inset:8px;border-radius:50%;border:3px solid transparent;border-top-color:#b8860b;animation:spin .8s linear infinite reverse}
.spinner-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;animation:pulse 1.5s ease-in-out infinite}
.loading-text{color:#c9b8e8;font-family:'Noto Serif JP',serif;font-size:15px;animation:fadeInOut 2s ease-in-out infinite}
@keyframes fadeInOut{0%,100%{opacity:.4}50%{opacity:1}}

/* Result */
.result{padding-top:40px;padding-bottom:60px}
.result-header{text-align:center;margin-bottom:32px}
.result-sub{color:#b8860b;font-size:12px;letter-spacing:4px;margin-bottom:8px}
.fortune-box{background:rgba(255,255,255,.03);border:1px solid rgba(184,134,11,.15);border-radius:16px;padding:28px 22px;margin-bottom:32px}
.fortune-text{font-family:'Noto Serif JP',serif;font-size:15px;line-height:2;white-space:pre-wrap}
.section-label{display:flex;align-items:center;gap:8px;color:#daa520;font-size:13px;font-weight:600;margin:20px 0 12px}
.advice-box{background:rgba(184,134,11,.08);border:1px solid rgba(184,134,11,.2);border-radius:12px;padding:16px 18px;margin:20px 0}
.advice-label{color:#daa520;font-size:13px;font-weight:600;margin-bottom:8px}

/* Tarot card visual - 画面幅に合わせてスケール */
.tarot-card-wrapper{display:flex;justify-content:center;margin-bottom:20px;padding:0 8px}
.tarot-card{width:min(160px,42vw);max-width:100%;aspect-ratio:140/220;border-radius:18px;padding:10px;background:linear-gradient(160deg,rgba(14,6,40,.96),rgba(44,18,84,.98));border:1px solid rgba(218,165,32,.7);box-shadow:0 14px 36px rgba(0,0,0,.7);position:relative;overflow:hidden;box-sizing:border-box}
.tarot-card::before{content:"";position:absolute;inset:10px;border-radius:12px;border:1px solid rgba(248,237,198,.18);box-shadow:0 0 18px rgba(218,165,32,.35) inset;pointer-events:none}
.tarot-card img{position:absolute;inset:8px;border-radius:12px;object-fit:contain;opacity:.96;width:calc(100% - 16px);height:calc(100% - 16px)}
.tarot-card-content{position:relative;z-index:1;pointer-events:none}
.tarot-card-symbol{font-size:min(28px,7vw);margin-bottom:4px}
.tarot-card-name{font-family:'Noto Serif JP',serif;font-size:min(15px,4vw);letter-spacing:2px;margin-bottom:2px}
.tarot-card-number{font-size:10px;color:#9b8ec4}
.tarot-card-position{position:absolute;bottom:8px;right:8px;left:8px;text-align:center;font-size:10px;color:#0d0221;background:linear-gradient(135deg,#b8860b,#daa520);padding:3px 8px;border-radius:999px;font-weight:700;letter-spacing:1px;box-shadow:0 4px 14px rgba(184,134,11,.7);z-index:2}
.tarot-card.reversed{border-color:rgba(155,79,150,.9);box-shadow:0 14px 36px rgba(121,65,160,.7)}
.tarot-card.reversed .tarot-card-symbol{transform:rotate(180deg)}
.tarot-card.reversed img{transform:rotate(180deg)}

/* シェアボタン */
.share-section{margin-bottom:40px}
.share-section .share-label{color:#9b8ec4;font-size:12px;margin-bottom:10px;text-align:center}
.share-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}
.share-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:12px 18px;border-radius:12px;border:none;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:transform .2s,opacity .2s;font-family:'Noto Sans JP',sans-serif}
.share-btn:hover{transform:scale(1.05);opacity:.95}
.share-btn-x{background:#000;color:#fff}
.share-btn-line{background:#06C755;color:#fff}
.share-btn-ig{background:linear-gradient(135deg,#833AB4,#FD1D1D,#F77737);color:#fff}
.share-btn-copy{background:rgba(255,255,255,.1);color:#c9b8e8;border:1px solid rgba(184,134,11,.3)}
.share-btn-native{background:rgba(184,134,11,.2);color:#f5e6c8;border:1px solid rgba(184,134,11,.4)}

/* 有料導線 */
.upsell{background:linear-gradient(135deg,rgba(184,134,11,.08) 0%,rgba(218,165,32,.05) 100%);border:1px solid rgba(184,134,11,.25);border-radius:16px;padding:28px 22px;margin-bottom:24px;text-align:center}
.upsell h3{font-family:'Noto Serif JP',serif;color:#f5e6c8;font-size:18px;margin:8px 0}
.upsell .sub-text{color:#9b8ec4;font-size:13px;line-height:1.8}
.menu-card{background:rgba(255,255,255,.03);border:1px solid rgba(184,134,11,.15);border-radius:12px;padding:18px;margin:12px 0;text-align:left}
.menu-card.popular{background:rgba(218,165,32,.06);border-color:rgba(184,134,11,.25);position:relative}
.popular-badge{position:absolute;top:-10px;right:16px;background:linear-gradient(135deg,#b8860b,#daa520);color:#0d0221;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
.menu-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.menu-name{color:#f5e6c8;font-size:15px;font-weight:600}
.menu-price{color:#daa520;font-size:18px;font-weight:700;font-family:'Noto Serif JP',serif}
.menu-desc{color:#9b8ec4;font-size:12px;line-height:1.8}

.hidden{display:none}
.fade-in{animation:fadeIn .8s ease forwards}
</style>
</head>
<body>

<!-- 星空背景 -->
<div class="stars" id="stars"></div>

<div class="container">

  <!-- ===== ランディングページ ===== -->
  <div class="landing" id="page-landing">
    <div class="sub">✦ AI FORTUNE TELLING ✦</div>
    <h1>星詠みの館</h1>
    <p class="desc">タロット × 四柱推命 × スピリチュアル<br>あなただけの星の声をお届けします</p>
    <div class="crystal">🔮</div>
    <div class="features">
      🌙 生年月日とお悩みを入力するだけ<br>
      🌙 AIがタロットと四柱推命で鑑定<br>
      🌙 あなただけの特別なメッセージ<br>
      🌙 <span class="gold">完全無料</span>・所要時間わずか1分
    </div>
    <button type="button" class="btn-primary" id="btn-start">✦ 無料鑑定をはじめる ✦</button>
    <p class="privacy">※個人情報は鑑定にのみ使用し、保存されません</p>
    <div class="disclaimer">占いは娯楽としてお楽しみください。<br>医療・法律・投資の専門的助言ではありません。</div>
  </div>

  <!-- ===== 入力フォーム ===== -->
  <div class="form-section hidden" id="page-form">
    <button class="back-btn" onclick="showPage('landing')">← 戻る</button>
    <h2>鑑定に必要な情報</h2>
    <p class="form-desc">あなたの星を正確に読み解くために</p>
    
    <div class="field">
      <label>お名前（イニシャル可）</label>
      <input type="text" id="input-name" placeholder="例: M.K / みき">
    </div>
    
    <div class="field">
      <label>生年月日</label>
      <div class="birth-row">
        <input type="number" id="input-year" placeholder="年(例:1990)" min="1920" max="2010">
        <input type="number" id="input-month" placeholder="月" min="1" max="12">
        <input type="number" id="input-day" placeholder="日" min="1" max="31">
      </div>
    </div>
    
    <div class="field">
      <label>鑑定カテゴリ</label>
      <div class="cat-row">
        <button class="cat-btn active" data-cat="love" onclick="selectCat(this)">💕 恋愛</button>
        <button class="cat-btn" data-cat="work" onclick="selectCat(this)">💼 仕事</button>
        <button class="cat-btn" data-cat="money" onclick="selectCat(this)">💰 金運</button>
      </div>
    </div>
    
    <div class="field">
      <label>今のお悩み（任意・100文字以内）</label>
      <textarea id="input-concern" rows="3" placeholder="例: 気になる人がいるけど、距離が縮まらない…" maxlength="100" oninput="updateCount()"></textarea>
      <div class="char-count"><span id="char-count">0</span>/100</div>
    </div>
    
    <button class="btn-primary" onclick="submitFortune()" style="margin-bottom:16px">🔮 カードを引く</button>
    <p class="privacy" style="text-align:center">※入力情報は鑑定のみに使用し、保存されません</p>
  </div>

  <!-- ===== ローディング ===== -->
  <div class="loading hidden" id="page-loading">
    <div class="spinner-wrap">
      <div class="spinner-outer"></div>
      <div class="spinner-inner"></div>
      <div class="spinner-icon">🔮</div>
    </div>
    <p class="loading-text">星の声を聴いています…</p>
  </div>

  <!-- ===== 鑑定結果 ===== -->
  <div class="result hidden" id="page-result">
    <div class="result-header">
      <div class="result-sub">✦ YOUR TAROT READING ✦</div>
      <h2 id="result-title"></h2>
    </div>

    <div class="fortune-box">
      <div class="tarot-card-wrapper">
        <div class="tarot-card" id="tarot-card">
          <img id="tarot-card-image" alt="Tarot card">
          <div class="tarot-card-content">
            <div class="tarot-card-symbol">★</div>
            <div class="tarot-card-name" id="tarot-card-name"></div>
            <div class="tarot-card-number" id="tarot-card-number"></div>
            <div class="tarot-card-position" id="tarot-card-position"></div>
          </div>
        </div>
      </div>
      <div class="section-label" id="result-card-label"></div>
      <div class="section-label" id="result-stem-label"></div>
      <div class="fortune-text" id="result-text"></div>
    </div>

    <!-- 有料導線 -->
    <div class="upsell">
      <div style="font-size:24px;margin-bottom:8px">🌙</div>
      <h3>もう少し深くお伝えしたいことがあります</h3>
      <p class="sub-text">1枚のカードでは伝えきれなかった<br>あなたの運命の流れ、もっと詳しくお話しできます</p>
      
      <div class="menu-card">
        <div class="menu-header">
          <span class="menu-name">📩 LINE詳細鑑定</span>
          <span class="menu-price">¥3,000</span>
        </div>
        <p class="menu-desc">タロット3枚引き＋四柱推命フル鑑定＋3ヶ月の運勢<br>24時間以内にテキストでお届け</p>
      </div>

      <div class="menu-card popular">
        <div class="popular-badge">人気No.1</div>
        <div class="menu-header">
          <span class="menu-name">🎥 Zoom個別鑑定（30分）</span>
          <span class="menu-price">¥5,000</span>
        </div>
        <p class="menu-desc">リアルタイム対話の特別鑑定<br>あなただけのオリジナルスプレッド</p>
      </div>

      <a href="#" id="booking-link" class="btn-primary" style="display:block;text-decoration:none;text-align:center;margin-top:20px">
        ✦ 詳しい鑑定を予約する ✦
      </a>
    </div>

    <button class="btn-secondary" onclick="resetForm()" style="margin-bottom:16px">🔮 もう一度占う</button>

    <div class="share-section">
      <p class="share-label">結果をSNSでシェア</p>
      <div class="share-btns">
        <a href="#" id="share-x" class="share-btn share-btn-x" target="_blank" rel="noopener">𝕏 X</a>
        <a href="#" id="share-line" class="share-btn share-btn-line" target="_blank" rel="noopener">LINE</a>
        <button type="button" id="share-copy" class="share-btn share-btn-copy">コピー（Instagramなど）</button>
        <button type="button" id="share-native" class="share-btn share-btn-native" style="display:none">📱 シェア</button>
      </div>
    </div>
    
    <div style="text-align:center;padding-bottom:20px">
      <p class="privacy" style="line-height:1.8">占いは娯楽としてお楽しみください。<br>© 星詠みの館</p>
    </div>
  </div>

</div>

<script type="application/json" id="tarot-image-urls">{{ TAROT_IMAGE_URLS | tojson }}</script>
<script>
// 設定読み込み（JSON を別 script に分けて構文エラーを防ぐ）
var TAROT_IMAGE_URLS = [];
(function() {
  var el = document.getElementById('tarot-image-urls');
  if (el && el.textContent) {
    try { TAROT_IMAGE_URLS = JSON.parse(el.textContent); } catch (e) {}
  }
})();

// ページ切り替え
function showPage(page) {
  var ids = ['landing', 'form', 'loading', 'result'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById('page-' + ids[i]);
    if (el) el.classList.add('hidden');
  }
  var target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ボタン：無料鑑定をはじめる（インライン onclick に頼らない）
var btnStart = document.getElementById('btn-start');
if (btnStart) btnStart.addEventListener('click', function() { showPage('form'); });

// 星空生成
(function() {
  var container = document.getElementById('stars');
  if (!container) return;
  for (var i = 0; i < 60; i++) {
    var star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    var size = Math.random() * 2.5 + 0.5;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.setProperty('--d', (Math.random() * 3 + 2) + 's');
    star.style.setProperty('--del', (Math.random() * 3) + 's');
    container.appendChild(star);
  }
})();

var selectedCategory = 'love';
var lastResult = null;

function selectCat(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCategory = btn.dataset.cat;
}

function updateCount() {
  document.getElementById('char-count').textContent = document.getElementById('input-concern').value.length;
}

function submitFortune() {
  const name = document.getElementById('input-name').value.trim();
  const year = document.getElementById('input-year').value;
  const month = document.getElementById('input-month').value;
  const day = document.getElementById('input-day').value;
  const concern = document.getElementById('input-concern').value.trim();
  
  if (!name || !year || !month || !day) {
    alert('お名前と生年月日をご入力ください');
    return;
  }
  
  showPage('loading');
  
  fetch('/api/fortune', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: name,
      birth_year: parseInt(year),
      birth_month: parseInt(month),
      birth_day: parseInt(day),
      category: selectedCategory,
      concern: concern
    })
  })
  .then(r => r.json())
  .then(data => {
    lastResult = data;
    displayResult(data, name);
  })
  .catch(err => {
    console.error(err);
    alert('申し訳ございません。しばらくしてからもう一度お試しください。');
    showPage('form');
  });
}

function resetForm() {
  showPage('form');
  lastResult = null;
}

function getShareText() {
  if (!lastResult) return { text: '', url: window.location.href };
  var url = window.location.href;
  var text = '🔮星詠みの館で占ってもらった！\nタロット「' +
    lastResult.card.name + '」' + lastResult.card.position +
    ' × 四柱推命「' + lastResult.stem.name + '」\n\n▶ 無料鑑定はこちら → ' + url;
  return { text: text, url: url };
}

function setupShareButtons() {
  var nativeBtn = document.getElementById('share-native');
  if (navigator.share) nativeBtn.style.display = 'inline-flex';

  document.getElementById('share-x').onclick = function(e) {
    e.preventDefault();
    var s = getShareText();
    if (!lastResult) return;
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(s.text), '_blank', 'noopener,noreferrer');
  };

  document.getElementById('share-line').onclick = function(e) {
    e.preventDefault();
    var s = getShareText();
    if (!lastResult) return;
    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(s.text), '_blank', 'noopener,noreferrer');
  };

  document.getElementById('share-copy').onclick = function() {
    var s = getShareText();
    if (!lastResult) return;
    navigator.clipboard.writeText(s.text).then(function() {
      alert('コピーしました！Instagram・DM・ストーリーなどに貼り付けてね✨');
    });
  };

  nativeBtn.onclick = function() {
    var s = getShareText();
    if (!lastResult || !navigator.share) return;
    navigator.share({ text: s.text, title: '星詠みの館', url: s.url });
  };
}

function displayResult(data, name) {
  document.getElementById('result-title').textContent = name + 'さんへの鑑定結果';
  document.getElementById('result-card-label').innerHTML = 
    '🃏 タロット「' + data.card.name + '」' + data.card.position;
  document.getElementById('result-stem-label').innerHTML = 
    '☯ 四柱推命「' + data.stem.name + '（' + data.stem.reading + '）」';
  document.getElementById('tarot-card-name').textContent = data.card.name;
  document.getElementById('tarot-card-number').textContent = 'No.' + String(data.card.number).padStart(2,'0');
  document.getElementById('tarot-card-position').textContent = data.card.position;
  const tarotImgEl = document.getElementById('tarot-card-image');
  if (tarotImgEl && TAROT_IMAGE_URLS && TAROT_IMAGE_URLS[data.card.number]) {
    tarotImgEl.src = TAROT_IMAGE_URLS[data.card.number];
  }
  const tarotCardEl = document.getElementById('tarot-card');
  if (tarotCardEl) {
    tarotCardEl.classList.toggle('reversed', !data.card.is_upright);
  }
  document.getElementById('result-text').textContent = data.fortune_text;
  setupShareButtons();
  showPage('result');
}
</script>

</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE, TAROT_IMAGE_URLS=TAROT_IMAGE_URLS)


@app.route("/api/fortune", methods=["POST"])
def api_fortune():
    data = request.get_json()
    try:
        result = generate_fortune_with_claude(
            name=data["name"],
            birth_year=data["birth_year"],
            birth_month=data["birth_month"],
            birth_day=data["birth_day"],
            category=data.get("category", "love"),
            concern=data.get("concern", ""),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
