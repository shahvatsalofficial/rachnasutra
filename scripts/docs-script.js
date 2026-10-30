(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem('rs-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  document.querySelector('.theme-btn').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rs-theme', next); } catch (e) {}
  });
  var btn = document.querySelector('.menu-btn'), side = document.getElementById('sidebar');
  btn.addEventListener('click', function () {
    var open = side.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('pre.code').forEach(function (pre) {
    var b = document.createElement('button');
    b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy'; b.setAttribute('aria-label', 'Copy code');
    b.addEventListener('click', function () {
      var t = pre.querySelector('code').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); }, function () { b.textContent = 'Press Ctrl+C'; });
    });
    pre.appendChild(b);
  });
  var q = document.getElementById('q'), res = document.getElementById('results'), idx = window.__DOCS_INDEX__ || [];
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  q.addEventListener('input', function () {
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
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape') { res.hidden = true; if (side.classList.contains('open')) { side.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) res.hidden = true; });
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[en.target.id]; if (a) a.classList.add('on'); } });
    }, { rootMargin: '-10% 0px -80% 0px' });
    document.querySelectorAll('article h2[id], article h3[id]').forEach(function (h) { io.observe(h); });
  }
})();
