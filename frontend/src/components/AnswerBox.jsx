function AnswerBox({ answer, setAnswer, onSubmit, loading }) {
    return (
        <div className="mt-6">

            <label className="block font-semibold mb-2">
                Your Answer
            </label>

            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={7}
                className="w-full border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
            />

            <button
                onClick={onSubmit}
                disabled={loading || !answer.trim()}
                className="w-full mt-4 bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? "Evaluating..." : "Submit Answer"}
            </button>

        </div>
    );
}

export default AnswerBox;