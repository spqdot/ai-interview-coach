import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import AnswerBox from "../components/AnswerBox";
import { VOICE_LANGUAGE_LABELS } from "../voiceLanguages";

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
    const [speechLanguage] = useState(
        state?.speechLanguage || "en-US"
    );
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [autoListen, setAutoListen] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);
    const [speechMessage, setSpeechMessage] = useState("");
    const [availableVoices, setAvailableVoices] = useState([]);
    const [conversationReply, setConversationReply] = useState("");

    const [questionNumber, setQuestionNumber] = useState(1);
    const speechRef = useRef(null);
    const speechStartTimerRef = useRef(null);
    const terminatedRef = useRef(false);
    const answerRequestRef = useRef(false);
    const voiceStopRef = useRef(null);

    const maxQuestions = 5;
    const isVoiceInterview = state?.mode === "voice";
    const interviewerMessage = conversationReply
        ? `${conversationReply} ${question}`.trim()
        : isVoiceInterview && questionNumber === 1
            ? `${state?.greeting || ""} ${question}`.trim()
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
            if (terminatedRef.current) {
                return;
            }

            setIsInterviewerSpeaking(false);
            setAutoListen(true);
        }, 400);
    };

    const speakQuestion = () => {
        if (terminatedRef.current || !("speechSynthesis" in window) || !interviewerMessage || !isVoiceInterview) {
            return;
        }

        clearTimeout(speechStartTimerRef.current);
        setAutoListen(false);
        setIsInterviewerSpeaking(true);
        window.speechSynthesis.cancel();

        const selectedVoice = availableVoices.find((voice) =>
            voice.lang.toLowerCase().startsWith(speechLanguage.toLowerCase())
        );

        if (!selectedVoice) {
            const message = speechLanguage === "pt-BR"
                ? "This browser does not provide a Brazilian Portuguese voice. You can read the interviewer text and answer when the microphone starts."
                : `This browser does not provide a ${VOICE_LANGUAGE_LABELS[speechLanguage]} voice. You can read the interviewer text and answer when the microphone starts.`;
            setSpeechMessage(message);
            startListeningAfterSpeech();
            return;
        }

        setSpeechMessage("");

        const utterance = new SpeechSynthesisUtterance(interviewerMessage);
        utterance.lang = speechLanguage;
        utterance.voice = selectedVoice;
        utterance.rate = 0.92;
        utterance.onend = startListeningAfterSpeech;
        utterance.onerror = startListeningAfterSpeech;
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (terminatedRef.current) {
            return undefined;
        }

        speakQuestion();

        return () => {
            clearTimeout(speechStartTimerRef.current);
            window.speechSynthesis?.cancel();
        };
    }, [interviewerMessage, isVoiceInterview, speechLanguage, availableVoices]);

    const stopWrittenInterview = async () => {
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

    const stopInterview = (reason = "manual", notifyBackend = true) => {
        if (!isVoiceInterview) {
            return stopWrittenInterview();
        }

        if (terminatedRef.current) {
            return;
        }

        terminatedRef.current = true;
        answerRequestRef.current = true;
        clearTimeout(speechStartTimerRef.current);
        speechStartTimerRef.current = null;
        speechRef.current = null;
        window.speechSynthesis?.cancel();
        voiceStopRef.current?.();
        setAutoListen(false);
        setIsInterviewerSpeaking(false);
        setLoading(false);
        setIsTerminated(true);

        if (notifyBackend && state?.interview_id) {
            api.post("/interview/stop", { interview_id: state.interview_id }).catch((error) => {
                console.error("Error ending voice interview:", error);
            });
        }

        setSpeechMessage(
            reason === "language-mismatch"
                ? "Interview stopped because the selected interview language was not suitable for you."
                : "Interview stopped."
        );
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

        if (!isVoiceInterview && stopPhrases.some((phrase) => answerText.toLowerCase().includes(phrase))) {
            await stopWrittenInterview();
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
                    stopInterview("language-mismatch", false);
                    return;
                }
            }

            const conversationResponse = await api.post("/interview/conversation", {
                interview_id: state.interview_id,
                transcript: answerText,
                language: speechLanguage,
            });

            if (conversationResponse.data.is_conversation_turn) {
                if (!terminatedRef.current) {
                    setConversationReply(conversationResponse.data.reply);

                    if (conversationResponse.data.technical_answer) {
                        const response = await api.post(
                            "/interview/answer",
                            {
                                interview_id: state.interview_id,
                                answer: conversationResponse.data.technical_answer,
                            }
                        );

                        if (terminatedRef.current) {
                            return;
                        }

                        const data = response.data;
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

                        if (data.next_question) {
                            setAutoListen(false);
                            setQuestion(data.next_question);
                            setQuestionNumber((previous) => previous + 1);
                        }
                    }

                    setAnswer("");
                }
                return;

            }

            if (terminatedRef.current) {
                return;
            }

            const response = await api.post(
                "/interview/answer",
                {
                    interview_id: state.interview_id,
                    answer: answerText,
                }
            );

            const data = response.data;

            if (terminatedRef.current) {
                return;
            }

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
                setConversationReply("");
                setQuestion(data.next_question);
            }

            if (!terminatedRef.current) {
                setQuestionNumber((previous) => previous + 1);
            }

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
            if (!terminatedRef.current) {
                answerRequestRef.current = false;
                setLoading(false);
            }
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

                    {isVoiceInterview && isTerminated ? (
                        <div className="text-center py-10">
                            <h2 className="text-2xl font-bold text-red-800">🛑 Interview Stopped</h2>
                            <p className="text-gray-700 mt-4">
                                {speechMessage || "The interview has been stopped."}
                            </p>
                            <div className="flex flex-wrap justify-center gap-3 mt-7">
                                <button type="button" onClick={() => navigate("/")} className="new-interview-button text-white px-6 py-3 rounded-lg">
                                    Choose Another Language
                                </button>
                                <button type="button" onClick={() => navigate("/")} className="border border-blue-600 text-blue-700 px-6 py-3 rounded-lg">
                                    Restart Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>

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

                        <div>
                                <label className="text-sm text-gray-500 block">
                                    {isVoiceInterview ? "Voice Language" : "Written Language"}
                                </label>

                                <p className="font-semibold text-gray-800 mt-1">
                                    {VOICE_LANGUAGE_LABELS[speechLanguage]}
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
                        key={`${questionNumber}-${speechLanguage}`}
                        answer={answer}
                        setAnswer={setAnswer}
                        onSubmit={submitAnswer}
                        onStopInterview={stopInterview}
                        loading={loading}
                        questionNumber={questionNumber}
                        questionKey={`${questionNumber}-${speechLanguage}-${conversationReply}`}
                        speechLanguage={speechLanguage}
                        voiceOnly={isVoiceInterview}
                        autoStart={isVoiceInterview && autoListen && !isInterviewerSpeaking}
                        isTerminated={isTerminated}
                        interviewStoppedRef={terminatedRef}
                        onVoiceStopReady={(stopVoice) => {
                            voiceStopRef.current = stopVoice;
                        }}
                    />

                    {isVoiceInterview && (
                        <button
                            type="button"
                            onClick={() => stopInterview("manual")}
                            className="w-full mt-4 rounded-lg bg-red-700 text-white font-semibold py-3 hover:bg-red-800"
                        >
                            🛑 Stop Interview
                        </button>
                    )}

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

                        </>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Interview;