import { useLocation, useNavigate } from "react-router-dom";

function Result() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const downloadReport = () => {
        window.print();
    };

    if (!state) {
        return (
            <div className="result-page min-h-screen flex items-center justify-center px-4">
                <div className="result-card bg-white p-8 rounded-xl shadow-lg text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        No Interview Result
                    </h1>

                    <button
                        onClick={() => navigate("/")}
                        className="new-interview-button text-white px-6 py-3 rounded-lg"
                    >
                        Start New Interview
                    </button>
                </div>
            </div>
        );
    }

    if (state.is_language_mismatch) {
        return (
            <div className="result-page min-h-screen flex items-center justify-center px-4">
                <div className="result-card bg-white p-8 rounded-xl shadow-lg text-center max-w-xl">
                    <h1 className="text-3xl font-bold">Interview ended</h1>
                    <p className="text-gray-700 mt-4">{state.reason}</p>
                    <p className="text-gray-500 mt-2">Selected language: {state.language}</p>
                    <div className="flex flex-wrap justify-center gap-3 mt-7">
                        <button onClick={() => navigate("/")} className="new-interview-button text-white px-6 py-3 rounded-lg">
                            Choose another language
                        </button>
                        <button onClick={() => navigate("/")} className="border border-blue-600 text-blue-700 px-6 py-3 rounded-lg">
                            Restart Interview
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="result-page min-h-screen py-10">

            <div className="max-w-4xl mx-auto px-4">

                {/* Header */}

                <div className="result-header bg-white rounded-xl shadow-lg p-8 mb-6">

                    <h1 className="text-3xl font-bold text-center">
                        Interview Results
                    </h1>

                    <p className="text-center text-gray-500 mt-2">
                        {state.role} · {state.topic}
                    </p>

                </div>

                {state.is_incomplete && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-amber-900">
                            Interview Not Completed
                        </h2>

                        <p className="text-amber-800 mt-2">
                            Thank you for the interview. You answered {state.answered_questions} of 5 questions, and the score below reflects only those submitted answers.
                        </p>
                    </div>
                )}


                {/* Final Score */}

                <div className="result-card score-card bg-white rounded-xl shadow-lg p-8 mb-6 text-center">

                    <p className="text-gray-500">
                        {state.is_incomplete ? "Incomplete Interview Score" : "Final Score"}
                    </p>

                    <p className="text-5xl font-bold text-blue-600 mt-2">
                        {state.final_score}/10
                    </p>

                    <p className="text-xl font-semibold mt-4">
                        {state.overall_rating}
                    </p>

                </div>


                {/* Hiring Recommendation */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-3">
                        Hiring Recommendation
                    </h2>

                    <p className="text-gray-700">
                        {state.hiring_recommendation}
                    </p>

                </div>


                {/* Question Scores */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Question Scores
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

                        {state.question_scores?.map(
                            (score, index) => (
                                <div
                                    key={index}
                                    className="score-tile border rounded-lg p-4 text-center"
                                >
                                    <p className="text-sm text-gray-500">
                                        Question {index + 1}
                                    </p>

                                    <p className="text-2xl font-bold mt-1">
                                        {score}/10
                                    </p>
                                </div>
                            )
                        )}

                    </div>

                </div>


                {/* Strengths */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Strengths
                    </h2>

                    <ul className="list-disc pl-6 space-y-2">

                        {state.strengths?.map(
                            (strength, index) => (
                                <li key={index}>
                                    {strength}
                                </li>
                            )
                        )}

                    </ul>

                </div>


                {/* Areas for Improvement */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Areas for Improvement
                    </h2>

                    <ul className="list-disc pl-6 space-y-2">

                        {state.areas_for_improvement?.map(
                            (area, index) => (
                                <li key={index}>
                                    {area}
                                </li>
                            )
                        )}

                    </ul>

                </div>


                {/* Recommended Topics */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Recommended Topics
                    </h2>

                    <div className="flex flex-wrap gap-3">

                        {state.recommended_topics?.map(
                            (topic, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full"
                                >
                                    {topic}
                                </span>
                            )
                        )}

                    </div>

                </div>


                {/* Final Feedback */}

                <div className="result-card bg-white rounded-xl shadow-lg p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Final Feedback
                    </h2>

                    <p className="text-gray-700 leading-relaxed">
                        {state.final_feedback}
                    </p>

                </div>


                {/* Download Report */}

                <div className="flex justify-center gap-4 mt-8 mb-6 no-print">

                    <button
                        onClick={downloadReport}
                        className="report-button text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                        📄 Download Interview Report
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="new-interview-button text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Start New Interview
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Result;