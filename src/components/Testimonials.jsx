import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const testimonials = [
  {
    id: 1,
    name: "Anjali Sharma",
    role: "Verified Buyer",
    rating: 5,
    text: "I've been using Gen-1 Eco products for three months now, and the results are amazing. The laundry detergent is gentle on my clothes but tough on stains. Highly recommended!",
    avatar: "https://i.pravatar.cc/150?u=anjali",
  },
  {
    id: 2,
    name: "Rohan Gupta",
    role: "Regular Customer",
    rating: 5,
    text: "The floor cleaner has a lovely, fresh scent that isn't overpowering. It's great to know I'm using products that are safe for my pets and the environment.",
    avatar: "https://i.pravatar.cc/150?u=rohan",
  },
  {
    id: 3,
    name: "Sneha Kapoor",
    role: "Eco-Conscious Mom",
    rating: 4,
    text: "Finally found dish soap that doesn't dry out my hands! Gen-1 Eco is a game-changer for my kitchen routine. I love the mission behind the brand.",
    avatar: "https://i.pravatar.cc/150?u=sneha",
  },
  {
    id: 4,
    name: "Vikram Nair",
    role: "Verified Buyer",
    rating: 5,
    text: "Switched to Gen-1 Eco six months ago and haven't looked back. The multi-surface cleaner is incredible — one bottle handles the whole house!",
    avatar: "https://i.pravatar.cc/150?u=vikram",
  },
  {
    id: 5,
    name: "Priya Mehta",
    role: "Loyal Customer",
    rating: 5,
    text: "The packaging is completely plastic-free and the formula is superb. My home smells fresh without any harsh chemicals. This brand truly walks the talk.",
    avatar: "https://i.pravatar.cc/150?u=priya",
  },
  {
    id: 6,
    name: "Arjun Bose",
    role: "New Customer",
    rating: 4,
    text: "Very impressed with the quality. The dishwasher pods work better than the branded ones I was using before, and they're kinder to the planet. Will definitely reorder.",
    avatar: "https://i.pravatar.cc/150?u=arjun",
  },
];

