class DahamPasalApp {
  constructor() {
    this.lessons = window.lessons || [];
    this.unlockedLessons = JSON.parse(localStorage.getItem('unlocked_lessons')) || [];
    this.customTeacherQs = JSON.parse(localStorage.getItem('teacher_qs')) || {}; 
    
    this.teacherMode = false;
    this.currentLesson = null;
    this.deferredPrompt = null;

    this.initElements();
    this.bindEvents();
    this.renderDashboard();
    this.initPWA();
  }

  initElements() {
    this.dashboard = document.getElementById('lesson-grid');
    this.viewOverlay = document.getElementById('view-overlay');
    this.viewContent = document.getElementById('view-content');
    this.closeBtn = document.getElementById('close-btn');
    this.teacherBtn = document.getElementById('teacher-toggle');
     this.modalBody = document.getElementById('modal-body');
     this.installBtn = document.getElementById('pwa-install-btn');
     this.installBanner = document.getElementById('install-banner');
     this.bannerInstallBtn = document.getElementById('banner-install-btn');
     this.bannerCloseBtn = document.getElementById('banner-close-btn');
   }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hideLesson());
    this.teacherBtn.addEventListener('click', () => this.toggleTeacherMode());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideLesson();
    });
    
     if (this.installBtn) {
       this.installBtn.addEventListener('click', () => this.installPWA());
     }
     if (this.bannerInstallBtn) {
       this.bannerInstallBtn.addEventListener('click', () => this.installPWA());
     }
     if (this.bannerCloseBtn) {
       this.bannerCloseBtn.addEventListener('click', () => {
         this.installBanner.style.display = 'none';
       });
     }
   }

  renderDashboard() {
    this.dashboard.innerHTML = '';
    this.lessons.forEach((lesson, index) => {
      const card = document.createElement('div');
      card.className = 'lesson-card stagger-in';
      card.style.animationDelay = `${index * 0.05}s`;
      
      let qCount = lesson.mcqs ? lesson.mcqs.length : 0;
      let tCount = this.customTeacherQs[lesson.id] ? this.customTeacherQs[lesson.id].length : 0;

      card.innerHTML = `
        <div class="lesson-number">පාඩම ${lesson.id}</div>
        <div class="lesson-title">${lesson.title}</div>
        <div class="status-badge status-open">
          MCQ: ${qCount} | ගුරු ප්‍රශ්න: ${tCount}
        </div>
      `;
      
      card.addEventListener('click', () => this.showLesson(lesson));
      this.dashboard.appendChild(card);
    });
  }

  showLesson(lesson) {
    this.currentLesson = lesson;
    const isUnlocked = this.unlockedLessons.includes(lesson.id);
    const teacherQsArr = this.customTeacherQs[lesson.id] || [];
    
    let html = `<h2>${lesson.title}</h2>`;

    if (lesson.mcqs && lesson.mcqs.length > 0) {
      html += `
        <h3 style="margin-top:20px; color:var(--primary);">බහුවරණ ප්‍රශ්න (සැමට විවෘතයි)</h3>
        <div class="question-list">
          ${lesson.mcqs.map((mcq, i) => `
            <div class="question-item">
              <span class="question-text">${i + 1}. ${mcq.q}</span>
              <div class="options-grid" id="options-${i}">
                ${mcq.options.map((opt, optIdx) => `
                  <button class="option-btn" 
                    onclick="window.app.checkAnswer(${i}, ${optIdx}, ${mcq.correctIndex}, this)">
                    ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      html += `<p style="color:#777; margin:20px 0;">මෙම පාඩමට තවම බහුවරණ ප්‍රශ්න එකතු කර නැත.</p>`;
    }

    html += `
      <h3 style="margin-top:30px; color:var(--accent); border-top:2px solid #eee; padding-top:20px;">ගුරුතුමා විසින් සැකසූ ප්‍රශ්න හා පිළිතුරු</h3>
    `;

    if (teacherQsArr.length > 0) {
      html += `<div class="question-list">`;
      teacherQsArr.forEach((tq, i) => {
        html += `
          <div class="question-item" style="border-left-color: var(--accent);">
            <span class="question-text">${i + 1}. ${tq.q}</span>
            <div class="answer-area" style="background:#fff3e0; padding:10px; border-radius:8px; margin-top:10px; border:none;">
              ${isUnlocked ? `
                <span style="color:#e65100; font-weight:500;">පිළිතුර: ${tq.a}</span>
              ` : `
                <p class="status-msg" style="color:#d84315; margin:0;">🔒 පිළිතුර බැලීමට ගුරුතුමාගේ අවසරය අවශ්‍යයි.</p>
              `}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += `<p style="color:#777;">ගුරුතුමා විසින් තවම ප්‍රශ්න එකතු කර නැත.</p>`;
    }

    html += `
      <div class="teacher-controls" id="teacher-controls">
        <div class="unlock-overlay" style="margin-bottom: 20px;">
          <h4>ගුරුතුමාගේ ලොක් එක</h4>
          <p style="font-size:0.9rem; color:#666;">මෙය බලපාන්නේ ගුරුතුමා විසින් සැකසූ ප්‍රශ්න වල පිළිතුරු සඳහා පමණි.</p>
          ${!isUnlocked ? `
            <button class="btn-primary btn-unlock" style="margin-top:10px;" onclick="window.app.unlockCurrentLesson()">
              පිළිතුරු පෙන්වීමට අවසර දෙන්න (Unlock)
            </button>
          ` : `
            <p style="color: #4caf50; font-weight: 600; margin-top:10px;">පිළිතුරු දැනට විවෘත කර ඇත.</p>
            <button class="btn-primary" style="background: #9e9e9e;" onclick="window.app.lockCurrentLesson()">
              නැවත අගුළු දමන්න (Lock)
            </button>
          `}
        </div>

        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px dashed #ccc;">
          <h4 style="margin-bottom: 15px; color:var(--accent);">නව ගුරු ප්‍රශ්නයක් ඇතුළත් කරන්න</h4>
          <input type="text" id="new-tq-q" placeholder="ප්‍රශ්නය ටයිප් කරන්න..." style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px; font-family:inherit;">
          <textarea id="new-tq-a" placeholder="පිළිතුර ටයිප් කරන්න..." style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px; font-family:inherit; min-height:80px;"></textarea>
          <button class="btn-primary" onclick="window.app.addTeacherQuestion()">ප්‍රශ්නය එක් කරන්න</button>
        </div>
      </div>
    `;

    this.modalBody.innerHTML = html;
    this.viewOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.updateTeacherVisibility();
  }

  checkAnswer(questionIndex, selectedIndex, correctIndex, btnElement) {
    const parent = document.getElementById(`options-${questionIndex}`);
    const buttons = parent.querySelectorAll('.option-btn');
    
    // Disable all to prevent multiple guesses
    buttons.forEach(btn => btn.disabled = true);
    
    if (selectedIndex === correctIndex) {
      btnElement.classList.add('correct');
      btnElement.innerHTML += ' ✔';
    } else {
      btnElement.classList.add('wrong');
      btnElement.innerHTML += ' ✖';
      buttons[correctIndex].classList.remove('correct-outline');
      buttons[correctIndex].classList.add('correct');
      buttons[correctIndex].innerHTML += ' ✔';
    }
  }

  hideLesson() {
    this.viewOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    this.currentLesson = null;
  }

  toggleTeacherMode() {
    if (!this.teacherMode) {
      const pass = prompt('ගුරුතුමාගේ රහස් අංකය ඇතුළත් කරන්න (1234):');
      if (pass === '1234') {
        this.teacherMode = true;
        this.teacherBtn.classList.add('active');
        this.teacherBtn.innerHTML = '<span>🔒</span> ගුරු ප්‍රකාරය ක්‍රියාත්මකයි';
        document.body.classList.add('teacher-active');
      } else {
        alert('වැරදි අංකයකි!');
      }
    } else {
      this.teacherMode = false;
      this.teacherBtn.classList.remove('active');
      this.teacherBtn.innerHTML = '<span>🔓</span> ගුරු ප්‍රකාරය (Teacher Mode)';
      document.body.classList.remove('teacher-active');
    }
    
    if (this.currentLesson) {
      this.updateTeacherVisibility();
    }
  }

  updateTeacherVisibility() {
    const controls = document.getElementById('teacher-controls');
    if (controls) {
      controls.style.display = this.teacherMode ? 'block' : 'none';
    }
  }

  unlockCurrentLesson() {
    if (!this.currentLesson) return;
    if (!this.unlockedLessons.includes(this.currentLesson.id)) {
      this.unlockedLessons.push(this.currentLesson.id);
      localStorage.setItem('unlocked_lessons', JSON.stringify(this.unlockedLessons));
      this.showLesson(this.currentLesson);
    }
  }

  lockCurrentLesson() {
    if (!this.currentLesson) return;
    this.unlockedLessons = this.unlockedLessons.filter(id => id !== this.currentLesson.id);
    localStorage.setItem('unlocked_lessons', JSON.stringify(this.unlockedLessons));
    this.showLesson(this.currentLesson);
  }

  addTeacherQuestion() {
    const qInput = document.getElementById('new-tq-q').value.trim();
    const aInput = document.getElementById('new-tq-a').value.trim();
    
    if (!qInput || !aInput) {
      alert("කරුණාකර ප්‍රශ්නය සහ පිළිතුර ඇතුළත් කරන්න!");
      return;
    }
    
    const lessonId = this.currentLesson.id;
    if (!this.customTeacherQs[lessonId]) {
      this.customTeacherQs[lessonId] = [];
    }
    
    this.customTeacherQs[lessonId].push({ q: qInput, a: aInput });
    localStorage.setItem('teacher_qs', JSON.stringify(this.customTeacherQs));
    
    this.showLesson(this.currentLesson);
    this.renderDashboard();
  }

  initPWA() {
    // Register Service Worker (Skip if on local file protocol)
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered', reg))
          .catch(err => console.log('Service Worker registration failed', err));
      });
    }

    // Handle Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
       // Update UI notify the user they can install the PWA
       if (this.installBtn) {
         this.installBtn.style.display = 'flex';
       }
       if (this.installBanner) {
         this.installBanner.style.display = 'flex';
       }
     });

    window.addEventListener('appinstalled', (evt) => {
      console.log('App was installed');
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }
    });
  }

  async installPWA() {
    if (!this.deferredPrompt) return;
    
    // Show the prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    
     // Hide the install button
     if (this.installBtn) {
       this.installBtn.style.display = 'none';
     }
     if (this.installBanner) {
       this.installBanner.style.display = 'none';
     }
   }
}

// Initialize app
window.app = new DahamPasalApp();
