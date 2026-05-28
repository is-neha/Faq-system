import {
  useEffect,
  useState
} from "react";

function QuestionPage() {

  const [questions, setQuestions] =
    useState([]);

  const [answerText, setAnswerText] =
    useState({});

  /* FETCH QUESTIONS — shows only URQ + PAQ (not yet FAQ) */

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

        setQuestions(data);

      })

      .catch((err) => {

        console.log(err);

      });

  }, []);

  /* SHOW ONLY URQ + PAQ — questions that still need answers */
  // (FAQ questions are already resolved, no need to show here)

  const unresolvedQuestions =
    questions.filter((q) => {

      return q.state === "URQ" || q.state === "PAQ";

    });

  /* SUBMIT ANSWER */

  const submitAnswer = async (
    questionId
  ) => {

    if (
      !answerText[questionId]?.trim()
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    try {

      const response =
        await fetch(

          `http://localhost:5000/answers/${questionId}/answers`,

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({

              content:
                answerText[questionId]

            })

          }
        );

      const data =
        await response.json();

      alert(data.message || "Answer submitted!");

      /* CLEAR THE ANSWER BOX AND REFRESH */
      setAnswerText((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });

      /* REFETCH TO SHOW STATE CHANGE (URQ → PAQ) */
      const token2 = localStorage.getItem("token");
      const headers2 = {};
      if (token2) headers2["Authorization"] = `Bearer ${token2}`;

      fetch("http://localhost:5000/questions", { headers: headers2 })
        .then((res) => res.json())
        .then((data) => setQuestions(data));

    } catch (error) {

      console.log(error);

    }
  };

  /* EMPTY STATE */

  if (
    unresolvedQuestions.length === 0
  ) {

    return (

      <div className="question-page">

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

      <h1>
        Resolve Questions
      </h1>

      {unresolvedQuestions.map(
        (question) => (

          <div
            key={question._id}
            className="question-card"
          >

            {/* QUESTION — new backend uses title, state, upvotes */}

            <h2>
              {question.title}
            </h2>

            <p>
              {question.description}
            </p>

            <p style={{ fontSize: "12px", color: "#888" }}>
              State: {question.state} &nbsp;|&nbsp;
              Upvotes: {question.upvotes || 0}
            </p>

            {/* ANSWER BOX */}

            <textarea

              rows="5"

              placeholder=
              "Write your answer..."

              value={
                answerText[
                  question._id
                ] || ""
              }

              onChange={(e) =>

                setAnswerText({

                  ...answerText,

                  [question._id]:
                    e.target.value

                })

              }
            />

            {/* SUBMIT BUTTON */}

            <button

              className=
              "submit-answer-btn"

              onClick={() =>

                submitAnswer(
                  question._id
                )

              }
            >

              Submit Answer

            </button>

          </div>

        )
      )}

    </div>

  );
}

export default QuestionPage;