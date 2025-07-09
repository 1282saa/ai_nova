import React from "react";
import { motion } from "framer-motion";
import { PopularKeyword } from "../../types";
import { itemVariants } from "../../animations/pageAnimations";

interface KeywordTagProps {
  item: PopularKeyword;
}

const KeywordTag: React.FC<KeywordTagProps> = ({ item }) => {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "new":
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
      case "down":
        return "from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      case "new":
        return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
      default:
        return "from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300";
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        scale: 1.05,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{ scale: 0.95 }}
      className={`group relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 cursor-pointer border ${getTrendColor(
        item.trend
      )}`}
    >
      {getTrendIcon(item.trend)}
      <span className="font-semibold text-sm">{item.keyword}</span>
    </motion.div>
  );
};

export default KeywordTag;
