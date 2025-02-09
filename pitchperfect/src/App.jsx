import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PropTypes from 'prop-types';

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export function CardContent({ children }) {
  return <div className="space-y-4">{children}</div>;
}

CardContent.propTypes = {
  children: PropTypes.node.isRequired
};

export default function PitchPerfect() {
  // eslint-disable-next-line no-unused-vars
  const [originalFile, setOriginalFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userFile, setUserFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (type === "original") setOriginalFile(file);
    else setUserFile(file);
  };

  const analyzeVoice = () => {
    setAnalysisData([
      { name: "Start", original: 220, user: 200 },
      { name: "Mid", original: 250, user: 240 },
      { name: "End", original: 230, user: 225 },
    ]);
  };

  return (
    <div className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 text-center">PitchPerfect</h1>
      
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gray-800 rounded-2xl shadow-lg">
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base">Upload Original Song</label>
              <Input 
                type="file" 
                onChange={(e) => handleFileUpload(e, "original")} 
                className="mt-2 w-full text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base">Upload Your Singing</label>
              <Input 
                type="file" 
                onChange={(e) => handleFileUpload(e, "user")} 
                className="mt-2 w-full text-sm sm:text-base"
              />
            </div>
            <Button 
              onClick={analyzeVoice} 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-3"
            >
              Analyze Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisData && (
        <div className="mt-8 w-full max-w-xs sm:max-w-md md:max-w-2xl px-2">
          <h2 className="text-lg sm:text-xl mb-4 text-center">Voice Analysis</h2>
          <div className="w-full h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#ccc"
                  tick={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#ccc"
                  tick={{ fontSize: '12px' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="original" 
                  stroke="#8884d8"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="user" 
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}