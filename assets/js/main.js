// Reveal elements on scroll
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
};

const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// Trigger reveal for elements already in viewport on load
setTimeout(() => {
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight) {
            el.classList.add('active');
        }
    });
}, 100);

// Tracker logic
const trackerMin = document.getElementById('tracker-min');
const trackerSec = document.getElementById('tracker-sec');
const trackerBtn = document.getElementById('tracker-btn');
const trackerIcon = document.getElementById('tracker-icon');
const trackerRing = document.getElementById('tracker-ring');

if (trackerMin && trackerSec && trackerBtn && trackerIcon) {
    let minutes = 42;
    let seconds = 15;
    let isRunning = true;
    let interval;

    const updateTimer = () => {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        trackerMin.textContent = minutes.toString().padStart(2, '0');
        trackerSec.textContent = seconds.toString().padStart(2, '0');
    };

    interval = setInterval(updateTimer, 1000);

    trackerBtn.addEventListener('click', () => {
        if (isRunning) {
            // Pause -> show play (Green)
            clearInterval(interval);
            isRunning = false;
            trackerIcon.setAttribute('icon', 'solar:play-bold');
            trackerBtn.className = "w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center text-xl shadow-[0_0_25px_rgba(16,185,129,0.7)] transition-all transform hover:scale-110 mb-2 relative group/btn";
            trackerRing.className = "absolute inset-0 rounded-full border border-emerald-300/50 scale-110 opacity-0 group-hover/btn:opacity-100 group-hover/btn:scale-125 transition-all duration-300";
        } else {
            // Play -> show pause (Orange)
            interval = setInterval(updateTimer, 1000);
            isRunning = true;
            trackerIcon.setAttribute('icon', 'solar:pause-bold');
            trackerBtn.className = "w-14 h-14 rounded-full bg-[#f97316] hover:bg-orange-400 text-white flex items-center justify-center text-xl shadow-[0_0_25px_rgba(249,115,22,0.8)] transition-all transform hover:scale-110 mb-2 relative group/btn";
            trackerRing.className = "absolute inset-0 rounded-full border border-orange-300/50 scale-110 opacity-0 group-hover/btn:opacity-100 group-hover/btn:scale-125 transition-all duration-300";
        }
    });
}
