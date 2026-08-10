import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Home() {
    const [candidateName, setCandidateName] = useState("");
    const [role, setRole] = useState("AI Engineer");
    const [topic, setTopic] = useState("RAG");
    const [difficulty, setDifficulty] = useState("Easy");

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
                    role: role,
                    topic: topic,
                    difficulty: difficulty,
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
        <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">

            <div className="bg-white rounded-xl shadow-lg p-8 w-[500px]">

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-8">
                    AI Interview Coach
                </h1>


                <div className="space-y-5">

                    {/* Candidate Name */}
                    <div>
                        <label className="font-semibold">
                            Candidate Name
                        </label>

                        <input
                            type="text"
                            className="w-full border rounded-lg p-3 mt-2"
                            value={candidateName}
                            onChange={(e) =>
                                setCandidateName(e.target.value)
                            }
                            placeholder="Enter your name"
                        />
                    </div>


                    {/* Role */}
                    <div>
                        <label className="font-semibold">
                            Role
                        </label>

                        <select
                            className="w-full border rounded-lg p-3 mt-2"
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
                        <label className="font-semibold">
                            Topic
                        </label>

                        <select
                            className="w-full border rounded-lg p-3 mt-2"
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
                        <label className="font-semibold">
                            Difficulty
                        </label>

                        <select
                            className="w-full border rounded-lg p-3 mt-2"
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


                    {/* Start Interview Button */}
                    <button
                        onClick={startInterview}
                        disabled={loading}
                        className={`w-full text-white rounded-lg p-3 mt-5 ${
                            loading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading
                            ? "Starting Interview..."
                            : "Start Interview"
                        }
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Home;