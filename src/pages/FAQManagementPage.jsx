import { useEffect, useState } from "react";

function FAQManagementPage() {

  const [questions, setQuestions] =
    useState([]);

  /* GET LOGGED IN USER */

  const user =
    JSON.parse(
      localStorage.getItem("user") || "{}"
    );

  /* FETCH QUESTIONS */

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

  /* VERIFY AN ANSWER — marks it official, may promote URQ→PAQ→FAQ */

  const verifyAnswer = async (
    questionId,
    answerId
  ) => {

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    try {

      const response =
        await fetch(

          `http://localhost:5000/answers/${answerId}/verify`,

          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      alert(data.message);

      /* REFRESH LIST */
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

  /* DELETE A QUESTION */

  const deleteQuestion = async (
    questionId
  ) => {

    const confirmDelete =
      window.confirm(
        "Delete this question?"
      );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    try {

      const response =
        await fetch(

          `http://localhost:5000/questions/${questionId}`,

          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      alert(data.message);

      /* REFRESH LIST */
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

  /* ADMIN PROTECTION */

  if (
    !user ||
    user.role !== "admin"
  ) {

    return (

      <div className="page-wrapper">

        <div className="empty-state">

          <h1>
            Access Denied
          </h1>

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

      <h1>
        Admin Moderation Dashboard
      </h1>

      {/* EMPTY STATE */}

      {questions.length === 0 ? (

        <div className="empty-state">

          <h2>
            No Questions Available
          </h2>

        </div>

      ) : (

        questions.map((question) => (

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

            <p>

              <strong>
                Category:
              </strong>

              {" "}

              {question.category?.name || question.category}

            </p>

            <p>

              <strong>
                State:
              </strong>

              {" "}

              {question.state}

            </p>

            <p>

              <strong>
                Upvotes:
              </strong>

              {" "}

              {question.upvotes || 0}

            </p>

            <h3>
              Submitted Answers
            </h3>

            {/* NO ANSWERS */}

            {!question.answers ||
            question.answers.length === 0 ? (

              <p className="no-answer">

                No answers submitted yet.

              </p>

            ) : (

              question.answers.map(
                (answer) => (

                  <div
                    key={answer._id}
                    className="answer-card"
                  >

                    {/* VERIFIED BADGE — isOfficial instead of verified */}

                    {answer.isOfficial && (

                      <span
                        className="verified-badge"
                      >

                        ✔ Verified (Official)

                      </span>

                    )}

                    <p>
                      {answer.content}
                    </p>

                    <p style={{ fontSize: "12px", color: "#888" }}>
                      Upvotes: {answer.upvotes || 0}
                    </p>

                    {/* VERIFY BUTTON — only if NOT already official */}

                    {!answer.isOfficial && (

                      <button

                        className=
                        "approve-btn"

                        onClick={() =>

                          verifyAnswer(
                            question._id,
                            answer._id
                          )

                        }
                      >

                        Verify Answer

                      </button>

                    )}
                  </div>

                )
              )
            )}

            {/* DELETE QUESTION — available to admin */}

            <button
              className="delete-btn"
              onClick={() =>
                deleteQuestion(
                  question._id
                )
              }
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