import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IssueTopic } from "../../types";
import { itemVariants } from "../../animations/pageAnimations";

interface IssueCardProps {
  item: IssueTopic;
}

const IssueCard: React.FC<IssueCardProps> = ({ item }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700"
      whileHover={{
        y: -2,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* 랭킹 배지 */}
      <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {item.rank}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="pt-20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {item.title || item.topic_name}
            </h3>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
              {item.count}건
            </span>
          </div>
        </div>

        {/* 상세 정보 토글 버튼 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            뉴스 기사 {item.count}개 수집됨
          </span>
          <button className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
            {showDetails ? (
              <>
                접기
                <svg
                  className="w-4 h-4 ml-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                언론사별 보기
                <svg
                  className="w-4 h-4 ml-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* 언론사별 breakdown (토글) */}
        <AnimatePresence>
          {showDetails &&
            item.provider_breakdown &&
            item.provider_breakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-primary-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  언론사별 보도 현황
                </h4>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {item.provider_breakdown?.map(
                    (provider: any, index: number) => (
                      <motion.div
                        key={provider.provider_code}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                          {provider.provider}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                            {provider.count}건
                          </span>
                          <div className="w-12 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  (provider.count /
                                    Math.max(
                                      ...(item.provider_breakdown?.map(
                                        (p: any) => p.count
                                      ) || [1])
                                    )) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default IssueCard;
