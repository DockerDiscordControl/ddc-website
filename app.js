// DDC Website JavaScript

// README laden und anzeigen
async function loadReadme() {
  const readmeContent = document.getElementById('readme-content');
  const readmeStatus = document.getElementById('readme-status');
  
  try {
    readmeStatus.textContent = 'Loading...';
    readmeStatus.className = 'badge bg-warning';
    
    // Raw README direkt von GitHub laden (funktioniert mit GitHub Pages)
    const response = await fetch('https://raw.githubusercontent.com/DockerDiscordControl/DockerDiscordControl/main/README.md');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Text direkt lesen (bereits UTF-8)
    const readmeText = await response.text();
    
    // Markdown bereinigen vor dem Parsen
    let cleanedMarkdown = readmeText
      // Entferne GitHub-spezifische Metadaten am Anfang
      .replace(/^---[\s\S]*?---\n/m, '')
      // Konvertiere übermäßige Listen zu Paragraphen
      .replace(/^\s*[\*\-\+]\s+(.+)$/gm, (match, content) => {
        // Nur wichtige Listen behalten (mit Schlüsselwörtern)
        if (content.match(/^(Features?|Installation|Setup|Requirements?|Dependencies|Commands?|Examples?|Usage|Configuration|Options?):/i)) {
          return `### ${content}`;
        }
        // Kurze Listen-Items zu normalen Paragraphen machen
        if (content.length < 100) {
          return `**${content}**`;
        }
        return content;
      })
      // Mehrfache Aufzählungszeichen entfernen
      .replace(/^\s*[\*\-\+]\s*[\*\-\+]\s*/gm, '• ')
      // Verschachtelte Listen vereinfachen
      .replace(/^(\s+)[\*\-\+]\s+/gm, '$1• ')
      // Übermäßige Leerzeichen bereinigen
      .replace(/\s{3,}/g, ' ')
      // Mehrfache Zeilenumbrüche reduzieren
      .replace(/\n{4,}/g, '\n\n')
      // Trailing spaces entfernen
      .replace(/[ \t]+$/gm, '')
      // Lange Listen in Abschnitte unterteilen
      .replace(/((?:^[\*\-\+]\s+.+\n){5,})/gm, (match) => {
        // Lange Listen in kleinere Gruppen aufteilen
        const items = match.split('\n').filter(line => line.trim());
        const chunks = [];
        for (let i = 0; i < items.length; i += 3) {
          chunks.push(items.slice(i, i + 3).join('\n'));
        }
        return chunks.join('\n\n') + '\n';
      })
      // Spezielle DockerDiscordControl Abschnitte bereinigen
      .replace(/^## (Features|Installation|Configuration|Usage)/gm, '## $1')
      // Entferne übermäßige Code-Blöcke in Listen
      .replace(/^\s*[\*\-\+]\s+```[\s\S]*?```/gm, '')
      // Konvertiere einfache Listen zu Fließtext
      .replace(/^([\*\-\+]\s+[^:\n]{10,50})\n([\*\-\+]\s+[^:\n]{10,50})\n([\*\-\+]\s+[^:\n]{10,50})/gm, 
        (match, item1, item2, item3) => {
          const clean1 = item1.replace(/^[\*\-\+]\s+/, '');
          const clean2 = item2.replace(/^[\*\-\+]\s+/, '');
          const clean3 = item3.replace(/^[\*\-\+]\s+/, '');
          return `${clean1}, ${clean2}, and ${clean3}.`;
        });
    
    // Markdown zu HTML konvertieren mit besseren Optionen
    const htmlContent = marked.parse(cleanedMarkdown, {
      breaks: true,
      gfm: true,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
    
    // Inhalt anzeigen
    readmeContent.innerHTML = htmlContent;
    
    // Status aktualisieren
    readmeStatus.textContent = 'Loaded';
    readmeStatus.className = 'badge bg-success';
    
    // Post-processing: HTML bereinigen
    // Entferne leere Paragraphen
    const emptyPs = readmeContent.querySelectorAll('p:empty, p:not(:has(*)):not(:has(text()))');
    emptyPs.forEach(p => p.remove());
    
    // Bereinige verschachtelte Listen
    const nestedLists = readmeContent.querySelectorAll('ul ul, ol ol');
    nestedLists.forEach(list => {
      if (list.children.length === 0) {
        list.remove();
      }
    });
    
    // Links anpassen (relative Links zu absoluten GitHub-Links)
    const links = readmeContent.querySelectorAll('a[href^="#"], a[href^="./"], a[href^="../"], a[href^="docs/"], a[href^="config/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        // Anker-Links bleiben wie sie sind
        return;
      } else if (href.startsWith('./') || href.startsWith('../') || href.startsWith('docs/') || href.startsWith('config/')) {
        // Relative Links zu GitHub umleiten
        const cleanHref = href.replace(/^\.\//, '').replace(/^\.\.\//, '');
        link.setAttribute('href', `https://github.com/DockerDiscordControl/DockerDiscordControl/blob/main/${cleanHref}`);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    // Bilder anpassen
    const images = readmeContent.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        // Relative Bilder zu GitHub Raw Content umleiten
        const cleanSrc = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
        img.setAttribute('src', `https://raw.githubusercontent.com/DockerDiscordControl/DockerDiscordControl/main/${cleanSrc}`);
      }
    });
    
    // Tabellen responsive machen
    const tables = readmeContent.querySelectorAll('table');
    tables.forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
    
    // Scroll-to-top nach dem Laden
    setTimeout(() => {
      const readmeSection = document.querySelector('.readme-section');
      if (readmeSection) {
        readmeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
    
  } catch (error) {
    console.error('Error loading README:', error);
    
    // Fallback: Versuche es mit einem Proxy-Service
    try {
      readmeStatus.textContent = 'Retrying...';
      readmeStatus.className = 'badge bg-info';
      
      const proxyResponse = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://raw.githubusercontent.com/DockerDiscordControl/DockerDiscordControl/main/README.md'));
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        const readmeText = proxyData.contents;
        
        const htmlContent = marked.parse(readmeText, {
          breaks: true,
          gfm: true,
          sanitize: false
        });
        
        readmeContent.innerHTML = htmlContent;
        readmeStatus.textContent = 'Loaded (Proxy)';
        readmeStatus.className = 'badge bg-success';
        return;
      }
    } catch (proxyError) {
      console.error('Proxy also failed:', proxyError);
    }
    
    // Wenn alles fehlschlägt, zeige Fallback
    readmeContent.innerHTML = `
      <div class="alert alert-warning" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Unable to load README</strong><br>
        Please visit the <a href="https://github.com/DockerDiscordControl/DockerDiscordControl" target="_blank" rel="noopener noreferrer" class="alert-link">GitHub Repository</a> for the latest documentation.
        <br><br>
        <div class="mt-3">
          <button class="btn btn-outline-primary btn-sm" onclick="loadReadme()">
            <i class="bi bi-arrow-clockwise me-1"></i>Try Again
          </button>
        </div>
      </div>
    `;
    readmeStatus.textContent = 'Error';
    readmeStatus.className = 'badge bg-danger';
  }
}

// Markdown bereinigen (nicht mehr verwendet, aber für Kompatibilität beibehalten)
function cleanMarkdown(text) {
  return text;
}

// README Post-Processing (nicht mehr verwendet, aber für Kompatibilität beibehalten)
function postProcessReadme(content) {
  // Leer gelassen
}

// README Fehler anzeigen (nicht mehr verwendet, aber für Kompatibilität beibehalten)
function showReadmeError(content, status) {
  // Leer gelassen
}

// Neon Flicker Effekt
function setupNeonFlicker() {
  const neonMaxElement = document.getElementById('neon-max');
  const neonDdcElement = document.getElementById('neon-ddc');
  
  function flickerElement(element) {
    if (!element) return;
    
    if (Math.random() < 0.7) {
      const completelyOff = Math.random() < 0.3;
      const flickerClass = completelyOff ? 'flicker-off' : 'flicker';
      
      element.classList.add(flickerClass);
      
      const flickerDuration = Math.random() * 900 + 100;
      
      setTimeout(() => {
        element.classList.remove(flickerClass);
      }, flickerDuration);
    }
  }
  
  function flickerNeon() {
    flickerElement(neonMaxElement);
    
    setTimeout(() => {
      flickerElement(neonDdcElement);
    }, Math.random() * 2000);
    
    const nextFlickerTime = Math.random() * 5000 + 5000;
    setTimeout(flickerNeon, nextFlickerTime);
  }
  
  setTimeout(flickerNeon, 3000);
}

// Screenshot Carousel
class ScreenshotCarousel {
  constructor() {
    this.currentSlide = 0;
    this.autoplayInterval = null;
    this.isAutoplayActive = true;
    this.slides = document.querySelectorAll('.carousel-slide');
    this.indicators = document.querySelectorAll('.indicator');
    this.featureCards = document.querySelectorAll('.feature-card');
    
    this.init();
  }
  
  init() {
    this.updateFeatureCards();
    this.startAutoplay();
    this.setupEventListeners();
  }
  
  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      if (this.isAutoplayActive) {
        this.changeSlide(1);
      }
    }, 5000);
  }
  
  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }
  
  toggleAutoplay() {
    const btn = document.getElementById('autoplayBtn');
    const icon = btn.querySelector('i');
    
    this.isAutoplayActive = !this.isAutoplayActive;
    
    if (this.isAutoplayActive) {
      icon.className = 'bi bi-pause-fill';
      this.startAutoplay();
    } else {
      icon.className = 'bi bi-play-fill';
      this.stopAutoplay();
    }
  }
  
  changeSlide(direction) {
    const totalSlides = this.slides.length;
    
    this.slides[this.currentSlide].classList.remove('active');
    this.indicators[this.currentSlide].classList.remove('active');
    
    this.currentSlide = (this.currentSlide + direction + totalSlides) % totalSlides;
    
    this.slides[this.currentSlide].classList.add('active');
    this.indicators[this.currentSlide].classList.add('active');
    
    const carouselSlides = document.getElementById('carouselSlides');
    carouselSlides.style.transform = `translateX(-${this.currentSlide * 6.25}%)`;
    
    this.updateFeatureCards();
  }
  
  updateFeatureCards() {
    const currentFeature = this.slides[this.currentSlide].getAttribute('data-feature');
    
    this.featureCards.forEach(card => card.classList.remove('active'));
    
    if (currentFeature === 'control' || currentFeature === 'status') {
      const controlCard = document.querySelector('.feature-card[data-feature="control"]');
      if (controlCard) {
        controlCard.classList.add('active');
      }
    } else {
      const matchingCard = document.querySelector(`.feature-card[data-feature="${currentFeature}"]`);
      if (matchingCard) {
        matchingCard.classList.add('active');
      }
    }
  }
  
  goToSlide(slideIndex) {
    const direction = slideIndex - this.currentSlide;
    this.changeSlide(direction);
  }
  
  selectFeature(featureName) {
    let slideIndex = -1;
    
    if (featureName === 'control') {
      slideIndex = Array.from(this.slides).findIndex(slide => {
        const feature = slide.getAttribute('data-feature');
        return feature === 'control' || feature === 'status';
      });
    } else {
      slideIndex = Array.from(this.slides).findIndex(slide => 
        slide.getAttribute('data-feature') === featureName
      );
    }
    
    if (slideIndex !== -1) {
      this.goToSlide(slideIndex);
      
      document.querySelector('.screenshot-carousel-section').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      const wasAutoplay = this.isAutoplayActive;
      if (this.isAutoplayActive) {
        this.toggleAutoplay();
        setTimeout(() => {
          if (wasAutoplay) this.toggleAutoplay();
        }, 10000);
      }
    }
  }
  
  setupEventListeners() {
    const carousel = document.querySelector('.carousel-container');
    
    // Touch Events
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    carousel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      const swipeThreshold = 50;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.changeSlide(1);
        } else {
          this.changeSlide(-1);
        }
      }
    });
    
    // Mouse Events
    carousel.addEventListener('mouseenter', () => {
      if (this.isAutoplayActive) this.stopAutoplay();
    });
    
    carousel.addEventListener('mouseleave', () => {
      if (this.isAutoplayActive) this.startAutoplay();
    });
    
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.changeSlide(-1);
      } else if (e.key === 'ArrowRight') {
        this.changeSlide(1);
      } else if (e.key === ' ') {
        e.preventDefault();
        this.toggleAutoplay();
      }
    });
  }
  
  openModal() {
    const currentImage = this.slides[this.currentSlide].querySelector('.carousel-image');
    const currentCaption = this.slides[this.currentSlide].querySelector('.carousel-caption');
    
    openImageModal(
      currentImage.src,
      currentCaption.querySelector('h3').textContent,
      currentCaption.querySelector('p').textContent
    );
  }
}

// Image Modal
function openImageModal(imageSrc, title, description) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalDownload = document.getElementById('modalDownload');
  
  modalImage.src = imageSrc;
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  modalDownload.href = imageSrc;
  modalDownload.download = `ddc-${title.toLowerCase().replace(/\s+/g, '-')}-screenshot.png`;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// Global Functions (für onclick Events)
let carousel;

function changeSlide(direction) {
  carousel.changeSlide(direction);
}

function goToSlide(slideIndex) {
  carousel.goToSlide(slideIndex);
}

function selectFeature(featureName) {
  carousel.selectFeature(featureName);
}

function toggleAutoplay() {
  carousel.toggleAutoplay();
}

function openCarouselModal() {
  carousel.openModal();
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
  loadReadme();
  setupNeonFlicker();
  carousel = new ScreenshotCarousel();
  
  // ESC-Taste zum Schließen des Modals
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeImageModal();
    }
  });
}); 