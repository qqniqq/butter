(function () {
  'use strict';

  var doc = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  doc.documentElement.classList.remove('no-js');

  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- reveal on scroll (3D rise) ---------- */
  var items = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- scroll progress ---------- */
  var progress = doc.getElementById('progress');
  if (progress) {
    var onScrollBar = function () {
      var h = doc.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScrollBar, { passive: true });
    onScrollBar();
  }

  /* ---------- shared mouse state ---------- */
  var mx = -9999, my = -9999;
  if (fine) {
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });
  }

  /* ---------- coffee-bean particle field ---------- */
  var canvas = doc.getElementById('fx');
  if (canvas && !reduced && window.requestAnimationFrame) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var beans = [];
    var COUNT = fine ? 60 : 32;

    var resizeFx = function () {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    var makeBean = function (anywhere) {
      var z = 0.25 + Math.random() * 0.75;
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 30,
        z: z,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.006,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.18 + Math.random() * 0.4) * z,
        ox: 0,
        oy: 0
      };
    };

    var drawBean = function (x, y, s, rot, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#6b4a2f';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.62, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#faf7f2';
      ctx.lineWidth = Math.max(1, s * 0.14);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.quadraticCurveTo(s * 0.34, 0, 0, s * 0.8);
      ctx.stroke();
      ctx.restore();
    };

    resizeFx();
    for (var i = 0; i < COUNT; i++) beans.push(makeBean(true));
    window.addEventListener('resize', resizeFx);

    (function loop() {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      for (var i = 0; i < beans.length; i++) {
        var b = beans[i];
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        if (b.y < -40) beans[i] = b = makeBean(false);
        if (b.x < -40) b.x = W + 30;
        if (b.x > W + 40) b.x = -30;
        var dx = b.x - mx, dy = b.y - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150 && d > 0.001) {
          var f = (150 - d) / 150;
          b.ox += (dx / d) * f * 2.4;
          b.oy += (dy / d) * f * 2.4;
        }
        b.ox *= 0.9;
        b.oy *= 0.9;
        var parX = fine && mx > -999 ? ((mx - cx) / cx) * 14 * b.z : 0;
        var parY = fine && my > -999 ? ((my - cy) / cy) * 10 * b.z : 0;
        drawBean(b.x + b.ox + parX, b.y + b.oy + parY, 4 + b.z * 8, b.rot, 0.10 + b.z * 0.16);
      }
      window.requestAnimationFrame(loop);
    })();
  }

  /* ---------- hero 3D scene parallax ---------- */
  var scene = doc.querySelector('.scene');
  if (scene && !reduced) {
    var chips = Array.prototype.slice.call(scene.querySelectorAll('.chip'));
    if (fine) {
      window.addEventListener('mousemove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        chips.forEach(function (ch) {
          var d = parseFloat(ch.getAttribute('data-depth')) || 0.5;
          ch.style.setProperty('--px', (-nx * 46 * d).toFixed(1) + 'px');
          ch.style.setProperty('--py', (-ny * 30 * d).toFixed(1) + 'px');
        });
      }, { passive: true });
    }
    window.addEventListener('scroll', function () {
      var y = window.scrollY || doc.documentElement.scrollTop;
      if (y > window.innerHeight * 1.4) return;
      chips.forEach(function (ch) {
        var d = parseFloat(ch.getAttribute('data-depth')) || 0.5;
        ch.style.setProperty('--sy', (y * 0.22 * d).toFixed(1) + 'px');
      });
    }, { passive: true });
  }

  /* ---------- spotlight cards (cursor glow) ---------- */
  if (fine && !reduced) {
    Array.prototype.forEach.call(doc.querySelectorAll('.spot'), function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 3D tilt with glare ---------- */
  if (fine && !reduced) {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-tilt]'), function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 8;
      var glare = doc.createElement('span');
      glare.className = 'tilt__glare';
      el.appendChild(glare);
      el.classList.add('tilt');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform .12s ease-out';
        el.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - py) * max).toFixed(2) + 'deg)' +
          ' rotateY(' + ((px - 0.5) * max).toFixed(2) + 'deg) scale3d(1.015,1.015,1.015)';
        glare.style.opacity = '1';
        glare.style.background =
          'radial-gradient(circle at ' + (px * 100).toFixed(1) + '% ' + (py * 100).toFixed(1) +
          '%, rgba(255,255,255,.38), rgba(255,255,255,0) 62%)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.3,1)';
        el.style.transform = '';
        glare.style.opacity = '0';
      });
    });
  }

  /* ---------- exploding 3D hero letters ---------- */
  var title = doc.querySelector('.hero__title');
  if (title) {
    var text = title.textContent.trim();
    title.textContent = '';
    title.setAttribute('aria-label', text);
    var chars = [];
    for (var c = 0; c < text.length; c++) {
      var span = doc.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.style.animationDelay = (c * 90) + 'ms';
      span.textContent = text.charAt(c);
      title.appendChild(span);
      chars.push(span);
    }
    var hero = doc.querySelector('.hero');
    if (hero && fine && !reduced) {
      hero.addEventListener('mousemove', function (e) {
        for (var i = 0; i < chars.length; i++) {
          var r = chars[i].getBoundingClientRect();
          var ccx = r.left + r.width / 2;
          var ccy = r.top + r.height / 2;
          var dx = e.clientX - ccx;
          var dy = e.clientY - ccy;
          var d = Math.sqrt(dx * dx + dy * dy);
          var reach = 300;
          if (d < reach) {
            var f = 1 - d / reach;
            var ry = Math.max(-32, Math.min(32, -dx * 0.12 * f));
            var rx = Math.max(-26, Math.min(26, dy * 0.12 * f));
            chars[i].style.transform =
              'perspective(700px) translateZ(' + (f * 60).toFixed(1) + 'px)' +
              ' rotateY(' + ry.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg)';
          } else {
            chars[i].style.transform = '';
          }
        }
      });
      hero.addEventListener('mouseleave', function () {
        for (var i = 0; i < chars.length; i++) chars[i].style.transform = '';
      });
    }
  }

  /* ---------- velocity-reactive marquee ---------- */
  var track = doc.querySelector('.marquee__track');
  if (track && !reduced && window.requestAnimationFrame) {
    var mqX = 0, lastY = window.scrollY, vel = 0;
    (function mqLoop() {
      var y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.12;
      lastY = y;
      mqX += 0.8 + Math.min(7, vel * 0.14);
      var half = track.scrollWidth / 2;
      if (half > 0 && mqX >= half) mqX -= half;
      track.style.transform = 'translate3d(' + (-mqX).toFixed(1) + 'px,0,0)';
      window.requestAnimationFrame(mqLoop);
    })();
  }

  /* ---------- giant parallax words ---------- */
  var giants = Array.prototype.slice.call(doc.querySelectorAll('.giant'));
  if (giants.length && !reduced) {
    var onGiant = function () {
      giants.forEach(function (g) {
        var r = g.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var p = r.top / window.innerHeight;
        g.style.transform = 'translate3d(' + (p * -140).toFixed(1) + 'px,0,0)';
      });
    };
    window.addEventListener('scroll', onGiant, { passive: true });
    onGiant();
  }

  /* ---------- 3D coverflow carousel ---------- */
  var stage = doc.querySelector('.carousel__stage');
  if (stage) {
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.carousel__item'));
    var N = slides.length;
    var cur = 0;
    var render = function () {
      slides.forEach(function (it, i) {
        var off = ((i - cur) % N + N) % N;
        if (off > N / 2) off -= N;
        var abs = Math.abs(off);
        it.style.transform =
          'translate(-50%,-50%) translateX(' + (off * 55) + '%)' +
          ' translateZ(' + (-abs * 190) + 'px) rotateY(' + (-off * 30) + 'deg)';
        it.style.opacity = abs > 2.5 ? '0' : String(1 - abs * 0.22);
        it.style.zIndex = String(60 - Math.round(abs * 10));
        it.style.pointerEvents = abs > 2.5 ? 'none' : 'auto';
        it.classList.toggle('is-active', off === 0);
      });
    };
    var go = function (n) {
      cur = ((cur + n) % N + N) % N;
      render();
    };
    render();

    var prev = doc.querySelector('[data-carousel-prev]');
    var next = doc.querySelector('[data-carousel-next]');
    if (prev) prev.addEventListener('click', function () { go(-1); restart(); });
    if (next) next.addEventListener('click', function () { go(1); restart(); });

    slides.forEach(function (it, i) {
      it.addEventListener('click', function () {
        if (!it.classList.contains('is-active')) {
          cur = i;
          render();
          restart();
        }
      });
    });

    /* drag / swipe */
    var startX = null;
    stage.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    window.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) {
        go(dx < 0 ? 1 : -1);
        restart();
      }
    });

    /* autoplay */
    var timer = null;
    var start = function () {
      if (reduced) return;
      timer = setInterval(function () { go(1); }, 4200);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var restart = function () { stop(); start(); };
    stage.addEventListener('pointerenter', stop);
    stage.addEventListener('pointerleave', start);
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) stop(); else if (!timer) start();
    });
    start();
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduced) {
    Array.prototype.forEach.call(doc.querySelectorAll('.btn'), function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var bx = (e.clientX - r.left - r.width / 2) * 0.28;
        var by = (e.clientY - r.top - r.height / 2) * 0.4;
        btn.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- custom cursor ---------- */
  if (fine && !reduced) {
    var ring = doc.createElement('div');
    ring.id = 'cursor';
    var dot = doc.createElement('div');
    dot.id = 'cursor-dot';
    doc.body.appendChild(ring);
    doc.body.appendChild(dot);
    var rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      var over = e.target && e.target.closest &&
        e.target.closest('a, button, .btn, [data-tilt], .carousel__item');
      ring.classList.toggle('is-big', !!over);
    }, { passive: true });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      window.requestAnimationFrame(follow);
    })();
  }
})();
