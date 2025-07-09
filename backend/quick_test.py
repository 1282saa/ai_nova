#!/usr/bin/env python3
"""
Quick Test - 키워드 추출 기능 간단 테스트
"""

# 직접 import로 경로 문제 해결
try:
    from services.news.kiwi_keyword_extractor import KiwiKeywordExtractor
    print("✅ Kiwi 추출기 import 성공")
    
    # 문제가 되었던 쿼리로 테스트
    test_query = "삼성전자와 HBM 반도체 상황"
    
    print(f"\n🔍 테스트 쿼리: {test_query}")
    print("=" * 50)
    
    # Kiwi 추출기 생성
    extractor = KiwiKeywordExtractor()
    
    # 키워드 추출
    keywords = extractor.extract_keywords(test_query)
    print(f"추출된 키워드: {keywords}")
    
    # 성공 여부 확인
    if 'HBM' in keywords and '삼성전자' in keywords:
        print("\n🎉 성공! HBM과 삼성전자가 모두 추출되었습니다!")
        print("✅ 조사 제거 기능 정상 동작")
        print("✅ 전문용어 사전 정상 동작")
    else:
        print(f"\n⚠️ 확인 필요:")
        print(f"HBM 추출: {'✅' if 'HBM' in keywords else '❌'}")
        print(f"삼성전자 추출: {'✅' if '삼성전자' in keywords else '❌'}")
    
    # 추가 테스트 케이스
    print(f"\n📝 추가 테스트:")
    test_cases = [
        "네이버의 AI 검색 서비스",
        "현대차 전기차 2024년 실적", 
        "ChatGPT와 카카오톡 연동"
    ]
    
    for query in test_cases:
        keywords = extractor.extract_keywords(query)
        print(f"'{query}' → {keywords}")

except ImportError as e:
    print(f"❌ Import 실패: {e}")
    print("Kiwi가 설치되지 않았거나 경로 문제입니다.")
    
except Exception as e:
    print(f"❌ 테스트 실패: {e}")
    import traceback
    traceback.print_exc()

print(f"\n🔚 테스트 완료") 