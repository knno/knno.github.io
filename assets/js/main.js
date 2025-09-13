// year
document.getElementById('current-year').textContent = new Date().getFullYear();
// auto theme detection
function applyTheme() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.setAttribute("data-bs-theme", "dark");
    } else {
    document.body.setAttribute("data-bs-theme", "light");
    }
}
applyTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
// countdown timer
const launchDate = new Date("2026-03-04T23:59:59").getTime();
const countdownEl = document.getElementById("countdown");
function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    if (distance <= 0) {
    countdownEl.textContent = "We are live!";
    return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    countdownEl.innerHTML = `
    <span class="fw-bold">${days}d</span>
    <span class="fw-bold">${hours}h</span>
    <span class="fw-bold">${minutes}m</span>
    <span class="fw-bold">${seconds}s</span>
    `;
}
updateCountdown();
setInterval(updateCountdown, 1000);
//form stuffs
function resetForm() {
    this.btn.disabled=false; this.btn.innerHTML='Notify me'; this.heart.classList.remove("beat");
    hcaptcha.reset();
};
function onSubscribe(event){
    const form = event.target;
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    if (!email) return false;
    const btn = event.target.querySelector('button');
    btn.disabled = true; btn.innerHTML = '...';
    const heart = document.getElementById('indicator-heart');
    const token = hcaptcha.getResponse();
    if (!token) {
        btn.disabled = true; btn.innerHTML = '<span style="color: red;">Captcha failed! Try again later.</span>';
        setTimeout(resetForm.bind({btn: btn, heart:heart}), 3500);
        return false;
    }
    const payload = { email, token };
    console.log('Subscribe:', email);
    fetch(form.action, {
        method: form.method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
        if (data.status === 'success') {
            btn.disabled = true; btn.innerHTML = '<span style="color: lime;">Thanks!</span>';
            heart.classList.add("beat"); //happy:D
            setTimeout(resetForm.bind({btn: btn, heart:heart}), 3500);
            form.reset();
        } else {
            if (data.error == "Email already subscribed") {
                btn.disabled = true; btn.innerHTML = '<span style="color: green;">Already in list!</span>';
            } else {
                btn.disabled = true; btn.innerHTML = '<span style="color: red;">Oops! Try again later.</span>';
            }
            setTimeout(resetForm.bind({btn: btn, heart:heart}), 3500);
            console.error("Submission result error:", data.error);
        }
        })
        .catch(error => {
            btn.disabled = true; btn.innerHTML = '<span style="color: red;">Network error. Please wait try again.</span>';
            setTimeout(resetForm.bind({btn: btn, heart:heart}), 3500);
            console.error("Submission error:", error);
        });
    return false;
}
