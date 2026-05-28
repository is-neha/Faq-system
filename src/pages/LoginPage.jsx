import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {

  const [username,setUsername] =
    useState("");

  const [password,setPassword] =
    useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();

    const response = await fetch(
      "http://localhost:5000/auth/login",

      {
        method:"POST",

        headers:{
          "Content-Type":
          "application/json"
        },

        body: JSON.stringify({
          // New backend uses email, not username
          email: username,
          password
        })
      }
    );

    const data =
      await response.json();

    if(response.ok){
      // New backend returns { token, user }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login Successful");

      /* REDIRECT BASED ON ROLE */

      if(data.user.role === "admin"){

        navigate("/admin");

      }else{

        navigate("/");
      }

    }else{

      alert(data.message);
    }
  };

  return (

    <div className="login-page">

      <form
        className="login-form"
        onSubmit={handleLogin}
      >

        <h1>Login</h1>

        <input
          type="text"
          placeholder="Email"
          value={username}

          onChange={(e)=>
            setUsername(
              e.target.value
            )
          }
        />

        <input
          type="password"
          placeholder="Password"

          value={password}

          onChange={(e)=>
            setPassword(
              e.target.value
            )
          }
        />

        <button type="submit">
          Login
        </button>
        <p>For admin email:"admin@vic.edu" pass:"admin123"</p>
        <p>For student email:"student@vic.edu" pass:"student123"</p>

      </form>
    </div>
  );
}

export default LoginPage;