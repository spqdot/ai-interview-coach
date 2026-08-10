import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import AnswerBox from "../components/AnswerBox";

function Interview() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [question, setQuestion] = useState(
        state?.question || ""
    );

    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const [questionNumber, setQuestionNumber] = useState(1);

    const maxQuestions = 5;

    const submitAnswer = async () => {
        if (!answer.trim()) {
            alert("Please enter your answer before submitting.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/interview/answer",
                {
                    interview_id: state.interview_id,
                    answer: answer,
                }
            );

            const data = response.data;

            console.log("Interview response:", data);

            // ==========================================
            // INTERVIEW COMPLETE
            // ==========================================

            if (data.is_complete) {
                navigate("/result", {
                    state: {
                        ...data,
                        role: state.role,
                        topic: state.topic,
                        difficulty: state.difficulty,
                    },
                });

                return;
            }

            // ==========================================
            // NEXT QUESTION
            // ==========================================

            setQuestion(data.next_question);

            setQuestionNumber(
                (previous) => previous + 1
            );

            setAnswer("");

        } catch (error) {
            console.error(
                "Error submitting answer:",
                error
            );

            if (error.response) {
                alert(
                    `Error ${error.response.status}: ${
                        error.response.data?.detail ||
                        "Server error"
                    }`
                );
            } else {
                alert(
                    "Could not submit answer. Please check that the backend is running."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">

            <div className="max-w-3xl mx-auto">

                {/* ==========================================
                    Header
                ========================================== */}

                <div className="text-center mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        AI Interview Coach
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Technical Interview
                    </p>

                </div>


                {/* ==========================================
                    Interview Card
                ========================================== */}

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    {/* ==========================================
                        Interview Information
                    ========================================== */}

                    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

                        <div>
                            <p className="text-sm text-gray-500">
                                Role
                            </p>

                            <p className="font-semibold text-gray-800">
                                {state?.role}
                            </p>
                        </div>


                        <div>
                            <p className="text-sm text-gray-500">
                                Topic
                            </p>

                            <p className="font-semibold text-gray-800">
                                {state?.topic}
                            </p>
                        </div>


                        <div>
                            <p className="text-sm text-gray-500">
                                Difficulty
                            </p>

                            <p className="font-semibold text-gray-800">
                                {state?.difficulty}
                            </p>
                        </div>

                    </div>


                    {/* ==========================================
                        Progress
                    ========================================== */}

                    <div className="mb-6">

                        <div className="flex justify-between items-center mb-2">

                            <p className="text-sm font-medium text-gray-600">
                                Question {questionNumber} of {maxQuestions}
                            </p>

                            <p className="text-sm text-gray-400">
                                {Math.round(
                                    (questionNumber / maxQuestions) * 100
                                )}%
                            </p>

                        </div>


                        <div className="w-full bg-gray-200 rounded-full h-2">

                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: `${
                                        (questionNumber / maxQuestions) * 100
                                    }%`,
                                }}
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        Interviewer Greeting
                    ========================================== */}

                    {state?.greeting && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">

                            <p className="text-blue-800">
                                {state.greeting}
                            </p>

                        </div>
                    )}


                    {/* ==========================================
                        Question
                    ========================================== */}

                    <div className="mb-6">

                        <p className="text-sm font-medium text-gray-500 mb-2">
                            Interview Question
                        </p>

                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">

                            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                                {question}
                            </p>

                        </div>

                    </div>


                    {/* ==========================================
                        Answer
                    ========================================== */}

                    <AnswerBox
                        answer={answer}
                        setAnswer={setAnswer}
                        onSubmit={submitAnswer}
                        loading={loading}
                    />


                    {/* ==========================================
                        Interview Guidance
                    ========================================== */}

                    <div className="mt-5 text-center">

                        <p className="text-sm text-gray-400">

                            {loading
                                ? "Evaluating your answer and preparing the next question..."
                                : "Answer as you would in a real technical interview."
                            }

                        </p>

                    </div>


                    {/* ==========================================
                        Evaluation Notice
                    ========================================== */}

                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">

                        <p className="text-sm text-gray-500 text-center">

                            Your score and detailed feedback will be
                            available after the interview.

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Interview;