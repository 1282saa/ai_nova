import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getConciergeStreamResponse,
  type ConciergeRequest,
  type ConciergeResponse,
  type ConciergeProgress,
  type ArticleReference,
  type CitationUsed,
} from "../../services/briefingApi";

const ConciergeInterface: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] =
    useState<ConciergeProgress | null>(null);
  const [finalResult, setFinalResult] = useState<ConciergeResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<
    "all" | "seoul_economic"
  >("all");

  // 참조 섹션으로 스크롤하기 위한 ref
  const referencesRef = useRef<HTMLDivElement>(null);

  // 툴팁 상태
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: ArticleReference | null;
    x: number;
    y: number;
  }>({
    show: false,
    content: null,
    x: 0,
    y: 0,
  });

  // 케로셀 상태 관리
  const [currentSlide, setCurrentSlide] = useState(0);
  const cardsPerView = 3; // 한 번에 3개씩 표시

  // 케로셀 네비게이션 함수
  const goToNextSlide = () => {
    if (finalResult?.references) {
      const maxSlides =
        Math.ceil(finalResult.references.length / cardsPerView) - 1;
      setCurrentSlide((prev) => (prev < maxSlides ? prev + 1 : 0));
    }
  };

  const goToPrevSlide = () => {
    if (finalResult?.references) {
      const maxSlides =
        Math.ceil(finalResult.references.length / cardsPerView) - 1;
      setCurrentSlide((prev) => (prev > 0 ? prev - 1 : maxSlides));
    }
  };

  const goToSlide = (slideIndex: number) => {
    if (finalResult?.references) {
      const maxSlides =
        Math.ceil(finalResult.references.length / cardsPerView) - 1;
      if (slideIndex >= 0 && slideIndex <= maxSlides) {
        setCurrentSlide(slideIndex);
      }
    }
  };

  // 새로운 결과가 나올 때 케로셀을 첫 번째 슬라이드로 리셋
  useEffect(() => {
    if (finalResult) {
      setCurrentSlide(0);
    }
  }, [finalResult]);

  // 전역 handleCitationClick 함수 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).handleCitationClick = (
        citationNumber: number,
        event?: MouseEvent
      ) => {
        if (!finalResult) return;

        const refIndex = citationNumber - 1;
        if (refIndex >= 0 && refIndex < finalResult.references.length) {
          const reference = finalResult.references[refIndex];

          // Ctrl/Cmd 키가 눌려있거나 중간 마우스 버튼인 경우 새 탭에서 열기
          const openInNewTab =
            event?.ctrlKey || event?.metaKey || event?.which === 2;

          // 원문 링크가 있으면 직접 이동
          if (reference.url && reference.url !== "#") {
            if (openInNewTab) {
              window.open(reference.url, "_blank", "noopener,noreferrer");
            } else {
              window.location.href = reference.url;
            }
          } else {
            // 원문 링크가 없으면 참고 기사 섹션으로 스크롤
            if (referencesRef.current) {
              referencesRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });

              // 해당 기사 카드 하이라이트 효과
              const articleCard = document.getElementById(
                `article-${citationNumber}`
              );
              if (articleCard) {
                articleCard.classList.add(
                  "ring-2",
                  "ring-primary-500",
                  "ring-opacity-75"
                );
                setTimeout(() => {
                  articleCard.classList.remove(
                    "ring-2",
                    "ring-primary-500",
                    "ring-opacity-75"
                  );
                }, 2000);
              }
            }
          }
        }
      };

      // 전역 호버 핸들러 설정
      (window as any).handleCitationHover = (
        citationNumber: number,
        event: MouseEvent,
        isEnter: boolean
      ) => {
        if (!finalResult || !isEnter) {
          setTooltip({ show: false, content: null, x: 0, y: 0 });
          return;
        }

        const refIndex = citationNumber - 1;
        if (refIndex >= 0 && refIndex < finalResult.references.length) {
          const reference = finalResult.references[refIndex];
          const rect = (event.target as HTMLElement).getBoundingClientRect();

          setTooltip({
            show: true,
            content: reference,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      };
    }

    // 컴포넌트 언마운트 시 전역 함수 정리
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).handleCitationClick;
        delete (window as any).handleCitationHover;
      }
    };
  }, [finalResult]);

  // 인용 번호 클릭 핸들러 (컴포넌트 내부용)
  const handleCitationClick = (citationNumber: number, event?: MouseEvent) => {
    (window as any).handleCitationClick?.(citationNumber, event);
  };

  // 실시간 인용번호 렌더링 함수 (개선된 버전)
  const renderTextWithCitations = (
    text: string,
    isStreaming: boolean = false
  ) => {
    if (!text) return "";

    // 이미 citation-badge가 포함된 텍스트라면 처리하지 않음 (중복 방지)
    if (text.includes("citation-badge")) {
      return text;
    }

    // 통합된 인용번호 패턴
    const citationPattern = /([.!?가-힣a-zA-Z])(\d{1,2})(?=\s|$|[.!?\n])/g;

    return text.replace(citationPattern, (match, prevChar, citationNum) => {
      const num = parseInt(citationNum);

      // 유효한 인용번호인지 확인 (1-10 범위, finalResult 존재)
      if (num >= 1 && num <= 10 && finalResult?.references) {
        const refIndex = num - 1;
        const reference = finalResult.references[refIndex];

        if (!reference) return match; // 참조가 없으면 변환하지 않음

        const hasUrl = reference.url && reference.url !== "#";

        return `${prevChar}<span 
          class="citation-badge inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 ml-1 shadow-lg hover:shadow-xl transform hover:scale-110 hover:-translate-y-0.5 border border-blue-400 ${
            hasUrl ? "hover:ring-2 hover:ring-blue-300" : ""
          }" 
          onclick="window.handleCitationClick?.(${num}, event)"
          onmouseenter="window.handleCitationHover?.(${num}, event, true)"
          onmouseleave="window.handleCitationHover?.(${num}, event, false)"
          title="${hasUrl ? "클릭하여 원문 보기" : "참조 기사 " + num}"
        >${num}</span>`;
      }

      // 유효하지 않은 인용번호는 그대로 유지
      return match;
    });
  };

  // 컴포넌트가 너무 크므로 기본 구조만 먼저 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setCurrentProgress(null);
    setFinalResult(null);
    setError(null);

    const request: ConciergeRequest = {
      question: query,
      max_articles: 10,
      include_related_keywords: true,
      include_today_issues: true,
      detail_level: "detailed",
      provider_filter: providerFilter,
    };

    try {
      await getConciergeStreamResponse(request, (progress) => {
        setCurrentProgress(progress);
        if (progress.result) {
          setFinalResult(progress.result);
        }
      });
    } catch (err: any) {
      console.error("컨시어지 오류:", err);
      setError(err.message || "답변 생성 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConversation = () => {
    setQuery("");
    setCurrentProgress(null);
    setFinalResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
          AI 뉴스 컨시어지
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          AI가 최신 뉴스를 분석하여 상세한 답변을 제공합니다
        </p>
      </motion.div>

      {/* 검색 입력 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8 backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="궁금한 뉴스나 주제에 대해 질문해보세요. 예: 삼성전자와 HBM 시장 경쟁력은?"
              className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all duration-300 text-lg leading-relaxed"
              rows={4}
              disabled={isProcessing}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {query.length}/500
            </div>
          </div>

          {/* 언론사 선택 탭 */}
          <div className="flex items-center space-x-4 px-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              언론사 선택:
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setProviderFilter("all")}
                disabled={isProcessing}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  providerFilter === "all"
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                전체 언론사
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter("seoul_economic")}
                disabled={isProcessing}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  providerFilter === "seoul_economic"
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                서울경제 전용
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex space-x-2">
                {["삼성전자 실적", "AI 반도체 동향", "코스피 전망"].map(
                  (example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setQuery(example)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {example}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {finalResult && (
                <button
                  type="button"
                  onClick={resetConversation}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                >
                  새 질문
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessing || !query.trim()}
                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>분석 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>질문하기</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* 오류 메시지 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">
                오류 발생
              </h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 진행 상황 표시 */}
      <AnimatePresence>
        {currentProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI 분석 진행 상황
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {providerFilter === "seoul_economic" ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      서울경제 전용 모드
                    </span>
                  ) : (
                    <span>전체 언론사 검색</span>
                  )}
                </div>
              </div>
              <div className="text-primary-600 dark:text-primary-400 font-semibold">
                {currentProgress.progress}%
              </div>
            </div>

            {/* 진행 바 */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress.progress}%` }}
              />
            </div>

            {/* 현재 상태 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {currentProgress.message}
                </span>
              </div>

              {currentProgress.extracted_keywords && (
                <div className="ml-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    추출된 키워드:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentProgress.extracted_keywords.map(
                      (keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 실시간 스트리밍 컨텐츠 */}
              {currentProgress.streaming_content && (
                <div className="ml-6 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    실시간 AI 응답:
                  </div>
                  <div
                    className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        renderTextWithCitations(
                          currentProgress.streaming_content,
                          true
                        ) +
                        '<span class="animate-pulse ml-1 text-blue-500">|</span>',
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 최종 결과 표시 */}
      <AnimatePresence>
        {finalResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8"
          >
            {/* 결과 헤더 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI 분석 결과
                </h2>
                <div className="text-sm">
                  {providerFilter === "seoul_economic" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      서울경제 전용
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      전체 언론사
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI 답변 내용 */}
            <div className="mb-8">
              <div
                className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: renderTextWithCitations(finalResult.answer),
                }}
              />
            </div>

            {/* 주요 포인트 */}
            {finalResult.key_points && finalResult.key_points.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                    🎯
                  </span>
                  주요 포인트
                </h4>
                <div className="grid gap-4">
                  {finalResult.key_points.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl border-l-4 border-primary-500"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white text-sm font-bold rounded-lg flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 연관 키워드 및 연관 질문 */}
            {(finalResult.related_keywords &&
              finalResult.related_keywords.length > 0) ||
            (finalResult.related_questions &&
              finalResult.related_questions.length > 0) ? (
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
                    🔗
                  </span>
                  연관 키워드 & 관련 질문
                </h4>

                {/* 연관 키워드 */}
                {finalResult.related_keywords &&
                  finalResult.related_keywords.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        연관 키워드
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {finalResult.related_keywords.map((keyword, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setQuery(keyword);
                              // 자동으로 검색 실행하지 않고 입력란에만 설정
                            }}
                            className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-700 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 연관 질문 */}
                {finalResult.related_questions &&
                  finalResult.related_questions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        관련 질문
                      </h5>
                      <div className="space-y-2">
                        {finalResult.related_questions.map(
                          (questionObj, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setQuery(questionObj.question);
                                // 바로 검색 실행
                                setTimeout(() => {
                                  const form = document.querySelector("form");
                                  if (form) {
                                    const submitEvent = new Event("submit", {
                                      bubbles: true,
                                      cancelable: true,
                                    });
                                    form.dispatchEvent(submitEvent);
                                  }
                                }, 100);
                              }}
                              className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:shadow-md hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 cursor-pointer border border-blue-200 dark:border-blue-700"
                            >
                              <div className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-0.5">❓</span>
                                <span className="flex-1 leading-relaxed">
                                  {questionObj.question}
                                </span>
                              </div>
                              {questionObj.keyword && (
                                <div className="mt-2 ml-6">
                                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                                    {questionObj.keyword}
                                  </span>
                                </div>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 참조 기사 */}
      {finalResult &&
        finalResult.references &&
        finalResult.references.length > 0 && (
          <div
            ref={referencesRef}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-3">
                📰
              </span>
              참조 기사 ({finalResult.references.length}개)
            </h3>

            {/* 케로셀 컨테이너 */}
            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${
                      currentSlide * (100 / cardsPerView)
                    }%)`,
                  }}
                >
                  {finalResult.references.map((ref, index) => (
                    <div
                      key={ref.ref_id}
                      id={`article-${index + 1}`}
                      className="flex-shrink-0 w-1/3 px-3"
                    >
                      <div
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-600"
                        onClick={() => handleCitationClick(index + 1)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
                            {index + 1}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-right bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                            관련도 {Math.round(ref.relevance_score * 100)}%
                          </div>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                          {ref.title}
                        </h4>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2 h-2 text-white"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                            <span className="font-medium">{ref.provider}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2 h-2 text-white"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                            <span>
                              {new Date(ref.published_at).toLocaleDateString(
                                "ko-KR"
                              )}
                            </span>
                          </div>
                        </div>

                        {ref.url && ref.url !== "#" && (
                          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center font-medium">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                              원문 보기
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 케로셀 네비게이션 */}
              {finalResult.references.length > cardsPerView && (
                <>
                  <button
                    onClick={goToPrevSlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-600 group"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={goToNextSlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 w-12 h-12 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-600 group"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* 슬라이드 인디케이터 */}
                  <div className="flex justify-center mt-8 space-x-2">
                    {Array.from({
                      length: Math.ceil(
                        finalResult.references.length / cardsPerView
                      ),
                    }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide
                            ? "bg-blue-500 w-8"
                            : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      {/* 분석 메타데이터 */}
      {finalResult && finalResult.analysis_metadata && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
              📊
            </span>
            분석 정보
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {finalResult.analysis_metadata.articles_analyzed || 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                분석 기사
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {finalResult.analysis_metadata.total_citations || 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                총 인용
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {finalResult.analysis_metadata.keywords_extracted || 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                추출 키워드
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {finalResult.analysis_metadata.processing_time_seconds || 0}s
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                처리 시간
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 툴팁 (각주 호버 시 기사 미리보기) */}
      <AnimatePresence>
        {tooltip.show && tooltip.content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translateX(-50%) translateY(-100%)",
              maxWidth: "400px",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
              {/* 툴팁 화살표 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
              </div>

              {/* 기사 정보 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    {tooltip.content.ref_id}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    관련도 {Math.round(tooltip.content.relevance_score * 100)}%
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">
                  {tooltip.content.title}
                </h4>

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {tooltip.content.provider}
                  </span>
                  <span>
                    {new Date(tooltip.content.published_at).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                </div>

                {tooltip.content.url && tooltip.content.url !== "#" && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center font-medium">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      클릭하여 원문 보기
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConciergeInterface;
