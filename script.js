// Small helper utils
function qs(sel){ return document.querySelector(sel); }

// Opening logic
const openBtn = qs('#openBtn');
const opening = qs('#opening');
const main = qs('#main');
openBtn.addEventListener('click', ()=>{
    opening.style.opacity = '0';
    opening.style.transform = 'scale(.995)';
    setTimeout(()=> opening.style.display='none', 450);
    main.classList.remove('hidden');
    window.scrollTo(0,0);
});

// RSVP popup logic & anti-spam token
const rsvpPopup = qs('#rsvpPopup');
const openRsvp = qs('#openRsvp');
const closeRsvp = qs('#closeRsvp');
const rsvpForm = qs('#rsvpForm');
const formError = qs('#formError');
const formSuccess = qs('#formSuccess');
const hp = qs('#hp');

// Token anti-refresh: generate once per session
function genToken(len=24){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s=''; for(let i=0;i<len;i++) s+=chars.charAt(Math.floor(Math.random()*chars.length));
    return s;
}
if(!sessionStorage.getItem('rsvpToken')){
    sessionStorage.setItem('rsvpToken', genToken());
    sessionStorage.setItem('rsvpSubmitted', '0');
}
qs('#token').value = sessionStorage.getItem('rsvpToken');

openRsvp.addEventListener('click', ()=>{
    rsvpPopup.setAttribute('aria-hidden','false');
});
closeRsvp.addEventListener('click', ()=>{
    rsvpPopup.setAttribute('aria-hidden','true');
});

// prevent double submissions: require token and session flag
let lastSubmit = 0;
rsvpForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    formError.style.display='none'; formSuccess.style.display='none';

    // honeypot
    if(hp.value && hp.value.trim() !== '') return;

    const name = qs('#name').value.trim();
    const guests = qs('#guests').value.trim();
    const status = qs('#status').value;
    const token = qs('#token').value;

    if(!name || !guests || parseInt(guests) < 1){
        formError.textContent = 'Harap isi Nama dan Jumlah tamu (>=1).';
        formError.style.display = 'block';
        return;
    }

    // anti-refresh / double submit using session flag
    if(sessionStorage.getItem('rsvpSubmitted') === '1'){
        formError.textContent = 'Anda sudah submit RSVP dari sesi ini.';
        formError.style.display = 'block';
        return;
    }

    // minimal interval 3s
    const now = Date.now();
    if(now - lastSubmit < 3000){
        formError.textContent = 'Tunggu sebentar sebelum mengirim ulang.';
        formError.style.display = 'block';
        return;
    }

    lastSubmit = now;

    // send to Google Apps Script - replace URL in code before deploy
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwR2XH2mHQt4IblHQbNZsXoSSdp8ZyzsPxh2H6ULfzNU2rZVJDSmcVBW6oG8QJ7KgTF/exec';

    const fd = new FormData();
    fd.append('timestamp', new Date().toISOString());
    fd.append('token', token);
    fd.append('name', name);
    fd.append('guests', guests);
    fd.append('status', status);
    fd.append('ua', navigator.userAgent);

    try{
        const res = await fetch(scriptURL, { method: 'POST', body: fd });
        if(res.ok){
            formSuccess.textContent = 'Terima kasih! RSVP berhasil dikirim.';
            formSuccess.style.display = 'block';
            sessionStorage.setItem('rsvpSubmitted','1');
            setTimeout(()=>{ rsvpPopup.setAttribute('aria-hidden','true'); rsvpForm.reset(); }, 1400);
        } else {
            throw new Error('non-200');
        }
    }catch(err){
        formError.textContent = 'Gagal mengirim data, coba lagi nanti.';
        formError.style.display = 'block';
    }
});
