import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as Tone from "tone";
import Meyda from "meyda";

export default function PitchPerfect() {
  const [originalFile, setOriginalFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [musicalKeys, setMusicalKeys] = useState(null);
  const [maxDuration, setMaxDuration] = useState(0);

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
              const avgPitch = features.chroma.reduce((sum, val) => sum + val, 0) / features.chroma.length;
              pitchData.push(avgPitch);
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


  const detectKey = (chroma) => {
    const keys = [
      "C Major", "C# Major", "D Major", "D# Major", "E Major", "F Major",
      "F# Major", "G Major", "G# Major", "A Major", "A# Major", "B Major"
    ];
    const maxIndex = chroma.indexOf(Math.max(...chroma));
    return keys[maxIndex];
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
    <div className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 text-center">PitchPerfect</h1>

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm sm:text-base">Upload Original Song</label>
            <Input type="file" onChange={(e) => handleFileUpload(e, "original")} className="mt-2 w-full text-sm sm:text-base" />
          </div>
          <div>
            <label className="block text-sm sm:text-base">Upload Your Singing</label>
            <Input type="file" onChange={(e) => handleFileUpload(e, "user")} className="mt-2 w-full text-sm sm:text-base" />
          </div>
          <Button onClick={analyzeVoice} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-3">
            Analyze Voice
          </Button>
        </div>
      </div>

      {musicalKeys && (
        <div className="mt-4 text-center">
          <p className="text-lg">🎵 <strong>Original Song Key:</strong> {musicalKeys.original}</p>
          <p className="text-lg">🎤 <strong>Your Singing Key:</strong> {musicalKeys.user}</p>
        </div>
      )}

      {analysisData && (
        <ResponsiveContainer width="80%" height={300} className="mt-6">
          <LineChart data={analysisData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="original" stroke="#8884d8" />
            <Line type="monotone" dataKey="user" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
