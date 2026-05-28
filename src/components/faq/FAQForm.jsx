import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function FAQForm() {
  const [question, setQuestion] =
    useState("");
  const [category, setCategory] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const navigate = useNavigate();

  /* Fetch categories from backend */
  useEffect(() => {
    fetch(
      "http://localhost:5000/categories"
    )
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        console.log(
          "Could not load categories",
          err
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim() || !category || !description.trim()) {
      alert(
        "Please fill in all required fields: title, category, and description."
      );
      return;
    }

    const token =
      localStorage.getItem("token");
    if (!token) {
      alert(
        "Please login first to submit a question."
      );
      navigate("/login");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/questions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: question.trim(),
            category, // ObjectId
            description: description.trim(),
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to submit question."
        );
        return;
      }

      alert(
        "Question submitted! It will appear in the community queue shortly."
      );
      navigate("/");
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Ask the Community</h2>
      <p
        style={{
          color: "#cbd5e1",
          marginBottom:
            "1.5rem",
          fontSize:
            "0.95rem",
        }}
      >
        Submit your query — our community
        will help resolve it.
      </p>

      <form
        className="faq-form"
        onSubmit={handleSubmit}
      >
        {/* Title */}
        <input
          type="text"
          placeholder="Question Title *"
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }
          maxLength={200}
        />

        {/* Category dropdown — populated from backend */}
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          disabled={loading}
        >
          <option value="">
            {loading
              ? "Loading categories..."
              : "Choose Category *"}
          </option>
          {categories.map((cat) => (
            <option
              key={cat._id}
              value={cat._id}
            >
              {cat.name}
            </option>
          ))}
        </select>

        {/* Description */}
        <textarea
          rows="6"
          placeholder="Describe your question in detail... *"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          maxLength={2000}
        />

        {/* Tags (optional) */}
        <input
          type="text"
          placeholder="Tags (comma-separated, optional)"
          value={tags}
          onChange={(e) =>
            setTags(e.target.value)
          }
        />

        <button
          type="submit"
          disabled={
            submitting ||
            loading
          }
        >
          {submitting
            ? "Submitting..."
            : "Submit Question"}
        </button>
      </form>
    </div>
  );
}

export default FAQForm;