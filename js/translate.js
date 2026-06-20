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
        menu.style.cssText = 'position:fixed;background:white;border:1px solid #ccc;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:10000;min-width:140px';
        menu.innerHTML = '<div style="padding:5px 0"><div onclick="window.changeLang(\'en\')" style="padding:8px 20px;cursor:pointer">🇬🇧 English</div><div onclick="window.changeLang(\'ar\')" style="padding:8px 20px;cursor:pointer">🇸🇦 Arabic</div><div onclick="window.changeLang(\'zh-CN\')" style="padding:8px 20px;cursor:pointer">🇨🇳 Chinese</div></div>';
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
