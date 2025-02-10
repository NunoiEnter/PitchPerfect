import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as Tone from "tone";
import Meyda from "meyda";
import { motion, AnimatePresence } from "framer-motion";

export default function PitchPerfect() {
  const [originalFile, setOriginalFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [musicalKeys, setMusicalKeys] = useState(null);
  const [maxDuration, setMaxDuration] = useState(0);
  const [isStarted, setIsStarted] = useState(false); // Track if the app has started

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (type === "original") setOriginalFile(file);
    else setUserFile(file);
  };

  const extractPitch = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const audioBuffer = await audioContext.decodeAudioData(reader.result);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const pitchData = [];
        const meydaAnalyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 512,
          featureExtractors: ["chroma"],
          callback: (features) => {
            if (features && features.chroma) {
              const maxIndex = features.chroma.indexOf(Math.max(...features.chroma));
              const pitch = 440 * Math.pow(2, (maxIndex - 9) / 12); // Convert chroma index to frequency
              pitchData.push(pitch);
            }
          },
        });

        source.start();
        meydaAnalyzer.start();

        setTimeout(() => {
          meydaAnalyzer.stop();
          resolve(pitchData);
        }, 3000);
      };
    });
  };

  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  const detectKey = (chroma) => {
    const keys = [
      "C Major", "C# Major", "D Major", "D# Major", "E Major", "F Major",
      "F# Major", "G Major", "G# Major", "A Major", "A# Major", "B Major",
      "C Minor", "C# Minor", "D Minor", "D# Minor", "E Minor", "F Minor",
      "F# Minor", "G Minor", "G# Minor", "A Minor", "A# Minor", "B Minor"
    ];
  
    let maxCorrelation = -Infinity;
    let bestKey = "Unknown";
  
    // Compare chroma to major and minor profiles
    for (let i = 0; i < 12; i++) {
      const rotatedChroma = [...chroma.slice(i), ...chroma.slice(0, i)];
      const majorCorrelation = rotatedChroma.reduce((sum, val, j) => sum + val * majorProfile[j], 0);
      const minorCorrelation = rotatedChroma.reduce((sum, val, j) => sum + val * minorProfile[j], 0);
  
      if (majorCorrelation > maxCorrelation) {
        maxCorrelation = majorCorrelation;
        bestKey = keys[i];
      }
      if (minorCorrelation > maxCorrelation) {
        maxCorrelation = minorCorrelation;
        bestKey = keys[i + 12];
      }
    }
  
    return bestKey;
  };

  const getMusicalKey = async (file) => {
    return new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") await audioContext.resume();

        const audioBuffer = await audioContext.decodeAudioData(reader.result);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        let keyDetected = "Unknown";
        const meydaAnalyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 512,
          featureExtractors: ["chroma"],
          callback: (features) => {
            if (features.chroma) {
              keyDetected = detectKey(features.chroma);
            }
          },
        });

        source.start();
        meydaAnalyzer.start();

        setTimeout(() => {
          meydaAnalyzer.stop();
          resolve(keyDetected);
        }, 3000);
      };
    });
  };

  const getAudioDuration = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(reader.result);
        resolve(audioBuffer.duration); // Returns duration in seconds
      };
    });
  };

  const formatTime = (index, sampleRate = 44100, bufferSize = 512) => {
    const seconds = (index * bufferSize) / sampleRate;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60); // Ensure rounding
  
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const analyzeVoice = async () => {
    if (!originalFile || !userFile) {
      alert("Please upload both audio files first.");
      return;
    }

    const originalPitch = await extractPitch(originalFile);
    const userPitch = await extractPitch(userFile);
    const originalKey = await getMusicalKey(originalFile);
    const userKey = await getMusicalKey(userFile);

    setMusicalKeys({ original: originalKey, user: userKey });

    // Get the duration of both files
    const originalDuration = await getAudioDuration(originalFile);
    const userDuration = await getAudioDuration(userFile);

    // Set maxDuration based on the longest file
    const maxFileDuration = Math.max(originalDuration, userDuration);
    setMaxDuration(maxFileDuration);

    const length = Math.min(originalPitch.length, userPitch.length);
    const analysisData = Array.from({ length }, (_, i) => ({
      name: formatTime(i, length, maxFileDuration), // Pass max duration
      original: originalPitch[i],
      user: userPitch[i],
    }));

    setAnalysisData(analysisData);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 relative">
      {/* Blue wave background animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <AnimatePresence>
        {!isStarted ? (
          // Initial screen with "Start" button
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
          >
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 text-center"
            >
              PitchPerfect
            </motion.h1>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button
                onClick={() => setIsStarted(true)}
                className="bg-white text-blue-600 hover:bg-blue-100 text-lg sm:text-xl py-3 px-6 rounded-full shadow-lg transform transition-all hover:scale-105"
              >
                Start
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          // Main upload and analysis screen
          <motion.div
            key="main-screen"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 py-8 sm:px-6 lg:px-8"
          >
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-center text-white"
            >
              Upload Your Songs
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base text-white/80">Upload Original Song</label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "original")}
                    className="mt-2 w-full text-sm sm:text-base bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-white/80">Upload Your Singing</label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileUpload(e, "user")}
                    className="mt-2 w-full text-sm sm:text-base bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg"
                  />
                </div>
                <Button
                  onClick={analyzeVoice}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-3 rounded-lg transform transition-all hover:scale-105"
                >
                  Analyze Voice
                </Button>
              </div>
            </motion.div>

            {musicalKeys && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-8 text-center"
              >
                <p className="text-lg text-white/90">🎵 <strong>Original Song Key:</strong> {musicalKeys.original}</p>
                <p className="text-lg text-white/90">🎤 <strong>Your Singing Key:</strong> {musicalKeys.user}</p>
              </motion.div>
            )}

            {analysisData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full max-w-4xl mt-8"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analysisData}>
                    <XAxis dataKey="name" stroke="#ffffff80" />
                    <YAxis
                      label={{ value: "Frequency (Hz)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "white" } }}
                      stroke="#ffffff80"
                    />
                    <Tooltip contentStyle={{ backgroundColor: "#1E3A8A", border: "none", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ color: "white" }} />
                    <Line type="monotone" dataKey="original" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="user" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wave animation styles */}
      <style jsx>{`
        .wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23003f8f'/%3E%3C/svg%3E");
          background-size: cover;
          animation: wave 10s infinite linear;
        }
        .wave1 {
          opacity: 0.7;
          animation-delay: -2s;
        }
        .wave2 {
          opacity: 0.5;
          animation-delay: -4s;
        }
        .wave3 {
          opacity: 0.3;
          animation-delay: -6s;
        }
        @keyframes wave {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}