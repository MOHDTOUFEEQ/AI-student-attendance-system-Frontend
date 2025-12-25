import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Image() {
     const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);
  const [numStudents, setNumStudents] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  const [classroomId, setClassroomId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [lectureName, setLectureName] = useState("");
  const [totalExpected, setTotalExpected] = useState();
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleUpload = (e) => {
    const selected = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setFile(reader.result);
    reader.readAsDataURL(selected);
  };

  const handlePredict = async () => {
    if (!file) return alert("Please upload a classroom photo!");
    if (!classroomId || !moduleName || !lectureName)
      return alert("Please fill classroom details first!");

    setLoading(true);
    setAnimate(true); // start animation

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/predict_image`, {
        file,
      },
      {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      const detected = res.data.num_students;
      setOutput(res.data.output);
      setNumStudents(detected);

      await axios.post(`${import.meta.env.VITE_API_URL}/log_attendance`, {
        classroom_id: classroomId,
        module_name: moduleName,
        lecture_name: lectureName,
        num_students_detected: detected,
        total_students_expected: Number(totalExpected),
      },
      {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      fetchLogs();
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }

    setLoading(false);
    setTimeout(() => setAnimate(false), 1500); // stop animation after 1.5s
  };

  const handleSubmitClick = () => {
    // Show consent modal instead of directly submitting
    setConsentModalOpen(true);
    setConsentChecked(false); // Reset checkbox when modal opens
  };

  const handleConsentAgree = () => {
    if (consentChecked) {
      setConsentModalOpen(false);
      handlePredict();
    }
  };

  const handleConsentCancel = () => {
    setConsentModalOpen(false);
    setConsentChecked(false);
  };

  const handleModalOpenChange = (open) => {
    setConsentModalOpen(open);
    if (!open) {
      // Reset checkbox when modal closes (including clicking outside)
      setConsentChecked(false);
    }
  };

  const fetchLogs = async () => {
    if (classroomId) {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/get_logs/${classroomId}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        }
      );
      setLogs(res.data);
    }
  };

  useEffect(() => {
    if (classroomId) fetchLogs();
  }, [classroomId]);
  return (
    <div className="min-h-screen bg-white text-black  flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl"
      >
        <Card className="p-8 shadow-xl border border-gray-200 rounded-2xl bg-white">
          <h1 className="text-3xl font-bold mb-8 text-center tracking-tight">
            🎓 Image Attendance Detection
          </h1>

          {/* Input Section */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Classroom ID"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
            />
            <Input
              placeholder="Module Name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
            />
            <Input
              placeholder="Lecture Name"
              value={lectureName}
              onChange={(e) => setLectureName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Expected Students"
              value={totalExpected}
              onChange={(e) => setTotalExpected(e.target.value)}
            />
          </div>

          {/* Upload Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 
                         file:rounded-md file:border file:border-gray-300 
                         file:text-sm file:font-medium file:bg-gray-100 
                         hover:file:bg-gray-200 transition-all"
            />

            <Button
              onClick={handleSubmitClick}
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md transition-all"
            >
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </Button>
          </div>

          {/* Animation Section */}
          {animate && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{
                repeat: 2,
                repeatType: "mirror",
                duration: 0.4,
                ease: "easeInOut",
              }}
              className="text-center text-lg font-semibold text-gray-700 mb-4"
            >
              ⚙️ Processing image...
            </motion.div>
          )}

          {/* Results */}
          {output && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mt-6 text-center"
            >
              <h3 className="text-lg font-semibold mb-2">
                👥 Students Detected: {numStudents}
              </h3>
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                src={output}
                alt="Detected classroom"
                className="mt-4 rounded-lg shadow-md border border-gray-300 max-h-96 mx-auto"
              />
            </motion.div>
          )}

          <hr className="my-8 border-gray-300" />

          <h2 className="text-xl font-semibold mb-3 text-center">
            📋 Attendance Logs {classroomId && `for ${classroomId}`}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Module</th>
                  <th className="p-2 border">Lecture</th>
                  <th className="p-2 border">Detected</th>
                  <th className="p-2 border">Expected</th>
                  <th className="p-2 border">Absent</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <tr key={i} className="text-center border-t">
                      <td className="p-2 border">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 border">{log.module_name}</td>
                      <td className="p-2 border">{log.lecture_name}</td>
                      <td className="p-2 border">{log.num_students_detected}</td>
                      <td className="p-2 border">{log.total_students_expected}</td>
                      <td className="p-2 border text-red-600 font-semibold">
                        {log.absent_students}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4 text-gray-500 italic"
                    >
                      No logs found. Upload and analyze to see results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Consent Modal */}
      <Dialog open={consentModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Consent Agreement</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                By clicking "I Agree", you confirm that you are voluntarily providing your image for the purpose of attendance monitoring. You acknowledge and consent that your image may be collected, processed, and securely stored in the system database.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                All stored images are encrypted and handled in accordance with applicable data protection laws and institutional privacy policies. The collected data will be used solely for academic and attendance-related purposes and will not be shared with any unauthorized third parties.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                If you do not agree to these terms, please cancel the operation.
              </p>
              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                />
                <label
                  htmlFor="consent-checkbox"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  I have read and agree to the terms above.
                </label>
              </div>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleConsentCancel}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsentAgree}
              disabled={!consentChecked}
              className="bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              I Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Image
