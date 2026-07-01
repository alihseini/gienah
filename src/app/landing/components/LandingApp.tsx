"use client";
import React from "react";
import {
  Button, IconButton, Input, Badge, Card, Tabs, Avatar, Switch, Toast, Tag, Tooltip, Select, Dialog, Icon,
} from "@/shared/components";
import data from "@/shared/data/landing.json";
import l from "../styles/landing.module.css";

const NAV = data.nav;
const DEPLOYS = data.deploys;

/* ---------------- Login ---------------- */
function Login({ onAuth }: { onAuth: () => void }) {
  return (
    <div className={l.loginBg}>
      <div className={l.loginGlow} />
      <div style={{ position: "relative", width: 392 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <img src="/assets/logo-mark.png" alt="" style={{ height: 44, width: "auto" }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "16px 0 4px" }}>Sign in to {data.org.name === "Helios" ? "Gienah" : data.org.name}</h1>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0 }}>Welcome back. Let&apos;s get you deploying.</p>
        </div>
        <Card padding={24} style={{ boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Work email" placeholder="you@company.com" leadingIcon={<Icon name="mail" size={16} />} defaultValue={data.user.email} />
            <Button variant="primary" block onClick={onAuth} trailingIcon={<Icon name="arrow-right" size={16} />}>Continue with email</Button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-tertiary)", fontSize: 12 }}>
              <span style={{ flex: 1, height: 1, background: "var(--border-default)" }} /> OR <span style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
            </div>
            <Button variant="secondary" block leadingIcon={<Icon name="github" size={17} />} onClick={onAuth}>Continue with GitHub</Button>
            <Button variant="secondary" block leadingIcon={<Icon name="lock" size={16} />} onClick={onAuth}>Continue with SSO</Button>
          </div>
        </Card>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-tertiary)", marginTop: 18 }}>
          New to Gienah? <a href="#" style={{ color: "var(--text-accent)", fontWeight: 500 }}>Create an account</a>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */
function Sidebar({ view, setView }: { view: string; setView: (v: string) => void }) {
  return (
    <aside className={l.sidebar}>
      <div style={{ padding: "16px 14px" }}>
        <button className={l.orgBtn}>
          <span style={{ width: 28, height: 28, display: "grid", placeItems: "center", flex: "none" }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 26, width: "auto" }} />
          </span>
          <span style={{ flex: 1, textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{data.org.name}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-tertiary)" }}>{data.org.plan}</span>
          </span>
          <Icon name="chevrons-up-down" size={15} color="var(--text-tertiary)" />
        </button>
      </div>
      <nav className={l.nav}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} className={[l.navBtn, view === n.id ? l.navBtnActive : ""].filter(Boolean).join(" ")}>
            <Icon name={n.icon} size={17} /> {n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: 12, borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <Avatar name={data.user.name} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.user.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{data.user.email}</div>
          </div>
          <IconButton icon={<Icon name="log-out" size={16} />} label="Sign out" size="sm" />
        </div>
      </div>
    </aside>
  );
}

function Header({ view, onDeploy }: { view: string; onDeploy: () => void }) {
  const title = NAV.find((n) => n.id === view)?.label || "";
  return (
    <header className={l.header}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <span style={{ color: "var(--text-tertiary)" }}>{data.org.name}</span>
        <Icon name="chevron-right" size={15} color="var(--gray-300)" />
        <span style={{ fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 220 }}>
          <Input size="sm" placeholder="Search…" leadingIcon={<Icon name="search" size={15} />} />
        </div>
        <Tooltip label="Documentation"><IconButton icon={<Icon name="book-open" size={17} />} label="Docs" /></Tooltip>
        <Tooltip label="Notifications"><IconButton icon={<Icon name="bell" size={17} />} label="Notifications" /></Tooltip>
        <Button size="sm" variant="primary" leadingIcon={<Icon name="plus" size={15} />} onClick={onDeploy}>New deploy</Button>
      </div>
    </header>
  );
}

/* ---------------- Views ---------------- */
function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "5px 0 0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, delta, positive }: { label: string; value: string; delta: string; positive: boolean }) {
  return (
    <Card padding={18}>
      <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</span>
        <Badge variant={positive ? "success" : "danger"}>
          <Icon name={positive ? "trending-up" : "trending-down"} size={12} /> {delta}
        </Badge>
      </div>
    </Card>
  );
}

