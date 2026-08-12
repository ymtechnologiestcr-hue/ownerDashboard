import { useEffect, useMemo, useState } from "react";
import {
  getOwnerDashboardInsights,
  type OwnerDashboardInsights,
  type SalesTrendPoint,
  type StockOverviewLevel,
  type DriverCashRow,
  type RecentActivityItem,
  type ExpenseBreakdownItem,
  type TopDriverItem,
} from "../services/ownerService";

type Props = {
  startDate: string;
  endDate: string;
};

type InsightsData = OwnerDashboardInsights["data"];

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatK = (value: number) =>
  value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${Math.round(value)}`;

const niceCeil = (value: number) => {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
};

const timeAgo = (iso: string) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

/* ---------------- Lucide section icons (exact) ---------------- */
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /><path d="m7.5 4.27 9 5.15" /></svg>
);
const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

/* ---------------- Activity row icons ---------------- */
const activityIcon = (type: string) => {
  switch (type) {
    case "SETTLEMENT":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
      );
    case "STOCK":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /></svg>
      );
    case "EXPENSE":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
      );
  }
};

const activityToneClass = (type: string) => {
  if (type === "SETTLEMENT") return "ins-act-icon green";
  if (type === "EXPENSE") return "ins-act-icon orange";
  return "ins-act-icon blue";
};

const ReceiptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></svg>
);
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ins-head-icon ins-head-icon-orange"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);

const MedalIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /><path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" /><circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" /></svg>
);

const MEDAL_COLORS = ["#E0A100", "#8A94A6", "#C8803C"];

const EXPENSE_COLORS = ["#3D4FE0", "#16a34a", "#db8e0a", "#7c3aed", "#556070", "#e5484d", "#0b84d4"];

/* ---------------- Expense donut (inline SVG) ---------------- */
function ExpenseDonut({ items, total, colors }: { items: ExpenseBreakdownItem[]; total: number; colors: string[] }) {
  const size = 150;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  if (!total) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ins-donut">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
      </svg>
    );
  }

  const prefix = items.reduce<number[]>((acc, item, i) => {
    acc.push((acc[i - 1] ?? 0) + item.amount);
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ins-donut" role="img" aria-label="Expense breakdown by category">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
      {items.map((item, i) => {
        const dash = (item.amount / total) * circ;
        const before = (prefix[i] - item.amount) / total;
        return (
          <circle
            key={item.category}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-before * circ}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

/* ---------------- Sales trend chart (inline SVG) ---------------- */
function SalesTrendChart({ points }: { points: SalesTrendPoint[] }) {
  const W = 720;
  const H = 300;
  const padL = 54;
  const padR = 16;
  const padT = 12;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = points.length;

  if (!n) {
    return <div className="ins-empty">No sales data for this range.</div>;
  }

  const maxSales = niceCeil(Math.max(1, ...points.map((p) => p.sales)));
  const maxDelivered = niceCeil(Math.max(1, ...points.map((p) => p.delivered)));

  const xAt = (i: number) =>
    n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
  const ySales = (v: number) => padT + plotH - (v / maxSales) * plotH;
  const yDeliv = (v: number) => padT + plotH - (v / maxDelivered) * plotH;

  const salesLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${ySales(p.sales).toFixed(1)}`)
    .join(" ");
  const salesArea = `${salesLine} L${xAt(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xAt(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
  const delivLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yDeliv(p.delivered).toFixed(1)}`)
    .join(" ");

  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }, (_, k) => {
    const val = (maxSales / steps) * k;
    return { val, y: ySales(val) };
  });

  const labelEvery = n <= 8 ? 1 : Math.ceil(n / 7);

  return (
    <svg className="ins-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Daily sales trend">
      <defs>
        <linearGradient id="insSalesFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D4FE0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3D4FE0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padL - 10} y={g.y + 4} textAnchor="end" className="ins-axis-label">{formatK(g.val)}</text>
        </g>
      ))}

      <path d={salesArea} fill="url(#insSalesFill)" />
      <path d={delivLine} fill="none" stroke="#16a34a" strokeWidth="2" opacity="0.55" />
      <path d={salesLine} fill="none" stroke="#3D4FE0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={xAt(i)} cy={ySales(p.sales)} r="3.2" fill="#3D4FE0" />
      ))}

      {points.map((p, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <text key={i} x={xAt(i)} y={H - 10} textAnchor="middle" className="ins-axis-label">{p.label}</text>
        ) : null
      )}
    </svg>
  );
}

