import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">🏸 SportSphere</span>
                        </Link>
                        <div className="hidden md:flex ml-10 space-x-8">
                            <Link
                                to="/courts"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Courts
                            </Link>
                            <Link
                                to="/coaches"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Coaches
                            </Link>
                            <Link
                                to="/tournaments"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Tournaments
                            </Link>
                            <Link
                                to="/sparring"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Sparring
                            </Link>
                            <Link
                                to="/chatbot"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                🤖 AI Chat
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <div className="hidden md:flex items-center space-x-4">
                                    {user?.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    {user?.role === 'coach' && (
                                        <Link
                                            to="/coach/dashboard"
                                            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Coach Dashboard
                                        </Link>
                                    )}
                                    <Link
                                        to="/my-sessions"
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        My Sessions
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Profile
                                    </Link>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-700">
                                        Hello, <span className="font-medium">{user?.name}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isAuthenticated && (
                <div className="md:hidden border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className="block text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        {user?.role === 'coach' && (
                            <Link
                                to="/coach/dashboard"
                                className="block text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                            >
                                Coach Dashboard
                            </Link>
                        )}
                        <Link
                            to="/my-sessions"
                            className="block text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                        >
                            My Sessions
                        </Link>
                        <Link
                            to="/profile"
                            className="block text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
