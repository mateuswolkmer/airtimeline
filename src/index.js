import React from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import { motion } from "motion/react";

function App() {
  return (
    <div>
      <motion.h2 drag className="text-2xl font-bold">
        Good luck with your assignment! {"\u2728"}
      </motion.h2>
      <motion.h3>{timelineItems.length} timeline items to render</motion.h3>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
