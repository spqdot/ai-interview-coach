import { useEffect, useRef, useState } from "react";

const completionPhrases = [
    /\b(that'?s my answer|i'?m finished|that'?s all|next question)\b[.!?\s]*$/i,
    /\b(essa e a minha resposta|estou pronto|proxima pergunta)\b[.!?\s]*$/i,
    /\b(das ist meine antwort|ich bin fertig|nachste frage)\b[.!?\s]*$/i,
    /\b(esa es mi respuesta|he terminado|siguiente pregunta)\b[.!?\s]*$/i,
    /\b(questa e la mia risposta|ho finito|prossima domanda)\b[.!?\s]*$/i,
    /(我的回答是这样|我说完了|下一个问题)[。！!？?\s]*$/,
];

function AnswerBox({
    answer,
    setAnswer,
    onSubmit,
    onStopInterview,
    loading,
    questionKey,
    speechLanguage = "en-US",
    voiceOnly = false,
    autoStart = false,
    isTerminated = false,
    interviewStoppedRef,
    onVoiceStopReady,
}) {
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);
    const finishingRef = useRef(false);
    const submittingRef = useRef(false);
    const transcriptRef = useRef("");
    const onSubmitRef = useRef(onSubmit);
    const retryTimerRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [voiceMessage, setVoiceMessage] = useState("");
    const [voiceSupported, setVoiceSupported] = useState(true);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    const interviewIsStopped = () => isTerminated || interviewStoppedRef?.current;

    const stopRecognition = () => {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
        shouldListenRef.current = false;
        finishingRef.current = false;
        submittingRef.current = true;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                // The browser may already have stopped recognition.
            }

            try {
                recognitionRef.current.abort();
            } catch (error) {
                // The browser may already have aborted recognition.
            }
        }

        recognitionRef.current = null;
        setIsListening(false);
    };

    useEffect(() => {
        onVoiceStopReady?.(stopRecognition);

        return () => onVoiceStopReady?.(null);
    }, [onVoiceStopReady]);

    const finishAnswer = () => {
        if (interviewIsStopped()) {
            return;
        }

        const transcript = transcriptRef.current.trim();

        if (!transcript) {
            setVoiceMessage("No speech was detected. Please continue speaking.");
            return;
        }

        shouldListenRef.current = false;
        finishingRef.current = true;
        recognitionRef.current?.stop();
    };

    useEffect(() => {
        if (interviewStoppedRef?.current) {
            return undefined;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceSupported(false);
            return undefined;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = speechLanguage;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => {
            if (!interviewIsStopped()) {
                setIsListening(true);
            }
        };

        recognition.onresult = (event) => {
            if (interviewIsStopped()) {
                return;
            }

            let transcript = "";

            for (let index = 0; index < event.results.length; index += 1) {
                transcript += event.results[index][0].transcript;
            }

            const phrase = completionPhrases.find((pattern) => pattern.test(transcript.trim()));
            const cleanTranscript = phrase
                ? transcript.trim().replace(phrase, "").trim()
                : transcript.trim();

            transcriptRef.current = cleanTranscript;
            setAnswer(cleanTranscript);

            if (phrase && cleanTranscript) {
                finishAnswer();
            }
        };

        recognition.onerror = (event) => {
            if (interviewIsStopped()) {
                return;
            }

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                shouldListenRef.current = false;
                setVoiceMessage("Microphone permission was denied. Please allow microphone access and reload the interview.");
            } else if (event.error !== "aborted") {
                setVoiceMessage("Speech recognition paused. Listening will resume automatically.");
            }
        };

        recognition.onend = () => {
            setIsListening(false);

            if (interviewIsStopped()) {
                return;
            }

            if (finishingRef.current && !submittingRef.current) {
                finishingRef.current = false;
                const transcript = transcriptRef.current.trim();

                if (transcript) {
                    submittingRef.current = true;
                    onSubmitRef.current(transcript);
                }

                return;
            }

            if (shouldListenRef.current && !submittingRef.current) {
                retryTimerRef.current = setTimeout(() => {
                    if (interviewIsStopped()) {
                        return;
                    }

                    try {
                        recognition.start();
                    } catch (error) {
                        setVoiceMessage("Speech recognition could not restart. Please refresh and try again.");
                    }
                }, 350);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
            shouldListenRef.current = false;
            try {
                recognition.abort();
            } catch (error) {
                // Recognition can already be stopped during question changes.
            }
        };
    }, [speechLanguage, questionKey, setAnswer]);

    useEffect(() => {
        if (interviewStoppedRef?.current) {
            return;
        }

        clearTimeout(retryTimerRef.current);
        shouldListenRef.current = false;
        finishingRef.current = false;
        submittingRef.current = false;
        transcriptRef.current = "";
        setAnswer("");
        setVoiceMessage("");
        recognitionRef.current?.abort();
    }, [questionKey, setAnswer]);

    useEffect(() => {
        if (!isTerminated) {
            return;
        }

        stopRecognition();
    }, [isTerminated]);

    useEffect(() => {
        if (interviewIsStopped() || !voiceOnly || !autoStart || loading || !recognitionRef.current || submittingRef.current) {
            return;
        }

        shouldListenRef.current = true;
        setVoiceMessage("");

        try {
            if (!isListening && !interviewIsStopped()) {
                recognitionRef.current.start();
            }
        } catch (error) {
            setVoiceMessage("Speech recognition could not start. Please allow microphone access and reload the interview.");
        }
    }, [autoStart, isListening, isTerminated, loading, questionKey, voiceOnly]);

    const cancelListening = () => {
        if (interviewIsStopped()) {
            return;
        }

        shouldListenRef.current = false;
        recognitionRef.current?.abort();
        setVoiceMessage("Voice input cancelled.");
    };

    return (
        <div className="answer-box mt-6">

            <label className="block font-semibold mb-2">
                {voiceOnly ? "Your response" : "Your Answer"}
            </label>

            {voiceSupported ? (
                <div className="mb-4">
                    {voiceOnly ? (
                        <div className="voice-status p-3 text-center">
                            {isListening ? "🔴 Listening..." : "Interviewer is preparing your turn..."}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                shouldListenRef.current = true;
                                recognitionRef.current?.start();
                            }}
                            disabled={loading || isListening}
                            className="voice-button w-full border border-blue-600 text-blue-700 rounded-lg p-3 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100"
                        >
                            {isListening ? "🔴 Listening..." : "🎤 Speak"}
                        </button>
                    )}

                    {isListening && voiceOnly && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <button
                                type="button"
                                onClick={finishAnswer}
                                className="rounded-lg bg-teal-700 text-white text-sm font-semibold py-2 hover:bg-teal-800"
                            >
                                Finish Answer
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
                    disabled={loading || isListening || !answer.trim()}
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