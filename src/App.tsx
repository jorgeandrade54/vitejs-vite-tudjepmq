import { useState, useMemo, useEffect, useCallback, useRef } from "react";

interface Rede { t: string; u: string; }
interface Candidato {
  rid: number; sq: string; idade: number;
  n: string; nc: string; ca: string; pt: string;
  ge: string; co: string; oc: string; es: string;
  ue: string; uf: string;
  ql: number; ei: string; bn: number; rs: Rede[];
  ig: string; os: string;
}
interface Filtros {
  ge?: string; co?: string; oc?: string; fx?: string;
  ca?: string; es?: string; ql?: boolean; ind?: boolean; bn?: boolean;
  ig?: string; os?: string; lgbt?: boolean;
}

// Código único nacional das Eleições Gerais 2026 (mesmo para todos os estados)
const CD_ELEICAO_2026 = "20322002026";

const ESTADOS: { uf: string; nome: string; regiao: string }[] = [
  { uf:"AC", nome:"Acre", regiao:"NORTE" }, { uf:"AL", nome:"Alagoas", regiao:"NORDESTE" },
  { uf:"AP", nome:"Amapá", regiao:"NORTE" }, { uf:"AM", nome:"Amazonas", regiao:"NORTE" },
  { uf:"BA", nome:"Bahia", regiao:"NORDESTE" }, { uf:"CE", nome:"Ceará", regiao:"NORDESTE" },
  { uf:"DF", nome:"Distrito Federal", regiao:"CENTRO" }, { uf:"ES", nome:"Espírito Santo", regiao:"SUDESTE" },
  { uf:"GO", nome:"Goiás", regiao:"CENTRO" }, { uf:"MA", nome:"Maranhão", regiao:"NORDESTE" },
  { uf:"MT", nome:"Mato Grosso", regiao:"CENTRO" }, { uf:"MS", nome:"Mato Grosso do Sul", regiao:"CENTRO" },
  { uf:"MG", nome:"Minas Gerais", regiao:"SUDESTE" }, { uf:"PA", nome:"Pará", regiao:"NORTE" },
  { uf:"PB", nome:"Paraíba", regiao:"NORDESTE" }, { uf:"PR", nome:"Paraná", regiao:"SUL" },
  { uf:"PE", nome:"Pernambuco", regiao:"NORDESTE" }, { uf:"PI", nome:"Piauí", regiao:"NORDESTE" },
  { uf:"RJ", nome:"Rio de Janeiro", regiao:"SUDESTE" }, { uf:"RN", nome:"Rio Grande do Norte", regiao:"NORDESTE" },
  { uf:"RS", nome:"Rio Grande do Sul", regiao:"SUL" }, { uf:"RO", nome:"Rondônia", regiao:"NORTE" },
  { uf:"RR", nome:"Roraima", regiao:"NORTE" }, { uf:"SC", nome:"Santa Catarina", regiao:"SUL" },
  { uf:"SP", nome:"São Paulo", regiao:"SUDESTE" }, { uf:"SE", nome:"Sergipe", regiao:"NORDESTE" },
  { uf:"TO", nome:"Tocantins", regiao:"NORTE" },
];
const REGIAO_UF: Record<string,string> = Object.fromEntries(ESTADOS.map(e => [e.uf, e.regiao]));
const NOME_UF: Record<string,string> = Object.fromEntries(ESTADOS.map(e => [e.uf, e.nome]));

const FAIXAS = [
  { label:"18–30", min:18, max:30 }, { label:"31–45", min:31, max:45 },
  { label:"46–60", min:46, max:60 }, { label:"60+", min:61, max:120 },
];
const COR_COR: Record<string,string> = {
  BRANCA:"#A0845C", PRETA:"#5C3317", PARDA:"#A06830",
  AMARELA:"#C8960A", "INDÍGENA":"#7B4513",
};
const PT_COR: Record<string,string> = {
  PT:"#CC0000", PSD:"#003FA5", PSOL:"#7B00B0", MDB:"#4169E1", PP:"#2A52BE",
  NOVO:"#E87722", REDE:"#00B140", PL:"#00205C", PSB:"#E05C00", PDT:"#C00000",
  PSDB:"#0070C0", REPUBLICANOS:"#003F7F", PCDOB:"#8B0000", PODE:"#006400",
  AVANTE:"#FF6600", PRD:"#003366", DC:"#001F5B", PV:"#2E8B57", UP:"#B00000",
  SOLIDARIEDADE:"#FF4500", AGIR:"#0047AB", CIDADANIA:"#FF6B35", PMB:"#00A0A0",
  MOBILIZA:"#8B008B", "PRTB":"#003366",
};

const INFO: Record<string,{def:string;fonte:string}> = {
  ge: { def:"Descrição do gênero da candidata ou candidato. Pode assumir os valores: Masculino e Feminino.", fonte:"Registrado pela Justiça Eleitoral" },
  co: { def:"Cor/raça é autodeclarada dentre as opções: Branca, Preta, Parda, Amarela, Indígena e Não Informado.", fonte:"Autodeclarado pela candidata ou candidato" },
  fx: { def:"Idade calculada com base na data da posse para o cargo e unidade eleitoral.", fonte:"Calculado pela Justiça Eleitoral" },
  ca: { def:"Descrição do cargo ao qual a candidata ou candidato concorre.", fonte:"Registrado pela Justiça Eleitoral" },
  es: { def:"Grau de instrução: Analfabeto, Lê e escreve, Fundamental/Médio/Superior (in)completo.", fonte:"Autodeclarado pela candidata ou candidato" },
  oc: { def:"Descrição da ocupação declarada pela candidata ou candidato.", fonte:"Autodeclarado pela candidata ou candidato" },
  ql: { def:"Indica se a candidata ou candidato considera-se quilombola.", fonte:"Autodeclarado pela candidata ou candidato" },
  ind:{ def:"Etnia indígena autodeclarada, dentre as opções idênticas às do cadastro eleitoral.", fonte:"Autodeclarado pela candidata ou candidato" },
  bn: { def:"Indica se a candidata ou candidato possui bens a declarar à Justiça Eleitoral.", fonte:"Autodeclarado pela candidata ou candidato" },
  ig: { def:"Identidade de gênero autodeclarada. Só aparece para quem autorizou a divulgação ao TSE.", fonte:"Autodeclarado pela candidata ou candidato" },
  os: { def:"Orientação sexual autodeclarada. Só aparece para quem autorizou a divulgação ao TSE.", fonte:"Autodeclarado pela candidata ou candidato" },
  lgbt:{ def:"Candidatas e candidatos que se declararam transgênero ou com orientação sexual não-heterossexual e autorizaram a divulgação.", fonte:"Autodeclarado pela candidata ou candidato" },
};

const REDE_ICON: Record<string,{i:string;c:string;l:string}> = {
  instagram:{i:"📷",c:"#E1306C",l:"Instagram"}, facebook:{i:"👤",c:"#1877F2",l:"Facebook"},
  tiktok:{i:"🎵",c:"#000000",l:"TikTok"}, youtube:{i:"▶️",c:"#FF0000",l:"YouTube"},
  threads:{i:"🧵",c:"#000000",l:"Threads"}, twitter:{i:"🐦",c:"#1DA1F2",l:"X / Twitter"},
  linkedin:{i:"💼",c:"#0A66C2",l:"LinkedIn"}, kwai:{i:"📹",c:"#FF6600",l:"Kwai"},
  site:{i:"🌐",c:"#6B1FA8",l:"Site"},
};

