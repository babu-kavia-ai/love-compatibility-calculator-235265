import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Normalize a name for hashing/scoring:
 * - trim
 * - collapse internal whitespace
 * - lowercase
 */
function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * A small deterministic 32-bit string hash.
 * Uses a FNV-1a style mixing for stable results across sessions/devices.
 */
function fnv1a32(str) {
  let hash = 0x811c9dc5; // offset basis
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    // hash *= 16777619 with 32-bit overflow:
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit integer
  return hash >>> 0;
}

function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deterministically compute compatibility score (0..100) from two names.
 * The algorithm:
 * - normalize both names
 * - sort to make A+B same as B+A (order-insensitive)
 * - hash combined string
 * - map into 0..100, with a mild "center pull" to reduce extremes a bit
 */
function computeCompatibilityScore(nameA, nameB) {
  const a = normalizeName(nameA);
  const b = normalizeName(nameB);

  const [first, second] = [a, b].sort();
  const combined = `${first}❤️${second}`;

  const h = fnv1a32(combined);

  // Base in [0..100]
  const base = h % 101;

  // Mild center pull using a second mix, still deterministic.
  const mix = fnv1a32(`${combined}#mix`) % 101;
  const centered = Math.round((base * 0.7 + mix * 0.3) * 1) / 1;

  return clamp(0, centered, 100);
}

function getCompatibilityDescriptor(score) {
  if (score >= 90) {
    return {
      label: "Cosmic Match",
      message: "You two are basically written in the stars. Plan something cute.",
      tone: "excellent",
    };
  }
  if (score >= 75) {
    return {
      label: "Strong Connection",
      message: "Great vibes! Keep communicating and it only gets better.",
      tone: "great",
    };
  }
  if (score >= 55) {
    return {
      label: "Promising Potential",
      message: "A sweet start. A little effort and you’ll be unstoppable.",
      tone: "good",
    };
  }
  if (score >= 35) {
    return {
      label: "Worth Exploring",
      message: "Not perfect, but intriguing. Try a fun date and see what happens.",
      tone: "okay",
    };
  }
  if (score >= 15) {
    return {
      label: "A Fun Challenge",
      message: "Opposites attract… sometimes. Patience and humor go a long way.",
      tone: "low",
    };
  }
  return {
    label: "Wild Card",
    message: "Love works in mysterious ways. Surprise plot twist? Possibly.",
    tone: "verylow",
  };
}

