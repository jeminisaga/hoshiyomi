import { useState, useEffect, useRef } from "react";

// ===== タロット大アルカナ22枚データ =====
const TAROT_CARDS = [
  { name: "愚者", upright: "新しい冒険、自由、無限の可能性", reversed: "無計画、現実逃避からの目覚め" },
  { name: "魔術師", upright: "才能の開花、創造力、意志の力", reversed: "潜在能力がまだ眠っている状態" },
  { name: "女教皇", upright: "直感、内なる知恵、静かな導き", reversed: "心の声に耳を傾ける時" },
  { name: "女帝", upright: "豊かさ、愛情、包容力", reversed: "自分を大切にすることの再発見" },
  { name: "皇帝", upright: "安定、リーダーシップ、確固たる意志", reversed: "柔軟さを取り入れる好機" },
  { name: "教皇", upright: "信頼、導き、精神的な成長", reversed: "自分なりの答えを見つける時" },
  { name: "恋人", upright: "深い絆、選択、調和", reversed: "自分自身との対話が必要な時期" },
  { name: "戦車", upright: "勝利、前進、強い意志", reversed: "一度立ち止まって方向を確認する時" },
  { name: "力", upright: "内なる強さ、勇気、忍耐", reversed: "優しさの中にある本当の力" },
  { name: "隠者", upright: "内省、知恵、自分だけの答え", reversed: "孤独から一歩踏み出す時" },
  { name: "運命の輪", upright: "転機、チャンス、流れの変化", reversed: "変化の前触れ、準備の時" },
  { name: "正義", upright: "公正、バランス、真実", reversed: "自分の中の正しさを見つめ直す時" },
  { name: "吊るされた男", upright: "新しい視点、手放し、悟り", reversed: "停滞からの解放が近い" },
  { name: "死神", upright: "再生、終わりと始まり、変容", reversed: "変化を受け入れる準備段階" },
  { name: "節制", upright: "調和、バランス、癒し", reversed: "自分のペースを取り戻す時" },
  { name: "悪魔", upright: "執着からの気づき、欲望の正体", reversed: "束縛からの解放の始まり" },
  { name: "塔", upright: "突然の変化、気づき、再構築", reversed: "恐れていたほどの衝撃は来ない" },
  { name: "星", upright: "希望、才能、インスピレーション", reversed: "見失った希望を取り戻す時" },
  { name: "月", upright: "直感、潜在意識、神秘", reversed: "不安の霧が晴れ始める時" },
  { name: "太陽", upright: "成功、喜び、活力、祝福", reversed: "小さな幸せに気づく時" },
  { name: "審判", upright: "覚醒、使命、人生の転換点", reversed: "過去を許し新たな一歩へ" },
  { name: "世界", upright: "完成、達成、統合、新たなステージ", reversed: "完成間近、あと少しの辛抱" },
];

// ===== 四柱推命 日干算出（簡易版） =====
const HEAVENLY_STEMS = [
  { name: "甲", reading: "きのえ", element: "木", keyword: "大樹のような真っ直ぐさ、リーダーシップ", desc: "大樹のように真っ直ぐで力強い方。周囲を引っ張る生まれながらのリーダー気質です。" },
  { name: "乙", reading: "きのと", element: "木", keyword: "草花のようなしなやかさ、協調性", desc: "草花のようにしなやかで、どんな環境にも適応できる柔軟さの持ち主。人に寄り添う優しさが魅力です。" },
  { name: "丙", reading: "ひのえ", element: "火", keyword: "太陽のような明るさ、情熱", desc: "太陽のように周囲を明るく照らす方。その情熱とエネルギーで、人を元気にする力を持っています。" },
  { name: "丁", reading: "ひのと", element: "火", keyword: "ろうそくの炎のような繊細さ、直感力", desc: "ろうそくの炎のように静かで繊細。深い直感力を持ち、人の心の機微に敏感な方です。" },
  { name: "戊", reading: "つちのえ", element: "土", keyword: "山のような安定感、包容力", desc: "山のようにどっしりとした安定感の持ち主。大きな包容力で周囲を安心させる存在です。" },
  { name: "己", reading: "つちのと", element: "土", keyword: "田畑のような育成力、母性", desc: "田畑のように豊かな育成力を持つ方。人や物事を大切に育て、花開かせる才能があります。" },
  { name: "庚", reading: "かのえ", element: "金", keyword: "鉄のような決断力、正義感", desc: "鉄のように強い意志と決断力の持ち主。一度決めたら迷わず突き進む正義の人です。" },
  { name: "辛", reading: "かのと", element: "金", keyword: "宝石のような美意識、高い理想", desc: "宝石のように美しい感性の持ち主。高い理想と洗練された美意識で、周囲を魅了します。" },
  { name: "壬", reading: "みずのえ", element: "水", keyword: "大海のような自由さ、知恵", desc: "大海のように広い視野と自由な発想の持ち主。知識の吸収力が高く、知恵で道を切り開きます。" },
  { name: "癸", reading: "みずのと", element: "水", keyword: "雨露のような癒しの力、浄化", desc: "雨露のように静かな癒しの力を持つ方。周囲を浄化し、穏やかさで人を救います。" },
];

