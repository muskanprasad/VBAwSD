// src/components/audio/AudioRecorder.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Props:
 *  - onRecordingComplete(wavBlob)
 *  - OR onRecorded(wavBlob)
 *  - disabled: boolean
 */

const AudioRecorder = ({ onRecordingComplete, onRecorded, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const callback = onRecordingComplete || onRecorded || null;

  /* ---------------------------------------
      WAV CONVERSION + RESAMPLING (16kHz)
     --------------------------------------- */

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Convert Float32 → PCM16 WAV bytes
  function encodeWav(audioBuffer) {
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = 1;

    const dataLength = samples.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  // Resample to 16kHz using OfflineAudioContext
  async function to16kWav(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);

    const TARGET_SR = 16000;

    const offline = new OfflineAudioContext(
      1,
      decoded.duration * TARGET_SR,
      TARGET_SR
    );

    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start(0);

    const rendered = await offline.startRendering();
    return encodeWav(rendered);
  }

  /* ---------------------------------------
               RECORDING CONTROL
     --------------------------------------- */

  const startRecording = async () => {
    if (disabled || isRecording) return;

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        try {
          const webmBlob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];

          if (!callback) return;

          const wav16k = await to16kWav(webmBlob);

          console.log("[DEBUG] Final WAV size:", wav16k.size);

          callback(wav16k);
        } catch (err) {
          console.error("WAV conversion error:", err);
          setError("Error converting audio to WAV");
        } finally {
          try {
            mr.stream.getTracks().forEach((t) => t.stop());
          } catch (_) {}
          setIsRecording(false);
        }
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      setError("Could not access microphone");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stream
            ?.getTracks()
            .forEach((t) => t.stop());
        } catch (_) {}
      }
    };
  }, []);

  const handleButtonClick = () => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const hintText = disabled
    ? "Recording is disabled while an operation is in progress."
    : isRecording
    ? "Recording… Speak clearly for 2–4 seconds in a quiet place."
    : "Tap to start a new recording. Recommended length: 2–4 seconds.";

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Start / Stop button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0.9rem 1.6rem",
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          border: "none",
          transition: "all 0.2s ease",
          transform: isRecording ? "scale(1.05)" : "scale(1)",

          // BUTTON COLOR LOGIC
          background: isRecording
            ? "rgba(239,68,68,0.85)" // recording red
            : document.documentElement.getAttribute("data-theme") === "light"
            ? "linear-gradient(135deg,#6366f1,#8b5cf6)" // light mode purple
            : "linear-gradient(135deg,#4f46e5,#7c3aed)", // dark mode violet

          color: "#ffffff",
          boxShadow: isRecording
            ? "0 0 0 8px rgba(239,68,68,0.25)"
            : "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        {isRecording ? "Stop recording" : "Start recording"}
      </button>

      {/* Helper / hint text */}
      <div
        style={{
          marginTop: "0.6rem",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          lineHeight: 1.4,
        }}
      >
        {hintText}
      </div>

      {/* Error text */}
      {error && (
        <div
          style={{
            color: "#dc2626",
            marginTop: "0.65rem",
            fontSize: "0.8rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
