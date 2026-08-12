import { useEffect, useRef, useState } from "react";

function AnswerBox({
    answer,
    setAnswer,
    onSubmit,
    onStopInterview,
    loading,
    questionNumber,
    questionKey,
    speechLanguage = "en-US",
    voiceOnly = false,
}) {
    const recognitionRef = useRef(null);
    const pauseTimerRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const liveTranscriptRef = useRef("");
    const submitAfterStopRef = useRef(false);
    const submissionStartedRef = useRef(false);
    const onSubmitRef = useRef(onSubmit);

    const [isListening, setIsListening] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState("");
    const [voiceSupported, setVoiceSupported] = useState(true);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceSupported(false);
            return undefined;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = speechLanguage;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalTranscript = finalTranscriptRef.current;
            let interimTranscript = "";

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;

                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            finalTranscriptRef.current = finalTranscript;
            const liveTranscript = `${finalTranscript} ${interimTranscript}`.trim();
            liveTranscriptRef.current = liveTranscript;
            setAnswer(liveTranscript);

            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
                if (liveTranscript && !submissionStartedRef.current) {
                    submitAfterStopRef.current = true;
                    recognition.stop();
                }
            }, 4500);
        };

        recognition.onerror = (event) => {
            clearTimeout(pauseTimerRef.current);
            setIsListening(false);

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setVoiceMessage("Microphone permission was denied. Please type your answer instead.");
            } else if (event.error === "no-speech") {
                setVoiceMessage("No speech was detected. Please try again or type your answer.");
            } else if (event.error !== "aborted") {
                setVoiceMessage("Speech recognition could not continue. Please try again or type your answer.");
            }
        };

        recognition.onend = () => {
            clearTimeout(pauseTimerRef.current);
            setIsListening(false);

            if (submitAfterStopRef.current) {
                submitAfterStopRef.current = false;
                const transcript = liveTranscriptRef.current.trim();

                if (transcript && !submissionStartedRef.current) {
                    submissionStartedRef.current = true;
                    onSubmitRef.current(transcript);
                } else if (!transcript) {
                    setVoiceMessage("No speech was detected. Please try again or type your answer.");
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            clearTimeout(pauseTimerRef.current);
            recognition.abort();
        };
    }, [setAnswer, speechLanguage]);

    useEffect(() => {
        clearTimeout(pauseTimerRef.current);
        submitAfterStopRef.current = false;
        finalTranscriptRef.current = "";
        liveTranscriptRef.current = "";
        submissionStartedRef.current = false;
        setVoiceMessage("");

        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    }, [questionKey || questionNumber]);

    const startListening = () => {
        if (loading || isListening || submissionStartedRef.current) {
            return;
        }

        finalTranscriptRef.current = "";
        liveTranscriptRef.current = "";
        submitAfterStopRef.current = false;
        setAnswer("");
        setVoiceMessage("");

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (error) {
            setVoiceMessage("Speech recognition could not start. Please try again or type your answer.");
        }
    };

    const cancelListening = () => {
        clearTimeout(pauseTimerRef.current);
        submitAfterStopRef.current = false;
        recognitionRef.current?.abort();
        setIsListening(false);
        setVoiceMessage("Voice input cancelled. You can type your answer instead.");
    };

    const finishSpeaking = () => {
        if (!liveTranscriptRef.current.trim()) {
            setVoiceMessage("No speech was detected. Please continue speaking or type your answer.");
            return;
        }

        clearTimeout(pauseTimerRef.current);
        submitAfterStopRef.current = true;
        recognitionRef.current?.stop();
    };

    return (
        <div className="answer-box mt-6">

            <label className="block font-semibold mb-2">
                {voiceOnly ? "Your response" : "Your Answer"}
            </label>

            {voiceSupported ? (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={startListening}
                        disabled={loading || isListening || submissionStartedRef.current}
                        className="voice-button w-full border border-blue-600 text-blue-700 rounded-lg p-3 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100"
                    >
                        {isListening ? "🔴 Listening..." : voiceOnly ? "🎤 Start speaking" : "🎤 Speak"}
                    </button>

                    {isListening && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <button
                                type="button"
                                onClick={finishSpeaking}
                                className="rounded-lg bg-teal-700 text-white text-sm font-semibold py-2 hover:bg-teal-800"
                            >
                                I'm finished speaking
                            </button>

                            <button
                                type="button"
                                onClick={cancelListening}
                                className="rounded-lg border border-gray-300 text-sm text-gray-600 py-2 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Voice input is not supported in this browser. Please type your answer instead.
                </p>
            )}

            {voiceMessage && (
                <p className="mb-4 text-sm text-red-600">
                    {voiceMessage}
                </p>
            )}

            {voiceOnly ? (
                <div className="voice-transcript min-h-28 p-4">
                    {answer || (
                        <span className="text-gray-400">
                            Your live response will appear here while you speak.
                        </span>
                    )}
                </div>
            ) : (
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={isListening ? "Your live speech transcript will appear here..." : "Type your answer here..."}
                    rows={7}
                    className="w-full border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || isListening}
                />
            )}

            {!voiceOnly && (
                <button
                    onClick={onSubmit}
                    disabled={loading || isListening || !answer.trim() || submissionStartedRef.current}
                    className="submit-button w-full mt-4 bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? "Evaluating..." : "Submit Answer"}
                </button>
            )}

            <button
                type="button"
                onClick={onStopInterview}
                disabled={loading || isListening}
                className="end-button w-full mt-3 text-sm text-gray-600 underline disabled:text-gray-400"
            >
                End Interview
            </button>

        </div>
    );
}

export default AnswerBox;