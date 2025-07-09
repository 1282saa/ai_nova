import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLatestNews } from "../services/api";
import { LatestNewsResponse } from "../types";
import { containerVariants } from "../animations/pageAnimations";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import ChatInterface from "../components/chat/ChatInterface";
import ConciergeInterface from "../components/concierge/ConciergeInterface";
import Tab from "../components/home/Tab";
import NewsCard from "../components/home/NewsCard";
import IssueCard from "../components/home/IssueCard";
import KeywordTag from "../components/home/KeywordTag";

/**
 * 홈페이지 컴포넌트
 */
const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("홈");
  const [latestNewsData, setLatestNewsData] =
    useState<LatestNewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대화형 검색 상태
  const [showChatInterface, setShowChatInterface] = useState(false);

  useEffect(() => {
    const fetchLatestNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getLatestNews();
        setLatestNewsData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
        );
        // 개발 중 더미 데이터 사용 (이슈 랭킹 구조)
        setLatestNewsData({
          today_issues: [
            {
              rank: 1,
              title: "반도체 수출 증가",
              count: 42,
              related_news: ["cluster_001", "cluster_002"],
            },
            {
              rank: 2,
              title: "AI 스타트업 투자",
              count: 38,
              related_news: ["cluster_003", "cluster_004"],
            },
            {
              rank: 3,
              title: "디지털 금융 혁신",
              count: 25,
              related_news: ["cluster_005"],
            },
            {
              rank: 4,
              title: "탄소중립 정책",
              count: 20,
              related_news: ["cluster_006"],
            },
            {
              rank: 5,
              title: "K-콘텐츠 해외진출",
              count: 18,
              related_news: ["cluster_007"],
            },
          ],
          popular_keywords: [
            { rank: 1, keyword: "생성 AI", count: 1250, trend: "up" },
            { rank: 2, keyword: "ESG 경영", count: 980, trend: "up" },
            { rank: 3, keyword: "메타버스", count: 850, trend: "stable" },
            { rank: 4, keyword: "탄소중립", count: 720, trend: "up" },
            { rank: 5, keyword: "디지털전환", count: 680, trend: "stable" },
            { rank: 6, keyword: "비대면 금융", count: 550, trend: "down" },
            { rank: 7, keyword: "자동차 전동화", count: 480, trend: "up" },
          ],
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (!latestNewsData) {
      return <ErrorMessage message={error} />;
    }

    switch (activeTab) {
      case "홈":
        return (
          <motion.div
            key="home-concierge"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <ConciergeInterface />
          </motion.div>
        );
      case "최신 뉴스":
        return (
          <motion.div
            key="latest-news"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                서울경제 헤드라인
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                서울경제신문의 최신 헤드라인 뉴스를 실시간으로 확인하세요.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <iframe
                src="https://www.sedaily.com/News/HeadLine"
                title="서울경제 헤드라인 뉴스"
                className="w-full h-[600px] border-0"
                style={{
                  minHeight: "600px",
                }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  <a
                    href="https://www.sedaily.com/News/HeadLine"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-500 transition-colors"
                  >
                    서울경제신문에서 더 많은 뉴스 보기 →
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        );
      case "주요 이슈":
        return (
          <motion.div
            key="issues"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                이슈 랭킹
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                오늘 가장 주목받는 이슈들을 점수 순으로 보여드립니다.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {latestNewsData?.today_issues?.length > 0 ? (
                latestNewsData.today_issues.map((item, index) => (
                  <IssueCard key={item.topic_id || index} item={item} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <p>오늘의 주요 이슈를 불러오고 있습니다...</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      exit="hidden"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
            AI Nova
          </span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          빅카인즈 기반 스마트 뉴스 분석 플랫폼
        </p>
      </div>

      {/* 탭을 상단으로 이동 */}
      <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-12">
        <Tab
          key="홈"
          label="홈"
          isActive={activeTab === "홈"}
          onClick={() => setActiveTab("홈")}
        />
        <Tab
          key="최신 뉴스"
          label="최신 뉴스"
          isActive={activeTab === "최신 뉴스"}
          onClick={() => setActiveTab("최신 뉴스")}
        />
        <Tab
          key="주요 이슈"
          label="주요 이슈"
          isActive={activeTab === "주요 이슈"}
          onClick={() => setActiveTab("주요 이슈")}
        />
      </div>

      {/* 대화형 검색 인터페이스 */}
      <AnimatePresence>
        {showChatInterface && (
          <ChatInterface onClose={() => setShowChatInterface(false)} />
        )}
      </AnimatePresence>

      {/* 탭 컨텐츠 */}
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
    </motion.div>
  );
};

export default HomePage;