function useItemsPerSlide() {
  const getItems = () => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  };
  const [items, setItems] = useState(getItems);

  useEffect(() => {
    const handler = () => setItems(getItems());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return items;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const Testimonials = () => {
  const itemsPerSlide = useItemsPerSlide();
  const slides = chunkArray(testimonials, itemsPerSlide);
  const totalSlides = slides.length;

  const [current, setCurrent] = useState(0);
  const autoRef = useRef(null);
  const touchStartX = useRef(null);

  // Keep current in bounds when itemsPerSlide changes
  useEffect(() => {
    setCurrent((c) => Math.min(c, totalSlides - 1));
  }, [totalSlides]);

  const goTo = useCallback(
    (index) => {
      const next = (index + totalSlides) % totalSlides;
      setCurrent(next);
    },
    [totalSlides]
  );

  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % totalSlides);
    }, 5000);
  }, [totalSlides]);

  useEffect(() => {
    resetAuto();
    return () => clearInterval(autoRef.current);
  }, [resetAuto]);

  const handlePrev = () => { goTo(current - 1); resetAuto(); };
  const handleNext = () => { goTo(current + 1); resetAuto(); };
  const handleDot = (i) => { goTo(i); resetAuto(); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? handleNext() : handlePrev(); }
    touchStartX.current = null;
  };

  return (
    <>
      <style>{`
        .ts-section {
          padding: 60px 0;
          background-color: #fdfaf7;
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .ts-container {
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
        }
        .ts-header {
          margin-bottom: 50px;
        }
        .ts-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 700;
          color: #1a3020;
          margin-bottom: 12px;
        }
        .ts-header p {
          font-size: 15px;
          color: #6b6b6b;
          max-width: 540px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* Slider */
        .ts-slider-wrapper {
          position: relative;
          padding: 0 48px;
          box-sizing: border-box;
        }
        .ts-track-outer {
          overflow: hidden;
          border-radius: 16px;
        }
        .ts-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
          user-select: none;
        }
        .ts-slide {
          min-width: 100%;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          padding: 4px 2px 8px;
        }
        .ts-slide-inner {
          display: grid;
          gap: 24px;
          width: 100%;
        }
        .ts-slide-inner.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .ts-slide-inner.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .ts-slide-inner.cols-1 { grid-template-columns: 1fr; }

        /* Card */
        .ts-card {
          background: #fff;
          padding: 36px 30px 28px;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(26, 48, 32, 0.07);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          text-align: left;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .ts-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 48px rgba(26, 48, 32, 0.13);
        }
        .ts-quote-icon {
          position: absolute;
          top: 20px;
          right: 24px;
          color: rgba(184, 151, 58, 0.15);
          font-size: 36px;
        }
        .ts-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
          color: #b8973a;
        }
        .ts-text {
          font-size: 14.5px;
          line-height: 1.75;
          color: #555;
          font-style: italic;
          margin-bottom: 24px;
          flex: 1;
        }
        .ts-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ts-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #b8973a;
          flex-shrink: 0;
        }
        .ts-user-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a3020;
          margin: 0 0 2px;
        }
        .ts-user-role {
          font-size: 12.5px;
          color: #b8973a;
          font-weight: 500;
        }

        /* Nav buttons */
        .ts-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #e0d9ce;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.09);
          transition: background 0.2s, border-color 0.2s, opacity 0.2s;
          z-index: 10;
          color: #1a3020;
          font-size: 20px;
          padding: 0;
        }
        .ts-btn:hover {
          background: #1a3020;
          border-color: #1a3020;
          color: #fff;
        }
        .ts-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }
        .ts-btn:disabled:hover {
          background: #fff;
          border-color: #e0d9ce;
          color: #1a3020;
        }
        .ts-btn-prev { left: 0; }
        .ts-btn-next { right: 0; }

        /* Dots */
        .ts-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
        }
        .ts-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: #d6cfc4;
          cursor: pointer;
          border: none;
          padding: 0;
          transition: background 0.25s, width 0.3s ease;
        }
        .ts-dot.active {
          background: #b8973a;
          width: 24px;
        }

        @media (max-width: 1024px) {
          .ts-section { padding: 50px 0; }
        }
        @media (max-width: 768px) {
          .ts-slider-wrapper { padding: 0 36px; }
          .ts-section { padding: 40px 0; }
          .ts-header { margin-bottom: 36px; }
          .ts-btn { width: 36px; height: 36px; font-size: 16px; }
          .ts-card { padding: 28px 22px 22px; }
        }
      `}</style>

      <section className="ts-section">
        <div className="ts-container">
          <div className="ts-header">
            <h2>What Our Customers Say</h2>
            <p>Real stories from real customers who have embraced a cleaner, greener lifestyle with Gen-1 Eco.</p>
          </div>

          <div className="ts-slider-wrapper">
            {/* Prev Button */}
            <button
              className="ts-btn ts-btn-prev"
              onClick={handlePrev}
              aria-label="Previous slide"
            >
              <FiChevronLeft />
            </button>

            {/* Track */}
            <div
              className="ts-track-outer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="ts-track"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {slides.map((group, slideIdx) => (
                  <div key={slideIdx} className="ts-slide">
                    <div className={`ts-slide-inner cols-${itemsPerSlide}`}>
                      {group.map((t) => (
                        <div key={t.id} className="ts-card">
                          <FaQuoteLeft className="ts-quote-icon" />
                          <div className="ts-stars">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                style={{ opacity: i < t.rating ? 1 : 0.2 }}
                              />
                            ))}
                          </div>
                          <p className="ts-text">"{t.text}"</p>
                          <div className="ts-user">
                            <img
                              src={t.avatar}
                              alt={t.name}
                              className="ts-avatar"
                            />
                            <div>
                              <p className="ts-user-name">{t.name}</p>
                              <span className="ts-user-role">{t.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              className="ts-btn ts-btn-next"
              onClick={handleNext}
              aria-label="Next slide"
            >
              <FiChevronRight />
            </button>
          </div>

          {/* Dots */}
          <div className="ts-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`ts-dot${i === current ? " active" : ""}`}
                onClick={() => handleDot(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;