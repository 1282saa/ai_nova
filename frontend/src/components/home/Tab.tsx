import React from "react";
import { motion } from "framer-motion";
import { TabProps } from "../../types";

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    role="tab"
    aria-selected={isActive}
    aria-controls={`tabpanel-${label.replace(/\s+/g, "-").toLowerCase()}`}
    className={`relative px-4 sm:px-6 py-3 font-medium transition-all duration-300 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      isActive
        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`}
  >
    {label}
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

export default Tab;
