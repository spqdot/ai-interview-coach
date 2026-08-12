import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Home() {
    const [candidateName, setCandidateName] = useState("");
    const [role, setRole] = useState("AI Engineer");
    const [topic, setTopic] = useState("RAG");
    const [difficulty, setDifficulty] = useState("Easy");
    const [mode, setMode] = useState("written");
    const [speechLanguage, setSpeechLanguage] = useState("en-US");

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const startInterview = async () => {
        if (!candidateName.trim()) {
            alert("Please enter your name.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/interview/start", {
                candidate_name: candidateName,
                role: role,
                topic: topic,
                difficulty: difficulty,
            });

            console.log("Interview started:", response.data);

            // Pass both backend response and
            // selected interview information
            navigate("/interview", {
                state: {
                    ...response.data,
                    candidate_name: candidateName,
                    role: role,
                    topic: topic,
                    difficulty: difficulty,
                    mode: mode,
                    speechLanguage: speechLanguage,
                },
            });

        } catch (error) {
            console.error("Failed to start interview:", error);

            if (error.response) {
                alert(
                    `Failed to start interview: ${
                        error.response.data?.detail ||
                        "Server error"
                    }`
                );
            } else {
                alert(
                    "Failed to start interview. Please make sure the backend is running."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page min-h-screen flex justify-center items-center px-4 py-10">

            <div className="home-card bg-white rounded-xl shadow-lg p-8 w-[500px]">

                {/* Title */}
                <p className="eyebrow text-center mb-3">Technical practice studio</p>

                <h1 className="page-title text-3xl font-bold text-center mb-2">
                    AI Interview Coach
                </h1>

                <p className="text-center text-gray-500 text-sm mb-8">
                    Build confidence one thoughtful answer at a time.
                </p>


                <div className="mb-6">
                    <p className="field-label mb-2">Choose your interview experience</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setMode("written")}
                            className={`mode-card text-left p-4 ${
                                mode === "written" ? "mode-card-active" : ""
                            }`}
                        >
                            <span className="block text-lg font-extrabold">Written Interview</span>
                            <span className="block text-sm mt-1">Read, write, and submit each answer.</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode("voice")}
                            className={`mode-card text-left p-4 ${
                                mode === "voice" ? "mode-card-active" : ""
                            }`}
                        >
                            <span className="block text-lg font-extrabold">Real-Time Voice</span>
                            <span className="block text-sm mt-1">Speak with an interviewer using your microphone.</span>
                        </button>
                    </div>
                </div>


                <div className="space-y-5">

                    {/* Candidate Name */}
                    <div>
                        <label className="field-label">
                            Candidate Name
                        </label>

                        <input
                            type="text"
                            className="form-control w-full border rounded-lg p-3 mt-2"
                            value={candidateName}
                            onChange={(e) =>
                                setCandidateName(e.target.value)
                            }
                            placeholder="Enter your name"
                        />
                    </div>


                    {/* Role */}
                    <div>
                        <label className="field-label">
                            Role
                        </label>

                        <select
                            className="form-control w-full border rounded-lg p-3 mt-2"
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value)
                            }
                        >
                            <option value="AI Engineer">
                                AI Engineer
                            </option>

                            <option value="ML Engineer">
                                ML Engineer
                            </option>

                            <option value="Data Scientist">
                                Data Scientist
                            </option>
                        </select>
                    </div>


                    {/* Topic */}
                    <div>
                        <label className="field-label">
                            Topic
                        </label>

                        <select
                            className="form-control w-full border rounded-lg p-3 mt-2"
                            value={topic}
                            onChange={(e) =>
                                setTopic(e.target.value)
                            }
                        >
                            <option value="RAG">
                                RAG
                            </option>

                            <option value="LLM Fundamentals">
                                LLM Fundamentals
                            </option>

                            <option value="Prompt Engineering">
                                Prompt Engineering
                            </option>

                            <option value="Embeddings">
                                Embeddings
                            </option>

                            <option value="Vector Databases">
                                Vector Databases
                            </option>

                            <option value="NLP">
                                NLP
                            </option>

                            <option value="Transformers">
                                Transformers
                            </option>

                            <option value="Machine Learning">
                                Machine Learning
                            </option>

                            <option value="Deep Learning">
                                Deep Learning
                            </option>

                            <option value="Generative AI">
                                Generative AI
                            </option>
                        </select>
                    </div>


                    {/* Difficulty */}
                    <div>
                        <label className="field-label">
                            Difficulty
                        </label>

                        <select
                            className="form-control w-full border rounded-lg p-3 mt-2"
                            value={difficulty}
                            onChange={(e) =>
                                setDifficulty(e.target.value)
                            }
                        >
                            <option value="Easy">
                                Easy
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Hard">
                                Hard
                            </option>
                        </select>
                    </div>

                    {mode === "voice" && (
                        <div>
                            <label className="field-label">
                                Voice Language
                            </label>

                            <select
                                className="form-control w-full border rounded-lg p-3 mt-2"
                                value={speechLanguage}
                                onChange={(e) => setSpeechLanguage(e.target.value)}
                            >
                                <option value="en-US">English</option>
                                <option value="bn-BD">Bengali</option>
                                <option value="hi-IN">Hindi</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                            </select>
                        </div>
                    )}


                    {/* Start Interview Button */}
                    <button
                        onClick={startInterview}
                        disabled={loading}
                        className={`primary-button w-full text-white rounded-lg p-3 mt-5 ${
                            loading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading
                            ? "Starting Interview..."
                            : mode === "voice"
                                ? "Start Real Interview"
                                : "Start Written Interview"
                        }
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Home;