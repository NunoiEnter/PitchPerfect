import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as Tone from "tone";
import Meyda from "meyda";

export default function PitchPerfect() {
  const [originalFile, setOriginalFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (type === "original") setOriginalFile(file);
    else setUserFile(file);
  };

  const extractPitch = async (file) => {
    return new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume AudioContext if it's suspended
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const audioBuffer = await audioContext.decodeAudioData(reader.result);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Meyda Analyzer
        const pitchData = [];
        const meydaAnalyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 512,
          featureExtractors: ["chroma"], // Use "chroma" instead of "pitch"
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
        }, 3000); // Analyze for 3 seconds
      };
    });
  };

  const analyzeVoice = async () => {
    if (!originalFile || !userFile) {
      alert("Please upload both audio files first.");
      return;
    }

    const originalPitch = await extractPitch(originalFile);
    const userPitch = await extractPitch(userFile);

    // Ensure we have the same data length
    const length = Math.min(originalPitch.length, userPitch.length);
    const analysisData = Array.from({ length }, (_, i) => ({
      name: `Time ${i}`,
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
      {analysisData && (
        <div className="mt-8 w-full max-w-xs sm:max-w-md md:max-w-2xl px-2">
          <h2 className="text-lg sm:text-xl mb-4 text-center">Voice Analysis</h2>
          <div className="w-full h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisData}>
                <XAxis dataKey="name" stroke="#ccc" tick={{ fontSize: "12px" }} />
                <YAxis stroke="#ccc" tick={{ fontSize: "12px" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="original" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="user" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}