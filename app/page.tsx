"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "search" | "calendar";
type Category = "IT·데이터" | "어학" | "공기업·공무원" | "금융·회계" | "디자인";

type Certificate = {
  id: number;
  name: string;
  shortName: string;
  category: Category;
  provider: string;
  level: string;
  applyStart: Date;
  applyEnd: Date;
  examDate: Date;
};

const DAY = 86_400_000;
const DEFAULT_SELECTED = [1, 3, 5];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatShort(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatRange(start: Date, end: Date) {
  return `${formatShort(start)} – ${formatShort(end)}`;
}

function buildCertificates(today: Date): Certificate[] {
  return [
    {
      id: 1,
      name: "정보처리기사",
      shortName: "정보처리",
      category: "IT·데이터",
      provider: "한국산업인력공단",
      level: "기사",
      applyStart: addDays(today, 2),
      applyEnd: addDays(today, 5),
      examDate: addDays(today, 34),
    },
    {
      id: 2,
      name: "한국사능력검정시험",
      shortName: "한국사",
      category: "공기업·공무원",
      provider: "국사편찬위원회",
      level: "심화",
      applyStart: addDays(today, 5),
      applyEnd: addDays(today, 9),
      examDate: addDays(today, 28),
    },
    {
      id: 3,
      name: "TOEIC",
      shortName: "TOEIC",
      category: "어학",
      provider: "YBM 한국TOEIC위원회",
      level: "정기시험",
      applyStart: addDays(today, -3),
      applyEnd: addDays(today, 6),
      examDate: addDays(today, 18),
    },
    {
      id: 4,
      name: "컴퓨터활용능력 1급",
      shortName: "컴활 1급",
      category: "IT·데이터",
      provider: "대한상공회의소",
      level: "1급",
      applyStart: addDays(today, 8),
      applyEnd: addDays(today, 13),
      examDate: addDays(today, 40),
    },
    {
      id: 5,
      name: "ADsP 데이터분석 준전문가",
      shortName: "ADsP",
      category: "IT·데이터",
      provider: "한국데이터산업진흥원",
      level: "준전문가",
      applyStart: addDays(today, 12),
      applyEnd: addDays(today, 16),
      examDate: addDays(today, 52),
    },
    {
      id: 6,
      name: "전산회계 1급",
      shortName: "전산회계",
      category: "금융·회계",
      provider: "한국세무사회",
      level: "1급",
      applyStart: addDays(today, 18),
      applyEnd: addDays(today, 23),
      examDate: addDays(today, 61),
    },
    {
      id: 7,
      name: "GTQ 그래픽기술자격",
      shortName: "GTQ",
      category: "디자인",
      provider: "한국생산성본부",
      level: "1급",
      applyStart: addDays(today, 22),
      applyEnd: addDays(today, 29),
      examDate: addDays(today, 68),
    },
    {
      id: 8,
      name: "KBS한국어능력시험",
      shortName: "KBS한국어",
      category: "공기업·공무원",
      provider: "KBS한국어진흥원",
      level: "정기시험",
      applyStart: addDays(today, 28),
      applyEnd: addDays(today, 35),
      examDate: addDays(today, 74),
    },
  ];
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true">✓</span>;
}

function CalendarIcon() {
  return <span aria-hidden="true">▦</span>;
}

function SearchIcon() {
  return <span aria-hidden="true">⌕</span>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [today] = useState(() => startOfDay(new Date()));
  const [selectedIds, setSelectedIds] = useState<number[]>(DEFAULT_SELECTED);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체 분야");
  const [status, setStatus] = useState("전체 일정");
  const [provider, setProvider] = useState("전체 주관처");
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [toast, setToast] = useState("");

  const certificates = useMemo(() => buildCertificates(today), [today]);

  useEffect(() => {
    const saved = window.localStorage.getItem("jagyeok-route-selected");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSelectedIds(parsed);
      } catch {
        window.localStorage.removeItem("jagyeok-route-selected");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("jagyeok-route-selected", JSON.stringify(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = certificates.filter((item) => selectedIds.includes(item.id));
  const countdown = [...selected]
    .filter((item) => daysBetween(today, item.examDate) >= 0)
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .slice(0, 3);

  const upcoming = [...certificates]
    .filter((item) => daysBetween(today, item.applyStart) >= 0)
    .sort((a, b) => a.applyStart.getTime() - b.applyStart.getTime())
    .slice(0, 4);

  const providers = [...new Set(certificates.map((item) => item.provider))];
  const filtered = certificates.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.provider.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "전체 분야" || item.category === category;
    const matchesProvider = provider === "전체 주관처" || item.provider === provider;
    const applyDays = daysBetween(today, item.applyStart);
    const isOpen = applyDays <= 0 && daysBetween(today, item.applyEnd) >= 0;
    const matchesStatus =
      status === "전체 일정" ||
      (status === "접수 중" && isOpen) ||
      (status === "접수 예정" && applyDays > 0);
    return matchesQuery && matchesCategory && matchesProvider && matchesStatus;
  });

  function toggleCertificate(item: Certificate) {
    const isSelected = selectedIds.includes(item.id);
    setSelectedIds((current) =>
      isSelected ? current.filter((id) => id !== item.id) : [...current, item.id],
    );
    setToast(
      isSelected
        ? `${item.name} 일정을 캘린더에서 삭제했어요.`
        : `${item.name} 일정을 캘린더에 추가했어요.`,
    );
  }

  function moveMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setTab("home")} aria-label="자격루트 홈">
          <BrandMark />
          <span>자격루트</span>
        </button>
        <nav className="main-nav" aria-label="주요 메뉴">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>
            홈
          </button>
          <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
            자격증 일정 검색
          </button>
          <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
            내 캘린더
          </button>
        </nav>
        <div className="header-actions">
          <span className="demo-badge">데모 데이터</span>
          <button className="calendar-count" onClick={() => setTab("calendar")}>
            <CalendarIcon /> 내 일정 <b>{selectedIds.length}</b>
          </button>
        </div>
      </header>

      <div className="page-wrap">
        {tab === "home" && (
          <section className="page home-page" aria-labelledby="home-title">
            <div className="eyebrow">
              {new Intl.DateTimeFormat("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              }).format(today)}
            </div>

            <div className="welcome-row">
              <div>
                <h1 id="home-title">오늘도 한 걸음,<br />합격에 가까워지고 있어요.</h1>
                <p>접수부터 시험일까지 중요한 일정을 한눈에 챙겨보세요.</p>
              </div>
              <button className="primary-button" onClick={() => setTab("search")}>
                <SearchIcon /> 자격증 찾아보기
              </button>
            </div>

            <div className="home-grid">
              <section className="panel upcoming-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">UP NEXT</span>
                    <h2>곧 접수가 시작돼요</h2>
                  </div>
                  <button className="text-button" onClick={() => setTab("search")}>전체 일정 보기 →</button>
                </div>
                <div className="upcoming-list">
                  {upcoming.map((item, index) => {
                    const dday = daysBetween(today, item.applyStart);
                    return (
                      <article className="upcoming-item" key={item.id}>
                        <div className="date-tile">
                          <span>{item.applyStart.toLocaleDateString("ko-KR", { month: "short" })}</span>
                          <b>{item.applyStart.getDate()}</b>
                        </div>
                        <div className="item-main">
                          <div className="item-topline">
                            <span className="category-tag">{item.category}</span>
                            {index === 0 && <span className="hot-tag">가장 가까워요</span>}
                          </div>
                          <h3>{item.name}</h3>
                          <p>{item.provider} · {item.level}</p>
                        </div>
                        <div className="item-side">
                          <span className="dday blue">D-{dday}</span>
                          <small>{formatRange(item.applyStart, item.applyEnd)}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="panel countdown-panel">
                <div className="panel-heading compact">
                  <div>
                    <span className="section-kicker green-text">MY PLAN</span>
                    <h2>시험까지 얼마 안 남았어요</h2>
                  </div>
                  <button className="icon-button" onClick={() => setTab("calendar")} aria-label="내 캘린더 열기">→</button>
                </div>
                <div className="countdown-list">
                  {countdown.map((item, index) => {
                    const remaining = daysBetween(today, item.examDate);
                    return (
                      <article className="countdown-item" key={item.id}>
                        <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                        <div>
                          <h3>{item.name}</h3>
                          <p>시험일 · {formatShort(item.examDate)}</p>
                        </div>
                        <b>D-{remaining}</b>
                      </article>
                    );
                  })}
                </div>
                <div className="plan-summary">
                  <div className="mini-calendar"><CalendarIcon /></div>
                  <p><b>{selectedIds.length}개의 자격증</b><br />일정을 관리하고 있어요</p>
                  <button onClick={() => setTab("calendar")}>캘린더 보기</button>
                </div>
              </aside>
            </div>

            <div className="tip-strip">
              <span aria-hidden="true">✦</span>
              <p><b>오늘의 체크</b> 관심 자격증을 캘린더에 추가하면 접수 기간과 시험일을 함께 볼 수 있어요.</p>
              <button onClick={() => setTab("search")}>일정 추가하기 →</button>
            </div>
          </section>
        )}

        {tab === "search" && (
          <section className="page search-page" aria-labelledby="search-title">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">CERTIFICATE FINDER</span>
                <h1 id="search-title">자격증 일정 검색</h1>
                <p>관심 있는 자격증을 찾고 내 캘린더에 바로 담아보세요.</p>
              </div>
              <div className="saved-stat">
                <span>내 캘린더</span>
                <b>{selectedIds.length}</b>
                <small>개 일정</small>
              </div>
            </div>

            <div className="search-box">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="자격증명 또는 주관처를 검색해보세요"
                aria-label="자격증 검색"
              />
              {query && <button onClick={() => setQuery("")} aria-label="검색어 지우기">×</button>}
            </div>

            <div className="filter-bar" aria-label="검색 필터">
              <span className="filter-label">필터</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="분야">
                <option>전체 분야</option>
                <option>IT·데이터</option>
                <option>어학</option>
                <option>공기업·공무원</option>
                <option>금융·회계</option>
                <option>디자인</option>
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="일정 상태">
                <option>전체 일정</option>
                <option>접수 중</option>
                <option>접수 예정</option>
              </select>
              <select value={provider} onChange={(event) => setProvider(event.target.value)} aria-label="주관처">
                <option>전체 주관처</option>
                {providers.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button
                className="reset-button"
                onClick={() => {
                  setCategory("전체 분야");
                  setStatus("전체 일정");
                  setProvider("전체 주관처");
                  setQuery("");
                }}
              >
                초기화
              </button>
            </div>

            <div className="results-heading">
              <h2>검색 결과 <span>{filtered.length}</span></h2>
              <p>일정은 서비스 흐름을 보여주기 위한 데모 데이터입니다.</p>
            </div>

            <div className="certificate-list">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const applyDays = daysBetween(today, item.applyStart);
                const isOpen = applyDays <= 0 && daysBetween(today, item.applyEnd) >= 0;
                return (
                  <article className={`certificate-card ${isSelected ? "selected" : ""}`} key={item.id}>
                    <div className="certificate-letter">{item.name.slice(0, 1)}</div>
                    <div className="certificate-info">
                      <div className="card-tags">
                        <span>{item.category}</span>
                        <span>{item.level}</span>
                        {isOpen && <span className="open-tag">접수 중</span>}
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.provider}</p>
                    </div>
                    <div className="schedule-pair">
                      <div>
                        <span className="legend-dot blue-dot" />
                        <p>접수 기간</p>
                        <b>{formatRange(item.applyStart, item.applyEnd)}</b>
                      </div>
                      <div>
                        <span className="legend-dot green-dot" />
                        <p>시험일</p>
                        <b>{formatShort(item.examDate)}</b>
                      </div>
                    </div>
                    <button
                      className={`save-button ${isSelected ? "saved" : ""}`}
                      onClick={() => toggleCertificate(item)}
                    >
                      {isSelected ? "✓ 추가됨" : "+ 캘린더 추가"}
                    </button>
                  </article>
                );
              })}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <span>⌕</span>
                  <h3>조건에 맞는 자격증이 없어요</h3>
                  <p>검색어나 필터를 바꿔 다시 찾아보세요.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "calendar" && (
          <CalendarPage
            month={month}
            today={today}
            selected={selected}
            onMoveMonth={moveMonth}
            onResetMonth={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            onSearch={() => setTab("search")}
            onRemove={toggleCertificate}
          />
        )}
      </div>

      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>
          <span>⌂</span>홈
        </button>
        <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
          <span>⌕</span>일정 검색
        </button>
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
          <span>▦</span>내 캘린더
        </button>
      </nav>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        <span>✓</span>{toast}
      </div>
    </main>
  );
}

function CalendarPage({
  month,
  today,
  selected,
  onMoveMonth,
  onResetMonth,
  onSearch,
  onRemove,
}: {
  month: Date;
  today: Date;
  selected: Certificate[];
  onMoveMonth: (delta: number) => void;
  onResetMonth: () => void;
  onSearch: () => void;
  onRemove: (item: Certificate) => void;
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: Date[] = [];
  for (let i = firstDay.getDay(); i > 0; i -= 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), 1 - i));
  }
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1];
    cells.push(addDays(last, 1));
  }

  return (
    <section className="page calendar-page" aria-labelledby="calendar-title">
      <div className="calendar-title-row">
        <div>
          <span className="section-kicker">MY CALENDAR</span>
          <h1 id="calendar-title">내 캘린더</h1>
          <p>등록한 자격증의 접수 기간과 시험일을 모아봤어요.</p>
        </div>
        <div className="calendar-legend">
          <span><i className="legend-dot blue-dot" />접수 기간</span>
          <span><i className="legend-dot green-dot" />시험일</span>
          <button onClick={onSearch}>+ 일정 추가</button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="panel calendar-panel">
          <div className="calendar-toolbar">
            <button onClick={() => onMoveMonth(-1)} aria-label="이전 달">‹</button>
            <h2>{month.getFullYear()}년 {month.getMonth() + 1}월</h2>
            <button onClick={() => onMoveMonth(1)} aria-label="다음 달">›</button>
            <button className="today-button" onClick={onResetMonth}>오늘</button>
          </div>
          <div className="calendar-grid weekday-row" aria-hidden="true">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid days-grid">
            {cells.map((day) => {
              const inMonth = day.getMonth() === month.getMonth();
              const events = selected.flatMap((item) => {
                const list: { type: "apply" | "exam"; label: string; item: Certificate }[] = [];
                const inApplyRange =
                  day.getTime() >= startOfDay(item.applyStart).getTime() &&
                  day.getTime() <= startOfDay(item.applyEnd).getTime();
                if (inApplyRange) {
                  list.push({
                    type: "apply",
                    label: sameDay(day, item.applyStart) ? `${item.shortName} 접수` : item.shortName,
                    item,
                  });
                }
                if (sameDay(day, item.examDate)) {
                  list.push({ type: "exam", label: `${item.shortName} 시험`, item });
                }
                return list;
              });
              return (
                <div
                  className={`calendar-day ${inMonth ? "" : "outside"} ${sameDay(day, today) ? "today" : ""}`}
                  key={dateKey(day)}
                >
                  <span className="day-number">{day.getDate()}</span>
                  <div className="day-events">
                    {events.slice(0, 3).map((event, index) => (
                      <span className={`calendar-event ${event.type}`} key={`${event.item.id}-${event.type}-${index}`}>
                        {event.label}
                      </span>
                    ))}
                    {events.length > 3 && <small>+{events.length - 3}개</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="panel my-list-panel">
          <div className="panel-heading compact">
            <div>
              <span className="section-kicker green-text">SAVED</span>
              <h2>등록한 자격증</h2>
            </div>
            <span className="list-count">{selected.length}</span>
          </div>
          <div className="my-calendar-list">
            {[...selected]
              .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
              .map((item) => (
                <article key={item.id}>
                  <div className="list-color" />
                  <div>
                    <h3>{item.name}</h3>
                    <p><span className="legend-dot blue-dot" />{formatRange(item.applyStart, item.applyEnd)}</p>
                    <p><span className="legend-dot green-dot" />{formatShort(item.examDate)} 시험</p>
                  </div>
                  <button onClick={() => onRemove(item)} aria-label={`${item.name} 삭제`}>×</button>
                </article>
              ))}
            {selected.length === 0 && (
              <div className="empty-mini">
                <span>▦</span>
                <h3>등록된 일정이 없어요</h3>
                <p>관심 자격증을 추가해보세요.</p>
                <button onClick={onSearch}>자격증 찾기</button>
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <button className="outline-button" onClick={onSearch}>+ 다른 자격증 추가하기</button>
          )}
        </aside>
      </div>
    </section>
  );
}
