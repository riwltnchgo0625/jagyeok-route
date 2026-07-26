"use client";

import { useEffect, useMemo, useState } from "react";
import { QNET_CATALOG } from "./qnet-catalog";

type Tab = "home" | "search" | "calendar";
type LoadStatus = "loading" | "ready" | "configuration_required" | "error";

type ApiSchedule = {
  id: string;
  jmCd: string;
  name: string;
  shortName: string;
  category: string;
  provider: string;
  level: string;
  phase: string;
  year: number;
  round: string;
  applyStart: string;
  applyEnd: string;
  examDate: string;
  examEndDate: string;
  resultDate: string | null;
  sourceUrl: string;
};

type Schedule = Omit<ApiSchedule, "applyStart" | "applyEnd" | "examDate" | "examEndDate" | "resultDate"> & {
  applyStart: Date;
  applyEnd: Date;
  examDate: Date;
  examEndDate: Date;
  resultDate: Date | null;
};

const DAY = 86_400_000;
const STORAGE_KEY = "jagyeok-route-qnet-selected";

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
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShort(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(date);
}

function formatRange(start: Date, end: Date) {
  return `${formatShort(start)} – ${formatShort(end)}`;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체 분야");
  const [status, setStatus] = useState("전체 일정");
  const [phase, setPhase] = useState("필기·실기 전체");
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedIds(parsed.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSchedules() {
      try {
        const response = await fetch(`/api/qnet?year=${today.getFullYear()}`);
        const payload = await response.json() as {
          status?: string;
          schedules?: ApiSchedule[];
          updatedAt?: string;
        };
        if (!active) return;
        if (payload.status === "configuration_required") {
          setLoadStatus("configuration_required");
          return;
        }
        if (!response.ok || payload.status !== "ok") {
          setLoadStatus("error");
          return;
        }
        const parsed = (payload.schedules ?? []).map((item) => ({
          ...item,
          applyStart: parseDate(item.applyStart),
          applyEnd: parseDate(item.applyEnd),
          examDate: parseDate(item.examDate),
          examEndDate: parseDate(item.examEndDate),
          resultDate: item.resultDate ? parseDate(item.resultDate) : null,
        }));
        setSchedules(parsed);
        setUpdatedAt(payload.updatedAt ? new Date(payload.updatedAt) : new Date());
        setLoadStatus("ready");
      } catch {
        if (active) setLoadStatus("error");
      }
    }
    void loadSchedules();
    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = schedules.filter((item) => selectedIds.includes(item.id));
  const upcoming = [...schedules]
    .filter((item) => daysBetween(today, item.applyEnd) >= 0)
    .sort((a, b) => a.applyStart.getTime() - b.applyStart.getTime())
    .slice(0, 4);
  const countdown = [...selected]
    .filter((item) => daysBetween(today, item.examDate) >= 0)
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .slice(0, 3);

  const categories = [...new Set(QNET_CATALOG.map((item) => item.category))];
  const filtered = schedules.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery);
    const matchesCategory = category === "전체 분야" || item.category === category;
    const matchesPhase = phase === "필기·실기 전체" || item.phase === phase;
    const isOpen = daysBetween(today, item.applyStart) <= 0 && daysBetween(today, item.applyEnd) >= 0;
    const isUpcoming = daysBetween(today, item.applyStart) > 0;
    const matchesStatus =
      status === "전체 일정" ||
      (status === "접수 중" && isOpen) ||
      (status === "접수 예정" && isUpcoming);
    return matchesQuery && matchesCategory && matchesPhase && matchesStatus;
  });

  function toggleSchedule(item: Schedule) {
    const isSelected = selectedIds.includes(item.id);
    setSelectedIds((current) =>
      isSelected ? current.filter((id) => id !== item.id) : [...current, item.id],
    );
    setToast(
      isSelected
        ? `${item.name} ${item.phase} 일정을 삭제했어요.`
        : `${item.name} ${item.phase} 일정을 추가했어요.`,
    );
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setTab("home")} aria-label="자격루트 홈">
          <BrandMark />
          <span>자격루트</span>
        </button>
        <nav className="main-nav" aria-label="주요 메뉴">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>홈</button>
          <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>자격증 일정 검색</button>
          <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>내 캘린더</button>
        </nav>
        <div className="header-actions">
          <span className={`source-badge ${loadStatus}`}>
            <i /> {loadStatus === "ready" ? "Q-Net 연동" : "Q-Net 연동 대기"}
          </span>
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
                <h1 id="home-title">공식 일정으로,<br />준비는 더 정확하게.</h1>
                <p>한국산업인력공단 Q-Net의 국가기술자격 일정만 제공합니다.</p>
              </div>
              <button className="primary-button" onClick={() => setTab("search")}>
                <SearchIcon /> Q-Net 자격증 찾기
              </button>
            </div>

            {loadStatus !== "ready" ? (
              <ConnectionState status={loadStatus} />
            ) : (
              <>
                <div className="data-trust-strip">
                  <span className="trust-icon">Q</span>
                  <div>
                    <b>Q-Net 공공데이터 연동 완료</b>
                    <p>국가자격 시험일정 조회 서비스에서 필기·실기 접수 및 시험일을 가져옵니다.</p>
                  </div>
                  <small>{updatedAt ? `${updatedAt.toLocaleDateString("ko-KR")} 확인` : "공식 데이터"}</small>
                </div>
                <div className="home-grid">
                  <section className="panel upcoming-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">Q-NET UP NEXT</span>
                        <h2>다가오는 접수 일정</h2>
                      </div>
                      <button className="text-button" onClick={() => setTab("search")}>전체 일정 보기 →</button>
                    </div>
                    {upcoming.length > 0 ? (
                      <div className="upcoming-list">
                        {upcoming.map((item, index) => {
                          const startDays = daysBetween(today, item.applyStart);
                          const isOpen = startDays <= 0 && daysBetween(today, item.applyEnd) >= 0;
                          return (
                            <article className="upcoming-item" key={item.id}>
                              <div className="date-tile">
                                <span>{item.applyStart.toLocaleDateString("ko-KR", { month: "short" })}</span>
                                <b>{item.applyStart.getDate()}</b>
                              </div>
                              <div className="item-main">
                                <div className="item-topline">
                                  <span className="category-tag">{item.category}</span>
                                  <span className="phase-tag">{item.phase}</span>
                                  {index === 0 && <span className="hot-tag">{isOpen ? "접수 중" : "가장 가까워요"}</span>}
                                </div>
                                <h3>{item.name}</h3>
                                <p>{item.year}년 {item.round}회 · 한국산업인력공단</p>
                              </div>
                              <div className="item-side">
                                <span className="dday blue">{isOpen ? "접수 중" : `D-${startDays}`}</span>
                                <small>{formatRange(item.applyStart, item.applyEnd)}</small>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyData message="현재 조회된 접수 예정 일정이 없어요." />
                    )}
                  </section>

                  <aside className="panel countdown-panel">
                    <div className="panel-heading compact">
                      <div>
                        <span className="section-kicker green-text">MY PLAN</span>
                        <h2>내 시험 D-day</h2>
                      </div>
                      <button className="icon-button" onClick={() => setTab("calendar")} aria-label="내 캘린더 열기">→</button>
                    </div>
                    {countdown.length > 0 ? (
                      <div className="countdown-list">
                        {countdown.map((item, index) => (
                          <article className="countdown-item" key={item.id}>
                            <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                            <div>
                              <h3>{item.name} · {item.phase}</h3>
                              <p>시험 시작 · {formatShort(item.examDate)}</p>
                            </div>
                            <b>D-{daysBetween(today, item.examDate)}</b>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-mini home-empty">
                        <span>▦</span>
                        <h3>등록한 일정이 없어요</h3>
                        <p>Q-Net 자격증 일정을 캘린더에 추가해보세요.</p>
                        <button onClick={() => setTab("search")}>일정 찾기</button>
                      </div>
                    )}
                    <div className="plan-summary">
                      <div className="mini-calendar"><CalendarIcon /></div>
                      <p><b>{selectedIds.length}개의 일정</b><br />이 브라우저에 저장되어 있어요</p>
                      <button onClick={() => setTab("calendar")}>캘린더 보기</button>
                    </div>
                  </aside>
                </div>
              </>
            )}

            <div className="tip-strip">
              <span aria-hidden="true">✓</span>
              <p><b>데이터 원칙</b> TOEIC·한국사·민간자격은 제외하고 공공 API로 확인되는 Q-Net 일정만 표시합니다.</p>
              <a href="https://www.data.go.kr/data/15074408/openapi.do" target="_blank" rel="noreferrer">공공데이터 원문 →</a>
            </div>
          </section>
        )}

        {tab === "search" && (
          <section className="page search-page" aria-labelledby="search-title">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">Q-NET CERTIFICATE FINDER</span>
                <h1 id="search-title">Q-Net 일정 검색</h1>
                <p>공공데이터로 확인된 국가기술자격 필기·실기 일정만 찾아보세요.</p>
              </div>
              <div className="saved-stat">
                <span>내 캘린더</span><b>{selectedIds.length}</b><small>개 일정</small>
              </div>
            </div>

            <div className="search-box">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="정보처리기사, 산업안전기사 등 검색"
                aria-label="Q-Net 자격증 검색"
              />
              {query && <button onClick={() => setQuery("")} aria-label="검색어 지우기">×</button>}
            </div>
            <div className="filter-bar" aria-label="검색 필터">
              <span className="filter-label">필터</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="분야">
                <option>전체 분야</option>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="일정 상태">
                <option>전체 일정</option>
                <option>접수 중</option>
                <option>접수 예정</option>
              </select>
              <select value={phase} onChange={(event) => setPhase(event.target.value)} aria-label="시험 단계">
                <option>필기·실기 전체</option>
                <option>필기</option>
                <option>실기</option>
              </select>
              <button
                className="reset-button"
                onClick={() => {
                  setCategory("전체 분야");
                  setStatus("전체 일정");
                  setPhase("필기·실기 전체");
                  setQuery("");
                }}
              >초기화</button>
            </div>

            <div className="results-heading">
              <h2>{loadStatus === "ready" ? <>공식 일정 <span>{filtered.length}</span></> : "연동 대상 자격증"}</h2>
              <p>제공기관: 한국산업인력공단 · 출처: 공공데이터포털</p>
            </div>

            {loadStatus === "loading" && <LoadingCards />}
            {loadStatus === "error" && <ConnectionState status="error" compact />}
            {loadStatus === "configuration_required" && (
              <>
                <ConnectionState status="configuration_required" compact />
                <div className="catalog-grid">
                  {QNET_CATALOG.map((item) => (
                    <article className="catalog-card" key={item.jmCd}>
                      <div className="certificate-letter">{item.name.slice(0, 1)}</div>
                      <div>
                        <div className="card-tags"><span>{item.category}</span><span>{item.level}</span></div>
                        <h3>{item.name}</h3>
                        <p>Q-Net 종목코드 {item.jmCd}</p>
                      </div>
                      <span className="waiting-label">일정 연동 대기</span>
                    </article>
                  ))}
                </div>
              </>
            )}
            {loadStatus === "ready" && (
              <div className="certificate-list">
                {filtered.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isOpen = daysBetween(today, item.applyStart) <= 0 && daysBetween(today, item.applyEnd) >= 0;
                  return (
                    <article className={`certificate-card ${isSelected ? "selected" : ""}`} key={item.id}>
                      <div className="certificate-letter">{item.name.slice(0, 1)}</div>
                      <div className="certificate-info">
                        <div className="card-tags">
                          <span>{item.category}</span><span>{item.phase}</span>
                          {isOpen && <span className="open-tag">접수 중</span>}
                        </div>
                        <h3>{item.name}</h3>
                        <p>{item.year}년 {item.round}회 · {item.level}</p>
                      </div>
                      <div className="schedule-pair">
                        <div><span className="legend-dot blue-dot" /><p>접수 기간</p><b>{formatRange(item.applyStart, item.applyEnd)}</b></div>
                        <div><span className="legend-dot green-dot" /><p>시험 기간</p><b>{formatRange(item.examDate, item.examEndDate)}</b></div>
                      </div>
                      <button className={`save-button ${isSelected ? "saved" : ""}`} onClick={() => toggleSchedule(item)}>
                        {isSelected ? "✓ 추가됨" : "+ 캘린더 추가"}
                      </button>
                    </article>
                  );
                })}
                {filtered.length === 0 && <EmptyData message="조건에 맞는 공식 일정이 없어요." />}
              </div>
            )}
          </section>
        )}

        {tab === "calendar" && (
          <CalendarPage
            month={month}
            today={today}
            selected={selected}
            onMoveMonth={(delta) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))}
            onResetMonth={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            onSearch={() => setTab("search")}
            onRemove={toggleSchedule}
          />
        )}
      </div>

      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}><span>⌂</span>홈</button>
        <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}><span>⌕</span>일정 검색</button>
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}><span>▦</span>내 캘린더</button>
      </nav>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite"><span>✓</span>{toast}</div>
    </main>
  );
}

