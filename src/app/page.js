"use client";
import { useEffect } from 'react';
import './globals.css';

export default function Home() {
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const video = document.getElementById('hero-video');
            const nav = document.getElementById('main-nav');
            const highlight = document.getElementById('line-highlight');
            const processSection = document.getElementById('process');
            const statementText = document.getElementById('reveal-statement');
            
            // Hero Effects
            if (video) {
                const opacity = Math.max(0, 0.6 - (scrollY / windowHeight) * 0.6);
                video.style.opacity = opacity;
            }

            // Sticky Glass Navigation
            if (nav) {
                if (scrollY > 50) {
                    nav.classList.add('liquid-glass-nav', 'nav-scrolled');
                } else {
                    nav.classList.remove('liquid-glass-nav', 'nav-scrolled');
                }
            }

            // Vertical Line Animation
            if (processSection && highlight) {
                const rect = processSection.getBoundingClientRect();
                if (rect.top < windowHeight && rect.bottom > 0) {
                    const relativeScroll = windowHeight / 2; 
                    highlight.style.opacity = '1';
                    const absoluteTop = scrollY + relativeScroll - processSection.offsetTop;
                    highlight.style.top = `${absoluteTop}px`;
                    highlight.style.transform = `translate(-50%, -50%) scaleY(0.5)`;
                } else {
                    highlight.style.opacity = '0';
                }
            }

            // Scroll Reveal Logic
            const reveals = document.querySelectorAll('.scroll-reveal');
            reveals.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                if (elementTop < windowHeight - elementVisible) {
                    element.classList.add('active');
                }
            });

            // Large Statement Reveal (Illumination)
            if (statementText) {
                const rect = statementText.getBoundingClientRect();
                const threshold = windowHeight * 0.75;
                if (rect.top < threshold) {
                    statementText.classList.add('active');
                } else {
                    statementText.classList.remove('active');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        // Intersection Observer for luminescent glow on icons
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px', 
            threshold: 0.2
        };

        const iconObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const group = entry.target.getAttribute('data-reveal-group');
                let iconId = '';
                
                if (group === 'step-1') iconId = 'icon-develop';
                if (group === 'step-2') iconId = 'icon-design';
                if (group === 'step-3') iconId = 'icon-deploy';
                
                const icon = document.getElementById(iconId);
                
                if (entry.isIntersecting) {
                    icon?.classList.add('glow-active');
                } else {
                    icon?.classList.remove('glow-active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-reveal-group]').forEach(el => iconObserver.observe(el));

        // Initialize on load
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            iconObserver.disconnect();
        };
    }, []);

    return (
        <div className="app-container">
            <nav id="main-nav" className="main-nav">
                <div className="logo">Velorah®</div>
                <div className="nav-links desktop-only">
                    <a className="nav-link-animated nav-link-active" href="#">Home</a>
                    <a className="nav-link-animated" href="#">Studio</a>
                    <a className="nav-link-animated" href="#">About</a>
                    <a className="nav-link-animated" href="#">Journal</a>
                    <a className="nav-link-animated" href="#">Reach Us</a>
                </div>
                <button className="btn-begin liquid-glass">Begin Journey</button>
            </nav>

            <main className="main-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <video 
                        id="hero-video"
                        className="hero-video" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                    >
                        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
                    </video>
                    
                    <div className="hero-content">
                        <h1 className="hero-heading animate-fade-rise">
                            Where <em>dreams</em> rise <br className="hidden-mobile" /> <em>through the silence.</em>
                        </h1>
                        <p className="hero-subtext animate-fade-rise-delay">
                            We're designing tools for deep thinkers, bold creators, and quiet rebels. 
                            Amid the chaos, we build digital spaces for sharp focus and inspired work.
                        </p>
                        <button className="btn-hero liquid-glass animate-fade-rise-delay-2">
                            Begin Journey
                        </button>
                    </div>
                    
                    <div className="scroll-indicator animate-pulse">
                        <span className="scroll-text">Scroll</span>
                        <div className="scroll-line"></div>
                    </div>
                </section>

                {/* The Process Section */}
                <section id="process" className="process-section">
                    <div className="vertical-dotted-line"></div>
                    <div id="line-highlight" className="scroll-highlight-point"></div>
                    
                    <div className="process-container">
                        <div className="section-header scroll-reveal">
                            <h2 className="section-title">The Process</h2>
                            <div className="section-divider"></div>
                        </div>

                        <div className="steps-container">
                            {/* Step 1: Develop */}
                            <div className="step-row scroll-reveal" data-reveal-group="step-1">
                                <div className="step-content text-right mobile-order-2 desktop-order-1">
                                    <div className="icon-container right-aligned">
                                        <div id="icon-develop" className="step-icon liquid-glass">
                                            <span className="material-symbols-outlined">terminal</span>
                                        </div>
                                    </div>
                                    <h3 className="step-title">Develop</h3>
                                    <p className="step-text">
                                        Unlock developer productivity. Long builds, complex config, and disjointed tools break the development process. Remove obstacles by giving them a better toolkit.
                                    </p>
                                </div>
                                <div className="step-number-container mobile-order-1 desktop-order-2">
                                    <div className="step-number">1</div>
                                </div>
                                <div className="step-image hidden-mobile mobile-order-3 desktop-order-3">
                                    <img alt="Development Interface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtYqYocFnZZpkGSyRO21hVQQ0UQmkHNzHldfgEQJWU2Ok4leM8boRTe_DCfudY0sMdCXscuJ5bo2vZHgzLtkYdNcqmdBEXRKK9-tEJxwPS_5NR_4NbXwQmj34wkyoge_0Yxo4ZNzWMqjYNe7JYz0C2pZ7ETYYMEh9V536sIioEiPWRT28Nvk7qN9j9-SVuM2mzdOwE_gaAnwAKDbXnQ6OW0aH-QxQ9PbFMsZvdTGfnPndPuml46_oYugRGrTjMR3U6ND5XIDqIbCWE" />
                                </div>
                            </div>

                            {/* Step 2: Design */}
                            <div className="step-row scroll-reveal" data-reveal-group="step-2">
                                <div className="step-image hidden-mobile">
                                    <img alt="Design System" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0mwDb1S3rOqKFzsaLu78Ru1hGKgdQ1yxaKUhL-bhlVWJlNGCqYchdZzZ0vvVUPZe9zCVzqLb12satuhlvGG8ajxJPNUvSKJRU5tqF7uyqYoZSLh9P5nbSuuXOd5nJujyJvqjSKgSbEOXltntUMUW5cbcgTN7Ss0fUxuLyHvvrkA3jOuMRsV2EEOLzjWMiyW01xNzrMxVgpWWvIMvCAplcDRQ-3d3tzqK2Z95xyuKWO_VmCsKaGJc_a1dfkrrFAfgI_QXX1lBIMul2" />
                                </div>
                                <div className="step-number-container">
                                    <div className="step-number">2</div>
                                </div>
                                <div className="step-content text-left">
                                    <div className="icon-container">
                                        <div id="icon-design" className="step-icon liquid-glass">
                                            <span className="material-symbols-outlined">layers</span>
                                        </div>
                                    </div>
                                    <h3 className="step-title">Design</h3>
                                    <p className="step-text">
                                        Crafting silence through visual clarity. We strip away the unnecessary, focusing on core aesthetics that resonate with the human spirit and digital precision.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Deploy */}
                            <div className="step-row scroll-reveal" data-reveal-group="step-3">
                                <div className="step-content text-right mobile-order-2 desktop-order-1">
                                    <div className="icon-container right-aligned">
                                        <div id="icon-deploy" className="step-icon liquid-glass">
                                            <span className="material-symbols-outlined">rocket_launch</span>
                                        </div>
                                    </div>
                                    <h3 className="step-title">Deploy</h3>
                                    <p className="step-text">
                                        Seamless transitions into the wild. Our deployment strategy ensures that your vision reaches the world with the same integrity and speed as it was conceived.
                                    </p>
                                </div>
                                <div className="step-number-container mobile-order-1 desktop-order-2">
                                    <div className="step-number">3</div>
                                </div>
                                <div className="step-image hidden-mobile mobile-order-3 desktop-order-3">
                                    <img alt="Global Deployment" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEqH3HkKJXjzCY0OaEpvjO-mGaohw9XLv7zKPzv_RMfnSI1TEU9wV30rULxtWPeGjmO7ZAYOEnG1ZQrnOggfh2-iz4tW7AIJM621jLhU_ssD2PrMKKATRTTd_-hb5VMxzSKVAfEqtfvbc8cPns8MKQNGlcSAjpA7c9gOMc96JqyG2-GLWVBLnGRgfOY3j9QmhUQqMtqQETfnvy78IraLtD7Kc79PpVBL6JGnMGI2MYKjYIAsdRmkg9MwaAxV6c01MpTbhoB5sAuts0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Large Statement Section */}
                <section id="statement-section" className="statement-section">
                    <div className="statement-container">
                        <h2 id="reveal-statement" className="illuminate-text">
                            We build the digital architecture <br className="hidden-mobile-block" /> that allows the world's most <br className="hidden-mobile-block" /> ambitious ideas to finally breathe.
                        </h2>
                    </div>
                    
                    <div className="statement-background">
                        <div className="ambient-glow"></div>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo">Velorah® Studios</div>
                    <div className="footer-links">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Social</a>
                    </div>
                    <p className="footer-copyright">
                        © 2024 Velorah® Studios. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
