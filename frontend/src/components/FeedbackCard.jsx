function FeedbackCard({ score, feedback }) {
    if (score === null && !feedback) {
        return null;
    }

    return (
        <div className="mt-6 p-5 bg-gray-50 border rounded-lg">

            <h3 className="text-xl font-bold mb-3">
                Evaluation
            </h3>

            {score !== null && (
                <p className="text-lg font-semibold mb-3">
                    Score: {score}/10
                </p>
            )}

            {feedback && (
                <div>
                    <p className="font-semibold mb-1">
                        Feedback
                    </p>

                    <p className="text-gray-700">
                        {feedback}
                    </p>
                </div>
            )}

        </div>
    );
}

export default FeedbackCard;