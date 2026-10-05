/* Navain AI — reveal-on-scroll + counters.
   Replaces the 116 KB GSAP bundle. ~1 KB.
   Safe by default: if this file never loads, navain.css shows
   all .reveal content because <html> has no .js class. */
document.documentElement.classList.add('js');

(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  function show(el) { el.classList.add('in'); }

  // Stagger siblings inside grids for a subtle cascade.
  var groups = {};
  Array.prototype.forEach.call(els, function (el) {
    var p = el.parentNode;
    if (!p) return;
    var k = p.__navainKey || (p.__navainKey = Math.random());
    groups[k] = (groups[k] || 0) + 1;
    if (groups[k] > 1) el.style.transitionDelay = Math.min((groups[k] - 1) * 70, 280) + 'ms';
  });

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(els, show);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  Array.prototype.forEach.call(els, function (el) { io.observe(el); });

  // Anything already in view on first paint: reveal immediately.
  requestAnimationFrame(function () {
    Array.prototype.forEach.call(els, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94) show(el);
    });
  });
})();
