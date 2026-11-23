(function () {
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rs-theme', next); } catch (e) {}
  });

  var side = document.getElementById('sidebar');
  var btn = document.querySelector('.menu-btn');
  function closeNav() { if (side && side.classList.contains('open')) { side.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } }
  if (btn && side) {
    btn.addEventListener('click', function () {
      var open = side.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    side.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  }

  document.querySelectorAll('pre.code').forEach(function (pre) {
    var b = document.createElement('button');
    b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy'; b.setAttribute('aria-label', 'Copy code');
    b.addEventListener('click', function () {
      var t = pre.querySelector('code').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); }, function () { b.textContent = 'Press Ctrl+C'; });
    });
    pre.appendChild(b);
  });

  // search
  var q = document.getElementById('q'), res = document.getElementById('results'), idx = window.__DOCS_INDEX__ || [];
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (q) q.addEventListener('input', function () {
    var term = q.value.trim().toLowerCase();
    if (term.length < 2) { res.hidden = true; res.innerHTML = ''; return; }
    var hits = [];
    idx.forEach(function (d) {
      var tl = d.t.toLowerCase(), xl = d.x.toLowerCase(), p = xl.indexOf(term);
      if (tl.indexOf(term) > -1 || p > -1) hits.push({ d: d, s: tl.indexOf(term) > -1 ? 0 : 1, p: p });
    });
    hits.sort(function (a, b) { return a.s - b.s; });
    res.innerHTML = hits.length ? hits.slice(0, 8).map(function (h) {
      var snip = h.p > -1 ? '...' + esc(h.d.x.substr(Math.max(0, h.p - 40), 110)) + '...' : '';
      return '<li role="option"><a href="' + h.d.u + '">' + esc(h.d.t) + '<small>' + snip + '</small></a></li>';
    }).join('') : '<li role="option"><a href="#" onclick="return false">No results</a></li>';
    res.hidden = false;
  });

  // lightbox for figures: opens the image at a readable size; wide diagrams scroll sideways on phones
  var lb = document.getElementById('lightbox');
  if (lb) {
    var body = lb.querySelector('.lb-body');
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.zoom');
      if (!a) return;
      e.preventDefault();
      var imgs = [].slice.call(a.querySelectorAll('img'));
      var visible = imgs.filter(function (i) { return i.offsetParent !== null; })[0] || imgs[0];
      if (!visible) return;
      var big = document.createElement('img');
      big.src = visible.currentSrc || visible.src; big.alt = visible.alt;
      if (!/\.svg(\?|$)/.test(big.src)) big.className = 'raster';
      body.textContent = ''; body.appendChild(big);
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
      body.scrollTop = 0; body.scrollLeft = 0;
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && q && document.activeElement !== q && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape') { if (res) res.hidden = true; closeNav(); }
  });
  document.addEventListener('click', function (e) { if (res && !e.target.closest('.search')) res.hidden = true; });

  var links = [].slice.call(document.querySelectorAll('.toc a'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[en.target.id]; if (a) a.classList.add('on'); } });
    }, { rootMargin: '-10% 0px -80% 0px' });
    document.querySelectorAll('article h2[id], article h3[id]').forEach(function (h) { io.observe(h); });
  }
})();
