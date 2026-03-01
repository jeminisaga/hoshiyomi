# 星詠みの館 - Cloudflare Workers (Python)
import json
import random
from datetime import date, datetime
from urllib.parse import urlparse
from workers import WorkerEntrypoint, Response

try:
    from workers import fetch
except Exception:
    fetch = None

try:
    from template_str import HTML_TEMPLATE
except Exception:
    HTML_TEMPLATE = "<!DOCTYPE html><html><head><meta charset=utf-8><title>星詠みの館</title></head><body><h1>星詠みの館</h1><p>読み込みエラー。テンプレートを確認してください。</p></body></html>"

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

CLAUDE_MODEL = "claude-sonnet-4-5-20250929"


def get_day_stem(year: int, month: int, day: int):
    base = date(1900, 1, 1)
    target = date(year, month, day)
    diff = (target - base).days
    index = (diff + 10) % 10
    return HEAVENLY_STEMS[index]


def draw_tarot():
    card = random.choice(TAROT_CARDS)
    is_upright = random.random() > 0.35
    return {
        "name": card["name"],
        "number": card["number"],
        "is_upright": is_upright,
        "position": "正位置" if is_upright else "逆位置",
    }


def generate_fallback_fortune(name: str, card: dict, stem: dict, category: str, concern: str) -> str:
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


async def generate_fortune_with_claude(
    api_key: str,
    name: str,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    category: str,
    concern: str,
) -> dict:
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

    if not api_key or fetch is None:
        fortune_text = generate_fallback_fortune(name, card, stem, category, concern)
        return {"fortune_text": fortune_text, "card": card, "stem": {"name": stem["name"], "reading": stem["reading"], "element": stem["element"]}}

    try:
        body = json.dumps({
            "model": CLAUDE_MODEL,
            "max_tokens": 800,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }, ensure_ascii=False)
        r = await fetch(
            "https://api.anthropic.com/v1/messages",
            method="POST",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body=body,
        )
        if r.status != 200:
            raise RuntimeError(f"API status {r.status}")
        data = await r.json()
        fortune_text = data["content"][0]["text"]
    except Exception:
        fortune_text = generate_fallback_fortune(name, card, stem, category, concern)

    return {
        "fortune_text": fortune_text,
        "card": card,
        "stem": {"name": stem["name"], "reading": stem["reading"], "element": stem["element"]},
    }


def html_response(html: str) -> Response:
    return Response(html, status=200, headers={"Content-Type": "text/html; charset=utf-8"})


BOOKING_URL = "/booking"
BOOKING_DEMO_HTML = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>詳しい鑑定を予約する | 星詠みの館</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Noto+Sans+JP:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP',sans-serif;background:linear-gradient(180deg,#060114 0%,#0d0221 30%,#150735 60%,#0a0118 100%);color:#e8dff0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{max-width:420px;width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(218,165,32,.25);border-radius:20px;padding:40px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4)}
h1{font-family:'Noto Serif JP',serif;font-size:22px;color:#daa520;margin-bottom:12px;letter-spacing:2px}
.badge{display:inline-block;font-size:11px;color:#9b8ec4;background:rgba(155,142,196,.2);padding:4px 12px;border-radius:999px;margin-bottom:24px}
p{font-size:15px;line-height:1.9;color:#c9b8e8;margin-bottom:16px}
.note{font-size:13px;color:#8a7aa8;margin-top:24px}
a.back{display:inline-block;margin-top:28px;color:#daa520;text-decoration:none;font-size:14px;border:1px solid rgba(218,165,32,.5);padding:10px 24px;border-radius:999px;}
a.back:hover{background:rgba(218,165,32,.15)}
</style>
</head>
<body>
<div class="card">
<span class="badge">デモページ</span>
<h1>✦ 詳しい鑑定を予約する ✦</h1>
<p>ここが「詳しい鑑定を予約する」の飛び先です。</p>
<p>本番では、LINE・予約フォームなどご希望のURLに差し替えできます。</p>
<p class="note">Worker では BOOKING_URL を変更して差し替え可能です。</p>
<a href="/" class="back">← 占いトップに戻る</a>
</div>
</body>
</html>"""


def json_response(obj: dict, status: int = 200) -> Response:
    return Response(json.dumps(obj, ensure_ascii=False), status=status, headers={"Content-Type": "application/json; charset=utf-8"})


class Default(WorkerEntrypoint):
    async def fetch(self, request) -> Response:
        try:
            url_str = getattr(request, "url", None)
            if url_str is None:
                url_str = str(getattr(request, "request", request))
            if not isinstance(url_str, str):
                url_str = str(url_str)
            path = urlparse(url_str).path.rstrip("/") or "/"
            method = (getattr(request, "method", None) or "GET").upper()

            if path == "/" and method == "GET":
                html = HTML_TEMPLATE.replace("__BOOKING_URL__", BOOKING_URL)
                if "__TAROT_IMAGE_URLS_JSON__" in html:
                    html = html.replace("__TAROT_IMAGE_URLS_JSON__", json.dumps(TAROT_IMAGE_URLS, ensure_ascii=False))
                return html_response(html)

            if path == "/booking" and method == "GET":
                return html_response(BOOKING_DEMO_HTML)

            if path == "/api/tarot-urls" and method == "GET":
                return json_response(TAROT_IMAGE_URLS)

            if path == "/api/health" and method == "GET":
                return json_response({"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"})

            if path == "/api/fortune" and method == "POST":
                try:
                    body = await request.json()
                except Exception:
                    return json_response({"error": "Invalid JSON"}, 400)
                env = getattr(self, "env", None)
                api_key = getattr(env, "ANTHROPIC_API_KEY", "") if env else ""
                try:
                    result = await generate_fortune_with_claude(
                        api_key=api_key,
                        name=body["name"],
                        birth_year=int(body["birth_year"]),
                        birth_month=int(body["birth_month"]),
                        birth_day=int(body["birth_day"]),
                        category=body.get("category", "love"),
                        concern=body.get("concern", ""),
                    )
                    return json_response(result)
                except Exception as e:
                    return json_response({"error": str(e)}, 500)

            return Response("Not Found", status=404)
        except Exception as e:
            err_msg = f"{type(e).__name__}: {e}"
            return Response(
                f"<pre>Worker Error\n\n{err_msg}</pre>",
                status=500,
                headers={"Content-Type": "text/html; charset=utf-8"},
            )