// PUBLIC_INTERFACE
function App() {
  /** Light theme only (per style guide); keep data-theme for future extension and consistency */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const [nameOne, setNameOne] = useState("");
  const [nameTwo, setNameTwo] = useState("");

  const [touched, setTouched] = useState({ nameOne: false, nameTwo: false });

  const [result, setResult] = useState(null); // { score, descriptor, key }
  const [isAnimating, setIsAnimating] = useState(false);

  const normalizedOne = useMemo(() => normalizeName(nameOne), [nameOne]);
  const normalizedTwo = useMemo(() => normalizeName(nameTwo), [nameTwo]);

  const errors = useMemo(() => {
    const e = {};
    if (normalizedOne.length === 0) e.nameOne = "Please enter a name.";
    if (normalizedTwo.length === 0) e.nameTwo = "Please enter a name.";

    // Prevent identical names after normalization (still allow if user insists? requirement says basic validation; we’ll block)
    if (normalizedOne.length > 0 && normalizedOne === normalizedTwo) {
      e.nameTwo = "Try two different names.";
    }

    // Basic sanity: must include at least 2 letters total
    const lettersOnly = (s) => s.replace(/[^a-z]/gi, "");
    if (normalizedOne.length > 0 && lettersOnly(normalizedOne).length < 2) {
      e.nameOne = "Please enter at least 2 letters.";
    }
    if (normalizedTwo.length > 0 && lettersOnly(normalizedTwo).length < 2) {
      e.nameTwo = "Please enter at least 2 letters.";
    }
    return e;
  }, [normalizedOne, normalizedTwo]);

  const canCalculate = Object.keys(errors).length === 0;

  // PUBLIC_INTERFACE
  const handleCalculate = (event) => {
    event.preventDefault();
    setTouched({ nameOne: true, nameTwo: true });

    if (!canCalculate) {
      setResult(null);
      return;
    }

    const score = computeCompatibilityScore(nameOne, nameTwo);
    const descriptor = getCompatibilityDescriptor(score);

    // key triggers CSS animations deterministically per calculation
    const key = `${normalizeName(nameOne)}|${normalizeName(nameTwo)}|${score}`;

    setResult({ score, descriptor, key });

    // Trigger a small "pulse" animation without impacting reduced-motion users.
    setIsAnimating(false);
    window.requestAnimationFrame(() => {
      setIsAnimating(true);
    });
  };

  // PUBLIC_INTERFACE
  const handleReset = () => {
    setNameOne("");
    setNameTwo("");
    setTouched({ nameOne: false, nameTwo: false });
    setResult(null);
    setIsAnimating(false);
  };

  const nameOneError = touched.nameOne ? errors.nameOne : undefined;
  const nameTwoError = touched.nameTwo ? errors.nameTwo : undefined;

  return (
    <div className="App">
      <main className="page">
        <section className="card" aria-labelledby="app-title">
          <header className="cardHeader">
            <div className="badge" aria-hidden="true">
              Love Calculator
            </div>
            <h1 id="app-title" className="title">
              Love Compatibility Calculator
            </h1>
            <p className="subtitle">
              Enter two names to get a deterministic compatibility score from{" "}
              <strong>0–100</strong>.
            </p>
          </header>

          <form className="form" onSubmit={handleCalculate} noValidate>
            <div className="field">
              <label className="label" htmlFor="nameOne">
                First name
              </label>
              <input
                id="nameOne"
                name="nameOne"
                className={`input ${nameOneError ? "inputError" : ""}`}
                type="text"
                value={nameOne}
                onChange={(e) => setNameOne(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, nameOne: true }))}
                placeholder="e.g., Alex"
                autoComplete="off"
                inputMode="text"
                aria-invalid={nameOneError ? "true" : "false"}
                aria-describedby={nameOneError ? "nameOne-error" : undefined}
              />
              {nameOneError ? (
                <div className="error" id="nameOne-error" role="alert">
                  {nameOneError}
                </div>
              ) : (
                <div className="hint">Tip: nicknames work too.</div>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="nameTwo">
                Second name
              </label>
              <input
                id="nameTwo"
                name="nameTwo"
                className={`input ${nameTwoError ? "inputError" : ""}`}
                type="text"
                value={nameTwo}
                onChange={(e) => setNameTwo(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, nameTwo: true }))}
                placeholder="e.g., Jordan"
                autoComplete="off"
                inputMode="text"
                aria-invalid={nameTwoError ? "true" : "false"}
                aria-describedby={nameTwoError ? "nameTwo-error" : undefined}
              />
              {nameTwoError ? (
                <div className="error" id="nameTwo-error" role="alert">
                  {nameTwoError}
                </div>
              ) : (
                <div className="hint">We’ll always return the same score for the same names.</div>
              )}
            </div>

            <div className="actions">
              <button
                className="btn btnPrimary"
                type="submit"
                disabled={!canCalculate}
              >
                Calculate
              </button>
              <button className="btn btnSecondary" type="button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </form>

          <section
            className={`result ${result ? "resultVisible" : ""} ${
              isAnimating ? "resultAnimate" : ""
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {result ? (
              <div key={result.key} className="resultInner">
                <div className="scoreRow">
                  <div className="scoreLabel">
                    <span className="scoreTitle">Compatibility</span>
                    <span className={`pill pill-${result.descriptor.tone}`}>
                      {result.descriptor.label}
                    </span>
                  </div>

                  <div className="scoreValue" aria-label={`Compatibility score ${result.score} percent`}>
                    <span className="scoreNumber">{result.score}</span>
                    <span className="scoreUnit">%</span>
                  </div>
                </div>

                <div className="meter" role="img" aria-label={`Score meter at ${result.score} percent`}>
                  <div className="meterTrack" />
                  <div
                    className="meterFill"
                    style={{ width: `${result.score}%` }}
                  />
                </div>

                <p className="message">{result.descriptor.message}</p>

                <p className="fineprint">
                  Deterministic score: same names → same result. For fun only.
                </p>
              </div>
            ) : (
              <div className="resultPlaceholder">
                <div className="placeholderTitle">Your result will appear here</div>
                <div className="placeholderText">
                  Enter two names above and tap <strong>Calculate</strong>.
                </div>
              </div>
            )}
          </section>

          <footer className="footer">
            <span className="footerText">Built with React • Modern light theme</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
