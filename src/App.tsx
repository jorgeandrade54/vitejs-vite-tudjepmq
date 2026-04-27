import { useState, useMemo, useEffect, useCallback } from "react";

interface Candidato {
  rid: number; idade: number;
  n: string; nc: string; ca: string; pt: string;
  mu: string; ge: string; co: string; oc: string; es: string;
  el: boolean; sq: string; ue: string; cd: string;
  uf: string; re: string; an: string;
}
interface Filtros {
  ge?: string; co?: string; oc?: string; fx?: string;
  ca?: string; mu?: string; apenasEleitos: boolean;
}

const FAIXAS = [
  { label:"18–30", min:18, max:30 }, { label:"31–45", min:31, max:45 },
  { label:"46–60", min:46, max:60 }, { label:"60+",   min:61, max:99 },
];
const COR_COR: Record<string,string> = {
  BRANCA:"#C8A87A", PRETA:"#7B4A2A", PARDA:"#C68B4E",
  AMARELA:"#FFD700", "INDÍGENA":"#8B5513",
};
const PT_COR: Record<string,string> = {
  PT:"#CC0000", PSD:"#003FA5", PSOL:"#7B00B0", MDB:"#4169E1", PP:"#0000CD",
  NOVO:"#E87722", REDE:"#00B140", PL:"#00205C", PSB:"#E05C00", PDT:"#C00000",
  PSDB:"#0070C0", REPUBLICANOS:"#003F7F", PCDOB:"#8B0000", PODE:"#006400",
  AVANTE:"#FF6600", PRD:"#003366", DC:"#001F5B", PV:"#2E8B57",
  SOLIDARIEDADE:"#FF4500", AGIR:"#0047AB", CIDADANIA:"#FF6B35",
};