function getDayStem(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const stemIndex = (diffDays + 10) % 10;
  return HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10];
}

// ===== タロットを1枚引く =====
function drawTarotCard() {
  const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
  const isUpright = Math.random() > 0.35;
  return { ...card, isUpright, position: isUpright ? "正位置" : "逆位置" };
}

// ===== AI鑑定生成（ローカル版） =====
function generateFortune(name, birthdate, category, concern, card, stem) {
  const categoryLabels = { love: "恋愛", work: "仕事", money: "金運" };
  const catLabel = categoryLabels[category] || "総合";

  const openings = {
    love: [
      `${name}さん、恋愛のことで胸がいっぱいなのですね。その想い、カードがしっかり受け止めてくれましたよ。`,
      `${name}さん、大切な方への想いを打ち明けてくださりありがとうございます。あなたの心に寄り添って、カードを引かせていただきました。`,
      `${name}さん、愛する気持ちって時に切なくもありますよね。でもご安心ください、今日のカードはあなたの味方ですよ。`,
    ],
    work: [
      `${name}さん、お仕事のこと、真剣に向き合っていらっしゃるのですね。その姿勢が、すでに道を切り開く力になっています。`,
      `${name}さん、毎日お疲れさまです。仕事の悩みは心身ともに消耗しますよね。あなたの気持ち、ちゃんと聞こえていますよ。`,
      `${name}さん、キャリアについて深く考えていらっしゃるのですね。その真摯さを、カードもしっかり見てくれています。`,
    ],
    money: [
      `${name}さん、お金のことって誰でも気になりますよね。前向きにご相談いただけて嬉しいです。`,
      `${name}さん、金運アップへの意識が高いですね！その姿勢自体が、すでに豊かさを引き寄せ始めていますよ。`,
      `${name}さん、経済面での新しい可能性を模索されているのですね。素晴らしい一歩だと思います。`,
    ],
  };

  const opening = openings[category]
    ? openings[category][Math.floor(Math.random() * openings[category].length)]
    : `${name}さん、ご相談ありがとうございます。あなたの声にしっかり耳を傾けて、カードを引かせていただきました。`;

  const cardMeaning = card.isUpright ? card.upright : card.reversed;
  const cardSection = card.isUpright
    ? `あなたに届いたカードは「${card.name}」の正位置。${cardMeaning}を意味する、とても心強いカードです。${concern ? `「${concern.slice(0, 20)}…」というお悩みに対して、` : ""}このカードは"流れはあなたの味方"だと告げています。今のあなたのエネルギーは正しい方向を向いていますよ。`
    : `あなたに現れたカードは「${card.name}」の逆位置。一見すると不安に感じるかもしれませんが、ご安心を。逆位置は「${cardMeaning}」というメッセージ。${concern ? `「${concern.slice(0, 20)}…」というお悩みも、` : ""}思っているより穏やかに解決へ向かうサインです。`;

  const stemSection = `四柱推命で見ると、あなたの日干は「${stem.name}（${stem.reading}）」——${stem.desc}${catLabel}の面では、この${stem.element}の気質を活かすことが開運の鍵になります。`;

  const advices = {
    love: [
      "ひとつ提案させてください。今週、相手に「ありがとう」や「嬉しい」といったポジティブな言葉を意識的に伝えてみて。小さな言葉が大きな変化を生みますよ。",
      "まずは自分自身を大切にする時間を作ってみてください。あなたが満たされることで、恋愛にも自然と良い流れが生まれます。",
      "相手との会話の中で、共通点を見つけて「私も！」と共感を伝えてみて。共鳴のエネルギーが二人を近づけます。",
    ],
    work: [
      "まず今週、「3ヶ月後にどうなっていたいか」を紙に書き出してみてください。目標が明確になると、日々の選択が変わり始めますよ。",
      "一つ試してみてほしいことがあります。仕事の中で「これは得意だな」と感じることを3つ書き出してみて。そこにキャリアのヒントが隠れています。",
      "深呼吸を3回してから重要な判断をする——このシンプルな習慣が、あなたの仕事運を大きく変えるきっかけになるでしょう。",
    ],
    money: [
      "まずは「人から褒められたこと」を3つ書き出してみてください。そこにあなたの金運の種が隠れています。小さく試して、反応が良いものを育てていくのが最強の戦略です。",
      "お財布の中を整理して、不要なレシートやカードを手放してみてください。空間ができると、そこに新しい豊かさが流れ込んできますよ。",
      "「もし失敗しないとしたら何をやりたい？」と自分に問いかけてみて。その答えの中に、金運を大きく開く鍵がありますよ。",
    ],
  };

  const advice = advices[category]
    ? advices[category][Math.floor(Math.random() * advices[category].length)]
    : "まずは深呼吸をして、自分の心の声に耳を傾けてみてください。答えはすでにあなたの中にありますよ。";

  const closings = [
    "星たちがあなたを応援しています。きっと大丈夫ですよ✨",
    "あなたの未来には、温かい光が差し込んでいます🌟",
    "一歩踏み出すあなたを、宇宙が見守っていますよ💫",
    "あなたらしく進んでいけば、道は必ず開けます🍀",
    "今日この瞬間から、新しい流れが始まっていますよ🌙",
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return { opening, cardSection, stemSection, advice, closing };
}

// ===== カードアニメーション用SVG =====
function TarotCardSVG({ cardName, isUpright, isRevealed }) {
  const rotation = !isUpright && isRevealed ? "rotate(180)" : "";
  return (
    <div
      style={{
        perspective: "800px",
        width: 180,
        height: 290,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* 裏面 */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            borderRadius: 12,
            background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #1a0a2e 100%)",
            border: "2px solid #b8860b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(184, 134, 11, 0.3)",
          }}
        >
          <div style={{ textAlign: "center", color: "#b8860b" }}>
            <div style={{ fontSize: 48 }}>✦</div>
            <div style={{ fontSize: 11, marginTop: 8, fontFamily: "'Noto Serif JP', serif", letterSpacing: 4 }}>
              星詠みの館
            </div>
            <div style={{ fontSize: 32, marginTop: 4 }}>☽</div>
          </div>
        </div>
        {/* 表面 */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 12,
            background: "linear-gradient(180deg, #0d0221 0%, #150735 40%, #1a0a3e 100%)",
            border: "2px solid #daa520",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxShadow: "0 8px 32px rgba(218, 165, 32, 0.4)",
          }}
        >
          <div style={{ transform: rotation, textAlign: "center" }}>
            <div style={{ color: "#daa520", fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
              TAROT
            </div>
            <div
              style={{
                color: "#f5e6c8",
                fontSize: 28,
                fontFamily: "'Noto Serif JP', serif",
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 8,
              }}
            >
              {cardName}
            </div>
            <div style={{ color: "#daa520", fontSize: 36, margin: "8px 0" }}>
              {["🌟", "🔮", "⭐", "🌙", "✨"][Math.floor(Math.random() * 5)]}
            </div>
            <div
              style={{
                color: isUpright ? "#90ee90" : "#ffa07a",
                fontSize: 13,
                fontWeight: 600,
                marginTop: 8,
                padding: "4px 12px",
                borderRadius: 20,
                background: isUpright ? "rgba(144,238,144,0.1)" : "rgba(255,160,122,0.1)",
                border: `1px solid ${isUpright ? "rgba(144,238,144,0.3)" : "rgba(255,160,122,0.3)"}`,
              }}
            >
              {isUpright ? "正位置" : "逆位置"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 星パーティクル背景 =====
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0,
            animation: `twinkle ${s.duration}s ${s.delay}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ===== ローディングアニメーション =====
function FortuneLoader() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 24px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#daa520",
            animation: "spin 1.2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#b8860b",
            animation: "spin 0.8s linear infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          🔮
        </div>
      </div>
      <p
        style={{
          color: "#c9b8e8",
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 15,
          animation: "fadeInOut 2s ease-in-out infinite",
        }}
      >
        星の声を聴いています…
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes fadeInOut { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ===== メインアプリ =====
export default function FortuneApp() {
  const [step, setStep] = useState("landing"); // landing -> form -> loading -> result
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    category: "love",
    concern: "",
  });
  const [result, setResult] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [textVisible, setTextVisible] = useState(0);
  const resultRef = useRef(null);

  const handleSubmit = () => {
    if (!formData.name || !formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      alert("お名前（イニシャル可）と生年月日をご入力ください");
      return;
    }
    setStep("loading");
    const card = drawTarotCard();
    const stem = getDayStem(
      parseInt(formData.birthYear),
      parseInt(formData.birthMonth),
      parseInt(formData.birthDay)
    );
    const fortune = generateFortune(
      formData.name,
      `${formData.birthYear}/${formData.birthMonth}/${formData.birthDay}`,
      formData.category,
      formData.concern,
      card,
      stem
    );

    setTimeout(() => {
      setResult({ card, stem, fortune });
      setStep("result");
      setTimeout(() => setCardRevealed(true), 600);
      setTimeout(() => setTextVisible(1), 1600);
      setTimeout(() => setTextVisible(2), 2400);
      setTimeout(() => setTextVisible(3), 3200);
      setTimeout(() => setTextVisible(4), 4000);
      setTimeout(() => setTextVisible(5), 4800);
    }, 3000);
  };

  const sectionStyle = (index) => ({
    opacity: textVisible >= index ? 1 : 0,
    transform: textVisible >= index ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.8s ease, transform 0.8s ease",
  });

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid rgba(184,134,11,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5e6c8",
    fontSize: 16,
    fontFamily: "'Noto Sans JP', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  const labelStyle = {
    display: "block",
    color: "#c9b8e8",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    fontFamily: "'Noto Serif JP', serif",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #060114 0%, #0d0221 30%, #150735 60%, #0a0118 100%)",
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Noto+Sans+JP:wght@300;400;600&display=swap"
        rel="stylesheet"
      />
      <StarField />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>
        {/* ===== LANDING ===== */}
        {step === "landing" && (
          <div
            style={{
              textAlign: "center",
              paddingTop: 80,
              animation: "fadeIn 1s ease",
            }}
          >
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div style={{ fontSize: 14, color: "#b8860b", letterSpacing: 6, marginBottom: 16 }}>
              ✦ AI FORTUNE TELLING ✦
            </div>
            <h1
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 36,
                fontWeight: 700,
                color: "#f5e6c8",
                margin: "0 0 8px",
                lineHeight: 1.4,
              }}
            >
              星詠みの館
            </h1>
            <p style={{ color: "#9b8ec4", fontSize: 14, margin: "0 0 40px", lineHeight: 1.8 }}>
              タロット × 四柱推命 × スピリチュアル
              <br />
              あなただけの星の声をお届けします
            </p>

            <div
              style={{
                fontSize: 72,
                margin: "20px 0 40px",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              🔮
            </div>
            <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>

            <div
              style={{
                background: "rgba(184,134,11,0.08)",
                border: "1px solid rgba(184,134,11,0.2)",
                borderRadius: 16,
                padding: "24px 20px",
                marginBottom: 40,
                textAlign: "left",
              }}
            >
              <p style={{ color: "#c9b8e8", fontSize: 14, lineHeight: 2, margin: 0 }}>
                🌙 生年月日とお悩みを入力するだけ
                <br />
                🌙 AIがタロットと四柱推命で鑑定
                <br />
                🌙 あなただけの特別なメッセージをお届け
                <br />
                🌙 <span style={{ color: "#daa520" }}>完全無料</span>・所要時間わずか1分
              </p>
            </div>

            <button
              onClick={() => setStep("form")}
              style={{
                width: "100%",
                padding: "18px 0",
                borderRadius: 50,
                border: "none",
                background: "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)",
                color: "#0d0221",
                fontSize: 17,
                fontWeight: 700,
                fontFamily: "'Noto Serif JP', serif",
                cursor: "pointer",
                letterSpacing: 2,
                boxShadow: "0 4px 24px rgba(184,134,11,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.03)";
                e.target.style.boxShadow = "0 6px 32px rgba(184,134,11,0.6)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 24px rgba(184,134,11,0.4)";
              }}
            >
              ✦ 無料鑑定をはじめる ✦
            </button>

            <p style={{ color: "#665c80", fontSize: 11, marginTop: 20 }}>
              ※個人情報は鑑定にのみ使用し、保存されません
            </p>

            <div
              style={{
                marginTop: 60,
                padding: "20px",
                borderTop: "1px solid rgba(184,134,11,0.15)",
              }}
            >
              <p style={{ color: "#665c80", fontSize: 11, lineHeight: 1.8, margin: 0 }}>
                占いは娯楽としてお楽しみください。
                <br />
                医療・法律・投資の専門的助言ではありません。
              </p>
            </div>
          </div>
        )}

        {/* ===== FORM ===== */}
        {step === "form" && (
          <div style={{ paddingTop: 40, animation: "fadeIn 0.6s ease" }}>
            <button
              onClick={() => setStep("landing")}
              style={{
                background: "none",
                border: "none",
                color: "#9b8ec4",
                fontSize: 14,
                cursor: "pointer",
                padding: "8px 0",
                marginBottom: 16,
              }}
            >
              ← 戻る
            </button>

            <h2
              style={{
                fontFamily: "'Noto Serif JP', serif",
                color: "#f5e6c8",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              鑑定に必要な情報
            </h2>
            <p style={{ color: "#9b8ec4", fontSize: 13, marginBottom: 32 }}>
              あなたの星を正確に読み解くために
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>お名前（イニシャル可）</label>
              <input
                type="text"
                placeholder="例: M.K / みき"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(184,134,11,0.6)";
                  e.target.style.boxShadow = "0 0 12px rgba(184,134,11,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(184,134,11,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>生年月日</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="年 (例:1990)"
                  value={formData.birthYear}
                  onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                  style={{ ...inputStyle, flex: 2 }}
                  min="1920"
                  max="2010"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.3)";
                  }}
                />
                <input
                  type="number"
                  placeholder="月"
                  value={formData.birthMonth}
                  onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  min="1"
                  max="12"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.3)";
                  }}
                />
                <input
                  type="number"
                  placeholder="日"
                  value={formData.birthDay}
                  onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  min="1"
                  max="31"
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(184,134,11,0.3)";
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>鑑定カテゴリ</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "love", label: "💕 恋愛" },
                  { value: "work", label: "💼 仕事" },
                  { value: "money", label: "💰 金運" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      borderRadius: 10,
                      border: `2px solid ${formData.category === cat.value ? "#daa520" : "rgba(184,134,11,0.2)"}`,
                      background:
                        formData.category === cat.value
                          ? "rgba(218,165,32,0.12)"
                          : "rgba(255,255,255,0.03)",
                      color: formData.category === cat.value ? "#f5e6c8" : "#9b8ec4",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>
                今のお悩み（任意・100文字以内）
              </label>
              <textarea
                placeholder="例: 気になる人がいるけど、距離が縮まらない…"
                value={formData.concern}
                onChange={(e) =>
                  setFormData({ ...formData, concern: e.target.value.slice(0, 100) })
                }
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "none",
                  lineHeight: 1.8,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(184,134,11,0.6)";
                  e.target.style.boxShadow = "0 0 12px rgba(184,134,11,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(184,134,11,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <div style={{ textAlign: "right", color: "#665c80", fontSize: 11, marginTop: 4 }}>
                {formData.concern.length}/100
              </div>
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%",
                padding: "18px 0",
                borderRadius: 50,
                border: "none",
                background: "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)",
                color: "#0d0221",
                fontSize: 17,
                fontWeight: 700,
                fontFamily: "'Noto Serif JP', serif",
                cursor: "pointer",
                letterSpacing: 2,
                boxShadow: "0 4px 24px rgba(184,134,11,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.03)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              🔮 カードを引く
            </button>

            <p style={{ color: "#665c80", fontSize: 11, textAlign: "center", marginTop: 16 }}>
              ※入力情報は鑑定のみに使用し、保存されません
            </p>
          </div>
        )}

        {/* ===== LOADING ===== */}
        {step === "loading" && (
          <div style={{ paddingTop: 120 }}>
            <FortuneLoader />
          </div>
        )}

        {/* ===== RESULT ===== */}
        {step === "result" && result && (
          <div ref={resultRef} style={{ paddingTop: 40, paddingBottom: 60, animation: "fadeIn 0.6s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ color: "#b8860b", fontSize: 12, letterSpacing: 4, marginBottom: 8 }}>
                ✦ YOUR TAROT READING ✦
              </div>
              <h2
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  color: "#f5e6c8",
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {formData.name}さんへの鑑定結果
              </h2>
            </div>

            {/* カード */}
            <div style={{ marginBottom: 36 }}>
              <TarotCardSVG
                cardName={result.card.name}
                isUpright={result.card.isUpright}
                isRevealed={cardRevealed}
              />
            </div>

            {/* 鑑定文 */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(184,134,11,0.15)",
                borderRadius: 16,
                padding: "28px 22px",
                marginBottom: 32,
              }}
            >
              <div style={sectionStyle(1)}>
                <p
                  style={{
                    color: "#e8dff0",
                    fontSize: 15,
                    lineHeight: 2,
                    margin: "0 0 20px",
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {result.fortune.opening}
                </p>
              </div>

              <div style={sectionStyle(2)}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    color: "#daa520",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>🃏</span>
                  <span>
                    タロット「{result.card.name}」{result.card.position}
                  </span>
                </div>
                <p
                  style={{
                    color: "#e8dff0",
                    fontSize: 15,
                    lineHeight: 2,
                    margin: "0 0 20px",
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {result.fortune.cardSection}
                </p>
              </div>

              <div style={sectionStyle(3)}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    color: "#daa520",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>☯</span>
                  <span>
                    四柱推命「{result.stem.name}（{result.stem.reading}）」
                  </span>
                </div>
                <p
                  style={{
                    color: "#e8dff0",
                    fontSize: 15,
                    lineHeight: 2,
                    margin: "0 0 20px",
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {result.fortune.stemSection}
                </p>
              </div>

              <div style={sectionStyle(4)}>
                <div
                  style={{
                    background: "rgba(184,134,11,0.08)",
                    border: "1px solid rgba(184,134,11,0.2)",
                    borderRadius: 12,
                    padding: "16px 18px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ color: "#daa520", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    💡 星からのアドバイス
                  </div>
                  <p
                    style={{
                      color: "#f5e6c8",
                      fontSize: 15,
                      lineHeight: 2,
                      margin: 0,
                      fontFamily: "'Noto Serif JP', serif",
                    }}
                  >
                    {result.fortune.advice}
                  </p>
                </div>
              </div>

              <div style={sectionStyle(5)}>
                <p
                  style={{
                    color: "#c9b8e8",
                    fontSize: 15,
                    lineHeight: 2,
                    margin: 0,
                    textAlign: "center",
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {result.fortune.closing}
                </p>
              </div>
            </div>

            {/* 有料導線 */}
            <div style={sectionStyle(5)}>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(184,134,11,0.08) 0%, rgba(218,165,32,0.05) 100%)",
                  border: "1px solid rgba(184,134,11,0.25)",
                  borderRadius: 16,
                  padding: "28px 22px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🌙</div>
                  <h3
                    style={{
                      fontFamily: "'Noto Serif JP', serif",
                      color: "#f5e6c8",
                      fontSize: 18,
                      fontWeight: 700,
                      margin: "0 0 8px",
                    }}
                  >
                    もう少し深くお伝えしたいことがあります
                  </h3>
                  <p
                    style={{
                      color: "#9b8ec4",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.8,
                    }}
                  >
                    1枚のカードでは伝えきれなかった
                    <br />
                    あなたの運命の流れ、もっと詳しくお話しできます
                  </p>
                </div>

                {/* メニュー1 */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(184,134,11,0.15)",
                    borderRadius: 12,
                    padding: "18px",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "#f5e6c8", fontSize: 15, fontWeight: 600 }}>
                      📩 LINE詳細鑑定
                    </span>
                    <span
                      style={{
                        color: "#daa520",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "'Noto Serif JP', serif",
                      }}
                    >
                      ¥3,000
                    </span>
                  </div>
                  <p style={{ color: "#9b8ec4", fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                    タロット3枚引き＋四柱推命フル鑑定＋3ヶ月の運勢
                    <br />
                    24時間以内にテキストでお届け
                  </p>
                </div>

                {/* メニュー2 */}
                <div
                  style={{
                    background: "rgba(218,165,32,0.06)",
                    border: "1px solid rgba(184,134,11,0.25)",
                    borderRadius: 12,
                    padding: "18px",
                    marginBottom: 20,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      background: "linear-gradient(135deg, #b8860b, #daa520)",
                      color: "#0d0221",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    人気No.1
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "#f5e6c8", fontSize: 15, fontWeight: 600 }}>
                      🎥 Zoom個別鑑定（30分）
                    </span>
                    <span
                      style={{
                        color: "#daa520",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "'Noto Serif JP', serif",
                      }}
                    >
                      ¥5,000
                    </span>
                  </div>
                  <p style={{ color: "#9b8ec4", fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                    リアルタイム対話の特別鑑定
                    <br />
                    あなただけのオリジナルスプレッド
                  </p>
                </div>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "ここにStripe決済リンクまたはLINE公式アカウントのURLを設定します\n\n例:\nhttps://buy.stripe.com/your-link\nhttps://lin.ee/your-line-id"
                    );
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 50,
                    border: "none",
                    background: "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)",
                    color: "#0d0221",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Noto Serif JP', serif",
                    textAlign: "center",
                    textDecoration: "none",
                    letterSpacing: 1,
                    boxShadow: "0 4px 24px rgba(184,134,11,0.4)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  ✦ 詳しい鑑定を予約する ✦
                </a>
              </div>
            </div>

            {/* もう一度占う */}
            <button
              onClick={() => {
                setStep("form");
                setResult(null);
                setCardRevealed(false);
                setTextVisible(0);
              }}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 50,
                border: "1px solid rgba(184,134,11,0.3)",
                background: "transparent",
                color: "#c9b8e8",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Noto Serif JP', serif",
                marginBottom: 16,
              }}
            >
              🔮 もう一度占う
            </button>

            {/* シェアボタン */}
            <button
              onClick={() => {
                const shareText = `🔮星詠みの館で占ってもらった！\nタロット「${result.card.name}」${result.card.position} × 四柱推命「${result.stem.name}」\n${result.fortune.closing}\n\n▶ 無料鑑定はこちら → [あなたのURL]`;
                if (navigator.share) {
                  navigator.share({ text: shareText });
                } else {
                  navigator.clipboard.writeText(shareText);
                  alert("シェア用テキストをコピーしました！SNSに貼り付けてね✨");
                }
              }}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 50,
                border: "1px solid rgba(155,142,196,0.3)",
                background: "transparent",
                color: "#9b8ec4",
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 40,
              }}
            >
              📱 結果をシェアする
            </button>

            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <p style={{ color: "#665c80", fontSize: 11, lineHeight: 1.8 }}>
                占いは娯楽としてお楽しみください。
                <br />© 星詠みの館
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
