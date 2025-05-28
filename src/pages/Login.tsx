
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/dataService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await loginUser({ email, password });
      setMessage(response.message || "Login successful!");
      navigate("/"); // Changed to redirect to homepage
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      setMessage(errorMessage);
    }
  };

  return (
    <div>
      <section className="bg-[#111827] min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex w-full max-w-5xl">
            <div className="w-1/2 p-8 text-white flex flex-col items-start justify-center">
              <div className="-mb-8 -mt-15 ml-10" style={{ height: "250px", overflow: "hidden" }}>
                <img
                  src="src/assets/logo.svg"
                  className="w-full h-full object-contain"
                  alt="CareerML Logo"
                />
              </div>
              <p className="text-lg text-center -ml-25">
                Discover your ideal career with ML-powered recommendations. Take
                the assessment and start your journey today!
              </p>
            </div>

            <div className="w-1/2 p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 mb-6">
                Sign in to your account
              </h1>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Sign in
                </button>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-light text-gray-500">
                    Don’t have an account yet?{" "}
                    <a
                      href="/register"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Sign up
                    </a>
                  </p>
                </div>
              </form>
              {message && <p className="mt-4 text-sm text-center">{message}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;