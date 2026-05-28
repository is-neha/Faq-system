import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        localStorage.setItem(
          "token",
          data.token
        );
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        /* Navigate based on role */
        if (
          data.user.role ===
          "admin"
        ) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        alert(
          data.message ||
            "Login failed"
        );
      }
    } catch (error) {
      console.log(error);
      alert(
        "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleLogin}
      >
        <h1>Welcome Back</h1>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          autoComplete="email"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          autoComplete="current-password"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </button>

        {/* Demo credentials hint */}
        <div
          style={{
            marginTop:
              "1.2rem",
            padding:
              "12px",
            background:
              "rgba(99,102,241,0.1)",
            borderRadius:
              "8px",
            fontSize:
              "0.8rem",
            color: "#cbd5e1",
            lineHeight:
              "1.6",
          }}
        >
          <strong
            style={{
              color: "#e0e7ff",
            }}
          >
            Demo credentials:
          </strong>
          <br />
          Admin:{" "}
          <code>
            admin@vic.edu
          </code>{" "}
          /{" "}
          <code>admin123</code>
          <br />
          Student:{" "}
          <code>
            student@vic.edu
          </code>{" "}
          /{" "}
          <code>student123</code>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;