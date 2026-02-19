import { useState } from 'react';
import coachService from '../services/coachService';

const SessionRating = ({ session, onRatingSubmitted }) => {
    const [rating, setRating] = useState({
        score: 5,
        review: ''
    });
    const [hoveredStar, setHoveredStar] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await coachService.rateSession(session._id, rating);
            setMessage({ type: 'success', text: 'Rating submitted successfully!' });
            if (onRatingSubmitted) {
                onRatingSubmitted();
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to submit rating' });
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return [...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
                <button
                    key={index}
                    type="button"
                    onClick={() => setRating({ ...rating, score: starValue })}
                    onMouseEnter={() => setHoveredStar(starValue)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="text-3xl focus:outline-none transition-transform hover:scale-110"
                >
                    {starValue <= (hoveredStar || rating.score) ? '⭐' : '☆'}
                </button>
            );
        });
    };

    // Don't show if session is not completed or already rated
    if (session.status !== 'completed' || session.rating) {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Rate Your Session</h3>

            {message.text && (
                <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        How would you rate this session?
                    </label>
                    <div className="flex gap-1">
                        {renderStars()}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {rating.score === 1 && 'Poor'}
                        {rating.score === 2 && 'Fair'}
                        {rating.score === 3 && 'Good'}
                        {rating.score === 4 && 'Very Good'}
                        {rating.score === 5 && 'Excellent'}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review (Optional)
                    </label>
                    <textarea
                        value={rating.review}
                        onChange={(e) => setRating({ ...rating, review: e.target.value })}
                        rows="4"
                        placeholder="Share your experience with this coach..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
            </form>
        </div>
    );
};

export default SessionRating;
