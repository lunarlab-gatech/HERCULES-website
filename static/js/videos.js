// HERCULES video panels: true lazy-load (preload="none" + deferred <source> src),
// IntersectionObserver autoplay/pause, manual play/pause toggle, reduced-motion aware.
(function () {
  "use strict";

  var REDUCE = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Attach real src to <source> elements only when a panel is needed.
  function hydrate(video) {
    if (video.dataset.hydrated) return;
    var sources = video.querySelectorAll("source[data-src]");
    for (var i = 0; i < sources.length; i++) {
      sources[i].src = sources[i].getAttribute("data-src");
    }
    video.load();
    video.dataset.hydrated = "1";
  }

  function setIcon(media, playing) {
    var icon = media.querySelector(".vpanel-toggle i");
    if (!icon) return;
    icon.className = playing ? "fas fa-pause" : "fas fa-play";
    var btn = media.querySelector(".vpanel-toggle");
    if (btn) btn.setAttribute("aria-label", playing ? "Pause video" : "Play video");
  }

  // Scope to <video> only — the phenomena grid also has an <img.vpanel-video> still.
  var videos = Array.prototype.slice.call(
    document.querySelectorAll("video.vpanel-video")
  );
  if (!videos.length) return;

  // Reflect actual play state on the toggle icon.
  videos.forEach(function (v) {
    var media = v.closest(".vpanel-media");
    v.addEventListener("play", function () {
      media.classList.add("is-playing");
      setIcon(media, true);
    });
    v.addEventListener("pause", function () {
      media.classList.remove("is-playing");
      setIcon(media, false);
    });
  });

  // Manual toggle. A user pause "sticks" so the observer won't auto-resume it.
  document.querySelectorAll(".vpanel-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var media = btn.closest(".vpanel-media");
      var v = media.querySelector("video");
      hydrate(v);
      if (v.paused) {
        delete v.dataset.userPaused;
        v.play().catch(function () {});
      } else {
        v.dataset.userPaused = "1";
        v.pause();
      }
    });
  });

  // Lazy-load + autoplay panels in/near the viewport; pause those scrolled away.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            hydrate(v);
            if (!REDUCE && v.dataset.userPaused !== "1") {
              v.play().catch(function () {});
            }
          } else if (!v.paused) {
            v.pause();
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.25 }
    );
    videos.forEach(function (v) {
      io.observe(v);
    });
  } else {
    // No IntersectionObserver: hydrate everything; autoplay unless reduced motion.
    videos.forEach(function (v) {
      hydrate(v);
      if (!REDUCE) v.play().catch(function () {});
    });
  }
})();
