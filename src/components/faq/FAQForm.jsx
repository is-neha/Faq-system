import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FAQForm() {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question || !category || !description) {
      alert("Fill all fields");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/questions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: question,
          category,
          description
        })
      }
    );

    const data = await response.json();

    alert(data.message || data.error || "Question submitted!");

    navigate("/");
  };

  return (
    <div className="form-container">
      <h2>Submit a New Question</h2>

      <form className="faq-form" onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Question Title"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Choose Category</option>

          <option value="Onboarding & Admin">
            Onboarding & Admin
          </option>

          <option value="Tech Support">
            Tech Support
          </option>

          <option value="Internship Queries">
            Internship Queries
          </option>

          <option value="Placements">
            Placements
          </option>

          <option value="Academics">
            Academics
          </option>

          <option value="Certificates">
            Certificates
          </option>
        </select>

        <textarea
          rows="6"
          placeholder="Describe your question..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">
          Submit Question
        </button>
      </form>
    </div>
  );
}

export default FAQForm;