const getIbg = (co: string) => COR_COR[co] ?? "#9B5DE5";
const getPtc = (pt: string) => PT_COR[pt] ?? "#666";
const fotoUrl = (c: Candidato) =>
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${CD_ELEICAO_2026}/${c.sq}/${c.ue}`;
const tseUrl = (c: Candidato) => {
  const re = REGIAO_UF[c.uf] ?? "NORTE";
  return `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${re}/${c.uf}/${CD_ELEICAO_2026}/${c.sq}/2026/${c.ue}`;
};

// Detecta se candidato é LGBTQIA+ (trans OU orientação não-heterossexual)
const ORIENT_LGBT = new Set(["GAY","LÉSBICA","BISSEXUAL","PANSEXUAL","ASSEXUAL"]);
const ehLGBT = (c: Candidato) => {
  const t = (c.ig || "").toUpperCase() === "TRANSGÊNERO";
  const o = ORIENT_LGBT.has((c.os || "").toUpperCase());
  return t || o;
};

function passaFiltros(c: Candidato, f: Filtros): boolean {
  if (f.ge && c.ge !== f.ge) return false;
  if (f.co && c.co !== f.co) return false;
  if (f.oc && c.oc !== f.oc) return false;
  if (f.ca && c.ca !== f.ca) return false;
  if (f.es && c.es !== f.es) return false;
  if (f.ig && c.ig !== f.ig) return false;
  if (f.os && c.os !== f.os) return false;
  if (f.lgbt && !ehLGBT(c)) return false;
  if (f.ql && !c.ql) return false;
  if (f.ind && !c.ei) return false;
  if (f.bn && !c.bn) return false;
  if (f.fx) { const fx = FAIXAS.find(x => x.label === f.fx); if (fx && (c.idade < fx.min || c.idade > fx.max)) return false; }
  return true;
}

function FotoCard({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) return <div className="foto-wrap"><img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} loading="lazy" /></div>;
  return <div className="foto-wrap foto-fb" style={{ background: `linear-gradient(135deg, ${getIbg(c.co)}, ${getIbg(c.co)}99)` }}>{c.n.charAt(0)}</div>;
}
function FotoModal({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) return <div className="mfoto-wrap"><img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} /></div>;
  return <div className="mfoto-wrap mfoto-fb" style={{ background: `linear-gradient(135deg, ${getIbg(c.co)}, ${getIbg(c.co)}99)` }}>{c.n.charAt(0)}</div>;
}

function InfoIcon({ k }: { k: string }) {
  const [open, setOpen] = useState(false);
  const info = INFO[k];
  if (!info) return null;
  return (
    <span className="info-wrap">
      <button className="info-btn" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>ⓘ</button>
      {open && (<>
        <div className="info-backdrop" onClick={e => { e.stopPropagation(); setOpen(false); }} />
        <div className="info-pop" onClick={e => e.stopPropagation()}>
          <div className="info-def">{info.def}</div>
          <div className="info-fonte">📋 {info.fonte}</div>
        </div>
      </>)}
    </span>
  );
}

function PickerModal({ title, items, selected, onSelect, onClose }: {
  title: string; items: string[]; selected?: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => items.filter(i => i.toLowerCase().includes(q.toLowerCase())), [items, q]);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 100); return () => clearTimeout(t); }, []);
  return (
    <div className="picker-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="picker-box">
        <div className="picker-hd"><div className="picker-title">{title}</div><button className="picker-close" onClick={onClose}>✕</button></div>
        <div className="picker-sw"><input ref={inputRef} className="picker-search" placeholder={`Buscar ${title.toLowerCase()}...`} value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="picker-list">
          {selected && <div className="picker-item sel" onClick={() => { onSelect(selected); onClose(); }}>✓ {selected}</div>}
          {filtered.filter(i => i !== selected).map(v => <div key={v} className="picker-item" onClick={() => { onSelect(v); onClose(); }}>{v}</div>)}
          {filtered.length === 0 && <div className="picker-empty">Nenhum resultado</div>}
        </div>
      </div>
    </div>
  );
}

// Modal de seleção de estado
function EstadoPicker({ current, onSelect, onClose }: { current: string; onSelect: (uf: string) => void; onClose: () => void; }) {
  const [q, setQ] = useState("");
  const filtered = ESTADOS.filter(e => e.nome.toLowerCase().includes(q.toLowerCase()) || e.uf.toLowerCase().includes(q.toLowerCase()));
  const regioes = ["NORTE","NORDESTE","CENTRO","SUDESTE","SUL"];
  const nomeReg: Record<string,string> = { NORTE:"Norte", NORDESTE:"Nordeste", CENTRO:"Centro-Oeste", SUDESTE:"Sudeste", SUL:"Sul" };
  return (
    <div className="picker-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="picker-box" style={{ maxHeight:"85vh" }}>
        <div className="picker-hd"><div className="picker-title">Escolha o estado</div><button className="picker-close" onClick={onClose}>✕</button></div>
        <div className="picker-sw"><input className="picker-search" placeholder="Buscar estado..." value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
        <div className="picker-list">
          {regioes.map(reg => {
            const estados = filtered.filter(e => e.regiao === reg);
            if (estados.length === 0) return null;
            return (
              <div key={reg}>
                <div className="estado-reg-label">{nomeReg[reg]}</div>
                <div className="estado-grid">
                  {estados.map(e => (
                    <div key={e.uf} className={`estado-item ${current === e.uf ? "on" : ""}`} onClick={() => { onSelect(e.uf); onClose(); }}>
                      <span className="estado-uf">{e.uf}</span>
                      <span className="estado-nome">{e.nome}</span>
                      {current === e.uf && <span className="estado-check">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="picker-empty">Nenhum estado encontrado</div>}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart, onPickEstado, estado }: { onStart: () => void; onPickEstado: () => void; estado: string; }) {
  return (
    <div className="welcome">
      <div className="welcome-inner">
        <div className="welcome-badge">🗳️ Eleições Gerais · Brasil · 2026</div>
        <img src="/logo.svg" alt="MeRepresenta" className="welcome-logo-img" />
        <p className="welcome-tag">Encontre candidatos ao legislativo que têm o mesmo perfil que você</p>

        <div className="welcome-cards">
          {[
            { icon:"⚖️", title:"Representação real", text:"O legislativo deveria ser um espelho da sociedade — mas não é. A maioria dos parlamentares ainda são homens brancos de classe alta." },
            { icon:"👥", title:"Sua identidade importa", text:"Uma professora negra conhece os problemas reais e pode propor políticas públicas que um político rico jamais pensaria." },
            { icon:"🗳️", title:"Esse espaço é nosso", text:"Filtre por perfil, descubra quem pensa como você e entre em contato direto pelas redes sociais. O poder pertence a todos." },
          ].map(({ icon, title, text }) => (
            <div key={title} className="wcard"><div className="wcard-icon">{icon}</div><div className="wcard-title">{title}</div><div className="wcard-text">{text}</div></div>
          ))}
        </div>

        <div className="welcome-mission">
          <p>O <strong>MeRepresenta</strong> nasceu de uma pergunta simples: <em>por que quem decide sobre a nossa vida não se parece com a gente?</em></p>
          <p>Comparando o Censo do IBGE com a composição do legislativo, os números são gritantes. Pretos, pardos, indígenas, mulheres e jovens são maioria na população — mas minoria no poder.</p>
          <p>Aqui você filtra candidatos ao legislativo por características, encontra quem te representa e pode segui-los nas redes — dando visibilidade a quem tem boas ideias mas não tem dinheiro de campanha.</p>
          <div className="welcome-source">🔍 Dados oficiais das Eleições Gerais 2026 · Todos os estados · Fonte: TSE</div>
        </div>

        <div className="welcome-sig">
          <div className="sig-line" />
          <div className="sig-content">
            <div className="sig-text">
              <div className="sig-label">Um projeto independente e sem fins lucrativos, idealizado e desenvolvido por</div>
              <div className="sig-name">Jorge Andrade</div>
            </div>
            <div className="sig-links">
              <a className="sig-link" href="https://instagram.com/jhor54" target="_blank" rel="noopener noreferrer"><span className="sig-emoji">📷</span> @jhor54</a>
              <a className="sig-link" href="mailto:jorgeandrade54@gmail.com"><span className="sig-emoji">✉️</span> Email</a>
            </div>
          </div>
        </div>

        <div className="welcome-cta">
          <div className="welcome-estado-box">
            <div className="web-label">📍 Comece escolhendo seu estado</div>
            <button className="web-btn" onClick={onPickEstado}>
              <span>{estado ? NOME_UF[estado] : "Escolha seu estado"}</span>
              <span className="web-arrow">▾</span>
            </button>
          </div>
          <button className="welcome-btn" onClick={onStart} disabled={!estado}>
            {estado ? `Explorar candidatos de ${NOME_UF[estado]} →` : "Escolha um estado para começar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 24;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F7F4EF;--bg2:#EEEAE2;--bg3:#FFFFFF;--border:#E2DDD5;
  --pink:#D4005A;--purple:#6B1FA8;--blue:#1A5CBE;--green:#00884A;--gold:#B8780A;
  --grad:linear-gradient(135deg,var(--pink),var(--purple));
  --text:#1A1A2E;--text2:#4A4865;--muted:#9090A8;
  --sw:272px; --radius:16px;
}
html,body,#root{min-height:100%;background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;}

.loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:var(--bg);}
.load-logo{font-family:'Bebas Neue',sans-serif;font-size:clamp(56px,12vw,110px);letter-spacing:2px;line-height:1;}
.load-logo-img{width:clamp(240px,50vw,420px);height:auto;}
.sb-logo-img{width:170px;height:auto;cursor:pointer;display:block;}
.mob-logo-img{height:28px;width:auto;cursor:pointer;}
.welcome-logo-img{width:100%;max-width:560px;height:auto;margin-bottom:16px;}
.pbar{width:200px;height:3px;border-radius:99px;background:#DDD8CF;overflow:hidden;}
.pfill{height:100%;border-radius:99px;background:var(--grad);transition:width .4s;}
.ptxt{font-size:11px;color:var(--muted);}

.welcome{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:40px 20px;}
.welcome-inner{max-width:660px;width:100%;}
.welcome-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;background:#fff;border:1.5px solid var(--border);font-size:12px;font-weight:600;color:var(--text2);margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);}
.welcome-logo{font-family:'Bebas Neue',sans-serif;font-size:clamp(60px,15vw,130px);line-height:.9;letter-spacing:2px;margin-bottom:12px;}
.wme{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.wrep{color:var(--text);}.wq{color:var(--gold);}
.welcome-tag{font-size:clamp(15px,3vw,20px);color:var(--text2);font-weight:600;margin-bottom:24px;}

.welcome-estado-box{background:#fff;border:2px solid var(--purple);border-radius:16px;padding:16px 18px;margin-bottom:16px;box-shadow:0 4px 20px rgba(107,31,168,.12);}
.welcome-cta{margin-top:28px;padding-top:28px;border-top:2px dashed var(--border);}
.web-label{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--purple);margin-bottom:8px;}
.web-btn{width:100%;padding:12px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg);font-family:inherit;font-size:16px;font-weight:700;color:var(--text);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .15s;}
.web-btn:hover{border-color:var(--purple);background:#fff;}
.web-arrow{color:var(--purple);font-size:14px;}

.welcome-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
@media(max-width:540px){.welcome-cards{grid-template-columns:1fr;}}
.wcard{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius);padding:18px 16px;box-shadow:0 2px 10px rgba(0,0,0,.05);}
.wcard-icon{font-size:24px;margin-bottom:8px;}
.wcard-title{font-weight:700;font-size:13px;color:var(--text);margin-bottom:5px;}
.wcard-text{font-size:12px;color:var(--text2);line-height:1.6;}
.welcome-mission{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius);padding:22px;margin-bottom:24px;box-shadow:0 2px 10px rgba(0,0,0,.05);}
.welcome-mission p{font-size:14px;color:var(--text2);line-height:1.8;margin-bottom:10px;}
.welcome-mission p:last-child{margin-bottom:0;}
.welcome-mission strong{color:var(--text);}
.welcome-mission em{color:var(--pink);font-style:normal;font-weight:700;}
.welcome-source{margin-top:16px;font-size:11px;color:var(--muted);padding-top:12px;border-top:1px solid var(--border);}
.welcome-btn{width:100%;padding:18px;border-radius:14px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;background:var(--grad);color:#fff;letter-spacing:.3px;transition:all .2s;box-shadow:0 6px 24px rgba(107,31,168,.3);}
.welcome-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 32px rgba(107,31,168,.45);}
.welcome-btn:disabled{opacity:.5;cursor:not-allowed;}

.welcome-sig{margin-top:32px;}
.sig-line{height:1px;background:var(--border);margin-bottom:20px;}
.sig-content{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.sig-label{font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:2px;}
.sig-name{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sig-links{display:flex;gap:10px;flex-wrap:wrap;}
.sig-link{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:12px;border:1.5px solid var(--border);background:#fff;text-decoration:none;font-size:13px;font-weight:700;color:var(--text);transition:all .18s;box-shadow:0 2px 8px rgba(0,0,0,.05);}
.sig-link:hover{border-color:var(--purple);color:var(--purple);transform:translateY(-2px);box-shadow:0 6px 16px rgba(107,31,168,.15);}
.sig-emoji{font-size:15px;}
@media(max-width:520px){.sig-content{flex-direction:column;align-items:flex-start;}}

.app{display:flex;min-height:100vh;}
.sb{width:var(--sw);flex-shrink:0;background:var(--bg3);border-right:1.5px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;overflow:hidden;transition:transform .3s cubic-bezier(.4,0,.2,1);box-shadow:2px 0 16px rgba(0,0,0,.06);}
.sb-hd{padding:20px 18px 14px;border-bottom:1.5px solid var(--border);flex-shrink:0;}
.sb-logo{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:2px;cursor:pointer;}
.sb-logo .lme{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sb-logo .lrep{color:var(--text);}.sb-logo .lq{color:var(--gold);}
.logo-sub{font-size:10px;color:var(--muted);margin-top:1px;}
.sb-estado-btn{margin-top:10px;width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--purple);background:rgba(107,31,168,.05);color:var(--purple);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .15s;}
.sb-estado-btn:hover{background:rgba(107,31,168,.1);}
.sb-body{flex:1;overflow-y:auto;padding:14px 16px 80px;}
.sb-body::-webkit-scrollbar{width:3px;}
.sb-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}

.aviso{background:#FFFBEC;border:1px solid #F5D060;border-radius:10px;padding:9px 11px;font-size:10px;color:#7A6000;line-height:1.5;margin-bottom:14px;}
.aviso strong{color:#5A4400;}
.fsec{margin-bottom:18px;}
.ftit{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:4px;}
.chips{display:flex;flex-wrap:wrap;gap:5px;}
.chip{padding:5px 12px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--bg);color:var(--text2);transition:all .18s;user-select:none;white-space:nowrap;}
.chip:hover{border-color:var(--purple);color:var(--purple);background:#fff;}
.chip.on{border-color:var(--c,var(--purple));background:var(--c,var(--purple));color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.18);}

.info-wrap{position:relative;display:inline-flex;}
.info-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0;line-height:1;transition:color .15s;}
.info-btn:hover{color:var(--purple);}
.info-backdrop{position:fixed;inset:0;z-index:150;}
.info-pop{position:absolute;top:20px;left:0;z-index:151;width:230px;background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);animation:popIn .15s ease;}
@keyframes popIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.info-def{font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:8px;font-weight:400;text-transform:none;letter-spacing:0;}
.info-fonte{font-size:10px;color:var(--purple);font-weight:700;padding-top:8px;border-top:1px solid var(--border);text-transform:none;letter-spacing:0;}

.toggle-filter{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg);margin-bottom:6px;cursor:pointer;transition:all .15s;}
.toggle-filter:hover{border-color:var(--purple);}
.toggle-filter.on{border-color:var(--pink);background:rgba(212,0,90,.05);}
.tf-label{font-size:12px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;}
.tf-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.toggle-filter.on .tf-check{background:var(--pink);border-color:var(--pink);color:#fff;font-size:12px;}

.sel-btn{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg);color:var(--text2);font-family:inherit;font-size:12px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;transition:all .15s;}
.sel-btn:hover{border-color:var(--purple);background:#fff;}
.sel-arrow{font-size:10px;color:var(--muted);}
.srch{width:100%;padding:8px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg);color:var(--text);font-family:inherit;font-size:12px;margin-bottom:6px;outline:none;transition:.15s;}
.srch:focus{border-color:var(--purple);background:#fff;}
.slist{display:flex;flex-direction:column;gap:1px;max-height:140px;overflow-y:auto;}
.slist::-webkit-scrollbar{width:3px;}
.slist::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}
.sit{padding:6px 8px;border-radius:8px;font-size:11px;cursor:pointer;color:var(--text2);transition:all .12s;}
.sit:hover{background:var(--bg2);color:var(--purple);}
.sit.on{background:rgba(107,31,168,.08);color:var(--purple);font-weight:700;}
.rst-btn{width:100%;padding:9px;border-radius:10px;border:1.5px dashed rgba(212,0,90,.3);background:transparent;color:var(--pink);font-family:inherit;font-size:12px;cursor:pointer;transition:all .2s;margin-top:6px;font-weight:700;}
.rst-btn:hover{background:rgba(212,0,90,.06);}

.main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;min-height:100vh;}
.hero{padding:28px 28px 0;background:var(--bg);}
.hero-inner{background:var(--grad);border-radius:22px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;overflow:hidden;position:relative;}
.hero-inner::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.07);}
.hero-inner::before{content:'';position:absolute;right:60px;bottom:-60px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.05);}
.hero-left{position:relative;z-index:1;}
.hero-estado{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:99px;margin-bottom:10px;cursor:pointer;transition:all .15s;backdrop-filter:blur(10px);}
.hero-estado:hover{background:rgba(255,255,255,.3);}
.hero-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,7vw,80px);color:#fff;letter-spacing:2px;line-height:1;}
.hero-label{font-size:15px;font-weight:600;color:rgba(255,255,255,.85);margin-top:4px;}
.hero-sub{font-size:12px;color:rgba(255,255,255,.65);margin-top:4px;}
.hero-right{display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:1;}
.hero-stat{background:rgba(255,255,255,.15);border-radius:12px;padding:10px 16px;text-align:center;backdrop-filter:blur(10px);}
.hero-stat-n{font-family:'Bebas Neue',sans-serif;font-size:24px;color:#fff;line-height:1;}
.hero-stat-l{font-size:10px;color:rgba(255,255,255,.75);font-weight:600;letter-spacing:.5px;text-transform:uppercase;}

.filter-bar{padding:16px 28px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.fb-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;white-space:nowrap;}
.fb-chip{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;background:var(--grad);color:#fff;cursor:pointer;transition:all .15s;animation:chipIn .2s ease;}
.fb-chip:hover{opacity:.85;transform:scale(.97);}
.fb-chip span{font-size:11px;opacity:.8;}
@keyframes chipIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.fb-clear{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;border:1.5px solid rgba(212,0,90,.3);color:var(--pink);background:transparent;cursor:pointer;transition:all .15s;}
.fb-clear:hover{background:rgba(212,0,90,.07);}

.gw{padding:18px 28px 40px;flex:1;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;}
.card{background:var(--bg3);border:1.5px solid var(--border);border-radius:20px;overflow:hidden;cursor:pointer;transition:transform .22s,box-shadow .22s,border-color .22s;box-shadow:0 2px 8px rgba(0,0,0,.05);animation:fadeUp .3s ease both;}
.card:hover{transform:translateY(-5px);border-color:rgba(107,31,168,.25);box-shadow:0 12px 32px rgba(107,31,168,.14);}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.foto-wrap{width:100%;height:170px;overflow:hidden;position:relative;background:var(--bg2);}
.foto-wrap img{width:100%;height:100%;object-fit:cover;object-position:top center;transition:transform .3s;}
.card:hover .foto-wrap img{transform:scale(1.04);}
.foto-fb{display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:56px;color:#fff;}
.card-badges{position:absolute;top:10px;left:10px;display:flex;flex-direction:column;gap:4px;}
.badge-q{background:#00884A;color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:99px;letter-spacing:.3px;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.badge-i{background:#7B4513;color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:99px;letter-spacing:.3px;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.badge-lgbt{background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:99px;letter-spacing:.3px;box-shadow:0 2px 8px rgba(0,0,0,.3);text-shadow:0 1px 2px rgba(0,0,0,.4);}
.rede-count{position:absolute;bottom:10px;right:10px;background:rgba(255,255,255,.92);color:var(--purple);font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;backdrop-filter:blur(4px);display:flex;align-items:center;gap:3px;}
.card-body{padding:14px;}
.card-name{font-weight:700;font-size:13px;line-height:1.3;margin-bottom:2px;color:var(--text);}
.card-cargo{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;}
.card-pt{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;color:#fff;margin-bottom:10px;}
.card-tags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;}
.ctag{font-size:10px;padding:3px 8px;border-radius:99px;border:1px solid var(--border);color:var(--text2);background:var(--bg);}
.ctag.m{border-color:var(--c);color:var(--c);background:rgba(107,31,168,.06);}
.card-btn{display:flex;align-items:center;justify-content:center;width:100%;padding:9px;border-radius:10px;border:1.5px solid var(--border);background:transparent;font-family:inherit;font-size:12px;font-weight:700;color:var(--purple);cursor:pointer;transition:all .18s;gap:4px;}
.card-btn:hover{background:var(--grad);border-color:transparent;color:#fff;}

.load-more-wrap{text-align:center;padding:0 28px 40px;}
.load-more-btn{padding:14px 40px;border-radius:12px;border:2px solid var(--border);background:#fff;font-family:inherit;font-size:14px;font-weight:700;color:var(--text2);cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.05);}
.load-more-btn:hover{border-color:var(--purple);color:var(--purple);transform:translateY(-2px);box-shadow:0 6px 20px rgba(107,31,168,.12);}

.ov{position:fixed;inset:0;background:rgba(26,26,46,.55);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fin .2s;backdrop-filter:blur(4px);}
@media(min-width:600px){.ov{align-items:center;}}
.modal{background:var(--bg3);border:1.5px solid var(--border);width:100%;max-width:480px;border-radius:24px 24px 0 0;padding:28px 24px;position:relative;animation:sup .26s cubic-bezier(.4,0,.2,1);max-height:92vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,.1);}
@media(min-width:600px){.modal{border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.18);}}
@keyframes sup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@keyframes fin{from{opacity:0}to{opacity:1}}
.mcl{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:16px;transition:all .15s;z-index:2;}
.mcl:hover{background:var(--bg);color:var(--text);}
.modal-top{display:flex;gap:18px;align-items:flex-start;margin-bottom:18px;}
.mfoto-wrap{width:90px;height:90px;border-radius:16px;overflow:hidden;flex-shrink:0;border:2px solid var(--border);}
.mfoto-wrap img{width:100%;height:100%;object-fit:cover;object-position:top;}
.mfoto-fb{width:90px;height:90px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:42px;color:#fff;flex-shrink:0;}
.modal-info{flex:1;min-width:0;}
.mnome{font-weight:800;font-size:18px;line-height:1.2;margin-bottom:3px;color:var(--text);}
.mcargo{font-size:12px;color:var(--muted);margin-bottom:3px;}
.mpt{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;color:#fff;margin-top:6px;}
.mbadges{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
.mbadge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;}
.mbadge.q{background:rgba(0,136,74,.1);border:1.5px solid rgba(0,136,74,.25);color:var(--green);}
.mbadge.i{background:rgba(123,69,19,.1);border:1.5px solid rgba(123,69,19,.25);color:#7B4513;}
.mbadge.lgbt{background:linear-gradient(90deg,rgba(228,3,3,.12),rgba(255,140,0,.12),rgba(0,128,38,.12),rgba(0,77,255,.12),rgba(117,7,135,.12));border:1.5px solid rgba(117,7,135,.3);color:#750787;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0;}
.minfo{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:11px;}
.ml{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.mv{font-size:12px;font-weight:600;line-height:1.3;color:var(--text);}

.redes-sec{margin:16px 0;}
.redes-tit{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text2);margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.redes-grid{display:flex;flex-wrap:wrap;gap:8px;}
.rede-link{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg);text-decoration:none;font-size:12px;font-weight:700;color:var(--text);transition:all .18s;}
.rede-link:hover{border-color:var(--c);background:#fff;transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.1);}
.rede-emoji{font-size:16px;}
.redes-empty{font-size:12px;color:var(--muted);padding:12px;background:var(--bg2);border-radius:12px;text-align:center;line-height:1.5;}

.maviso{background:#FFFBEC;border:1px solid #F5D060;border-radius:10px;padding:9px 11px;font-size:10px;color:#7A6000;line-height:1.5;margin-bottom:14px;}
.tbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px;border-radius:13px;font-family:inherit;font-size:14px;font-weight:800;background:var(--grad);color:#fff;border:none;cursor:pointer;transition:all .2s;text-decoration:none;box-shadow:0 4px 16px rgba(107,31,168,.25);}
.tbtn:hover{opacity:.92;transform:translateY(-1px);}

.picker-ov{position:fixed;inset:0;background:rgba(26,26,46,.55);z-index:300;display:flex;align-items:flex-end;justify-content:center;animation:fin .2s;backdrop-filter:blur(4px);}
@media(min-width:600px){.picker-ov{align-items:center;}}
.picker-box{background:var(--bg3);width:100%;max-width:480px;border-radius:24px 24px 0 0;display:flex;flex-direction:column;max-height:82vh;box-shadow:0 -8px 40px rgba(0,0,0,.12);}
@media(min-width:600px){.picker-box{border-radius:24px;}}
.picker-hd{display:flex;justify-content:space-between;align-items:center;padding:18px 20px 12px;border-bottom:1.5px solid var(--border);}
.picker-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.picker-close{background:var(--bg2);border:1.5px solid var(--border);color:var(--text2);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}
.picker-sw{padding:12px 18px;flex-shrink:0;}
.picker-search{width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid rgba(107,31,168,.25);background:var(--bg2);color:var(--text);font-family:inherit;font-size:14px;outline:none;}
.picker-search:focus{border-color:var(--purple);}
.picker-list{flex:1;overflow-y:auto;padding:0 18px 32px;}
.picker-list::-webkit-scrollbar{width:3px;}
.picker-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}
.picker-item{padding:14px 12px;border-bottom:1px solid var(--border);font-size:14px;cursor:pointer;color:var(--text);transition:all .12s;border-radius:8px;}
.picker-item:hover{background:rgba(107,31,168,.06);color:var(--purple);}
.picker-item.sel{color:var(--pink);font-weight:700;}
.picker-empty{text-align:center;padding:28px;color:var(--muted);font-size:13px;}

.estado-reg-label{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--purple);margin:16px 0 8px;}
.estado-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
@media(max-width:480px){.estado-grid{grid-template-columns:1fr;}}
.estado-item{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg);cursor:pointer;transition:all .15s;position:relative;}
.estado-item:hover{border-color:var(--purple);background:#fff;transform:translateY(-1px);}
.estado-item.on{border-color:var(--pink);background:rgba(212,0,90,.05);}
.estado-uf{font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--purple);letter-spacing:1px;min-width:32px;}
.estado-nome{font-size:12px;font-weight:600;color:var(--text);}
.estado-check{position:absolute;right:12px;color:var(--pink);font-weight:800;}

.mob-bar{display:none;}.fab{display:none;}.sb-pull{display:none;}.sb-ov{display:none;}.sb-close-btn{display:none;}
@media(max-width:767px){
  :root{--sw:100%;}
  .sb{position:fixed;top:auto;bottom:0;left:0;right:0;height:91vh;border-right:none;border-top:2px solid var(--border);border-radius:24px 24px 0 0;transform:translateY(100%);box-shadow:0 -8px 40px rgba(0,0,0,.1);}
  .sb.open{transform:translateY(0);}
  .sb-pull{display:block;width:40px;height:4px;border-radius:99px;background:var(--border);margin:12px auto 0;flex-shrink:0;}
  .sb-hd{padding-top:12px;position:relative;}
  .sb-close-btn{display:flex;position:absolute;top:12px;right:14px;width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg2);align-items:center;justify-content:center;color:var(--text2);font-size:14px;cursor:pointer;}
  .sb-ov{position:fixed;inset:0;background:rgba(26,26,46,.5);z-index:99;animation:fin .2s;}
  .main{margin-left:0;}
  .mob-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg3);border-bottom:1.5px solid var(--border);position:sticky;top:0;z-index:60;box-shadow:0 2px 10px rgba(0,0,0,.06);}
  .mob-logo{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;}
  .mob-estado{font-size:11px;font-weight:700;color:var(--purple);background:rgba(107,31,168,.08);padding:4px 10px;border-radius:99px;cursor:pointer;border:1px solid rgba(107,31,168,.2);}
  .hero{padding:14px 14px 0;}.hero-inner{padding:20px;}
  .filter-bar{padding:12px 14px 0;}
  .gw{padding:12px 14px 100px;}
  .grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px;}
  .foto-wrap{height:140px;}
  .fab{display:flex;position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:90;align-items:center;gap:8px;padding:13px 26px;border-radius:99px;background:var(--grad);color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 24px rgba(107,31,168,.4);white-space:nowrap;}
  .fc{background:rgba(0,0,0,.25);border-radius:99px;padding:1px 7px;font-size:10px;}
  .desktop-only{display:none !important;}
  .load-more-wrap{padding:0 14px 100px;}
}
@media(min-width:768px){.mobile-only{display:none !important;}}

.empty{grid-column:1/-1;text-align:center;padding:60px 20px;}
.empty-i{font-size:48px;margin-bottom:14px;}
.empty-t{font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--muted);}
.empty-s{font-size:13px;color:var(--muted);margin-top:6px;}
`;

