import {
  useEffect,
  useState,
  useCallback,
} from "react";

function QuestionPage() {
  const [questions, setQuestions] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [answerText, setAnswerText] =
    useState({});
  const [submitting, setSubmitting] =
    useState(null); // questionId being submitted

  /* FETCH QUESTIONS — server-side filter: URQ + PAQ only, sorted by urgency */
  const fetchQuestions = useCallback(() => {
    const token =
      localStorage.getItem("token");
    const headers = {};
    if (token)
      headers[
        "Authorization"
      ] = `Bearer ${token}`;

    fetch(
      `http://localhost:5000/questions?state=URQ,PAQ&sort=urgency`,
      { headers }
    )
      .then((res) => res.json())
      .then((res) => {
        // Support both paginated { data } and flat array responses
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
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  /* SUBMIT ANSWER */
  const submitAnswer = async (
    questionId
  ) => {
    if (
      !answerText[questionId]?.trim()
    ) {
      return;
    }

    const token =
      localStorage.getItem("token");
    if (!token) {
      alert(
        "Please login first to answer."
      );
      return;
    }

    setSubmitting(questionId);

    try {
      const response = await fetch(
        `http://localhost:5000/answers/${questionId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: answerText[questionId],
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to submit answer"
        );
        return;
      }

      alert(
        data.message ||
          "Answer submitted!"
      );

      /* Clear the answer box */
      setAnswerText((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });

      /* Refresh to reflect URQ → PAQ state change */
      setLoading(true);
      fetchQuestions();
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  };

  /* EMPTY STATE */
  if (
    !loading &&
    questions.length === 0
  ) {
    return (
      <div className="question-page">
        <h1>Resolve Questions</h1>
        <div className="empty-state">
          <h2>
            No Questions To Resolve
          </h2>
          <p>
            All community questions
            are currently answered.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="question-page">
      <h1>Resolve Questions</h1>

      {loading && (
        <div
          className="loading-indicator"
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#cbd5e1",
          }}
        >
          Loading questions...
        </div>
      )}

      {!loading &&
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

            {/* Tags */}
            {question.tags &&
              question.tags.length >
                0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    margin:
                      "4px 0",
                  }}
                >
                  {question.tags.map(
                    (tag) => (
                      <span
                        key={tag}
                        className="faq-count-badge"
                        style={{
                          background:
                            "rgba(99,102,241,0.3)",
                          fontSize:
                            "11px",
                        }}
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              )}

            <p
              style={{
                fontSize: "12px",
                color: "#888",
              }}
            >
              <span
                style={{
                  color:
                    question.state ===
                    "URQ"
                      ? "#f87171"
                      : "#fbbf24",
                  fontWeight:
                    "bold",
                }}
              >
                {question.state}
              </span>{" "}
              · Upvotes:{" "}
              {question.upvotes || 0}
            </p>

            {/* Existing answers */}
            {question.answers &&
              question.answers
                .length > 0 && (
                <div
                  className="existing-answers"
                >
                  <h4>
                    Existing Answers
                  </h4>
                  {question.answers.map(
                    (ans) => (
                      <div
                        key={
                          ans._id
                        }
                        className="answer-card"
                        style={{
                          border:
                            "1px solid rgba(255,255,255,0.1)",
                          borderRadius:
                            "8px",
                          padding:
                            "10px",
                          marginBottom:
                            "8px",
                        }}
                      >
                        <p>
                          {
                            ans.content
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
                          {ans.upvotes ||
                            0}
                          {ans.isOfficial &&
                            " · ✔ Official"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Answer input */}
            <textarea
              rows="5"
              placeholder="Write your answer to help the community..."
              value={
                answerText[
                  question._id
                ] || ""
              }
              onChange={(e) =>
                setAnswerText({
                  ...answerText,
                  [question._id]:
                    e.target.value,
                })
              }
            />

            <button
              className="submit-answer-btn"
              onClick={() =>
                submitAnswer(
                  question._id
                )
              }
              disabled={
                submitting ===
                question._id
              }
            >
              {submitting ===
              question._id
                ? "Submitting..."
                : "Submit Answer"}
            </button>
          </div>
        ))}
    </div>
  );
}

export default QuestionPage;