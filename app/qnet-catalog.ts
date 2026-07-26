export type QnetCatalogItem = {
  jmCd: string;
  name: string;
  shortName: string;
  category: string;
  level: string;
};

export const QNET_CATALOG: QnetCatalogItem[] = [
  { jmCd: "1320", name: "정보처리기사", shortName: "정보처리", category: "IT·정보통신", level: "기사" },
  { jmCd: "1150", name: "전기기사", shortName: "전기기사", category: "전기·전자", level: "기사" },
  { jmCd: "1431", name: "산업안전기사", shortName: "산업안전", category: "안전관리", level: "기사" },
  { jmCd: "1630", name: "건축기사", shortName: "건축기사", category: "건설", level: "기사" },
  { jmCd: "1250", name: "토목기사", shortName: "토목기사", category: "건설", level: "기사" },
  { jmCd: "1021", name: "일반기계기사", shortName: "일반기계", category: "기계·재료", level: "기사" },
  { jmCd: "1910", name: "소방설비기사(전기분야)", shortName: "소방설비", category: "안전관리", level: "기사" },
  { jmCd: "2121", name: "위험물산업기사", shortName: "위험물", category: "안전관리", level: "산업기사" },
  { jmCd: "1982", name: "컬러리스트기사", shortName: "컬러리스트", category: "디자인", level: "기사" },
];