function Sparkbars({ data: bars, color = "var(--accent-400)" }: { data: number[]; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
      {bars.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${v}%`, background: color, borderRadius: 3, opacity: 0.35 + v / 160 }} />
      ))}
    </div>
  );
}

type Deploy = (typeof DEPLOYS)[number];
function DeployRow({ d }: { d: Deploy }) {
  return (
    <div className={l.deployRow}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-50)", color: "var(--accent-600)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="box" size={17} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{d.branch} · {d.sha}</div>
      </div>
      <Tag>{d.branch.includes("/") ? "Preview" : "Production"}</Tag>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 150 }}>
        <Avatar name={d.who} size="xs" />
        <span style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{d.time}</span>
      </div>
      <Badge variant={d.color as "success" | "warning" | "danger"} dot>{d.status}</Badge>
      <IconButton icon={<Icon name="ellipsis" size={17} />} label="Actions" size="sm" />
    </div>
  );
}

function Overview() {
  return (
    <>
      <PageHead title="Overview" sub="Last 24 hours · production">
        <div style={{ display: "flex", gap: 10 }}>
          <Select size="sm" options={["Last 24 hours", "Last 7 days", "Last 30 days"]} style={{ width: 160 }} />
          <Button size="sm" variant="secondary" leadingIcon={<Icon name="external-link" size={15} />}>Visit</Button>
        </div>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {data.metrics.map((m) => <Metric key={m.label} {...m} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card padding={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Traffic</span>
            <Badge variant="success" dot>Healthy</Badge>
          </div>
          <Sparkbars data={data.traffic} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
          </div>
        </Card>
        <Card padding={20}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.activity.map(([ic, who, what, t], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--gray-100)", color: "var(--text-secondary)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={ic} size={15} /></span>
                <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}><b style={{ fontWeight: 600 }}>{who}</b> <span style={{ color: "var(--text-secondary)" }}>{what}</span></div>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card padding={0}>
          <div style={{ padding: "16px 16px 12px", fontSize: 15, fontWeight: 600 }}>Recent deployments</div>
          {DEPLOYS.slice(0, 3).map((d, i) => <DeployRow key={i} d={d} />)}
        </Card>
      </div>
    </>
  );
}

function Deployments({ onDeploy }: { onDeploy: () => void }) {
  const [tab, setTab] = React.useState("all");
  const list = DEPLOYS.filter((d) => tab === "all" || (tab === "prod" ? !d.branch.includes("/") : d.branch.includes("/")));
  return (
    <>
      <PageHead title="Deployments" sub="Every build across your environments">
        <Button size="sm" variant="primary" leadingIcon={<Icon name="plus" size={15} />} onClick={onDeploy}>New deploy</Button>
      </PageHead>
      <div style={{ marginBottom: 16 }}>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "All" }, { value: "prod", label: "Production" }, { value: "preview", label: "Preview" }]} />
      </div>
      <Card padding={0}>
        {list.map((d, i) => <DeployRow key={i} d={d} />)}
      </Card>
    </>
  );
}

function Observability() {
  return (
    <>
      <PageHead title="Observability" sub="Traces, latency, and errors across regions" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={20}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Requests by region</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.regions.map(([r, v]) => (
              <div key={r as string} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 92, fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{r}</span>
                <div style={{ flex: 1, height: 10, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${v}%`, height: "100%", background: "var(--accent-500)", borderRadius: 99 }} />
                </div>
                <span style={{ width: 36, textAlign: "right", fontSize: 12.5, color: "var(--text-tertiary)" }}>{v}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card padding={20}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>p99 latency</div>
          <Sparkbars data={data.latency} color="var(--accent-500)" />
          <div style={{ display: "flex", gap: 20, marginTop: 18 }}>
            {data.latencyStats.map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</div><div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{v}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Storage() {
  return (
    <>
      <PageHead title="Storage" sub="Databases, buckets, and caches in your system graph" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {data.storage.map(([ic, n, k, u, col, st]) => (
          <Card key={n} padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ width: 38, height: 38, borderRadius: 9, background: "var(--accent-50)", color: "var(--accent-600)", display: "grid", placeItems: "center" }}><Icon name={ic} size={19} /></span>
              <Badge variant={col as "success" | "warning"} dot>{st}</Badge>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 14 }}>{n}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{k}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>{u}</div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Settings() {
  const [del, setDel] = React.useState(false);
  return (
    <>
      <PageHead title="Settings" sub="Project configuration and team" />
      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <Card padding={22}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>General</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Project name" defaultValue="gienah-api" />
            <Select label="Production region" options={["us-east-1", "eu-west-1", "ap-south-1"]} />
          </div>
        </Card>
        <Card padding={22}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Deployment</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.settingsToggles.map(([t, dsc, on], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{t}</div><div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{dsc}</div></div>
                <Switch defaultChecked={Boolean(on)} />
              </div>
            ))}
          </div>
        </Card>
        <Card padding={22} style={{ borderColor: "var(--red-100)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-danger)", marginBottom: 6 }}>Danger zone</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 360 }}>Permanently delete this project and all of its deployments, data, and logs.</div>
            <Button variant="danger" onClick={() => setDel(true)}>Delete project</Button>
          </div>
        </Card>
      </div>
      <Dialog
        open={del}
        onClose={() => setDel(false)}
        title="Delete gienah-api?"
        description="This permanently removes the project and all its data. This cannot be undone."
        footer={<><Button variant="ghost" onClick={() => setDel(false)}>Cancel</Button><Button variant="danger" onClick={() => setDel(false)}>Delete project</Button></>}
      >
        <Input label="Type the project name to confirm" placeholder="gienah-api" />
      </Dialog>
    </>
  );
}

/* ---------------- App ---------------- */
function Landing() {
  const [view, setView] = React.useState("overview");
  const [toasts, setToasts] = React.useState<number[]>([]);
  const deploy = () => {
    const id = Date.now();
    setToasts((t) => [...t, id]);
    setTimeout(() => setToasts((t) => t.filter((x) => x !== id)), 3800);
  };
  const views: Record<string, React.ReactNode> = {
    overview: <Overview />,
    deployments: <Deployments onDeploy={deploy} />,
    observability: <Observability />,
    storage: <Storage />,
    settings: <Settings />,
  };
  return (
    <div className={l.shell}>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header view={view} onDeploy={deploy} />
        <main style={{ padding: "28px", flex: 1 }}>{views[view]}</main>
      </div>
      <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 50 }}>
        {toasts.map((id) => (
          <Toast key={id} variant="success" title="Deployment started" description="gienah-api · main · building now" onClose={() => setToasts((t) => t.filter((x) => x !== id))} />
        ))}
      </div>
    </div>
  );
}

export function LandingApp() {
  const [authed, setAuthed] = React.useState(false);
  return <div className={l.root}>{authed ? <Landing /> : <Login onAuth={() => setAuthed(true)} />}</div>;
}
