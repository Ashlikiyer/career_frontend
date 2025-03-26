

const Navbar = () => {
  return (
    <div>
        <nav className="bg-[#111827] p-4 flex justify-between items-center">
        <div className="flex space-x-20 flex-grow justify-center">
          <a href="#" className="text-white hover:text-white">
            HOME
          </a>
          <a href="#" className="text-white hover:text-white">
            ASSESSMENT
          </a>
          <a href="#" className="text-white hover:text-white">
            DASHBOARD
          </a>
        </div>
        <div className="rounded-full bg-gray-700 w-10 h-10 flex items-center justify-center">
          <img src="" alt="Profile" className="rounded-full" />
        </div>
      </nav>
    </div>
  )
}

export default Navbar