(function() {
  'use strict';

  var TAROT_IMAGE_URLS = [];
  var selectedCategory = 'love';
  var lastResult = null;

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

  function getShareText() {
    if (!lastResult) return { text: '', url: window.location.href };
    var u = window.location.href;
    var t = String.fromCharCode(0xD83C, 0xDF36) + '星詠みの館で占ってもらった！\nタロット「' + lastResult.card.name + '」' + lastResult.card.position + ' × 四柱推命「' + lastResult.stem.name + '」\n\n▶ 無料鑑定はこちら → ' + u;
    return { text: t, url: u };
  }

  function shareToX() {
    if (!lastResult) return;
    var s = getShareText();
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(s.text), '_blank', 'noopener,noreferrer');
  }

  function shareToLine() {
    if (!lastResult) return;
    var s = getShareText();
    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(s.text), '_blank', 'noopener,noreferrer');
  }

  function shareCopy() {
    if (!lastResult) return;
    var s = getShareText();
    navigator.clipboard.writeText(s.text).then(function() {
      alert('コピーしました！');
    }).catch(function() {
      alert('コピーに失敗しました');
    });
  }

  function shareNative() {
    if (!lastResult || !navigator.share) return;
    var s = getShareText();
    navigator.share({ text: s.text, title: '星詠みの館', url: s.url });
  }

  function setupShareButtons() {
    var n = document.getElementById('share-native');
    if (n && navigator.share) n.style.display = 'inline-flex';
  }

  function submitFortune() {
    var name = document.getElementById('input-name').value.trim();
    var year = document.getElementById('input-year').value;
    var month = document.getElementById('input-month').value;
    var day = document.getElementById('input-day').value;
    var concern = document.getElementById('input-concern').value.trim();
    if (!name || !year || !month || !day) {
      alert('お名前と生年月日をご入力ください');
      return;
    }
    showPage('loading');
    fetch('/api/fortune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        birth_year: parseInt(year, 10),
        birth_month: parseInt(month, 10),
        birth_day: parseInt(day, 10),
        category: selectedCategory,
        concern: concern
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      lastResult = data;
      displayResult(data, name);
    })
    .catch(function(err) {
      console.error(err);
      alert('申し訳ございません。しばらくしてからもう一度お試しください。');
      showPage('form');
    });
  }

  function resetForm() {
    showPage('form');
    lastResult = null;
  }

  function displayResult(data, name) {
    var titleEl = document.getElementById('result-title');
    var cardLabel = document.getElementById('result-card-label');
    var stemLabel = document.getElementById('result-stem-label');
    if (titleEl) titleEl.textContent = name + 'さんへの鑑定結果';
    if (cardLabel) cardLabel.innerHTML = '🃏 タロット「' + data.card.name + '」' + data.card.position;
    if (stemLabel) stemLabel.innerHTML = '☯ 四柱推命「' + data.stem.name + '（' + data.stem.reading + '）」';
    var cardName = document.getElementById('tarot-card-name');
    var cardNum = document.getElementById('tarot-card-number');
    var cardPos = document.getElementById('tarot-card-position');
    var resultText = document.getElementById('result-text');
    if (cardName) cardName.textContent = data.card.name;
    if (cardNum) cardNum.textContent = 'No.' + String(data.card.number).padStart(2, '0');
    if (cardPos) cardPos.textContent = data.card.position;
    if (resultText) resultText.textContent = data.fortune_text;

    var tarotImgEl = document.getElementById('tarot-card-image');
    if (tarotImgEl && data.card) {
      var num = data.card.number;
      var url = TAROT_IMAGE_URLS[num];
      if (url) {
        tarotImgEl.src = url;
      } else {
        fetch('/api/tarot-urls').then(function(r) { return r.json(); }).then(function(urls) {
          for (var i = 0; i < (urls || []).length; i++) TAROT_IMAGE_URLS[i] = urls[i];
          if (TAROT_IMAGE_URLS[num]) tarotImgEl.src = TAROT_IMAGE_URLS[num];
        });
      }
    }
    var tarotCardEl = document.getElementById('tarot-card');
    if (tarotCardEl) tarotCardEl.classList.toggle('reversed', !data.card.is_upright);

    setupShareButtons();
    showPage('result');
  }

  function selectCat(btn) {
    document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    selectedCategory = btn.dataset.cat || 'love';
  }

  function updateCount() {
    var el = document.getElementById('char-count');
    var concern = document.getElementById('input-concern');
    if (el && concern) el.textContent = concern.value.length;
  }

  window.showPage = showPage;
  window.submitFortune = submitFortune;
  window.resetForm = resetForm;
  window.selectCat = selectCat;
  window.updateCount = updateCount;
  window.shareToX = shareToX;
  window.shareToLine = shareToLine;
  window.shareCopy = shareCopy;
  window.shareNative = shareNative;

  fetch('/api/tarot-urls').then(function(r) { return r.json(); }).then(function(urls) {
    for (var i = 0; i < (urls || []).length; i++) TAROT_IMAGE_URLS[i] = urls[i];
  }).catch(function() {});

  var container = document.getElementById('stars');
  if (container) {
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
  }
})();