export default function App() {
  const [estado, setEstado] = useState<string>(() => {
    try { return localStorage.getItem("mr_estado") || ""; } catch { return ""; }
  });
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading]       = useState(false);
  const [pct, setPct]               = useState(0);
  const [msg, setMsg]               = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [filtros, setFiltros]       = useState<Filtros>({});
  const [ocSearch, setOcSearch]     = useState("");
  const [sbOpen, setSbOpen]         = useState(false);
  const [sel, setSel]               = useState<Candidato | null>(null);
  const [pickerOc, setPickerOc]     = useState(false);
  const [pickerEs, setPickerEs]     = useState(false);
  const [pickerEstado, setPickerEstado] = useState(false);
  const [page, setPage]             = useState(1);

  // Carregar dados do estado selecionado
  const carregarEstado = useCallback((uf: string) => {
    setLoading(true); setPct(20); setMsg(`Carregando candidatos de ${NOME_UF[uf]}...`);
    setCandidatos([]); setFiltros({}); setPage(1);
    fetch(`/candidatos_${uf}.json`)
      .then(r => r.json())
      .then((d: Candidato[]) => {
        setPct(100);
        setTimeout(() => { setCandidatos(d); setLoading(false); }, 300);
      })
      .catch(() => { setMsg(`Erro ao carregar ${uf}. Verifique candidatos_${uf}.json na pasta public.`); });
  }, []);

  useEffect(() => {
    if (estado) carregarEstado(estado);
  }, []);

  const escolherEstado = (uf: string) => {
    setEstado(uf);
    try { localStorage.setItem("mr_estado", uf); } catch {}
    carregarEstado(uf);
    setShowWelcome(false);
  };

  const opts = useMemo(() => {
    const u = (a: string[]) => [...new Set(a)].filter(Boolean).sort();
    return {
      ge: u(candidatos.map(c => c.ge)),
      co: u(candidatos.map(c => c.co)).filter(c => c !== "NÃO INFORMADO"),
      oc: u(candidatos.map(c => c.oc)),
      ca: u(candidatos.map(c => c.ca)),
      es: u(candidatos.map(c => c.es)),
      ig: u(candidatos.map(c => c.ig)).filter(v => v !== "Prefere não informar"),
      os: u(candidatos.map(c => c.os)).filter(v => v !== "Prefere não informar"),
    };
  }, [candidatos]);

  const nLGBT = useMemo(() => candidatos.filter(ehLGBT).length, [candidatos]);

  const ocFilt = useMemo(() => opts.oc.filter(o => o.toLowerCase().includes(ocSearch.toLowerCase())), [opts.oc, ocSearch]);

  const tog = useCallback((cat: keyof Filtros, val: string) => {
    setFiltros(f => ({ ...f, [cat]: f[cat] === val ? undefined : val })); setPage(1);
  }, []);
  const togBool = useCallback((cat: keyof Filtros) => {
    setFiltros(f => ({ ...f, [cat]: f[cat] ? undefined : true })); setPage(1);
  }, []);

  const filtrados = useMemo(() => {
    const keys = Object.keys(filtros) as (keyof Filtros)[];
    const temFiltro = keys.some(k => filtros[k]);
    return candidatos.filter(c => temFiltro ? passaFiltros(c, filtros) : true);
  }, [candidatos, filtros]);

  const resultado = useMemo(() => filtrados.slice(0, page * PAGE_SIZE), [filtrados, page]);
  const hasMore = resultado.length < filtrados.length;
  const comRedes = useMemo(() => candidatos.filter(c => c.rs.length > 0).length, [candidatos]);
  const nAtivos = (Object.keys(filtros) as (keyof Filtros)[]).filter(k => filtros[k]).length;
  const temFiltro = nAtivos > 0;
  const closeSb = useCallback(() => setSbOpen(false), []);

  // Tela de boas-vindas
  if (showWelcome && !temFiltro) return (
    <><style>{CSS}</style>
      <WelcomeScreen onStart={() => { if (estado) setShowWelcome(false); }} onPickEstado={() => setPickerEstado(true)} estado={estado} />
      {pickerEstado && <EstadoPicker current={estado} onSelect={escolherEstado} onClose={() => setPickerEstado(false)} />}
    </>
  );

  if (loading) return (
    <><style>{CSS}</style>
    <div className="loading">
      <img src="/logo.svg" alt="MeRepresenta" className="load-logo-img" />
      <div className="pbar"><div className="pfill" style={{width:`${pct}%`}}/></div>
      <div className="ptxt">{msg}</div>
    </div></>
  );

  const nomeFiltro: Record<string,string> = { ql:"Quilombola", ind:"Indígena", bn:"Declarou bens", lgbt:"LGBTQIA+" };
  const ativosList: {k:string;v:string}[] = [];
  (["ge","co","oc","fx","ca","es","ig","os"] as const).forEach(k => { if (filtros[k]) ativosList.push({k, v:String(filtros[k])}); });
  (["lgbt","ql","ind","bn"] as const).forEach(k => { if (filtros[k]) ativosList.push({k, v:nomeFiltro[k]}); });

  const SidebarContent = () => (
    <>
      <div className="sb-pull"/>
      <div className="sb-hd">
        <img src="/logo.svg" alt="MeRepresenta" className="sb-logo-img" onClick={()=>setShowWelcome(true)} />
        <div className="logo-sub">Eleições Gerais 2026 · Legislativo</div>
        <button className="sb-estado-btn" onClick={()=>setPickerEstado(true)}>
          <span>📍 {NOME_UF[estado]}</span><span>trocar ▾</span>
        </button>
        <button className="sb-close-btn" onClick={closeSb}>✕</button>
      </div>
      <div className="sb-body">
        <div className="aviso">
          <strong>⚠️ Dados TSE:</strong> As informações vêm do arquivo oficial de candidatos. Clique no ⓘ de cada filtro para ver a definição e quem preencheu o dado.
        </div>
        <div className="fsec">
          <div className="ftit">✊ Representatividade</div>
          <div className={`toggle-filter ${filtros.lgbt?"on":""}`} onClick={()=>togBool("lgbt")}>
            <span className="tf-label">🏳️‍🌈 LGBTQIA+ <InfoIcon k="lgbt"/></span><span className="tf-check">{filtros.lgbt?"✓":""}</span>
          </div>
          <div className={`toggle-filter ${filtros.ql?"on":""}`} onClick={()=>togBool("ql")}>
            <span className="tf-label">🏴 Quilombola <InfoIcon k="ql"/></span><span className="tf-check">{filtros.ql?"✓":""}</span>
          </div>
          <div className={`toggle-filter ${filtros.ind?"on":""}`} onClick={()=>togBool("ind")}>
            <span className="tf-label">🪶 Indígena <InfoIcon k="ind"/></span><span className="tf-check">{filtros.ind?"✓":""}</span>
          </div>
          {nLGBT>0 && <div style={{fontSize:10,color:"var(--muted)",marginTop:6,lineHeight:1.4}}>{nLGBT} candidatos LGBTQIA+ neste estado.</div>}
        </div>
        <div className="fsec">
          <div className="ftit">⚥ Sexo <InfoIcon k="ge"/></div>
          <div className="chips">
            {opts.ge.map(v => <div key={v} className={`chip ${filtros.ge===v?"on":""}`} style={{"--c":v==="FEMININO"?"#D4005A":"#1A5CBE"} as React.CSSProperties} onClick={()=>tog("ge",v)}>{v}</div>)}
          </div>
        </div>
        {opts.ig.length>0 && (
          <div className="fsec">
            <div className="ftit">🌈 Identidade de gênero <InfoIcon k="ig"/></div>
            <div className="chips">
              {opts.ig.map(v => <div key={v} className={`chip ${filtros.ig===v?"on":""}`} style={{"--c":v==="Transgênero"?"#9B5DE5":"#6B7280"} as React.CSSProperties} onClick={()=>tog("ig",v)}>{v}</div>)}
            </div>
          </div>
        )}
        {opts.os.length>0 && (
          <div className="fsec">
            <div className="ftit">💗 Orientação sexual <InfoIcon k="os"/></div>
            <div className="chips">
              {opts.os.map(v => <div key={v} className={`chip ${filtros.os===v?"on":""}`} style={{"--c":v==="Heterossexual"?"#6B7280":"#D4005A"} as React.CSSProperties} onClick={()=>tog("os",v)}>{v}</div>)}
            </div>
          </div>
        )}
        <div className="fsec">
          <div className="ftit">🌿 Etnia / Cor <InfoIcon k="co"/></div>
          <div className="chips">
            {opts.co.map(v => <div key={v} className={`chip ${filtros.co===v?"on":""}`} style={{"--c":COR_COR[v]??"#6B1FA8"} as React.CSSProperties} onClick={()=>tog("co",v)}>{v}</div>)}
          </div>
        </div>
        <div className="fsec">
          <div className="ftit">🎂 Faixa Etária <InfoIcon k="fx"/></div>
          <div className="chips">
            {FAIXAS.map(f => <div key={f.label} className={`chip ${filtros.fx===f.label?"on":""}`} style={{"--c":"#6B1FA8"} as React.CSSProperties} onClick={()=>tog("fx",f.label)}>{f.label} anos</div>)}
          </div>
        </div>
        <div className="fsec">
          <div className="ftit">🏛️ Cargo <InfoIcon k="ca"/></div>
          <div className="chips">
            {opts.ca.map(v => <div key={v} className={`chip ${filtros.ca===v?"on":""}`} style={{"--c":"#1A5CBE"} as React.CSSProperties} onClick={()=>tog("ca",v)}>{v}</div>)}
          </div>
        </div>
        <div className="fsec">
          <div className="ftit">🎓 Escolaridade <InfoIcon k="es"/></div>
          <button className="sel-btn" onClick={()=>setPickerEs(true)} style={filtros.es?{borderColor:"#00884A",color:"#00884A"} as React.CSSProperties:{}}>
            <span>{filtros.es??"Selecionar escolaridade..."}</span>
            {filtros.es?<span onClick={e=>{e.stopPropagation();tog("es",filtros.es!);}} style={{color:"#D4005A"}}>✕</span>:<span className="sel-arrow">▼</span>}
          </button>
        </div>
        <div className="fsec">
          <div className="ftit">💼 Profissão <InfoIcon k="oc"/> <span style={{fontSize:9,color:"var(--muted)",fontWeight:400,letterSpacing:0}}>({opts.oc.length})</span></div>
          <button className="sel-btn mobile-only" onClick={()=>setPickerOc(true)} style={filtros.oc?{borderColor:"#D4005A",color:"#D4005A"} as React.CSSProperties:{}}>
            <span>{filtros.oc??"Selecionar profissão..."}</span>
            {filtros.oc?<span onClick={e=>{e.stopPropagation();tog("oc",filtros.oc!);}} style={{color:"#D4005A"}}>✕</span>:<span className="sel-arrow">▼</span>}
          </button>
          <div className="desktop-only">
            {filtros.oc&&<div style={{marginBottom:6}}><div className="chip on" style={{"--c":"#D4005A"} as React.CSSProperties} onClick={()=>tog("oc",filtros.oc!)}>{filtros.oc} ✕</div></div>}
            <input className="srch" placeholder="Buscar profissão..." value={ocSearch} onChange={e=>setOcSearch(e.target.value)}/>
            <div className="slist">
              {ocFilt.slice(0,80).map(v=><div key={v} className={`sit ${filtros.oc===v?"on":""}`} onClick={()=>{tog("oc",v);setOcSearch("");}}>{v}</div>)}
              {ocFilt.length===0&&<div style={{fontSize:11,color:"var(--muted)",padding:"4px 8px"}}>Nenhuma encontrada</div>}
            </div>
          </div>
        </div>
        <div className="fsec">
          <div className="ftit">💰 Patrimônio</div>
          <div className={`toggle-filter ${filtros.bn?"on":""}`} onClick={()=>togBool("bn")}>
            <span className="tf-label">📄 Declarou bens <InfoIcon k="bn"/></span><span className="tf-check">{filtros.bn?"✓":""}</span>
          </div>
        </div>
        {temFiltro&&<button className="rst-btn" onClick={()=>{setFiltros({});setPage(1);}}>✕ Limpar todos os filtros</button>}
      </div>
    </>
  );

  return (
    <><style>{CSS}</style>
    <div className="mob-bar">
      <img src="/logo.svg" alt="MeRepresenta" className="mob-logo-img" onClick={()=>setShowWelcome(true)} />
      <span className="mob-estado" onClick={()=>setPickerEstado(true)}>📍 {estado} ▾</span>
    </div>

    <div className="app">
      {sbOpen&&<div className="sb-ov" onClick={closeSb}/>}
      <div className={`sb ${sbOpen?"open":""}`}><SidebarContent/></div>

      <div className="main">
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-left">
              <div className="hero-estado" onClick={()=>setPickerEstado(true)}>📍 {NOME_UF[estado]} · trocar</div>
              <div className="hero-num">{filtrados.length.toLocaleString()}</div>
              <div className="hero-label">{temFiltro?"candidatos correspondem ao seu perfil":"candidatos ao legislativo"}</div>
              <div className="hero-sub">{temFiltro?"Ajuste os filtros para refinar":`Eleições Gerais 2026 · ${NOME_UF[estado]}`}</div>
            </div>
            <div className="hero-right">
              <div className="hero-stat"><div className="hero-stat-n">{comRedes}</div><div className="hero-stat-l">Com redes</div></div>
              <div className="hero-stat"><div className="hero-stat-n">{opts.ca.length}</div><div className="hero-stat-l">Cargos</div></div>
              <div className="hero-stat"><div className="hero-stat-n">{opts.oc.length}</div><div className="hero-stat-l">Profissões</div></div>
            </div>
          </div>
        </div>

        {temFiltro && (
          <div className="filter-bar">
            <span className="fb-label">Filtros:</span>
            {ativosList.map(({k,v})=><div key={k} className="fb-chip" onClick={()=>setFiltros(f=>({...f,[k]:undefined}))}>{v} <span>✕</span></div>)}
            <button className="fb-clear" onClick={()=>{setFiltros({});setPage(1);}}>Limpar tudo</button>
          </div>
        )}

        <div className="gw">
          <div className="grid">
            {resultado.length===0&&(
              <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">Nenhum candidato encontrado</div><div className="empty-s">Tente remover alguns filtros</div></div>
            )}
            {resultado.map((c,i)=>{
              const mge=filtros.ge===c.ge, mco=filtros.co===c.co;
              return (
                <div className="card" key={c.rid} style={{animationDelay:`${Math.min(i%PAGE_SIZE,20)*.03}s`} as React.CSSProperties} onClick={()=>setSel(c)}>
                  <div style={{position:"relative"}}>
                    <FotoCard c={c}/>
                    <div className="card-badges">
                      {ehLGBT(c)&&<span className="badge-lgbt">🏳️‍🌈 {c.ig==="Transgênero"?"Trans":c.os}</span>}
                      {c.ql===1&&<span className="badge-q">🏴 Quilombola</span>}
                      {c.ei&&<span className="badge-i">🪶 {c.ei}</span>}
                    </div>
                    {c.rs.length>0&&<div className="rede-count">🔗 {c.rs.length}</div>}
                  </div>
                  <div className="card-body">
                    <div className="card-name">{c.n}</div>
                    <div className="card-cargo">{c.ca}</div>
                    <div className="card-pt" style={{background:getPtc(c.pt)}}>{c.pt}</div>
                    <div className="card-tags">
                      <span className={`ctag ${mge?"m":""}`} style={mge?{"--c":c.ge==="FEMININO"?"#D4005A":"#1A5CBE"} as React.CSSProperties:{}}>{c.ge}</span>
                      <span className={`ctag ${mco?"m":""}`} style={mco?{"--c":COR_COR[c.co]??"#6B1FA8"} as React.CSSProperties:{}}>{c.co}</span>
                      <span className="ctag">{c.idade}a</span>
                    </div>
                    <button className="card-btn">Ver perfil →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {hasMore&&(
          <div className="load-more-wrap">
            <button className="load-more-btn" onClick={()=>setPage(p=>p+1)}>Carregar mais candidatos ↓</button>
          </div>
        )}
      </div>
    </div>

    <button className="fab" onClick={()=>setSbOpen(o=>!o)}>
      {sbOpen?"✕ Fechar":"⚙ Filtros"}{nAtivos>0&&<span className="fc">{nAtivos}</span>}
    </button>

    {pickerEstado&&<EstadoPicker current={estado} onSelect={escolherEstado} onClose={()=>setPickerEstado(false)}/>}
    {pickerOc&&<PickerModal title="Profissão" items={opts.oc} selected={filtros.oc} onSelect={v=>{tog("oc",v);setPickerOc(false);}} onClose={()=>setPickerOc(false)}/>}
    {pickerEs&&<PickerModal title="Escolaridade" items={opts.es} selected={filtros.es} onSelect={v=>{tog("es",v);setPickerEs(false);}} onClose={()=>setPickerEs(false)}/>}

    {sel&&(
      <div className="ov" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
        <div className="modal">
          <button className="mcl" onClick={()=>setSel(null)}>×</button>
          <div className="modal-top">
            <FotoModal c={sel}/>
            <div className="modal-info">
              <div className="mnome">{sel.n}</div>
              <div className="mcargo">{sel.nc}</div>
              <div className="mcargo">{sel.ca} · {NOME_UF[sel.uf]}</div>
              <div className="mpt" style={{background:getPtc(sel.pt)}}>{sel.pt}</div>
              <div className="mbadges">
                {ehLGBT(sel)&&<span className="mbadge lgbt">🏳️‍🌈 LGBTQIA+</span>}
                {sel.ql===1&&<span className="mbadge q">🏴 Quilombola</span>}
                {sel.ei&&<span className="mbadge i">🪶 {sel.ei}</span>}
              </div>
            </div>
          </div>
          <div className="mgrid">
            {[{l:"Sexo",v:sel.ge},{l:"Etnia/Cor",v:sel.co},{l:"Idade",v:`${sel.idade} anos`},{l:"Escolaridade",v:sel.es.replace("ENSINO ","")},{l:"Profissão",v:sel.oc},{l:"Declarou bens",v:sel.bn?"Sim":"Não"},
              ...(sel.ig?[{l:"Identidade de gênero",v:sel.ig}]:[]),
              ...(sel.os?[{l:"Orientação sexual",v:sel.os}]:[])]
              .map(({l,v})=><div className="minfo" key={l}><div className="ml">{l}</div><div className="mv">{v}</div></div>)}
          </div>
          <div className="redes-sec">
            <div className="redes-tit">🔗 Redes sociais & contato</div>
            {sel.rs.length>0 ? (
              <div className="redes-grid">
                {sel.rs.map((r,i)=>{
                  const info = REDE_ICON[r.t] ?? REDE_ICON.site;
                  return <a key={i} className="rede-link" href={r.u} target="_blank" rel="noopener noreferrer" style={{"--c":info.c} as React.CSSProperties}><span className="rede-emoji">{info.i}</span> {info.l}</a>;
                })}
              </div>
            ) : <div className="redes-empty">Este candidato não informou redes sociais ao TSE.</div>}
          </div>
          <div className="maviso">🏛️ No perfil oficial do TSE você encontra bens declarados, propostas e prestação de contas de campanha.</div>
          <a className="tbtn" href={tseUrl(sel)} target="_blank" rel="noopener noreferrer">🗳️ Ver perfil completo no TSE</a>
        </div>
      </div>
    )}
    </>
  );
}
