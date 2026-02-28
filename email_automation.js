/**
 * 星詠みの館 — 自動メール返信システム
 * 
 * 【使い方】
 * 1. Googleスプレッドシートを新規作成
 * 2. メニュー「拡張機能」→「Apps Script」を開く
 * 3. このコード全体をコピーして貼り付け
 * 4. YOUR_EMAIL を自分のメールアドレスに変更
 * 5. 「実行」→ 初回は権限許可が必要
 * 6. トリガー設定：「トリガー」→「トリガーを追加」→ 
 *    関数: checkNewPurchases / イベント: 時間主導型 / 5分おき
 */

// ===== 設定 =====
const YOUR_EMAIL = "your-email@gmail.com"; // ← 自分のメールに変更！
const SHEET_NAME = "購入管理";

// ===== 決済完了時の自動メール（LINE詳細鑑定用） =====
function sendLineReadingConfirmation(customerEmail, customerName) {
  const subject = "🌙 星詠みの館 — LINE詳細鑑定のご購入ありがとうございます";
  const body = `
${customerName || "お客"}様

星詠みの館をご利用いただき、ありがとうございます✨

LINE詳細鑑定（¥3,000）のご購入を確認いたしました。

━━━━━━━━━━━━━━━━━━
📩 鑑定のお届けについて
━━━━━━━━━━━━━━━━━━

以下の情報を、LINE公式アカウントにお送りください：

1. お名前（フルネーム or イニシャル）
2. 生年月日
3. ご相談内容（できるだけ詳しく）

▶ LINE公式アカウント: [あなたのLINE URLをここに]

情報をいただいてから24時間以内に、
タロット3枚引き＋四柱推命フル鑑定＋3ヶ月の運勢を
心を込めてお届けいたします。

━━━━━━━━━━━━━━━━━━

何かご不明な点がございましたら、
このメールに返信いただくか、LINEでお気軽にどうぞ。

あなたの星が輝く未来を、心よりお祈りしております🌟

星詠みの館
`.trim();

  GmailApp.sendEmail(customerEmail, subject, body);
  
  // 自分にも通知
  GmailApp.sendEmail(YOUR_EMAIL, 
    "【星詠み】新規購入: LINE詳細鑑定 ¥3,000", 
    `新規購入がありました！\n\n顧客: ${customerName || "不明"}\nメール: ${customerEmail}\n商品: LINE詳細鑑定\n\nLINEでの連絡をお待ちください。`
  );
}

// ===== 決済完了時の自動メール（Zoom鑑定用） =====
function sendZoomReadingConfirmation(customerEmail, customerName) {
  const subject = "🌙 星詠みの館 — Zoom個別鑑定のご予約ありがとうございます";
  const body = `
${customerName || "お客"}様

星詠みの館をご利用いただき、ありがとうございます✨

Zoom個別鑑定（¥5,000 / 30分）のご購入を確認いたしました。

━━━━━━━━━━━━━━━━━━
🎥 ご予約について
━━━━━━━━━━━━━━━━━━

以下のリンクから、ご都合の良い日時をお選びください：

▶ 予約ページ: [あなたのCalendly URLをここに]

※ ご予約後、Zoomリンクが自動で届きます
※ 事前に生年月日とご相談内容をお伝えいただけると
   より深い鑑定が可能です

━━━━━━━━━━━━━━━━━━
📝 当日の流れ
━━━━━━━━━━━━━━━━━━

1. Zoomに入室（5分前からOK）
2. 簡単なご挨拶＆お悩みの確認
3. タロットリーディング（リアルタイム）
4. 四柱推命による深い分析
5. まとめ＆アドバイス

━━━━━━━━━━━━━━━━━━

あなたとお話できることを楽しみにしております🌙

星詠みの館
`.trim();

  GmailApp.sendEmail(customerEmail, subject, body);
  
  GmailApp.sendEmail(YOUR_EMAIL, 
    "【星詠み】新規購入: Zoom個別鑑定 ¥5,000", 
    `新規購入がありました！\n\n顧客: ${customerName || "不明"}\nメール: ${customerEmail}\n商品: Zoom個別鑑定\n\nCalendlyでの予約をお待ちください。`
  );
}

// ===== フォローアップメール（鑑定後3日後に送信） =====
function sendFollowUpEmail(customerEmail, customerName, productType) {
  const subject = "🌟 星詠みの館 — その後いかがですか？";
  const body = `
${customerName || "お客"}様

先日は星詠みの館をご利用いただき、
ありがとうございました✨

鑑定からお時間が経ちましたが、
その後いかがでしょうか？

鑑定でお伝えしたアドバイス、
少しでもお役に立てていたら嬉しいです。

━━━━━━━━━━━━━━━━━━

もし追加でご相談したいことがあれば、
いつでもLINEでお声がけくださいね。

また、よろしければ
ご感想をいただけるととても励みになります🙏

▶ LINE: [あなたのLINE URL]

━━━━━━━━━━━━━━━━━━

🎁 リピーター様特典

次回のご鑑定が 10%OFF になります！
クーポンコード: STAR10

━━━━━━━━━━━━━━━━━━

あなたの毎日に、星の祝福がありますように🌙

星詠みの館
`.trim();

  GmailApp.sendEmail(customerEmail, subject, body);
}

// ===== スプレッドシート管理用 =====
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "日時", "名前", "メール", "商品", "金額", 
      "ステータス", "確認メール送信", "フォローアップ送信"
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
  }
  return sheet;
}

// ===== 手動で購入記録を追加するUI =====
function addPurchaseRecord() {
  const ui = SpreadsheetApp.getUi();
  
  const nameRes = ui.prompt("顧客名を入力:");
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  
  const emailRes = ui.prompt("顧客メールアドレス:");
  if (emailRes.getSelectedButton() !== ui.Button.OK) return;
  
  const productRes = ui.prompt("商品 (LINE / Zoom / 月額):");
  if (productRes.getSelectedButton() !== ui.Button.OK) return;
  
  const sheet = initSheet();
  const product = productRes.getResponseText().trim();
  const amount = product.includes("LINE") ? 3000 : product.includes("Zoom") ? 5000 : 1980;
  
  sheet.appendRow([
    new Date(),
    nameRes.getResponseText().trim(),
    emailRes.getResponseText().trim(),
    product,
    amount,
    "決済完了",
    "未送信",
    "未送信"
  ]);
  
  // 自動メール送信
  const email = emailRes.getResponseText().trim();
  const name = nameRes.getResponseText().trim();
  
  if (product.includes("LINE")) {
    sendLineReadingConfirmation(email, name);
  } else if (product.includes("Zoom")) {
    sendZoomReadingConfirmation(email, name);
  }
  
  // 送信済みに更新
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 7).setValue("送信済み " + new Date().toLocaleDateString());
  
  ui.alert("購入記録を追加し、確認メールを送信しました！");
}

// ===== メニューに追加 =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⭐ 星詠みの館")
    .addItem("📝 購入記録を追加", "addPurchaseRecord")
    .addItem("📊 シートを初期化", "initSheet")
    .addToUi();
}