function ConnectionState({ status, compact = false }: { status: LoadStatus; compact?: boolean }) {
  const loading = status === "loading";
  const error = status === "error";
  return (
    <section className={`connection-state ${compact ? "compact" : ""}`}>
      <div className={`connection-symbol ${loading ? "pulse" : ""}`}>{loading ? "···" : error ? "!" : "Q"}</div>
      <div>
        <span className="section-kicker">{loading ? "CONNECTING" : error ? "TEMPORARY ERROR" : "API KEY REQUIRED"}</span>
        <h2>{loading ? "Q-Net 공식 일정을 불러오고 있어요" : error ? "공식 일정을 불러오지 못했어요" : "공공데이터 인증키 연결을 기다리고 있어요"}</h2>
        <p>
          {loading
            ? "한국산업인력공단 국가자격 시험일정 조회 서비스에 연결 중입니다."
            : error
              ? "잠시 후 새로고침해 주세요. 임의 일정은 대신 표시하지 않습니다."
              : "인증키가 등록되면 Q-Net 필기·실기 접수 및 시험일이 자동으로 표시됩니다. 현재는 가짜 일정을 제공하지 않습니다."}
        </p>
      </div>
      {!loading && !error && (
        <a href="https://www.data.go.kr/data/15074408/openapi.do" target="_blank" rel="noreferrer">API 활용신청 →</a>
      )}
    </section>
  );
}

