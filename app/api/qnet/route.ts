import { env } from "cloudflare:workers";
import { QNET_CATALOG } from "../../qnet-catalog";

type QnetEnv = {
  DATA_GO_KR_SERVICE_KEY?: string;
};

type QnetRawSchedule = {
  implYy?: string;
  implSeq?: string;
  description?: string;
  docRegStartDt?: string;
  docRegEndDt?: string;
  docExamStartDt?: string;
  docExamEndDt?: string;
  docPassDt?: string;
  pracRegStartDt?: string;
  pracRegEndDt?: string;
  pracExamStartDt?: string;
  pracExamEndDt?: string;
  pracPassDt?: string;
};

function isoDate(value?: string) {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function rawItems(payload: unknown): QnetRawSchedule[] {
  const body = (payload as {
    response?: { body?: { items?: unknown } };
  })?.response?.body;
  const items = body?.items;
  if (Array.isArray(items)) return items as QnetRawSchedule[];
  if (items && typeof items === "object" && "item" in items) {
    const item = (items as { item?: unknown }).item;
    return Array.isArray(item) ? (item as QnetRawSchedule[]) : item ? [item as QnetRawSchedule] : [];
  }
  return [];
}

async function fetchItemSchedules(serviceKey: string, jmCd: string, year: number) {
  const url = new URL("https://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList");
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("dataFormat", "json");
  url.searchParams.set("implYy", String(year));
  url.searchParams.set("qualgbCd", "T");
  url.searchParams.set("jmCd", jmCd);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 21_600 },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Q-Net API responded with ${response.status}`);
  }
  return rawItems(await response.json());
}

export async function GET(request: Request) {
  const serviceKey = (env as unknown as QnetEnv).DATA_GO_KR_SERVICE_KEY?.trim();
  const requestedYear = Number(new URL(request.url).searchParams.get("year"));
  const currentYear = new Date().getFullYear();
  const year =
    Number.isInteger(requestedYear) &&
    requestedYear >= currentYear - 1 &&
    requestedYear <= currentYear + 1
      ? requestedYear
      : currentYear;

  if (!serviceKey) {
    return Response.json(
      {
        status: "configuration_required",
        source: "한국산업인력공단 국가자격 시험일정 조회 서비스",
        sourceUrl: "https://www.data.go.kr/data/15074408/openapi.do",
        catalog: QNET_CATALOG,
        schedules: [],
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
    const results = await Promise.all(
      QNET_CATALOG.map(async (certificate) => ({
        certificate,
        rows: await fetchItemSchedules(serviceKey, certificate.jmCd, year),
      })),
    );

    const schedules = results.flatMap(({ certificate, rows }) =>
      rows.flatMap((row) => {
        const round = row.implSeq || row.description || "정기";
        const common = {
          jmCd: certificate.jmCd,
          name: certificate.name,
          shortName: certificate.shortName,
          category: certificate.category,
          level: certificate.level,
          provider: "한국산업인력공단(Q-Net)",
          year: Number(row.implYy || year),
          round: String(round),
          sourceUrl: "https://www.q-net.or.kr",
        };
        const phases = [];
        const docApplyStart = isoDate(row.docRegStartDt);
        const docApplyEnd = isoDate(row.docRegEndDt);
        const docExamStart = isoDate(row.docExamStartDt);
        if (docApplyStart && docApplyEnd && docExamStart) {
          phases.push({
            ...common,
            id: `${certificate.jmCd}-${year}-${round}-doc`,
            phase: "필기",
            applyStart: docApplyStart,
            applyEnd: docApplyEnd,
            examDate: docExamStart,
            examEndDate: isoDate(row.docExamEndDt) ?? docExamStart,
            resultDate: isoDate(row.docPassDt),
          });
        }
        const pracApplyStart = isoDate(row.pracRegStartDt);
        const pracApplyEnd = isoDate(row.pracRegEndDt);
        const pracExamStart = isoDate(row.pracExamStartDt);
        if (pracApplyStart && pracApplyEnd && pracExamStart) {
          phases.push({
            ...common,
            id: `${certificate.jmCd}-${year}-${round}-prac`,
            phase: "실기",
            applyStart: pracApplyStart,
            applyEnd: pracApplyEnd,
            examDate: pracExamStart,
            examEndDate: isoDate(row.pracExamEndDt) ?? pracExamStart,
            resultDate: isoDate(row.pracPassDt),
          });
        }
        return phases;
      }),
    );

    return Response.json(
      {
        status: "ok",
        source: "한국산업인력공단 국가자격 시험일정 조회 서비스",
        sourceUrl: "https://www.data.go.kr/data/15074408/openapi.do",
        updatedAt: new Date().toISOString(),
        year,
        catalog: QNET_CATALOG,
        schedules,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        status: "upstream_error",
        message: error instanceof Error ? error.message : "Q-Net 일정 조회에 실패했습니다.",
        catalog: QNET_CATALOG,
        schedules: [],
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
