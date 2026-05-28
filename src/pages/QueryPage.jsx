import {
  useState, useEffect
} from "react";

import {
  Link
} from "react-router-dom";

import SearchBar
from "../components/faq/SearchBar";

import CategoryCard
from "../components/faq/CategoryCard";

// Importing the flat database JSON array
import rawDbData from "../data/ProjectDB.faqs.json";

// 1. Keep your templates exactly as they are
// 1. Structural Map covering all categories shown in the UI
// 1. Expanded layout tracking exactly 12 specific operational categories
const categoryTemplates = [
  { id: 1, title: "Onboarding & Admin", sub: "1. About the internship", sections: ["1"] },
  { id: 2, title: "Onboarding & Admin", sub: "2. Timing and dates", sections: ["2"] },
  { id: 3, title: "NOC", sub: "3. NOC (No Objection Certificate)", sections: ["3"] },
  { id: 4, title: "Offer & Registration", sub: "4. Selection, offer letter, and registration", sections: ["4"] },
  { id: 5, title: "Daily Ops", sub: "5. Work, mentorship, and projects", sections: ["5"] },
  { id: 6, title: "Code of Conduct", sub: "6. Code of conduct — communication channels", sections: ["6"] },
  { id: 7, title: "Interviews", sub: "7. Interviews Related", sections: ["7"] },
  { id: 8, title: "Certificates", sub: "8. Certificate Issuance", sections: ["8"] },
  { id: 9, title: "Rosetta Journal", sub: "9. Rosetta — your internship journal", sections: ["9"] },
  { id: 10, title: "Coursework", sub: "10. Phase 1 — coursework, Vibe LMS, and live sessions", sections: ["10"] },
  { id: 11, title: "Communication Tools", sub: "11. Yaksha Chat Related", sections: ["11"] },
  { id: 12, title: "Tech Support", sub: "12. ViBe Platform", sections: ["12"] },
  { id: 13, title: "Team Formation", sub: "13. Team Formation & Grouping", sections: ["13"] }
];

// 2. Exact RegEx parsing to strictly assign items to these columns
const structuredCategories = categoryTemplates.map(cat => {

  const matchedItems = rawDbData.filter(item => {
    const questionText = item.question?.trim() || "";

    // Strictly captures the leading digit cluster before the first decimal point
    const match = questionText.match(/^(\d+)\./);

    if (match) {
      const extractedSection = match[1];
      return cat.sections.includes(extractedSection);
    }

    return false;
  });


  return {
    id: cat.id,
    categoryTitle: cat.title,
    subTitle: cat.sub,
    faqs: matchedItems.map(item => ({
      id: item.id || item._id?.$oid,
      question: item.question,
      answer: item.answer
    }))
  };
});



/* FETCH COMMUNITY QUESTIONS FROM MONGODB BACKEND */

function QueryPage() {

  const [search, setSearch] =
    useState("");
  const [
    resolvedQuestions,
    setResolvedQuestions
  ] = useState([]);

  useEffect(() => {

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(
      "http://localhost:5000/questions",
      { headers }
    )

      .then((res) => res.json())

      .then((data) => {

        // New backend: state === "FAQ" means resolved/verified
        const resolved =
          data.filter(
            (q) => q.state === "FAQ"
          );

        setResolvedQuestions(
          resolved
        );

      })

      .catch((err) => {

        console.log(err);

      });

  }, []);

  /* UPVOTE AN ANSWER */

  const handleUpvote = async (answerId) => {

    const token = localStorage.getItem("token");
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    if (!token || !user._id) {
      alert("Please login first");
      return;
    }

    try {

      const response =
        await fetch(

          `http://localhost:5000/answers/${answerId}/upvote`,

          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      alert(data.message);

      /* REFRESH TO SHOW UPDATED UPVOTE COUNT */
      const token2 = localStorage.getItem("token");
      const headers2 = {};
      if (token2) headers2["Authorization"] = `Bearer ${token2}`;

      fetch("http://localhost:5000/questions", { headers: headers2 })
        .then((res) => res.json())
        .then((data) => {
          const resolved = data.filter((q) => q.state === "FAQ");
          setResolvedQuestions(resolved);
        });

    } catch (error) {

      console.log(error);

    }
  };

  /* COMPUTE FILTERED FAQs INSIDE COMPONENT — needs access to live `search` state */
  const filteredFaqs = structuredCategories.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(faq =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.faqs.length > 0);

  const noResults = filteredFaqs.length === 0;

  return (

    <div className="faq-page">

      {/* Hero Section */}
      <div className="hero">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to commonly asked questions</p>
        <div className="search-section">
          <SearchBar search={search} setSearch={setSearch} />
          <Link to="/post-query" className="ask-question-btn">
            + Ask Question
          </Link>
        </div>
      </div>

      {/* Resolve Question Card */}
      <div className="resolve-card">
        <div>
          <h2>Resolve a Question</h2>
          <p>Help fellow students by answering unresolved community questions.</p>
        </div>
        <Link to="/question" className="resolve-btn">
          Resolve Questions
        </Link>
      </div>

      {/* FAQ Grid */}
      {!noResults ? (
        <div className="faq-grid">
          {filteredFaqs.map((catItem) => (
            <CategoryCard
              key={catItem.id}
              category={catItem}
            />
          ))}
        </div>
      ) : (
        <div className="ask-card">
          <h2>No matching FAQ found</h2>
          <p>Can't find what you're looking for?</p>
          <Link to="/post-query" className="ask-btn">
            Ask a New Question
          </Link>
        </div>
      )}

      {/* Resolved Community Questions Section */}
      {resolvedQuestions.length > 0 && (
        <div className="resolved-section">
          <h2>
            Resolved Community Questions
          </h2>

          {resolvedQuestions.map(
            (question) => (
              <div
                key={question._id}
                className="resolved-card"
              >
                <h3>
                  {question.title}
                </h3>
                <p>
                  {question.description}
                </p>
                <p style={{ fontSize: "12px", color: "#888" }}>
                  Upvotes: {question.upvotes || 0}
                </p>

                {/* ADMIN VERIFIED ANSWERS (isOfficial === true) */}
                {question.answers?.map(
                  (answer) =>
                    answer.isOfficial && (
                      <div
                        key={answer._id}
                        className="answer-card"
                      >
                        <span className="verified-badge">
                          ✔ Admin Verified
                        </span>
                        <p>
                          {answer.content}
                        </p>

                        {/* UPVOTE BUTTON — targets the answer, not the question */}
                        <button
                          className="upvote-btn"
                          onClick={() =>
                            handleUpvote(
                              answer._id
                            )
                          }
                        >
                          👍 Upvote
                          ({answer.upvotes || 0})
                        </button>
                      </div>
                    )
                )}
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}

export default QueryPage;