import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./App.css";

/* =========================================
   REUSABLE MOTION
========================================= */

function Reveal({
  children,
  delay = 0,
  y = 30,
  className = "",
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}


/* =========================================
   CINEMATIC PORTRAIT SEQUENCE
========================================= */

const PORTRAIT_FRAMES = 240;

const portraitChapters = [
  {
    start: 0,
    end: 0.24,
    number: "01",
    label: "BACKEND ENGINEERING",
    title: "BACKEND",
    skills: "C#  ·  .NET  ·  ASP.NET CORE",
  },
  {
    start: 0.24,
    end: 0.48,
    number: "02",
    label: "API ENGINEERING",
    title: "APIs",
    skills: "REST APIs  ·  EF CORE  ·  LINQ",
  },
  {
    start: 0.48,
    end: 0.73,
    number: "03",
    label: "FULL STACK",
    title: "BUILD",
    skills: "REACT  ·  SQL SERVER  ·  MICROSERVICES",
  },
  {
    start: 0.73,
    end: 1,
    number: "04",
    label: "ENGINEERING PRINCIPLES",
    title: "SYSTEMS",
    skills: "SOLID  ·  CLEAN ARCHITECTURE  ·  GIT",
  },
];

function getPortraitFramePath(index) {
  return `/portrait-frames/frame-${String(index).padStart(4, "0")}.jpg`;
}

function getPortraitChapter(progress) {
  return (
    portraitChapters.find(
      (chapter) => progress >= chapter.start && progress < chapter.end
    ) || portraitChapters[portraitChapters.length - 1]
  );
}

function PortraitSequence() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animationRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const activeChapter = getPortraitChapter(progress);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;

    if (!canvas || !section) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const images = Array.from({ length: PORTRAIT_FRAMES }, (_, index) => {
      const image = new Image();
      image.decoding = "async";
      image.src = getPortraitFramePath(index);
      return image;
    });

    imagesRef.current = images;
    let lastDrawnFrame = -1;

    const drawFrame = (frame) => {
      const frameIndex = Math.min(
        PORTRAIT_FRAMES - 1,
        Math.max(0, Math.round(frame))
      );

      if (frameIndex === lastDrawnFrame) return;

      const image = imagesRef.current[frameIndex];

      if (!image || !image.complete || !image.naturalWidth) return;

      lastDrawnFrame = frameIndex;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const isMobile = width <= 768;

      context.fillStyle = "#050505";
      context.fillRect(0, 0, width, height);

      if (isMobile) {
        // Mobile gets a deliberately composed cinematic treatment instead of
        // forcing the desktop 16:9 artwork to fill a tall phone screen.
        // A soft full-screen version provides the atmosphere, while the
        // sharper foreground is zoomed out so the subject is not enormous.
        const coverScale = Math.max(
          width / image.naturalWidth,
          height / image.naturalHeight
        );
        const bgWidth = image.naturalWidth * coverScale;
        const bgHeight = image.naturalHeight * coverScale;
        const bgX = (width - bgWidth) * 0.62;
        const bgY = (height - bgHeight) / 2;

        context.save();
        context.filter = "blur(18px)";
        context.globalAlpha = 0.34;
        context.drawImage(image, bgX, bgY, bgWidth, bgHeight);
        context.restore();

        context.fillStyle = "rgba(5, 5, 5, 0.34)";
        context.fillRect(0, 0, width, height);

        const mobileScale = coverScale * 0.72;
        const drawWidth = image.naturalWidth * mobileScale;
        const drawHeight = image.naturalHeight * mobileScale;
        const x = (width - drawWidth) * 0.64;
        const y = (height - drawHeight) / 2;

        context.save();
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, x, y, drawWidth, drawHeight);
        context.restore();
        return;
      }

      // Desktop remains exactly the existing full-screen 16:9 composition.
      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight
      );
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      context.save();
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, x, y, drawWidth, drawHeight);
      context.restore();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawnFrame = -1;
      drawFrame(currentFrameRef.current);
    };

    const updateScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      const travelled = Math.min(Math.max(-rect.top, 0), total);
      const nextProgress = Math.min(Math.max(travelled / total, 0), 1);

      targetFrameRef.current = nextProgress * (PORTRAIT_FRAMES - 1);
      setProgress(nextProgress);
    };

    const animate = () => {
      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const difference = target - current;

      if (Math.abs(difference) > 0.02) {
        currentFrameRef.current += difference * 0.16;
        drawFrame(currentFrameRef.current);
      } else {
        currentFrameRef.current = target;
        drawFrame(target);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });

    resize();
    updateScroll();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      cancelAnimationFrame(animationRef.current);
      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, []);

  const chapterProgress = Math.min(
    Math.max(
      (progress - activeChapter.start) /
        (activeChapter.end - activeChapter.start),
      0
    ),
    1
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      className="portrait-sequence"
      aria-label="Cinematic introduction"
    >
      <div className="portrait-sticky">
        <canvas
          ref={canvasRef}
          className="portrait-canvas"
          aria-label="Cinematic portrait sequence"
        />

        <div className="portrait-vignette" />

        <header className="portrait-header">
          <div className="portrait-header-left">
            <span>PORTFOLIO / 2026</span>
          </div>

          <div className="portrait-header-right">
            <span>INDIA</span>
          </div>
        </header>

        <div className="portrait-identity">
          <h1>RANITH.N.</h1>
          <span>SOFTWARE DEVELOPER</span>
        </div>

        <motion.div
          className="portrait-skill-copy"
          key={activeChapter.number}
          initial={{ opacity: 0, y: 22, filter: "blur(7px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="portrait-skill-index">
            <span>{activeChapter.number}</span>
            <span>{activeChapter.label}</span>
          </div>

          <h1>{activeChapter.title}</h1>

          <div className="portrait-skill-line">
            <span className="portrait-skill-dot" />
            <span>{activeChapter.skills}</span>
          </div>
        </motion.div>

        <div className="portrait-bottom">
          <span>SCROLL TO EXPLORE</span>
          <span>{String(Math.round(progress * 100)).padStart(3, "0")}</span>
        </div>

        <div className="portrait-progress">
          <span style={{ transform: `scaleY(${progress})` }} />
        </div>

        <div className="portrait-chapter-progress">
          <span>{String(activeChapter.number).padStart(2, "0")}</span>
          <div>
            <span style={{ transform: `scaleX(${chapterProgress})` }} />
          </div>
          <span>04</span>
        </div>
      </div>
    </section>
  );
}

/* =========================================
   EXPERIENCE
========================================= */

/* =========================================
   EXPERIENCE TURNING SEQUENCE
========================================= */

const TURNING_FRAMES = 240;

function getTurningFramePath(index) {
  return `/turning-frames-16x9/frame-${String(index).padStart(4, "0")}.jpg`;
}

function TurningExperienceSequence() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const framesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animationRef = useRef(null);
  const progressBarRef = useRef(null);
  const [activeRole, setActiveRole] = useState(0);

  const experienceChapters = [
    {
      number: "01",
      label: "CURRENT ROLE",
      title: "JUNIOR SOFTWARE DEVELOPER",
      company: "EGDK INDIA PVT. LTD.",
      date: "NOV 2024 — PRESENT",
      description:
        "Working on a large-scale invoicing application across Grid, Trade and Invoicing.",
      work: [
        "REST APIs with C# and ASP.NET Core",
        "SQL Server and stored procedures",
        "Unit testing, debugging and code reviews",
      ],
      tech: "C# · .NET · ASP.NET CORE · REST APIs",
    },
    {
      number: "02",
      label: "EARLIER ROLE",
      title: "SOFTWARE DEVELOPER TRAINEE",
      company: "EGDK INDIA PVT. LTD.",
      date: "AUG 2024 — NOV 2024",
      description:
        "Contributed to an Estate Management System while building backend services and API integrations.",
      work: [
        "REST APIs and backend integration",
        "Microservices architecture",
        "CRUD operations with Entity Framework",
      ],
      tech: "C# · .NET · ASP.NET CORE · EF CORE",
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const visibleImage = imageRef.current;

    if (!section || !visibleImage) return;

    let destroyed = false;

    const getFramePath = (index) =>
      `/turning-frames-16x9/frame-${String(index).padStart(4, "0")}.jpg`;

    const frames = Array.from({ length: TURNING_FRAMES }, (_, index) => {
      const image = new Image();
      image.decoding = "async";
      image.src = getFramePath(index);
      return image;
    });

    framesRef.current = frames;
    visibleImage.src = getFramePath(0);

    const showFrame = (frame) => {
      if (destroyed) return;

      const index = Math.min(
        TURNING_FRAMES - 1,
        Math.max(0, Math.round(frame))
      );

      const nextImage = framesRef.current[index];

      if (!nextImage || !nextImage.complete || nextImage.naturalWidth === 0) {
        return;
      }

      currentFrameRef.current = index;
      visibleImage.src = nextImage.src;
    };

    const updateScroll = () => {
      const rect = section.getBoundingClientRect();
      const distance = section.offsetHeight - window.innerHeight;

      if (distance <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / distance));

      targetFrameRef.current = progress * (TURNING_FRAMES - 1);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${Math.max(0.02, progress)})`;
      }

      // Keep the role change tied to the visual transition itself.
      // The latest role appears first; the earlier role takes over
      // once the person has passed the turning midpoint.
      const nextRole = progress < 0.52 ? 0 : 1;
      setActiveRole((current) =>
        current === nextRole ? current : nextRole
      );
    };

    const animate = () => {
      if (destroyed) return;

      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const next =
        Math.abs(target - current) < 0.02
          ? target
          : current + (target - current) * 0.18;

      currentFrameRef.current = next;
      showFrame(next);
      animationRef.current = requestAnimationFrame(animate);
    };

    const onFrameLoad = (event) => {
      if (destroyed) return;

      const loaded = event.currentTarget;
      const loadedIndex = framesRef.current.indexOf(loaded);

      if (loadedIndex === Math.round(currentFrameRef.current)) {
        visibleImage.src = loaded.src;
      }
    };

    frames.forEach((image) => image.addEventListener("load", onFrameLoad));

    const firstFrame = frames[0];
    const startAnimation = () => {
      if (destroyed) return;
      visibleImage.src = firstFrame.src;
      updateScroll();
      animate();
    };

    if (firstFrame.complete && firstFrame.naturalWidth > 0) {
      startAnimation();
    } else {
      firstFrame.addEventListener("load", startAnimation, { once: true });
    }

    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      destroyed = true;
      window.removeEventListener("scroll", updateScroll);
      cancelAnimationFrame(animationRef.current);
      frames.forEach((image) =>
        image.removeEventListener("load", onFrameLoad)
      );
    };
  }, []);

  const role = experienceChapters[activeRole];

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="experience-turn-sequence"
      aria-label="Experience transition"
    >
      <div className="experience-turn-sticky">
        <img
          ref={imageRef}
          className="experience-turn-image"
          src="/turning-frames-16x9/frame-0000.jpg"
          alt=""
          draggable="false"
        />

        <div className="experience-turn-vignette" />

        <div className="experience-turn-label">
          <span className="experience-turn-number">02</span>
          <span className="experience-turn-title">EXPERIENCE</span>
          <span className="experience-turn-subtitle">MY JOURNEY SO FAR</span>
        </div>

        <motion.div
          key={role.number}
          className="experience-role-overlay"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="experience-role-kicker">
            <span>{role.number}</span>
            <span>{role.label}</span>
          </div>

          <h2>{role.title}</h2>

          <div className="experience-role-meta">
            <span>{role.company}</span>
            <span>{role.date}</span>
          </div>

          <p className="experience-role-description">
            {role.description}
          </p>

          <div className="experience-role-work">
            <span className="experience-role-work-label">WORKED ON</span>
            <div className="experience-role-work-list">
              {role.work.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="experience-role-tech">{role.tech}</div>
        </motion.div>

        <div className="experience-turn-progress" aria-hidden="true">
          <span ref={progressBarRef} />
        </div>
      </div>
    </section>
  );
}



function Experience() {
  return <TurningExperienceSequence />;
}

/* =========================================
   PROJECTS
========================================= */

function Projects() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const backdropRef = useRef(null);
  const framesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const animationRef = useRef(null);

  const PROJECT_TRANSITION_FRAMES = 259;

  const getFramePath = (index) =>
    `/projects-transition/frame-${String(index).padStart(4, "0")}.jpg`;

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const backdrop = backdropRef.current;

    if (!section || !image) return;

    let destroyed = false;

    const frames = Array.from(
      { length: PROJECT_TRANSITION_FRAMES },
      (_, index) => {
        const frame = new Image();
        frame.decoding = "async";
        frame.src = getFramePath(index);
        return frame;
      }
    );

    framesRef.current = frames;
    image.src = getFramePath(0);

    const showFrame = (frameNumber) => {
      if (destroyed) return;

      const index = Math.max(
        0,
        Math.min(
          PROJECT_TRANSITION_FRAMES - 1,
          Math.round(frameNumber)
        )
      );

      const next = framesRef.current[index];

      if (!next) return;

      if (next.complete && next.naturalWidth > 0) {
        if (image.src !== next.src) {
          image.src = next.src;
        }
        if (backdrop && backdrop.src !== next.src) {
          backdrop.src = next.src;
        }
        return;
      }

      next.addEventListener(
        "load",
        () => {
          if (!destroyed && Math.round(currentFrameRef.current) === index) {
            image.src = next.src;
            if (backdrop) backdrop.src = next.src;
          }
        },
        { once: true }
      );
    };

    const updateTargetFromScroll = () => {
      const rect = section.getBoundingClientRect();
      const distance = section.offsetHeight - window.innerHeight;

      if (distance <= 0) return;

      const travelled = Math.min(
        Math.max(-rect.top, 0),
        distance
      );

      const progress = travelled / distance;
      targetFrameRef.current =
        progress * (PROJECT_TRANSITION_FRAMES - 1);
    };

    const animate = () => {
      if (destroyed) return;

      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const difference = target - current;

      const next =
        Math.abs(difference) < 0.03
          ? target
          : current + difference * 0.22;

      currentFrameRef.current = next;
      showFrame(next);

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", updateTargetFromScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateTargetFromScroll);

    updateTargetFromScroll();
    showFrame(0);
    animate();

    return () => {
      destroyed = true;
      window.removeEventListener("scroll", updateTargetFromScroll);
      window.removeEventListener("resize", updateTargetFromScroll);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="projects-cinematic-section"
      aria-label="Selected projects"
    >
      <div className="projects-cinematic-stage">
        <img
          ref={backdropRef}
          className="projects-transition-backdrop"
          src={getFramePath(0)}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
        <img
          ref={imageRef}
          className="projects-transition-image"
          src={getFramePath(0)}
          alt="Cinematic projects transition"
          draggable="false"
        />
        <div className="projects-transition-vignette" aria-hidden="true" />
      </div>
    </section>
  );
}

function About() {
  const education = [
    {
      year: "2020 — 2024",
      title: "Bachelor of Engineering — CSE",
      institution: "Sahyadri College of Engineering and Management",
      result: "CGPA 8.4",
      detail:
        "Studied software engineering, operating systems, cloud computing, data structures and algorithms, and object-oriented programming.",
    },
    {
      year: "2018 — 2020",
      title: "Pre University — Science",
      institution: "St. Aloysius P.U. College",
      result: "89.33%",
      detail:
        "PCMC curriculum with Physics, Chemistry, Mathematics and Computer Science.",
    },
    {
      year: "2017 — 2018",
      title: "Class X — KSEEB",
      institution: "Milagres High School, Mangalore",
      result: "91.68%",
      detail: "Completed elementary schooling under KSEEB.",
    },
  ];

  return (
    <section className="about-editorial-section" id="about">
      <div className="about-editorial-grain" aria-hidden="true" />
      <div className="about-editorial-glow about-editorial-glow-one" aria-hidden="true" />
      <div className="about-editorial-glow about-editorial-glow-two" aria-hidden="true" />

      <div className="about-editorial-container">
        <div className="about-editorial-hero">
          <Reveal>
            <div className="about-editorial-copy">
              <span className="about-editorial-kicker">ABOUT ME</span>

              <h2>
                I BUILD SOFTWARE
                <br />
                THAT MAKES <em>COMPLEX</em>
                <br />
                THINGS FEEL SIMPLE.
              </h2>

              <p className="about-editorial-lead">
                I’m a software engineer focused on backend systems, full-stack
                applications and AI-powered workflows. I like understanding the
                problem first, designing the system clearly, and building software
                that is reliable, maintainable and useful.
              </p>

              <div className="about-editorial-meta">
                <span>BACKEND</span>
                <i />
                <span>FULL STACK</span>
                <i />
                <span>AI</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="about-editorial-portrait-wrap">
              <div className="about-editorial-portrait-label">
                <span>RANITH N.</span>
                <span>SOFTWARE ENGINEER</span>
              </div>
              <div className="about-editorial-portrait-frame">
                <img
                  src="/about-portrait.png"
                  alt=""
                  draggable="false"
                />
                <div className="about-editorial-portrait-fade" />
              </div>
              <div className="about-editorial-portrait-note">
                <span>BUILDING WITH INTENT.</span>
                <span>LEARNING THROUGH EVERY SYSTEM.</span>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="about-editorial-block">
          <Reveal>
            <div className="about-editorial-block-label">
              <span>EDUCATION</span>
            </div>
          </Reveal>

          <div className="about-editorial-education-list">
            {education.map((item, index) => (
              <Reveal key={item.year} delay={index * 0.06}>
                <article className="about-editorial-education-item">
                  <span className="about-editorial-year">{item.year}</span>
                  <div className="about-editorial-education-main">
                    <h3>{item.title}</h3>
                    <p className="about-editorial-institution">{item.institution}</p>
                    <p>{item.detail}</p>
                  </div>
                  <strong>{item.result}</strong>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="about-editorial-block about-editorial-certification-block">
          <Reveal>
            <div className="about-editorial-block-label">
              <span>CERTIFICATION</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="about-editorial-certification">
              <span>01</span>
              <div>
                <h3>AZ-900</h3>
                <p>Microsoft Azure Fundamentals</p>
                <small>Azure Services · Cloud Concepts</small>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}

/* =========================================
   CONTACT
========================================= */

function Contact() {
  return (
    <section
      className="contact-section"
      id="contact"
    >
      <div className="contact-container">

        <Reveal>
          <div className="section-eyebrow">
            05 / CONTACT
          </div>
        </Reveal>

        <div className="contact-main">

          <Reveal>
            <div className="contact-heading">

              <span>
                LET'S BUILD
              </span>

              <strong>
                SOMETHING
                <br />
                USEFUL.
              </strong>

            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="contact-side">

              <p>
                Have a problem worth solving, a system
                worth building, or an idea you want to
                turn into something real?
              </p>

              <a
                className="contact-button"
                href="mailto:ranithn272002@gmail.com"
              >
                <span>
                  START A CONVERSATION
                </span>

                <span>
                  ↗
                </span>
              </a>

              <a
                className="contact-email"
                href="mailto:ranithn272002@gmail.com"
              >
                ranithn272002@gmail.com
              </a>

            </div>
          </Reveal>

        </div>

        <div className="contact-footer">

          <Reveal>
            <div>
              <span className="contact-footer-label">
                RANITH N.
              </span>

              <span>
                SOFTWARE ENGINEER
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div>
              <span className="contact-footer-label">
                BASED IN
              </span>

              <span>
                INDIA
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <span className="contact-footer-label">
                STATUS
              </span>

              <span className="contact-status">
                <i />
                BUILDING
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="contact-top">
              <a href="#top">
                BACK TO TOP ↑
              </a>
            </div>
          </Reveal>

        </div>

      </div>
    </section>
  );
}


/* =========================================
   APP
========================================= */

function App() {
  const [activeSection, setActiveSection] = useState("top");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = [
      "top",
      "experience",
      "projects",
      "about",
      "contact",
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      let current = "experience";

      sections.forEach((id) => {
        const section = document.getElementById(id);

        if (
          section &&
          section.offsetTop <= scrollPosition
        ) {
          current = id;
        }
      });

      setActiveSection(current);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <main className="site">

      {/* NAVIGATION */}

      <header className={`navbar ${menuOpen ? "menu-open" : ""}`}>

        <a
          href="#top"
          className="nav-brand"
          onClick={() => setMenuOpen(false)}
          aria-label="Go to top"
        >
          RN<span>.</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a
            href="#top"
            className={activeSection === "top" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            HOME
          </a>

          <a
            href="#experience"
            className={activeSection === "experience" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            EXPERIENCE
          </a>

          <a
            href="#projects"
            className={activeSection === "projects" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            PROJECTS
          </a>

          <a
            href="#about"
            className={activeSection === "about" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            ABOUT
          </a>
        </nav>

        <a
          href="#contact"
          className="nav-contact"
          onClick={() => setMenuOpen(false)}
        >
          LET'S TALK
        </a>

        <button
          type="button"
          className={`nav-menu-button ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          <span />
          <span />
        </button>

      </header>

      <div
        id="mobile-navigation"
        className={`mobile-navigation ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-navigation-inner">

          <div className="mobile-navigation-label">
            <span>NAVIGATION</span>
            <span>RANITH N. / 2026</span>
          </div>

          <nav aria-label="Mobile navigation">
            <a
              href="#top"
              className={activeSection === "top" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>01</span>
              HOME
            </a>

            <a
              href="#experience"
              className={activeSection === "experience" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>02</span>
              EXPERIENCE
            </a>

            <a
              href="#projects"
              className={activeSection === "projects" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>03</span>
              PROJECTS
            </a>

            <a
              href="#about"
              className={activeSection === "about" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>04</span>
              ABOUT
            </a>

            <a
              href="#contact"
              className={activeSection === "contact" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>05</span>
              CONTACT
            </a>
          </nav>

          <div className="mobile-navigation-footer">
            <span>SOFTWARE ENGINEER</span>
            <span>INDIA</span>
          </div>

        </div>
      </div>


      {/* CINEMATIC PORTRAIT SEQUENCE */}

      <PortraitSequence />


      {/* SECTIONS */}

      <Experience />

      <Projects />
      <About />

      <Contact />

    </main>
  );
}

export default App; 