function LoadingCards() {
  return (
    <div className="loading-cards" aria-label="일정 불러오는 중">
      {[1, 2, 3].map((item) => <span key={item} />)}
    </div>
  );
}

function EmptyData({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <span>⌕</span><h3>{message}</h3><p>필터를 바꾸거나 Q-Net 원문을 확인해 주세요.</p>
    </div>
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
  selected: Schedule[];
  onMoveMonth: (delta: number) => void;
  onResetMonth: () => void;
  onSearch: () => void;
  onRemove: (item: Schedule) => void;
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
    cells.push(addDays(cells[cells.length - 1], 1));
  }

  return (
    <section className="page calendar-page" aria-labelledby="calendar-title">
      <div className="calendar-title-row">
        <div>
          <span className="section-kicker">MY Q-NET CALENDAR</span>
          <h1 id="calendar-title">내 캘린더</h1>
          <p>공식 Q-Net 일정 중 직접 선택한 필기·실기 일정만 표시합니다.</p>
        </div>
        <div className="calendar-legend">
          <span><i className="legend-dot blue-dot" />접수 기간</span>
          <span><i className="legend-dot green-dot" />시험 기간</span>
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
              const events = selected.flatMap((item) => {
                const list: { type: "apply" | "exam"; label: string }[] = [];
                if (day >= startOfDay(item.applyStart) && day <= startOfDay(item.applyEnd)) {
                  list.push({ type: "apply", label: sameDay(day, item.applyStart) ? `${item.shortName} ${item.phase} 접수` : item.shortName });
                }
                if (day >= startOfDay(item.examDate) && day <= startOfDay(item.examEndDate)) {
                  list.push({ type: "exam", label: sameDay(day, item.examDate) ? `${item.shortName} ${item.phase} 시험` : item.shortName });
                }
                return list;
              });
              return (
                <div className={`calendar-day ${day.getMonth() !== month.getMonth() ? "outside" : ""} ${sameDay(day, today) ? "today" : ""}`} key={dateKey(day)}>
                  <span className="day-number">{day.getDate()}</span>
                  <div className="day-events">
                    {events.slice(0, 3).map((event, index) => (
                      <span className={`calendar-event ${event.type}`} key={`${event.label}-${index}`}>{event.label}</span>
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
            <div><span className="section-kicker green-text">SAVED</span><h2>등록한 일정</h2></div>
            <span className="list-count">{selected.length}</span>
          </div>
          <div className="my-calendar-list">
            {[...selected].sort((a, b) => a.examDate.getTime() - b.examDate.getTime()).map((item) => (
              <article key={item.id}>
                <div className="list-color" />
                <div>
                  <h3>{item.name} · {item.phase}</h3>
                  <p><span className="legend-dot blue-dot" />{formatRange(item.applyStart, item.applyEnd)}</p>
                  <p><span className="legend-dot green-dot" />{formatRange(item.examDate, item.examEndDate)}</p>
                </div>
                <button onClick={() => onRemove(item)} aria-label={`${item.name} 일정 삭제`}>×</button>
              </article>
            ))}
            {selected.length === 0 && (
              <div className="empty-mini">
                <span>▦</span><h3>등록된 일정이 없어요</h3><p>Q-Net 공식 일정을 추가해보세요.</p>
                <button onClick={onSearch}>일정 찾기</button>
              </div>
            )}
          </div>
          {selected.length > 0 && <button className="outline-button" onClick={onSearch}>+ 다른 일정 추가하기</button>}
        </aside>
      </div>
    </section>
  );
}
