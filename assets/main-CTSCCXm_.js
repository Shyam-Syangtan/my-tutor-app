import"./authService-kw7IlJTq.js";const r="YOUR_GOOGLE_CLIENT_ID";window.addEventListener("load",function(){s()});function s(){typeof google<"u"&&google.accounts?google.accounts.id.initialize({client_id:r,callback:l,auto_select:!1,cancel_on_tap_outside:!0}):console.warn("Google Sign-In library not loaded")}function l(e){console.log("Google Sign-In successful"),console.log("JWT Token:",e.credential),closeLoginModal();const t=c(e.credential);console.log("User Info:",t),a("Successfully signed in with Google!","success"),d(t)}function c(e){try{const o=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),n=decodeURIComponent(atob(o).split("").map(function(i){return"%"+("00"+i.charCodeAt(0).toString(16)).slice(-2)}).join(""));return JSON.parse(n)}catch(t){return console.error("Error parsing JWT token:",t),null}}window.openLoginModal=function(){const e=document.getElementById("loginModal");if(e){e.classList.add("active"),document.body.style.overflow="hidden";const t=e.querySelector(".modal-close");t&&t.focus()}};window.closeLoginModal=function(e){if(e&&e.target!==e.currentTarget)return;const t=document.getElementById("loginModal");t&&(t.classList.remove("active"),document.body.style.overflow="")};window.handleGoogleLogin=async function(){if(window.authService){await window.authService.signInWithGoogle();return}typeof google<"u"&&google.accounts?google.accounts.id.prompt(e=>{(e.isNotDisplayed()||e.isSkippedMoment())&&google.accounts.id.renderButton(document.getElementById("google-signin-button"),{theme:"outline",size:"large",width:250,text:"signin_with"})}):(a("Google Sign-In is not available. Please try again later.","error"),console.error("Google Sign-In library not loaded"))};function d(e){if(!e)return;const t=document.createElement("div");t.className="user-info-display",t.innerHTML=`
        <div class="user-card">
            <img src="${e.picture}" alt="Profile" class="user-avatar">
            <div class="user-details">
                <h3>Welcome, ${e.name}!</h3>
                <p>${e.email}</p>
                <button onclick="signOut()" class="sign-out-btn">Sign Out</button>
            </div>
        </div>
    `;const o=document.querySelector(".cta-button");o&&o.parentNode.replaceChild(t,o)}function a(e,t="info"){const o=document.createElement("div");if(o.className=`notification notification-${t}`,o.textContent=e,!document.querySelector("#notification-styles")){const n=document.createElement("style");n.id="notification-styles",n.textContent=`
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            
            .notification-success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            
            .notification-info {
                background: linear-gradient(135deg, #6366f1 0%, #5855eb 100%);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .user-info-display {
                display: flex;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .user-card {
                background: white;
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 400px;
            }
            
            .user-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .user-details h3 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
            }
            
            .user-details p {
                margin: 0 0 1rem 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .sign-out-btn {
                background: #ef4444;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .sign-out-btn:hover {
                background: #dc2626;
            }
        `,document.head.appendChild(n)}document.body.appendChild(o),setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},5e3)}document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".language-pill").forEach(t=>{t.addEventListener("click",function(){const o=this.querySelector(".language-name").textContent;a(`Exploring ${o} tutors...`,"info"),console.log(`User clicked on ${o}`)})})});document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",function(o){o.preventDefault();const n=this.getAttribute("href"),i=document.querySelector(n);i&&i.scrollIntoView({behavior:"smooth",block:"start"})})})});document.addEventListener("DOMContentLoaded",function(){const e=document.querySelector(".hero-title"),t=document.querySelector(".hero-features"),o=document.querySelector(".cta-button");e&&(e.style.opacity="0",e.style.transform="translateY(30px)",setTimeout(()=>{e.style.transition="all 0.8s ease-out",e.style.opacity="1",e.style.transform="translateY(0)"},200)),t&&(t.style.opacity="0",t.style.transform="translateY(30px)",setTimeout(()=>{t.style.transition="all 0.8s ease-out",t.style.opacity="1",t.style.transform="translateY(0)"},400)),o&&(o.style.opacity="0",o.style.transform="translateY(30px)",setTimeout(()=>{o.style.transition="all 0.8s ease-out",o.style.opacity="1",o.style.transform="translateY(0)"},600))});document.addEventListener("keydown",function(e){const t=document.getElementById("loginModal");if(t&&t.classList.contains("active")&&(e.key==="Escape"&&closeLoginModal(),e.key==="Tab")){const o=t.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),n=o[0],i=o[o.length-1];e.shiftKey?document.activeElement===n&&(e.preventDefault(),i.focus()):document.activeElement===i&&(e.preventDefault(),n.focus())}});async function u(){const e=window.location.pathname,t="/my-tutor-app/";if(!(e!==t&&e!==t+"index.html")&&window.authService){const{session:o}=await window.authService.auth.getSession();o&&(window.location.href=t+"home.html")}}document.addEventListener("DOMContentLoaded",function(){setTimeout(u,500)});