/* ---------------- Stock bar ---------------- */
function StockBar({ label, level, color }: { label: string; level: StockOverviewLevel; color: string }) {
  const pct = level.total > 0 ? Math.min(100, Math.round((level.current / level.total) * 100)) : 0;
  return (
    <div className="ins-stock-row">
      <div className="ins-stock-top">
        <span className="ins-stock-label">{label}</span>
        <span className="ins-stock-value">
          <strong>{level.current}</strong> / {level.total}
        </span>
      </div>
      <div className="ins-stock-track">
        <div className="ins-stock-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {level.low && <p className="ins-stock-alert">⚠ Low stock alert</p>}
    </div>
  );
}

/* ---------------- Driver cash status pill ---------------- */
const statusPillClass = (status: string) => {
  if (status === "Settled") return "ins-pill settled";
  if (status === "Pending") return "ins-pill pending";
  return "ins-pill neutral";
};

export default function DashboardInsights({ startDate, endDate }: Props) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesDays, setSalesDays] = useState<7 | 30>(7);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await getOwnerDashboardInsights(startDate, endDate, salesDays);
        if (active && res.data?.data) setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard insights:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [startDate, endDate, salesDays]);

  const trendPoints = useMemo(() => data?.salesTrend.points ?? [], [data]);
  const drivers: DriverCashRow[] = data?.driverCashTracking ?? [];
  const activity: RecentActivityItem[] = data?.recentActivity ?? [];
  const expenseItems: ExpenseBreakdownItem[] = data?.expenseBreakdown.items ?? [];
  const expenseTotal = data?.expenseBreakdown.total ?? 0;
  const topDrivers: TopDriverItem[] = data?.topDrivers ?? [];

  return (
    <div className="ins-grid">
      {/* Sales Performance */}
      <section className="ins-card ins-row-a">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <TrendingUpIcon />
            <div>
              <h3 className="ins-title">Sales Performance</h3>
              <p className="ins-subtitle">Daily sales trend and delivery metrics</p>
            </div>
          </div>
          <div className="ins-toggle">
            <button className={salesDays === 7 ? "active" : ""} onClick={() => setSalesDays(7)}>7 Days</button>
            <button className={salesDays === 30 ? "active" : ""} onClick={() => setSalesDays(30)}>30 Days</button>
          </div>
        </div>

        <div className="ins-body">
          <div className="ins-chart-wrap">
            {loading && !data ? (
              <div className="ins-empty">Loading…</div>
            ) : (
              <SalesTrendChart points={trendPoints} />
            )}
          </div>

          <div className="ins-legend">
            <span><i className="dot blue" /> Sales (₹)</span>
            <span><i className="dot green" /> Cylinders Delivered</span>
          </div>
        </div>
      </section>

      {/* Stock Overview */}
      <section className="ins-card ins-row-a">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <PackageIcon />
            <div>
              <h3 className="ins-title">Stock Overview</h3>
              <p className="ins-subtitle">Current inventory levels</p>
            </div>
          </div>
        </div>

        <div className="ins-body">
          {data ? (
            <div className="ins-stock-list">
              <StockBar label="Domestic Cylinders" level={data.stockOverview.domestic} color="#3D4FE0" />
              <StockBar label="Commercial Cylinders" level={data.stockOverview.commercial} color="#16a34a" />
              <StockBar label="Empty Cylinders" level={data.stockOverview.empty} color="#e5484d" />
            </div>
          ) : (
            <div className="ins-empty">{loading ? "Loading…" : "No stock data."}</div>
          )}
        </div>
      </section>

      {/* Driver Cash Tracking */}
      <section className="ins-card ins-row-b">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <TruckIcon />
            <div>
              <h3 className="ins-title">Driver Cash Tracking</h3>
              <p className="ins-subtitle">Collection and settlement status</p>
            </div>
          </div>
        </div>

        <div className="ins-body ins-table-wrap">
          <table className="ins-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th className="num">Cylinders</th>
                <th className="num">Cash Collected</th>
                <th className="num">Cash Settled</th>
                <th className="num">Pending</th>
                <th className="center">Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length ? (
                drivers.map((d) => (
                  <tr key={d.driverId} className={d.status === "Pending" ? "row-pending" : ""}>
                    <td className="strong">{d.driverName}</td>
                    <td className="num">{d.cylinders}</td>
                    <td className="num">{formatCurrency(d.collected)}</td>
                    <td className="num">{formatCurrency(d.settled)}</td>
                    <td className="num strong">{d.pending > 0 ? formatCurrency(d.pending) : "—"}</td>
                    <td className="center"><span className={statusPillClass(d.status)}>{d.status}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="ins-empty-cell">{loading ? "Loading…" : "No driver activity for this range."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="ins-card ins-row-b">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <ClockIcon />
            <div>
              <h3 className="ins-title">Recent Activity</h3>
              <p className="ins-subtitle">Latest updates and events</p>
            </div>
          </div>
        </div>

        <div className="ins-body">
          <div className="ins-activity-list">
            {activity.length ? (
              activity.map((a, i) => (
                <div className="ins-activity-item" key={i}>
                  <span className={activityToneClass(a.type)}>{activityIcon(a.type)}</span>
                  <div className="ins-activity-body">
                    <p className="ins-activity-title">{a.title}</p>
                    <p className="ins-activity-time">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="ins-empty">{loading ? "Loading…" : "No recent activity."}</div>
            )}
          </div>
        </div>
      </section>

      {/* Expense Breakdown */}
      <section className="ins-card ins-row-c">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <ReceiptIcon />
            <div>
              <h3 className="ins-title">Expense Breakdown</h3>
              <p className="ins-subtitle">Today&apos;s spending by category</p>
            </div>
          </div>
        </div>

        <div className="ins-body">
          {expenseItems.length ? (
            <div className="ins-expense">
              <div className="ins-donut-wrap">
                <ExpenseDonut items={expenseItems} total={expenseTotal} colors={EXPENSE_COLORS} />
              </div>
              <div className="ins-expense-list">
                {expenseItems.map((item, i) => (
                  <div className="ins-exp-row" key={item.category}>
                    <span className="ins-exp-label">
                      <i className="ins-exp-dot" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      {item.category}
                    </span>
                    <span className="ins-exp-amount">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="ins-exp-total">
                  <span>Total</span>
                  <span>{formatCurrency(expenseTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="ins-empty">{loading ? "Loading…" : "No expenses for this range."}</div>
          )}
        </div>
      </section>

      {/* Top Drivers Today */}
      <section className="ins-card ins-row-c">
        <div className="ins-card-head">
          <div className="ins-head-left">
            <TrophyIcon />
            <div>
              <h3 className="ins-title">Top Drivers Today</h3>
              <p className="ins-subtitle">Based on deliveries completed</p>
            </div>
          </div>
        </div>

        <div className="ins-body">
          <div className="ins-topdrivers">
            {topDrivers.length ? (
              topDrivers.map((d, i) => (
                <div className="ins-driver-row" key={d.driverId}>
                  <span className={i < 3 ? "ins-rank medal" : "ins-rank num"}>
                    {i < 3 ? <MedalIcon color={MEDAL_COLORS[i]} /> : i + 1}
                  </span>
                  <span className="ins-driver-name">{d.driverName}</span>
                  <span className="ins-driver-deliv">
                    <strong>{d.deliveries}</strong> deliveries
                  </span>
                </div>
              ))
            ) : (
              <div className="ins-empty">{loading ? "Loading…" : "No deliveries for this range."}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
