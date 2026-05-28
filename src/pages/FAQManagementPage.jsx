import { useEffect, useState } from "react";

function FAQManagementPage() {
  const [questions, setQuestions] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  const user = JSON.parse(
    localStorage.getItem("user") ||
      "{}"
  );

  /* Fetch all questions (admin sees everything) */
  const fetchQuestions = () => {
    const token =
      localStorage.getItem("token");
    const headers = {};
    if (token)
      headers[
        "Authorization"
      ] = `Bearer ${token}`;

    setLoading(true);
    fetch(
      `http://localhost:5000/questions?limit=100`,
      { headers }
    )
      .then((res) => res.json())
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : res.data || [];
        setQuestions(list);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  /* VERIFY ANSWER — admin action */
  const verifyAnswer = async (
    questionId,
    answerId
  ) => {
    const token =
      localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    const confirmed =
      window.confirm(
        "Verify this answer? It will mark it as official and promote the question to FAQ."
      );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/answers/${answerId}/verify`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (data.warning) {
        alert(data.message + "\n" + data.warning);
      } else {
        alert(data.message);
      }

      fetchQuestions();
    } catch (error) {
      console.log(error);
    }
  };

  /* DELETE QUESTION */
  const deleteQuestion = async (
    questionId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this question and all its answers? This cannot be undone."
      );
    if (!confirmed) return;

    const token =
      localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/questions/${questionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();
      alert(data.message);
      fetchQuestions();
    } catch (error) {
      console.log(error);
    }
  };

  /* ADMIN PROTECTION */
  if (!user || user.role !== "admin") {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <h1>Access Denied</h1>
          <p>
            Only admins can access
            this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <h1>Admin Moderation Dashboard</h1>

      {/* Refresh button */}
      <button
        onClick={fetchQuestions}
        disabled={loading}
        style={{
          marginBottom: "1rem",
          background:
            "rgba(99,102,241,0.3)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor:
            loading
              ? "not-allowed"
              : "pointer",
          opacity: loading
            ? 0.6
            : 1,
        }}
      >
        {loading
          ? "Refreshing..."
          : "🔄 Refresh"}
      </button>

      {/* Stats summary */}
      {!loading && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom:
              "1.5rem",
            flexWrap:
              "wrap",
          }}
        >
          {[
            {
              label: "Total",
              count: questions.length,
              color: "#cbd5e1",
            },
            {
              label: "URQ",
              count: questions.filter(
                (q) =>
                  q.state ===
                  "URQ"
              ).length,
              color: "#f87171",
            },
            {
              label: "PAQ",
              count: questions.filter(
                (q) =>
                  q.state ===
                  "PAQ"
              ).length,
              color: "#fbbf24",
            },
            {
              label: "FAQ",
              count: questions.filter(
                (q) =>
                  q.state ===
                  "FAQ"
              ).length,
              color: "#4ade80",
            },
            {
              label: "Flagged",
              count: questions.filter(
                (q) =>
                  q.flaggedForReview
              ).length,
              color: "#f97316",
            },
          ].map(
            ({ label, count, color }) => (
              <div
                key={label}
                style={{
                  background:
                    "rgba(255,255,255,0.05)",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  borderRadius:
                    "12px",
                  padding:
                    "12px 20px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "1.5rem",
                    fontWeight:
                      "bold",
                    color,
                  }}
                >
                  {count}
                </div>
                <div
                  style={{
                    fontSize:
                      "0.75rem",
                    color:
                      "#94a3b8",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                  }}
                >
                  {label}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign:
              "center",
            padding:
              "2rem",
            color: "#cbd5e1",
          }}
        >
          Loading...
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <h2>No Questions</h2>
        </div>
      ) : (
        questions.map((question) => (
          <div
            key={question._id}
            className="question-card"
          >
            <h2>
              {question.title}
            </h2>
            <p>
              {
                question.description
              }
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "#888",
              }}
            >
              <strong>
                Category:
              </strong>{" "}
              {question.category
                ?.name || "—"}
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "#888",
              }}
            >
              <strong>
                State:
              </strong>{" "}
              <span
                style={{
                  color:
                    question.state ===
                    "URQ"
                      ? "#f87171"
                      : question.state ===
                        "PAQ"
                      ? "#fbbf24"
                      : "#4ade80",
                  fontWeight:
                    "bold",
                }}
              >
                {question.state}
              </span>{" "}
              {question.flaggedForReview &&
                " · 🚩 Flagged for review"}
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "#888",
              }}
            >
              <strong>
                Upvotes:
              </strong>{" "}
              {question.upvotes ||
                0}
            </p>

            <h3
              style={{
                marginTop:
                  "0.8rem",
                fontSize:
                  "0.95rem",
                color:
                  "#cbd5e1",
              }}
            >
              Answers (
              {question.answers
                ?.length || 0}
              )
            </h3>

            {!question.answers ||
            question.answers
              .length === 0 ? (
              <p
                style={{
                  fontSize:
                    "0.85rem",
                  color: "#64748b",
                }}
              >
                No answers yet.
              </p>
            ) : (
              question.answers.map(
                (answer) => (
                  <div
                    key={
                      answer._id
                    }
                    style={{
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      borderRadius:
                        "8px",
                      padding:
                        "10px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    {answer.isOfficial && (
                      <span
                        className="verified-badge"
                        style={{
                          display:
                            "inline-block",
                          marginBottom:
                            "4px",
                        }}
                      >
                        ✔ Official
                      </span>
                    )}
                    <p
                      style={{
                        fontSize:
                          "0.9rem",
                      }}
                    >
                      {
                        answer.content
                      }
                    </p>
                    <p
                      style={{
                        fontSize:
                          "12px",
                        color:
                          "#888",
                      }}
                    >
                      👍{" "}
                      {answer.upvotes ||
                        0}
                    </p>

                    {!answer.isOfficial && (
                      <button
                        className="approve-btn"
                        onClick={() =>
                          verifyAnswer(
                            question._id,
                            answer._id
                          )
                        }
                        style={{
                          marginTop:
                            "6px",
                          fontSize:
                            "0.8rem",
                          padding:
                            "4px 12px",
                        }}
                      >
                        Verify Answer
                      </button>
                    )}
                  </div>
                )
              )
            )}

            <button
              className="delete-btn"
              onClick={() =>
                deleteQuestion(
                  question._id
                )
              }
              style={{
                marginTop:
                  "0.5rem",
              }}
            >
              Delete Question
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default FAQManagementPage;