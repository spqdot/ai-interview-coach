import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import AnswerBox from "../components/AnswerBox";
import { VOICE_LANGUAGES, VOICE_LANGUAGE_LABELS } from "../voiceLanguages";

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
    const [speechLanguage, setSpeechLanguage] = useState(
        state?.speechLanguage || "en-US"
    );
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [autoListen, setAutoListen] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);
    const [speechMessage, setSpeechMessage] = useState("");
    const [availableVoices, setAvailableVoices] = useState([]);

    const [questionNumber, setQuestionNumber] = useState(1);
    const speechRef = useRef(null);
    const speechStartTimerRef = useRef(null);
    const terminatedRef = useRef(false);
    const answerRequestRef = useRef(false);

    const maxQuestions = 5;
    const isVoiceInterview = state?.mode === "voice";
    const interviewerMessage = isVoiceInterview && questionNumber === 1
        ? `${state?.greeting || `Welcome to your ${state?.role || "technical"} interview.`} Today we will discuss ${state?.topic || "your selected topic"}. ${question}`
        : question;

    useEffect(() => {
        if (!("speechSynthesis" in window) || !isVoiceInterview) {
            return undefined;
        }

        const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
        loadVoices();
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

        return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }, [isVoiceInterview]);

    const startListeningAfterSpeech = () => {
        speechStartTimerRef.current = setTimeout(() => {
            if (!terminatedRef.current) {
                setIsInterviewerSpeaking(false);
                setAutoListen(true);
            }
        }, 400);
    };

    const speakQuestion = () => {
        if (!("speechSynthesis" in window) || !interviewerMessage || !isVoiceInterview) {
            return;
        }

        clearTimeout(speechStartTimerRef.current);
        setAutoListen(false);
        setIsInterviewerSpeaking(true);
        window.speechSynthesis.cancel();

        const portugueseVoice = availableVoices.find((voice) =>
            voice.lang.toLowerCase().startsWith("pt-pt")
        );

        if (speechLanguage === "pt-PT" && !portugueseVoice) {
            setSpeechMessage("This browser does not provide a Portuguese (Portugal) voice. It will not substitute a Brazilian Portuguese voice.");
            startListeningAfterSpeech();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(interviewerMessage);
        utterance.lang = speechLanguage;
        utterance.voice = speechLanguage === "pt-PT"
            ? portugueseVoice
            : availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(speechLanguage.toLowerCase()));
        utterance.rate = 0.92;
        utterance.onend = startListeningAfterSpeech;
        utterance.onerror = startListeningAfterSpeech;
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        speakQuestion();

        return () => {
            clearTimeout(speechStartTimerRef.current);
            window.speechSynthesis?.cancel();
        };
    }, [interviewerMessage, isVoiceInterview, speechLanguage, availableVoices]);

    const stopInterview = async () => {
        if (loading || !state?.interview_id || isTerminated) {
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

        if (loading || answerRequestRef.current || terminatedRef.current) {
            return;
        }

        if (!answerText) {
            alert("Please enter your answer before submitting.");
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

        answerRequestRef.current = true;
        setLoading(true);

        try {
            if (isVoiceInterview) {
                const mismatchResponse = await api.post("/interview/language-mismatch", {
                    interview_id: state.interview_id,
                    transcript: answerText,
                    selected_language: speechLanguage,
                });

                if (mismatchResponse.data.language_mismatch) {
                    terminatedRef.current = true;
                    clearTimeout(speechStartTimerRef.current);
                    window.speechSynthesis?.cancel();
                    setAutoListen(false);
                    setIsInterviewerSpeaking(false);
                    setIsTerminated(true);

                    navigate("/result", {
                        state: {
                            is_language_mismatch: true,
                            reason: mismatchResponse.data.reason,
                            language: VOICE_LANGUAGE_LABELS[speechLanguage],
                            role: state.role,
                            topic: state.topic,
                            difficulty: state.difficulty,
                        },
                    });
                    return;
                }
            }

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
                setAutoListen(false);
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
            answerRequestRef.current = false;
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

                        {isVoiceInterview && (
                            <div>
                                <label className="text-sm text-gray-500 block">
                                    Voice Language
                                </label>

                                <select
                                    className="form-control mt-1 p-2 text-sm"
                                    value={speechLanguage}
                                    onChange={(event) => {
                                        setAutoListen(false);
                                        window.speechSynthesis?.cancel();
                                        setSpeechMessage("");
                                        setSpeechLanguage(event.target.value);
                                    }}
                                    disabled={loading || isInterviewerSpeaking}
                                >
                                    {Object.entries(VOICE_LANGUAGES).map(([language, locale]) => (
                                        <option key={locale} value={locale}>
                                            {VOICE_LANGUAGE_LABELS[locale]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                        questionKey={`${questionNumber}-${speechLanguage}`}
                        speechLanguage={speechLanguage}
                        voiceOnly={isVoiceInterview}
                        autoStart={isVoiceInterview && autoListen && !isInterviewerSpeaking}
                        isTerminated={isTerminated}
                    />

                    {speechMessage && (
                        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            {speechMessage}
                        </p>
                    )}


                    {/* ==========================================
                        Interview Guidance
                    ========================================== */}

                    <div className="mt-5 text-center">

                        <p className="text-sm text-gray-400">

                            {loading
                                ? "Evaluating your answer and preparing the next question..."
                                : isVoiceInterview
                                    ? isInterviewerSpeaking
                                        ? "The interviewer is asking the question. Your microphone will start automatically next."
                                        : "Speak naturally. Say “That’s my answer” or press Finish Answer when you are done."
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