const getIbg  = (co: string) => COR_COR[co] ?? "#4FA3FF";
const getPtc  = (pt: string) => PT_COR[pt]  ?? "#555";
const fotoUrl = (c: Candidato) =>
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${c.cd}/${c.sq}/${c.ue}`;
const tseUrl  = (c: Candidato) =>
  `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${c.re}/${c.uf}/${c.cd}/${c.sq}/${c.an}/${c.ue}`;

function passaFiltros(c: Candidato, f: Filtros): boolean {
  if (f.ge && c.ge !== f.ge) return false;
  if (f.co && c.co !== f.co) return false;
  if (f.oc && c.oc !== f.oc) return false;
  if (f.ca && c.ca !== f.ca) return false;
  if (f.mu && c.mu !== f.mu) return false;
  if (f.fx) {
    const faixa = FAIXAS.find(x => x.label === f.fx);
    if (faixa && (c.idade < faixa.min || c.idade > faixa.max)) return false;
  }
  return true;
}

// Componente de foto com fallback para inicial
function Foto({ c, size, fontSize }: { c: Candidato; size: number; fontSize: number }) {
  const [err, setErr] = useState(false);
  const bg = getIbg(c.co);
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: size * 0.28,
    overflow: "hidden", flexShrink: 0, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif", fontSize, color: "#000",
  };
  if (!err) {
    return (
      <div style={style}>
        <img
          src={fotoUrl(c)}
          alt={c.n}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>
    );
  }
  return <div style={style}>{c.n.charAt(0)}</div>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#080C17;--bg2:#0C1220;--bg3:#111827;
  --gold:#FFD700;--green:#00C950;
  --text:#E8EDF5;--muted:#5A6A80;--border:rgba(255,255,255,.07);
  --sw:292px;
}
html,body,#root{min-height:100%;background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;}

.loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
  background:radial-gradient(ellipse 100% 60% at 50% 0%,rgba(0,201,80,.06),transparent 70%),var(--bg);}
.logo-big{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,12vw,100px);letter-spacing:2px;line-height:1;}
.lg{color:var(--green);}.ly{color:var(--gold);}
.pbar{width:180px;height:3px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;}
.pfill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--green),var(--gold));transition:width .4s;}
.ptxt{font-size:11px;color:var(--muted);}

.app{display:flex;min-height:100vh;}

/* Sidebar */
.sb{width:var(--sw);flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;
  overflow:hidden;transition:transform .3s cubic-bezier(.4,0,.2,1);}
.sb-hd{padding:18px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;}
.logo .lg{color:var(--green);}.logo .ly{color:var(--gold);}
.logo-sub{font-size:10px;color:var(--muted);margin-top:2px;}
.sb-body{flex:1;overflow-y:auto;padding:12px 16px 80px;}
.sb-body::-webkit-scrollbar{width:3px;}
.sb-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px;}

.aviso{background:rgba(255,165,0,.07);border:1px solid rgba(255,165,0,.2);border-radius:8px;
  padding:8px 10px;font-size:10px;color:#AA8855;line-height:1.5;margin-bottom:14px;}
.aviso strong{color:#FFB347;}
.fsec{margin-bottom:16px;}
.ftit{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
.chips{display:flex;flex-wrap:wrap;gap:4px;}
.chip{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#778899;
  transition:all .15s;user-select:none;white-space:nowrap;}
.chip:hover{border-color:var(--gold);color:var(--gold);}
.chip.on{border-color:var(--c);background:var(--c);color:#000;}
.tog-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;}
.tog-lbl{font-size:12px;font-weight:500;}
.tog{position:relative;width:38px;height:20px;cursor:pointer;}
.tog input{opacity:0;width:0;height:0;}
.tog-tr{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:99px;transition:.2s;}
.tog input:checked+.tog-tr{background:var(--green);}
.tog-th{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:.2s;}
.tog input:checked~.tog-th{left:21px;}
.srch{width:100%;padding:7px 11px;border-radius:8px;border:1px solid var(--border);
  background:rgba(255,255,255,.03);color:var(--text);font-family:inherit;font-size:12px;margin-bottom:6px;outline:none;}
.srch:focus{border-color:rgba(255,215,0,.3);}
.slist{display:flex;flex-direction:column;gap:2px;max-height:145px;overflow-y:auto;}
.slist::-webkit-scrollbar{width:3px;}
.slist::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px;}
.sit{padding:5px 8px;border-radius:6px;font-size:11px;cursor:pointer;color:#8899AA;transition:all .12s;line-height:1.3;}
.sit:hover{background:rgba(255,255,255,.05);color:var(--text);}
.sit.on{background:rgba(255,215,0,.1);color:var(--gold);font-weight:600;}
.rst-btn{width:100%;padding:9px;border-radius:8px;border:1px dashed rgba(255,215,0,.25);
  background:transparent;color:var(--gold);font-family:inherit;font-size:12px;
  cursor:pointer;transition:all .2s;margin-top:6px;font-weight:600;}
.rst-btn:hover{background:rgba(255,215,0,.07);}

/* Main */
.main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;}
.mhd{padding:18px 22px 12px;border-bottom:1px solid var(--border);background:var(--bg);position:sticky;top:0;z-index:50;}
.cnt-big{font-family:'Bebas Neue',sans-serif;font-size:34px;line-height:1;}
.cnt-big span{color:var(--gold);}
.cnt-sub{font-size:11px;color:var(--muted);margin-top:3px;}
.pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
.pill{display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:11px;
  font-weight:600;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.2);
  color:var(--gold);cursor:pointer;transition:all .15s;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pill:hover{background:rgba(255,60,60,.1);border-color:rgba(255,60,60,.3);color:#FF6B6B;}

.gw{padding:16px 22px 20px;flex:1;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}

/* Card */
.card{background:var(--bg3);border:1px solid var(--border);border-radius:14px;
  padding:14px;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;
  position:relative;overflow:hidden;}
.card:hover{transform:translateY(-3px);border-color:rgba(255,215,0,.22);box-shadow:0 8px 28px rgba(0,0,0,.4);}
.card-foto{width:56px;height:56px;border-radius:12px;overflow:hidden;flex-shrink:0;margin-bottom:10px;position:relative;}
.card-foto img{width:100%;height:100%;object-fit:cover;object-position:top;}
.card-foto-fb{width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:24px;color:#000;margin-bottom:10px;}
.cn{font-weight:700;font-size:13px;line-height:1.3;margin-bottom:2px;}
.cca{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;}
.cpt{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;margin-bottom:8px;}
.ctags{display:flex;flex-wrap:wrap;gap:3px;}
.ctag{font-size:10px;padding:2px 6px;border-radius:99px;
  border:1px solid rgba(255,255,255,.08);color:#6A7A8A;background:rgba(255,255,255,.02);}
.ctag.m{border-color:var(--c);color:var(--c);}
.edot{position:absolute;top:10px;right:10px;width:7px;height:7px;border-radius:50%;
  background:var(--green);box-shadow:0 0 6px var(--green);}

/* Modal */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:200;
  display:flex;align-items:flex-end;justify-content:center;animation:fin .2s;}
@media(min-width:600px){.ov{align-items:center;}}
.modal{background:var(--bg2);border:1px solid rgba(255,255,255,.1);width:100%;max-width:460px;
  border-radius:20px 20px 0 0;padding:26px 22px;position:relative;
  animation:sup .26s cubic-bezier(.4,0,.2,1);max-height:90vh;overflow-y:auto;}
@media(min-width:600px){.modal{border-radius:20px;}}
@keyframes sup{from{transform:translateY(36px);opacity:0}to{transform:none;opacity:1}}
@keyframes fin{from{opacity:0}to{opacity:1}}
.mcl{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:50%;
  border:1px solid var(--border);background:rgba(255,255,255,.05);cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:16px;}
.mcl:hover{color:var(--text);}
.modal-top{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px;}
.modal-foto{width:80px;height:80px;border-radius:14px;overflow:hidden;flex-shrink:0;}
.modal-foto img{width:100%;height:100%;object-fit:cover;object-position:top;}
.modal-foto-fb{width:80px;height:80px;border-radius:14px;display:flex;align-items:center;
  justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:38px;color:#000;flex-shrink:0;}
.modal-info{flex:1;min-width:0;}
.mnome{font-weight:700;font-size:16px;line-height:1.2;margin-bottom:2px;}
.mcargo{font-size:11px;color:var(--muted);margin-bottom:3px;}
.mpt{display:inline-block;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:700;color:#fff;margin-top:6px;}
.elbadge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;
  background:rgba(0,201,80,.12);border:1px solid rgba(0,201,80,.25);
  color:var(--green);font-size:11px;font-weight:700;margin-top:6px;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0;}
.minfo{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;padding:9px;}
.ml{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:2px;}
.mv{font-size:12px;font-weight:600;line-height:1.3;}
.tbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;
  border-radius:11px;font-family:inherit;font-size:14px;font-weight:700;
  background:var(--gold);color:#000;border:none;cursor:pointer;transition:all .2s;text-decoration:none;}
.tbtn:hover{background:#FFC000;}
.maviso{background:rgba(255,165,0,.07);border:1px solid rgba(255,165,0,.2);border-radius:8px;
  padding:8px 10px;font-size:10px;color:#AA8855;line-height:1.5;margin-bottom:12px;}

/* Mobile */
.mob-bar{display:none;}.fab{display:none;}.sb-pull{display:none;}.sb-ov{display:none;}
@media(max-width:767px){
  :root{--sw:100%;}
  .sb{position:fixed;top:auto;bottom:0;left:0;right:0;height:88vh;
    border-right:none;border-top:1px solid rgba(255,255,255,.12);
    border-radius:20px 20px 0 0;transform:translateY(100%);}
  .sb.open{transform:translateY(0);}
  .sb-pull{display:block;width:36px;height:3px;border-radius:99px;
    background:rgba(255,255,255,.18);margin:14px auto 0;flex-shrink:0;}
  .sb-hd{padding-top:10px;}
  .sb-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99;animation:fin .2s;}
  .main{margin-left:0;}
  .mob-bar{display:flex;align-items:center;justify-content:space-between;
    padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);
    position:sticky;top:0;z-index:60;}
  .mob-logo{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;}
  .mhd{padding:12px 16px 10px;top:49px;}
  .gw{padding:12px 14px 100px;}
  .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
  .cnt-big{font-size:24px;}
  .fab{display:flex;position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:90;
    align-items:center;gap:7px;padding:11px 22px;border-radius:99px;
    background:var(--gold);color:#000;border:none;font-family:inherit;font-size:13px;
    font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(255,215,0,.4);white-space:nowrap;}
  .fc{background:#000;border-radius:99px;padding:1px 6px;font-size:10px;}
}
.empty{grid-column:1/-1;text-align:center;padding:60px 20px;}
.empty-i{font-size:40px;margin-bottom:12px;}
.empty-t{font-family:'Bebas Neue',sans-serif;font-size:24px;color:#334;}
.empty-s{font-size:12px;color:#445;margin-top:6px;}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.card{animation:fu .22s ease both;}
`;

