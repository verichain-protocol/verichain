import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { MdCancel } from "react-icons/md";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import Logo from "../../assets/Logo.png";
import { useAuth } from "../../core/providers/auth-provider";
import { logicService } from "../../services/logic.service";
import { internetIdentityService } from "../../services/internetIdentity.service";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSmartLogin = async () => {
    setIsCheckingRegistration(true);
    
    try {
      console.log('🔍 Checking user registration status...');
      
      // First, try to authenticate with Internet Identity to get principal
      const authResult = await internetIdentityService.login();
      
      if (!authResult.success) {
        console.log('❌ Authentication failed, redirecting to register');
        navigate('/Register');
        return;
      }
      
      console.log('✅ Authentication successful, checking if user is registered...');
      
      // Check if user exists in the system
      const userResult = await logicService.getUser();
      
      if (userResult.success && userResult.user) {
        console.log('✅ User is registered, proceeding to Dashboard');
        navigate('/Dashboard');
      } else {
        console.log('📝 User not registered, redirecting to Register form');
        navigate('/Register');
      }
      
    } catch (error) {
      console.error('❌ Error during smart login:', error);
      // Fallback to register page
      navigate('/Register');
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className=" bg-black text-white">
      <header className="bg-black">
        <div className="flex items-center justify-between px-6 md:px-16 lg:px-28 py-6">
          <div className="flex items-center space-x-2">
            <div className="">
              <img
                src={Logo}
                alt="Logo"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <span className="text-lime-400 font-bold text-xl">VERICHAIN</span>
          </div>

          <nav className="hidden lg:flex items-center text-lg space-x-28">
            <Link
              to="/"
              className={`relative transition-colors ${
                isActive("/")
                  ? "text-lime-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Home
              {isActive("/") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </Link>
            <Link
              to="/Dashboard"
              className={`relative transition-colors ${
                isActive("/Dashboard")
                  ? "text-lime-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Verify
              {isActive("/Dashboard") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </Link>
            <Link
              to="/History"
              className={`relative transition-colors ${
                isActive("/History")
                  ? "text-lime-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              History
              {isActive("/History") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </Link>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 border-red-400 border-[1px] px-4 py-2 rounded-full text-red-400 hover:bg-red-400 hover:text-white bg-transparent transition-all duration-300"
                >
                  <FaSignOutAlt size={14} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSmartLogin}
                disabled={isCheckingRegistration}
                className="bg-lime-400 text-gray-900 px-7 py-2 rounded-full hover:bg-lime-300 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCheckingRegistration ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            )}
          </div>

          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-lime-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <MdCancel size={24} /> : <IoMdMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <nav className="px-6 md:px-16 pb-6 space-y-4 bg-black border-t border-gray-800">
            <Link
              to="/"
              className={`block py-2 text-lg font-medium ${
                isActive("/")
                  ? "text-lime-400"
                  : "text-gray-300 hover:text-white"
              } transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/Dashboard"
              className={`block py-2 text-lg ${
                isActive("/Dashboard")
                  ? "text-lime-400 font-medium"
                  : "text-gray-300 hover:text-white"
              } transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              Verify
            </Link>
            <Link
              to="/History"
              className={`block py-2 text-lg ${
                isActive("/History")
                  ? "text-lime-400 font-medium"
                  : "text-gray-300 hover:text-white"
              } transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              History
            </Link>
            
            {/* Mobile Auth Section */}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <div className="flex items-center space-x-2 text-lime-400">
                  <FaUser size={16} />
                  <span className="text-sm">{user?.fullName || user?.email || 'User'}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 border-red-400 border-[1px] px-7 py-2 rounded-full text-red-400 hover:bg-red-400 hover:text-white bg-transparent transition-all duration-300"
                >
                  <FaSignOutAlt size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                className="w-full bg-lime-400 text-gray-900 px-7 py-2 rounded-full hover:bg-lime-300 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                disabled={isCheckingRegistration}
                onClick={() => {
                  handleSmartLogin();
                  setIsMenuOpen(false);
                }}
              >
                {isCheckingRegistration ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
