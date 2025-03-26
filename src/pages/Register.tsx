const Register = () => {
  return (
    <div>
      <section className="bg-[#111827] min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex w-full max-w-5xl">
            {/* Left Side (Logo and Description) */}
            <div className="w-1/2 p-8 text-white flex flex-col items-start justify-center">
              <div className="-mb-8 -mt-15 ml-10" style={{ height: '250px', overflow: 'hidden' }}>
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

            {/* Right Side (Login Form) */}
            <div className="w-1/2 p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 mb-6">
                Create your account
              </h1>
              <form className="space-y-4">
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
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="name@company.com"
                    required={true}
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
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required={true}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required={true}
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
                    Already have an account?{" "}
                    <a
                      href="#"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Sign in here
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;