// Foto com fallback
function FotoCard({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <div className="card-foto">
        <img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className="card-foto-fb" style={{ background: getIbg(c.co) }}>
      {c.n.charAt(0)}
    </div>
  );
}

function FotoModal({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <div className="modal-foto">
        <img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className="modal-foto-fb" style={{ background: getIbg(c.co) }}>
      {c.n.charAt(0)}
    </div>
  );
}

export default function App() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pct, setPct]               = useState(0);
  const [msg, setMsg]               = useState("Carregando dados do TSE...");
  const [filtros, setFiltros]       = useState<Filtros>({ apenasEleitos: false });
  const [ocSearch, setOcSearch]     = useState("");
  const [muSearch, setMuSearch]     = useState("");
  const [sbOpen, setSbOpen]         = useState(false);
  const [sel, setSel]               = useState<Candidato | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPct(30), 300);
    const t2 = setTimeout(() => { setPct(65); setMsg("Processando candidatos..."); }, 800);
    fetch("/candidatos_pa.json")
      .then(r => r.json())
      .then((d: Candidato[]) => {
        clearTimeout(t1); clearTimeout(t2);
        setPct(100);
        setMsg(`${d.length.toLocaleString()} candidatos das Eleições Municipais 2024`);
        setTimeout(() => { setCandidatos(d); setLoading(false); }, 400);
      })
      .catch(() => setMsg("Erro ao carregar. Verifique candidatos_pa.json na pasta public."));
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const opts = useMemo(() => {
    const u = (a: string[]) => [...new Set(a)].filter(Boolean).sort();
    return {
      ge: u(candidatos.map(c => c.ge)),
      co: u(candidatos.map(c => c.co)).filter(c => c !== "NÃO INFORMADO"),
      oc: u(candidatos.map(c => c.oc)),
      ca: u(candidatos.map(c => c.ca)),
      mu: u(candidatos.map(c => c.mu)),
    };
  }, [candidatos]);

  const ocFilt = useMemo(() => opts.oc.filter(o => o.toLowerCase().includes(ocSearch.toLowerCase())), [opts.oc, ocSearch]);
  const muFilt = useMemo(() => opts.mu.filter(m => m.toLowerCase().includes(muSearch.toLowerCase())), [opts.mu, muSearch]);

  const tog = useCallback((cat: keyof Filtros, val: string) => {
    setFiltros(f => ({ ...f, [cat]: f[cat] === val ? undefined : val }));
  }, []);

  const { resultado, total } = useMemo(() => {
    const temFiltro = !!(filtros.ge || filtros.co || filtros.oc || filtros.fx || filtros.ca || filtros.mu);
    const filtrados = candidatos.filter(c => {
      if (filtros.apenasEleitos && !c.el) return false;
      if (!temFiltro) return true;
      return passaFiltros(c, filtros);
    });
    return { resultado: filtrados.slice(0, 300), total: filtrados.length };
  }, [candidatos, filtros]);

  const nAtivos = [filtros.ge, filtros.co, filtros.oc, filtros.fx, filtros.ca, filtros.mu].filter(Boolean).length;
  const temFiltro = nAtivos > 0;

  if (loading) return (
    <><style>{CSS}</style>
    <div className="loading">
      <div className="logo-big"><span className="lg">TE</span><span className="ly">REPRESENTA</span><span>?</span></div>
      <div className="pbar"><div className="pfill" style={{ width: `${pct}%` }} /></div>
      <div className="ptxt">{msg}</div>
    </div></>
  );

  const SidebarContent = () => (
    <>
      <div className="sb-pull" />
      <div className="sb-hd">
        <div className="logo"><span className="lg">TE</span><span className="ly">REPRESENTA</span><span>?</span></div>
        <div className="logo-sub">Eleições Municipais · Pará · 2024</div>
      </div>
      <div className="sb-body">
        <div className="aviso">
          <strong>⚠️ Dados oficiais TSE:</strong> Sexo, etnia, profissão, escolaridade e faixa etária vêm do arquivo de candidatos.{" "}
          <strong>Orientação sexual e identidade de gênero não são coletados pelo TSE.</strong>
        </div>

        <div className="fsec">
          <div className="tog-row">
            <span className="tog-lbl">🏆 Apenas eleitos</span>
            <label className="tog">
              <input type="checkbox" checked={filtros.apenasEleitos}
                onChange={e => setFiltros(f => ({ ...f, apenasEleitos: e.target.checked }))} />
              <div className="tog-tr" /><div className="tog-th" />
            </label>
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">⚥ Sexo <span style={{ fontSize:9, color:"#556", fontWeight:400, letterSpacing:0 }}>(conforme TSE)</span></div>
          <div className="chips">
            {opts.ge.map(v => (
              <div key={v} className={`chip ${filtros.ge === v ? "on" : ""}`}
                style={{ "--c": v === "FEMININO" ? "#FF69B4" : "#4FA3FF" } as React.CSSProperties}
                onClick={() => tog("ge", v)}>{v}</div>
            ))}
          </div>
          <div style={{ fontSize:10, color:"#556", marginTop:6, lineHeight:1.4 }}>Transgênero e não-binário não constam nos dados do TSE.</div>
        </div>

        <div className="fsec">
          <div className="ftit">🌿 Etnia / Cor</div>
          <div className="chips">
            {opts.co.map(v => (
              <div key={v} className={`chip ${filtros.co === v ? "on" : ""}`}
                style={{ "--c": COR_COR[v] ?? "#FFD700" } as React.CSSProperties}
                onClick={() => tog("co", v)}>{v}</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">🎂 Faixa Etária</div>
          <div className="chips">
            {FAIXAS.map(f => (
              <div key={f.label} className={`chip ${filtros.fx === f.label ? "on" : ""}`}
                style={{ "--c": "#FFD700" } as React.CSSProperties}
                onClick={() => tog("fx", f.label)}>{f.label} anos</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">🏛️ Cargo</div>
          <div className="chips">
            {opts.ca.map(v => (
              <div key={v} className={`chip ${filtros.ca === v ? "on" : ""}`}
                style={{ "--c": "#4FA3FF" } as React.CSSProperties}
                onClick={() => tog("ca", v)}>{v}</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">💼 Profissão <span style={{ fontSize:9, color:"#556", fontWeight:400, letterSpacing:0 }}>(190 opções)</span></div>
          {filtros.oc && (
            <div style={{ marginBottom:6 }}>
              <div className="chip on" style={{ "--c": "#FFB347" } as React.CSSProperties}
                onClick={() => tog("oc", filtros.oc!)}>
                {filtros.oc} ✕
              </div>
            </div>
          )}
          <input className="srch" placeholder="Buscar profissão..."
            value={ocSearch} onChange={e => setOcSearch(e.target.value)} />
          <div className="slist">
            {ocFilt.slice(0, 80).map(v => (
              <div key={v} className={`sit ${filtros.oc === v ? "on" : ""}`}
                onClick={() => { tog("oc", v); setOcSearch(""); }}>{v}</div>
            ))}
            {ocFilt.length === 0 && <div style={{ fontSize:11, color:"#556", padding:"4px 8px" }}>Nenhuma encontrada</div>}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">📍 Município</div>
          <input className="srch" placeholder="Buscar cidade..."
            value={muSearch} onChange={e => setMuSearch(e.target.value)} />
          <div className="slist">
            {muFilt.slice(0, 60).map(m => (
              <div key={m} className={`sit ${filtros.mu === m ? "on" : ""}`}
                onClick={() => { tog("mu", m); setMuSearch(""); }}>{m}</div>
            ))}
          </div>
        </div>

        {temFiltro && (
          <button className="rst-btn" onClick={() => setFiltros({ apenasEleitos: false })}>✕ Limpar todos os filtros</button>
        )}
      </div>
    </>
  );

  return (
    <><style>{CSS}</style>

    <div className="mob-bar">
      <div className="mob-logo"><span className="lg">TE</span><span className="ly">REPRESENTA</span><span>?</span></div>
      <span style={{ fontSize:10, color:"var(--muted)" }}>PA · 2024</span>
    </div>

    <div className="app">
      {sbOpen && <div className="sb-ov" onClick={() => setSbOpen(false)} />}
      <div className={`sb ${sbOpen ? "open" : ""}`}><SidebarContent /></div>

      <div className="main">
        <div className="mhd">
          <div className="cnt-big"><span>{total.toLocaleString()}</span> candidatos</div>
          <div className="cnt-sub">
            {temFiltro
              ? `${total.toLocaleString()} candidatos correspondem ao seu perfil`
              : "Selecione características no painel para filtrar"}
          </div>
          {temFiltro && (
            <div className="pills">
              {[
                { k:"ge", v:filtros.ge }, { k:"co", v:filtros.co },
                { k:"oc", v:filtros.oc }, { k:"fx", v:filtros.fx },
                { k:"ca", v:filtros.ca }, { k:"mu", v:filtros.mu },
              ].filter(x => x.v).map(({ k, v }) => (
                <div key={k} className="pill"
                  onClick={() => setFiltros(f => ({ ...f, [k]: undefined }))}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{v}</span> ✕
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gw">
          <div className="grid">
            {resultado.length === 0 && (
              <div className="empty">
                <div className="empty-i">🔍</div>
                <div className="empty-t">Nenhum candidato encontrado</div>
                <div className="empty-s">Tente remover alguns filtros</div>
              </div>
            )}
            {resultado.map((c, i) => {
              const mge = filtros.ge === c.ge;
              const mco = filtros.co === c.co;
              const moc = filtros.oc === c.oc;
              return (
                <div className="card" key={c.rid}
                  style={{ animationDelay: `${Math.min(i, 30) * 0.025}s` } as React.CSSProperties}
                  onClick={() => setSel(c)}>

                  {c.el && <div className="edot" title="Eleito(a)" />}

                  <FotoCard c={c} />

                  <div className="cn">{c.n}</div>
                  <div className="cca">{c.ca} · {c.mu}</div>
                  <div className="cpt" style={{ background: getPtc(c.pt) }}>{c.pt}</div>
                  <div className="ctags">
                    <span className={`ctag ${mge ? "m" : ""}`}
                      style={mge ? { "--c": c.ge === "FEMININO" ? "#FF69B4" : "#4FA3FF" } as React.CSSProperties : {}}>
                      {c.ge}
                    </span>
                    <span className={`ctag ${mco ? "m" : ""}`}
                      style={mco ? { "--c": COR_COR[c.co] ?? "#FFD700" } as React.CSSProperties : {}}>
                      {c.co}
                    </span>
                    <span className={`ctag ${moc ? "m" : ""}`}
                      style={moc ? { "--c": "#FFB347" } as React.CSSProperties : {}}>
                      {c.oc.length > 20 ? c.oc.slice(0, 20) + "…" : c.oc}
                    </span>
                    <span className="ctag">{c.idade}a</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    <button className="fab" onClick={() => setSbOpen(o => !o)}>
      {sbOpen ? "✕ Fechar" : "⚙ Filtros"}
      {nAtivos > 0 && <span className="fc">{nAtivos}</span>}
    </button>

    {sel && (
      <div className="ov" onClick={e => e.target === e.currentTarget && setSel(null)}>
        <div className="modal">
          <button className="mcl" onClick={() => setSel(null)}>×</button>

          <div className="modal-top">
            <FotoModal c={sel} />
            <div className="modal-info">
              <div className="mnome">{sel.n}</div>
              <div className="mcargo">{sel.nc}</div>
              <div className="mcargo">{sel.ca} · {sel.mu} · {sel.uf}</div>
              <div className="mpt" style={{ background: getPtc(sel.pt) }}>{sel.pt}</div>
              {sel.el && <div className="elbadge">✓ ELEITO(A)</div>}
            </div>
          </div>

          <div className="mgrid">
            {[
              { l:"Sexo",        v: sel.ge },
              { l:"Etnia/Cor",   v: sel.co },
              { l:"Idade",       v: `${sel.idade} anos` },
              { l:"Escolaridade",v: sel.es.replace("ENSINO ", "") },
              { l:"Profissão",   v: sel.oc },
            ].map(({ l, v }) => (
              <div className="minfo" key={l}>
                <div className="ml">{l}</div>
                <div className="mv">{v}</div>
              </div>
            ))}
          </div>

          <div className="maviso">
            🏛️ No perfil do TSE você encontra redes sociais, propostas, bens declarados e financiamento de campanha.
          </div>
          <a className="tbtn" href={tseUrl(sel)} target="_blank" rel="noopener noreferrer">
            🗳️ Ver perfil completo no TSE
          </a>
        </div>
      </div>
    )}
    </>
  );
}
