
import { useState, useEffect } from "react";
import "./index.css";

const API_URL = "https://ideavote1.onrender.com/api/ideas";

const startingIdeas = [
  {
    title: "Campus Carpool",
    category: "Campus Life",
    description:
      "Share rides with fellow students and save money while travelling.",
    emoji: "🏣",
  },
  {
    title: "SkillSwap",
    category: "Education",
    description:
      "Students teach each other new skills and learn together for free.",
    emoji: "🎓",
  },
  {
    title: "Green Campus",
    category: "Environment",
    description:
      "Make college greener with recycling and student-led eco projects.",
    emoji: "🌱",
  },
  {
    title: "Study Buddy AI",
    category: "Technology",
    description:
      "Find study partners, share notes and plan study sessions.",
    emoji: "🤖",
  },
];

const categories = [
  "All",
  "Technology",
  "Education",
  "Campus Life",
  "Environment",
];

const emojiMap = {
  "Campus Carpool": "🏣",
  SkillSwap: "🎓",
  "Green Campus": "🌱",
  "Study Buddy AI": "🤖",
};

export default function App() {
  const [ideas, setIdeas] = useState([]);
  const [votes, setVotes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Technology");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // STEP 1: Load ideas from the H2 database through Spring Boot.
  useEffect(() => {
    async function loadIdeas() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Could not load ideas from the backend.");
        }

        let data = await response.json();

        // If H2 is empty, save the sample ideas to the database.
        if (data.length === 0) {
          const savedSamples = await Promise.all(
            startingIdeas.map(async (idea) => {
              const saveResponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  title: idea.title,
                  category: idea.category,
                  description: idea.description,
                  votes: 0,
                }),
              });

              if (!saveResponse.ok) {
                throw new Error("Could not save the sample ideas.");
              }

              return saveResponse.json();
            })
          );

          data = savedSamples;
        }

        const backendIdeas = data.map((idea) => ({
          ...idea,
          category:
            idea.category === "Transport"
              ? "Campus Life"
              : idea.category,
          emoji: emojiMap[idea.title] || "💡",
          votes: Number(idea.votes) || 0,
        }));

        setIdeas(backendIdeas);
        setError("");
      } catch (err) {
        console.error("Backend connection error:", err);
        setError(
          "Could not connect to the backend. Check that Spring Boot is running on port 8081."
        );
      } finally {
        setLoading(false);
      }
    }

    loadIdeas();
  }, []);

  // STEP 2: Save upvote changes to the H2 database.
  async function vote(id) {
    const idea = ideas.find((item) => item.id === id);

    if (!idea) return;

    const hasVoted = votes.includes(id);
    const newVotes = Math.max(
      0,
      idea.votes + (hasVoted ? -1 : 1)
    );

    try {
      const response = await fetch(
        `${API_URL}/${id}/votes?votes=${newVotes}`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error("Could not save your vote.");
      }

      const updatedIdea = await response.json();

      setIdeas((oldIdeas) =>
        oldIdeas.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedIdea,
                category:
                  updatedIdea.category === "Transport"
                    ? "Campus Life"
                    : updatedIdea.category,
                emoji: emojiMap[updatedIdea.title] || "💡",
                votes: Number(updatedIdea.votes) || 0,
              }
            : item
        )
      );

      setVotes((oldVotes) =>
        hasVoted
          ? oldVotes.filter((voteId) => voteId !== id)
          : [...oldVotes, id]
      );

      setError("");
    } catch (err) {
      console.error("Vote error:", err);
      setError("Vote could not be saved. Please try again.");
    }
  }

  // STEP 3: Submit a new idea using POST and save it in H2.
  async function submitIdea(e) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          category: newCategory,
          description: description.trim(),
          votes: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Idea could not be saved.");
      }

      const savedIdea = await response.json();

      const formattedIdea = {
        ...savedIdea,
        category:
          savedIdea.category === "Transport"
            ? "Campus Life"
            : savedIdea.category,
        emoji: emojiMap[savedIdea.title] || "💡",
        votes: Number(savedIdea.votes) || 0,
      };

      setIdeas((oldIdeas) => [
        formattedIdea,
        ...oldIdeas.filter((item) => item.id !== formattedIdea.id),
      ]);

      setTitle("");
      setDescription("");
      setNewCategory("Technology");
      setCategory("All");
      setSearch("");
      setShowForm(false);
      setError("");
    } catch (err) {
      console.error("Submit idea error:", err);
      setError(
        "Idea save avvaledu. Backend running lo undo check cheyyi."
      );
    }
  }

  const visibleIdeas = ideas
    .filter(
      (idea) => category === "All" || idea.category === category
    )
    .filter((idea) =>
      `${idea.title} ${idea.description} ${idea.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => b.votes - a.votes);

  const totalVotes = ideas.reduce(
    (sum, idea) => sum + idea.votes,
    0
  );

  const leaders = [...ideas].sort(
    (a, b) => b.votes - a.votes
  );

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">
          ✳ Idea<span>Vote</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#ideas">Explore Ideas</a>
          <a href="#leaderboard">Leaderboard</a>
        </nav>

        <button
          className="button primary"
          onClick={() => setShowForm(true)}
        >
          + Submit Idea
        </button>
      </header>

      <main>
        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 20px",
              margin: "12px",
              borderRadius: "8px",
              background: "#fff0f0",
              color: "#a32121",
            }}
          >
            {error}
          </div>
        )}

        <section className="hero" id="home">
          <div className="hero-text">
            <span className="eyebrow">
              ✦ YOUR IDEAS. YOUR VOICE.
            </span>

            <h1>
              Big ideas start
              <br />
              with <span>one vote.</span>
            </h1>

            <p>
              Share what is on your mind. Discover brilliant ideas.
              Help turn the next big thing into reality.
            </p>

            <div className="hero-buttons">
              <a className="button primary" href="#ideas">
                Explore Ideas ↗
              </a>

              <button
                className="button secondary"
                onClick={() => setShowForm(true)}
              >
                ＋ Share Your Idea
              </button>
            </div>

            <div className="hero-note">
              💜 Every great idea deserves a chance.
            </div>
          </div>

          <div className="hero-visual">
            <div className="orb">💡</div>
            <span className="float float-one">✨ Think big</span>
            <span className="float float-two">
              🚀 Make it happen
            </span>
            <span className="float float-three">
              ♡ Vote for change
            </span>
          </div>
        </section>

        <section className="stats">
          <div>
            <span>💡</span>
            <strong>{ideas.length}</strong>
            <small>Ideas Shared</small>
          </div>

          <div>
            <span>💜</span>
            <strong>{totalVotes.toLocaleString()}</strong>
            <small>Community Votes</small>
          </div>

          <div>
            <span>🌟</span>
            <strong>350+</strong>
            <small>Creative Minds</small>
          </div>
        </section>

        <section className="ideas-section" id="ideas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                DISCOVER SOMETHING NEW
              </span>
              <h2>
                Ideas worth <span>sharing.</span>
              </h2>
              <p>Find an idea you love? Give it your vote.</p>
            </div>

            <button
              className="button secondary"
              onClick={() => setShowForm(true)}
            >
              ＋ Submit Idea
            </button>
          </div>

          <div className="filters">
            <input
              className="search"
              placeholder="⌕ Search amazing ideas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search ideas"
            />

            <div className="chips">
              {categories.map((item) => (
                <button
                  key={item}
                  className={
                    category === item ? "chip active" : "chip"
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p>Loading ideas from database...</p>
          ) : (
            <div className="ideas-grid">
              {visibleIdeas.map((idea, index) => (
                <article className="idea-card" key={idea.id}>
                  <div className={`idea-image image-${index % 4}`}>
                    <span>{idea.emoji}</span>
                    <small>
                      IDEA #{String(index + 1).padStart(2, "0")}
                    </small>
                  </div>

                  <div className="idea-body">
                    <span className="tag">{idea.category}</span>
                    <h3>{idea.title}</h3>
                    <p>{idea.description}</p>

                    <div className="idea-footer">
                      <span>
                        ▲ <b>{idea.votes}</b> votes
                      </span>

                      <button
                        className={
                          votes.includes(idea.id)
                            ? "vote-button voted"
                            : "vote-button"
                        }
                        onClick={() => vote(idea.id)}
                      >
                        {votes.includes(idea.id)
                          ? "✓ Voted"
                          : "↑ Upvote"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {visibleIdeas.length === 0 && (
                <div className="empty">
                  <h3>No ideas found 🔎</h3>
                  <p>Try another search or category.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="leaderboard" id="leaderboard">
          <div>
            <span className="eyebrow">
              COMMUNITY FAVOURITES
            </span>
            <h2>
              The <span>leaderboard.</span>
            </h2>
            <p>
              Ideas ranked by votes, including newly submitted ideas.
            </p>
          </div>

          <div className="leader-list">
            {leaders.map((idea, index) => (
              <div className="leader-row" key={idea.id}>
                <span className={`rank rank-${(index % 3) + 1}`}>
                  {index + 1}
                </span>

                <span className="leader-emoji">{idea.emoji}</span>

                <div className="leader-name">
                  <b>{idea.title}</b>
                  <small>{idea.category}</small>
                </div>

                <strong>
                  {idea.votes} <small>votes</small>
                </strong>
              </div>
            ))}

            {leaders.length === 0 && !loading && (
              <p>No ideas submitted yet.</p>
            )}
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>
              Got an idea? <span>Let's hear it.</span>
            </h2>
            <p>
              Your next big idea could inspire hundreds. Start sharing
              today.
            </p>
          </div>

          <button
            className="button cta-button"
            onClick={() => setShowForm(true)}
          >
            Share Your Idea ↗
          </button>
        </section>
      </main>

      <footer>
        <a className="logo" href="#home">
          ✳ Idea<span>Vote</span>
        </a>
        <p>Good ideas deserve a chance.</p>
        <small>
          © 2026 IdeaVote · Student Innovation Platform
        </small>
      </footer>

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <form className="modal" onSubmit={submitIdea}>
            <button
              type="button"
              className="close"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>

            <span className="eyebrow">YOUR TURN TO INSPIRE</span>
            <h2>
              Share your <span>big idea.</span>
            </h2>
            <p>Tell the community what you have in mind.</p>

            <label htmlFor="idea-title">Idea title</label>
            <input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give title of your idea"
              maxLength={70}
              required
            />

            <label htmlFor="idea-category">Category</label>
            <select
              id="idea-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {categories
                .filter((item) => item !== "All")
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>

            <label htmlFor="idea-description">Description</label>
            <textarea
              id="idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea..."
              rows={4}
              maxLength={400}
              required
            />

            <button
              type="submit"
              className="button primary publish"
            >
              Publish Idea ↗
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
