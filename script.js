(function () {
  // Edit this list. Use local files (e.g. "songs/track1.mp3") or full URLs.
  var tracks = [
    { title: 'Song One',   artist: 'SoundHelix', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'Song Two',   artist: 'SoundHelix', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { title: 'Song Three', artist: 'SoundHelix', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { title: 'Song Four',  artist: 'SoundHelix', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var audio = new Audio();
  var index = 0;
  var lastVol = 0.8;
  var seeking = false;

  var el = {
    title: $('title'), artist: $('artist'), current: $('current'), duration: $('duration'),
    seek: $('seek'), play: $('play'), prev: $('prev'), next: $('next'),
    vol: $('vol'), mute: $('mute'), list: $('playlist'), disc: $('disc'),
    auto: $('autoplay'), files: $('files'), status: $('status')
  };

  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function fill(input, pct) { input.style.setProperty('--fill', pct + '%'); }

  function renderList() {
    el.list.innerHTML = '';
    tracks.forEach(function (t, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.className = i === index ? 'on' : '';
      b.innerHTML = '<span>' + (i === index ? '♪' : (i + 1)) + '</span><span><b></b><small></small></span>';
      b.querySelector('b').textContent = t.title;
      b.querySelector('small').textContent = t.artist;
      b.addEventListener('click', function () { load(i); play(); });
      li.appendChild(b);
      el.list.appendChild(li);
    });
  }

  function load(i) {
    index = (i + tracks.length) % tracks.length;
    var t = tracks[index];
    audio.src = t.src;
    el.title.textContent = t.title;
    el.artist.textContent = t.artist;
    el.current.textContent = '0:00';
    el.duration.textContent = '0:00';
    el.seek.value = 0; fill(el.seek, 0);
    el.status.textContent = '';
    renderList();
  }

  function play() {
    var p = audio.play();
    if (p && p.catch) p.catch(function () {
      el.status.textContent = 'Could not play this song. Check the file or your connection.';
      setPlaying(false);
    });
  }
  function setPlaying(on) {
    el.play.textContent = on ? '❚❚' : '▶';
    el.play.setAttribute('aria-label', on ? 'Pause' : 'Play');
    el.disc.classList.toggle('playing', on);
  }
  function toggle() { audio.paused ? play() : audio.pause(); }
  function prev() { audio.currentTime > 3 ? (audio.currentTime = 0) : (load(index - 1), play()); }
  function next() { load(index + 1); play(); }

  audio.addEventListener('play', function () { setPlaying(true); });
  audio.addEventListener('pause', function () { setPlaying(false); });
  audio.addEventListener('loadedmetadata', function () { el.duration.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    if (seeking || !audio.duration) return;
    var pct = audio.currentTime / audio.duration * 100;
    el.seek.value = pct * 10; fill(el.seek, pct);
    el.current.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () {
    if (el.auto.checked) next(); else { setPlaying(false); audio.currentTime = 0; }
  });
  audio.addEventListener('error', function () {
    el.status.textContent = 'Could not load "' + tracks[index].title + '".';
    setPlaying(false);
  });

  el.seek.addEventListener('input', function () {
    seeking = true;
    var pct = el.seek.value / 10;
    fill(el.seek, pct);
    if (audio.duration) el.current.textContent = fmt(audio.duration * pct / 100);
  });
  el.seek.addEventListener('change', function () {
    if (audio.duration) audio.currentTime = audio.duration * el.seek.value / 1000;
    seeking = false;
  });

  function setVol(v) {
    audio.volume = v; el.vol.value = v; fill(el.vol, v * 100);
    el.mute.textContent = v === 0 ? '🔇' : (v < 0.5 ? '🔉' : '🔊');
    el.mute.setAttribute('aria-label', v === 0 ? 'Unmute' : 'Mute');
  }
  el.vol.addEventListener('input', function () { setVol(parseFloat(el.vol.value)); if (audio.volume > 0) lastVol = audio.volume; });
  el.mute.addEventListener('click', function () { setVol(audio.volume === 0 ? (lastVol || 0.8) : 0); });

  el.play.addEventListener('click', toggle);
  el.prev.addEventListener('click', prev);
  el.next.addEventListener('click', next);

  el.files.addEventListener('change', function () {
    var first = tracks.length;
    Array.prototype.forEach.call(el.files.files, function (f) {
      tracks.push({ title: f.name.replace(/\.[^.]+$/, ''), artist: 'My file', src: URL.createObjectURL(f) });
    });
    if (tracks.length > first) { load(first); play(); }
  });

  // Keyboard: Space play/pause, N next, P previous, M mute, arrows seek and volume
  document.addEventListener('keydown', function (e) {
    var t = e.target.tagName;
    if (e.ctrlKey || e.metaKey || e.altKey || t === 'INPUT' || (t === 'BUTTON' && e.key === ' ')) return;
    var k = e.key.toLowerCase();
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    else if (k === 'n') next();
    else if (k === 'p') prev();
    else if (k === 'm') el.mute.click();
    else if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    else if (e.key === 'ArrowUp') { e.preventDefault(); setVol(Math.min(1, audio.volume + 0.05)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setVol(Math.max(0, audio.volume - 0.05)); }
  });

  setVol(0.8);
  load(0);
})();
