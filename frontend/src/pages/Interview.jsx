import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import AnswerBox from "../components/AnswerBox";

const stopPhrases = [
    "i do not want to continue",
    "i don't want to continue",
    "i dont want to continue",
    "i want to stop",
    "stop interview",
    "end interview",
    "quit interview",
];

function Interview() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [question, setQuestion] = useState(
        state?.question || ""
    );

    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [voiceStage, setVoiceStage] = useState(
        state?.mode === "voice" ? "ready" : "question"
    );

    const [questionNumber, setQuestionNumber] = useState(1);
    const speechRef = useRef(null);

    const maxQuestions = 5;
    const isVoiceInterview = state?.mode === "voice";
    const speechLanguage = state?.speechLanguage || "en-US";
    const readyPrompt = `Hi ${state?.candidate_name || "there"}, welcome to your ${state?.role || "technical"} interview. Today we will discuss ${state?.topic || "your selected topic"}. Are you ready to begin?`;
    const interviewerMessage = voiceStage === "ready" ? readyPrompt : question;

    const speakQuestion = () => {
        if (!("speechSynthesis" in window) || !interviewerMessage || !isVoiceInterview) {
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(interviewerMessage);
        utterance.lang = speechLanguage;
        utterance.rate = 0.92;
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        speakQuestion();

        return () => {
            window.speechSynthesis?.cancel();
        };
    }, [interviewerMessage, isVoiceInterview, speechLanguage]);

    const stopInterview = async () => {
        if (loading || !state?.interview_id) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/interview/stop", {
                interview_id: state.interview_id,
            });

            navigate("/result", {
                state: {
                    ...response.data,
                    role: state.role,
                    topic: state.topic,
                    difficulty: state.difficulty,
                },
            });
        } catch (error) {
            console.error("Error ending interview:", error);
            alert("Could not end the interview. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async (submittedAnswer = answer) => {
        const answerText = submittedAnswer.trim();

        if (loading) {
            return;
        }

        if (!answerText) {
            alert("Please enter your answer before submitting.");
            return;
        }

        if (isVoiceInterview && voiceStage === "ready") {
            setAnswer("");
            setVoiceStage("question");
            return;
        }

        if (stopPhrases.some((phrase) => answerText.toLowerCase().includes(phrase))) {
            await stopInterview();
            return;
        }

        if (!state?.interview_id) {
            alert("Interview session not found. Please start a new interview.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/interview/answer",
                {
                    interview_id: state.interview_id,
                    answer: answerText,
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

            if (data.next_question) {
                setQuestion(data.next_question);
            }

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
                console.error(
                    "Server response:",
                    error.response.data
                );

                alert(
                    `Error ${error.response.status}: ${
                        error.response.data?.detail ||
                        "Server error"
                    }`
                );
            } else {
                alert(
                    "Could not submit answer. Please check your internet connection and try again."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="interview-page min-h-screen py-10 px-4">

            <div className="max-w-3xl mx-auto">

                {/* ==========================================
                    Header
                ========================================== */}

                <div className="interview-header bg-white text-center mb-8 p-6">

                    <p className="eyebrow mb-2">Live technical practice</p>

                    <h1 className="page-title text-3xl font-bold text-gray-900">
                        AI Interview Coach
                    </h1>

                    <p className="text-gray-500 mt-2">
                        {isVoiceInterview ? "Real-Time Voice Interview" : "Written Technical Interview"}
                    </p>

                </div>


                {/* ==========================================
                    Interview Card
                ========================================== */}

                <div className="interview-panel bg-white rounded-2xl shadow-lg p-8">

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
                                    width: `${Math.min(
                                        (questionNumber / maxQuestions) * 100,
                                        100
                                    )}%`,
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
                            {isVoiceInterview ? "AI Interviewer" : "Interview Question"}
                        </p>

                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">

                            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                                {interviewerMessage}
                            </p>

                            {isVoiceInterview && "speechSynthesis" in window && (
                                <button
                                    type="button"
                                    onClick={speakQuestion}
                                    className="mt-5 text-sm font-semibold text-blue-700 hover:text-blue-900"
                                >
                                    Replay interviewer
                                </button>
                            )}

                        </div>

                    </div>


                    {/* ==========================================
                        Answer
                    ========================================== */}

                    <AnswerBox
                        answer={answer}
                        setAnswer={setAnswer}
                        onSubmit={submitAnswer}
                        onStopInterview={stopInterview}
                        loading={loading}
                        questionNumber={questionNumber}
                        questionKey={`${questionNumber}-${voiceStage}`}
                        speechLanguage={speechLanguage}
                        voiceOnly={isVoiceInterview}
                    />


                    {/* ==========================================
                        Interview Guidance
                    ========================================== */}

                    <div className="mt-5 text-center">

                        <p className="text-sm text-gray-400">

                            {loading
                                ? "Evaluating your answer and preparing the next question..."
                                : isVoiceInterview
                                    ? voiceStage === "ready"
                                        ? "Answer the interviewer by voice to begin."
                                        : "Speak naturally. Say when you are finished, or pause to submit automatically."
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