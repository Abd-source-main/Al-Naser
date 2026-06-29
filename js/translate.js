// Force Google Translate to load properly
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,ar,zh-CN'
  }, 'google_translate_element');
}

// Wait for full page load
window.addEventListener('load', function () {
  // Remove Google's banner
  setTimeout(function () {
    var banner = document.querySelector('.goog-te-banner-frame');
    if (banner) banner.style.display = 'none';
    document.body.style.top = '0px';
  }, 1000);

  // Your button handler
  const langBtn = document.querySelector('button[aria-label="Language"]');
  if (langBtn) {
    langBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      let menu = document.getElementById('customLangMenu');
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'customLangMenu';
        // Match the site's dark-navy / gold theme (see css/base.css :root).
        menu.style.cssText = 'position:fixed;background:#041828;border:1px solid rgba(201,168,76,0.25);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,0.45);z-index:10000;min-width:150px;overflow:hidden;font-family:"DM Sans",sans-serif';
        var itemStyle = 'padding:10px 18px;cursor:pointer;color:#cddde8;font-size:0.9rem;transition:background .15s,color .15s';
        var hoverIn = "this.style.background='rgba(201,168,76,0.15)';this.style.color='#e2c278'";
        var hoverOut = "this.style.background='transparent';this.style.color='#cddde8'";
        function langItem(code, label) {
          return '<div onclick="window.changeLang(\'' + code + '\')" onmouseover="' + hoverIn +
            '" onmouseout="' + hoverOut + '" style="' + itemStyle + '">' + label + '</div>';
        }
        menu.innerHTML = '<div style="padding:4px 0">' +
          langItem('en', '🇬🇧 English') +
          langItem('ar', '🇸🇦 Arabic') +
          langItem('zh-CN', '🇨🇳 Chinese') +
          '</div>';
        document.body.appendChild(menu);
      }

      const rect = langBtn.getBoundingClientRect();
      menu.style.top = rect.bottom + 5 + 'px';
      menu.style.right = window.innerWidth - rect.right + 'px';
      menu.style.left = 'auto';
      menu.style.display = 'block';

      function closeHandler(e) {
        if (!menu.contains(e.target) && e.target !== langBtn) {
          menu.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        }
      }
      setTimeout(() => document.addEventListener('click', closeHandler), 0);
    });
  }
});

// Global function for language change
window.changeLang = function (lang) {
  const checkExist = setInterval(function () {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
      clearInterval(checkExist);
    }
  }, 100);

  setTimeout(function () {
    const menu = document.getElementById('customLangMenu');
    if (menu) menu.style.display = 'none';
  }, 100);
};
