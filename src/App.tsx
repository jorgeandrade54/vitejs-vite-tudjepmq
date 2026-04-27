import { useState, useMemo, useEffect, useCallback, useRef } from "react";

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
  { label:"46–60", min:46, max:60 }, { label:"60+", min:61, max:99 },
];
const COR_COR: Record<string,string> = {
  BRANCA:"#C8A87A", PRETA:"#7B4A2A", PARDA:"#C68B4E",
  AMARELA:"#E6B800", "INDÍGENA":"#8B5513",
};
const PT_COR: Record<string,string> = {
  PT:"#CC0000", PSD:"#003FA5", PSOL:"#7B00B0", MDB:"#4169E1", PP:"#0000CD",
  NOVO:"#E87722", REDE:"#00B140", PL:"#00205C", PSB:"#E05C00", PDT:"#C00000",
  PSDB:"#0070C0", REPUBLICANOS:"#003F7F", PCDOB:"#8B0000", PODE:"#006400",
  AVANTE:"#FF6600", PRD:"#003366", DC:"#001F5B", PV:"#2E8B57",
  SOLIDARIEDADE:"#FF4500", AGIR:"#0047AB", CIDADANIA:"#FF6B35",
};

const getIbg = (co: string) => COR_COR[co] ?? "#9B5DE5";
const getPtc = (pt: string) => PT_COR[pt] ?? "#555";
const fotoUrl = (c: Candidato) =>
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${c.cd}/${c.sq}/${c.ue}`;
const tseUrl = (c: Candidato) =>
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

function FotoCard({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) return (
    <div className="card-foto">
      <img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} />
    </div>
  );
  return <div className="card-foto-fb" style={{ background: getIbg(c.co) }}>{c.n.charAt(0)}</div>;
}

function FotoModal({ c }: { c: Candidato }) {
  const [err, setErr] = useState(false);
  if (!err) return (
    <div className="modal-foto">
      <img src={fotoUrl(c)} alt={c.n} onError={() => setErr(true)} />
    </div>
  );
  return <div className="modal-foto-fb" style={{ background: getIbg(c.co) }}>{c.n.charAt(0)}</div>;
}

function PickerModal({ title, items, selected, onSelect, onClose }: {
  title: string; items: string[]; selected?: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() =>
    items.filter(i => i.toLowerCase().includes(q.toLowerCase()))
  , [items, q]);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="picker-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="picker-box">
        <div className="picker-hd">
          <div className="picker-title">{title}</div>
          <button className="picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="picker-search-wrap">
          <input ref={inputRef} className="picker-search"
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="picker-list">
          {selected && (
            <div className="picker-item selected" onClick={() => { onSelect(selected); onClose(); }}>✓ {selected}</div>
          )}
          {filtered.filter(i => i !== selected).map(v => (
            <div key={v} className="picker-item" onClick={() => { onSelect(v); onClose(); }}>{v}</div>
          ))}
          {filtered.length === 0 && <div className="picker-empty">Nenhum resultado</div>}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <div className="welcome-logo">
          <span className="wl-me">ME</span>
          <span className="wl-rep">REPRESENTA</span>
          <span className="wl-q">?</span>
        </div>
        <div className="welcome-tagline">
          Encontre candidatos que têm o mesmo perfil que você
        </div>

        <div className="welcome-cards">
          <div className="wcard">
            <div className="wcard-icon">⚖️</div>
            <div className="wcard-title">Representação real</div>
            <div className="wcard-text">O legislativo deveria ser um espelho da sociedade — mas não é. A maioria dos parlamentares ainda são homens brancos de classe alta.</div>
          </div>
          <div className="wcard">
            <div className="wcard-icon">👥</div>
            <div className="wcard-title">Sua identidade importa</div>
            <div className="wcard-text">Uma professora negra conhece os problemas reais e pode propor políticas públicas que um político rico jamais pensaria.</div>
          </div>
          <div className="wcard">
            <div className="wcard-icon">🗳️</div>
            <div className="wcard-title">Esse espaço é nosso</div>
            <div className="wcard-text">Use os filtros para encontrar candidatos com seu perfil. Depois descubra quem também pensa como você. O poder pertence a todos.</div>
          </div>
        </div>

        <div className="welcome-mission">
          <p>
            O <strong>MeRepresenta</strong> nasceu de uma pergunta simples:{" "}
            <em>por que quem decide sobre a nossa vida não se parece com a gente?</em>
          </p>
          <p>
            Comparando o Censo do IBGE com a composição do legislativo, os números são gritantes.
            Pretos, pardos, indígenas, mulheres e jovens são maioria na população — mas minoria no poder.
            Isso não é coincidência: é o reflexo de décadas de exclusão estrutural.
          </p>
          <p>
            O MeRepresenta também traz visibilidade para candidatos com boas ideias mas sem dinheiro
            para se fazerem ver em campanhas eleitorais. Use os filtros, encontre quem te representa
            — e leve esse espaço de volta para o povo.
          </p>
          <div className="welcome-source">
            🔍 Dados oficiais das Eleições Municipais 2024 · Estado do Pará · Fonte: TSE
          </div>
        </div>

        <button className="welcome-btn" onClick={onStart}>
          Explorar candidatos →
        </button>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#FAF7F2;
  --bg2:#F2EDE4;
  --bg3:#FFFFFF;
  --card-border:#E8E0D4;
  --pink:#E8006A;
  --purple:#7B2FBE;
  --green:#00A550;
  --gold:#D4900A;
  --text:#1C1C2E;
  --text2:#4A4A6A;
  --muted:#9090A8;
  --sw:300px;
}
html,body,#root{min-height:100%;background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;}

/* Loading */
.loading{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:var(--bg);}
.logo-load{font-family:'Bebas Neue',sans-serif;font-size:clamp(52px,12vw,100px);letter-spacing:2px;line-height:1;}
.pbar{width:180px;height:3px;border-radius:99px;background:#E0D8CC;overflow:hidden;}
.pfill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--pink),var(--purple));transition:width .4s;}
.ptxt{font-size:11px;color:var(--muted);}

/* Welcome */
.welcome{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:40px 20px;}
.welcome-content{max-width:640px;width:100%;}
.welcome-logo{font-family:'Bebas Neue',sans-serif;font-size:clamp(56px,14vw,120px);line-height:.9;letter-spacing:2px;margin-bottom:14px;}
.wl-me{background:linear-gradient(135deg,var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.wl-rep{color:var(--text);}
.wl-q{color:var(--gold);}
.welcome-tagline{font-size:clamp(15px,3vw,20px);color:var(--text2);margin-bottom:32px;font-weight:600;}
.welcome-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px;}
@media(max-width:520px){.welcome-cards{grid-template-columns:1fr;}}
.wcard{background:#fff;border:1.5px solid var(--card-border);border-radius:16px;padding:18px 16px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
.wcard-icon{font-size:26px;margin-bottom:8px;}
.wcard-title{font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px;}
.wcard-text{font-size:12px;color:var(--text2);line-height:1.6;}
.welcome-mission{background:#fff;border:1.5px solid var(--card-border);border-radius:16px;padding:24px;margin-bottom:28px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
.welcome-mission p{font-size:14px;color:var(--text2);line-height:1.8;margin-bottom:12px;}
.welcome-mission p:last-of-type{margin-bottom:0;}
.welcome-mission strong{color:var(--text);font-weight:700;}
.welcome-mission em{color:var(--pink);font-style:normal;font-weight:600;}
.welcome-source{margin-top:16px;font-size:11px;color:var(--muted);padding-top:12px;border-top:1px solid var(--card-border);}
.welcome-btn{width:100%;padding:18px;border-radius:14px;border:none;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;
  background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;
  letter-spacing:.5px;transition:all .2s;box-shadow:0 6px 24px rgba(123,47,190,.3);}
.welcome-btn:hover{transform:scale(1.02);box-shadow:0 10px 32px rgba(123,47,190,.45);}

/* App layout */
.app{display:flex;min-height:100vh;}

/* Sidebar */
.sb{width:var(--sw);flex-shrink:0;background:var(--bg2);border-right:1.5px solid var(--card-border);
  display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;
  overflow:hidden;transition:transform .3s cubic-bezier(.4,0,.2,1);}
.sb-hd{padding:20px 20px 14px;border-bottom:1.5px solid var(--card-border);flex-shrink:0;}
.sb-logo{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;}
.sb-logo .lme{background:linear-gradient(135deg,var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sb-logo .lrep{color:var(--text);}
.sb-logo .lq{color:var(--gold);}
.logo-sub{font-size:10px;color:var(--muted);margin-top:2px;}
.sb-body{flex:1;overflow-y:auto;padding:14px 18px 80px;}
.sb-body::-webkit-scrollbar{width:3px;}
.sb-body::-webkit-scrollbar-thumb{background:#D0C8BC;border-radius:99px;}

.aviso{background:#FFF8E6;border:1px solid #F0D080;border-radius:8px;
  padding:8px 10px;font-size:10px;color:#8A6800;line-height:1.5;margin-bottom:14px;}
.aviso strong{color:#6A4800;}
.fsec{margin-bottom:18px;}
.ftit{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.chips{display:flex;flex-wrap:wrap;gap:5px;}
.chip{padding:5px 12px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;
  border:1.5px solid var(--card-border);background:#fff;color:var(--text2);
  transition:all .15s;user-select:none;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.chip:hover{border-color:var(--purple);color:var(--purple);}
.chip.on{border-color:var(--c);background:var(--c);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);}

.tog-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;}
.tog-lbl{font-size:12px;font-weight:600;color:var(--text);}
.tog{position:relative;width:40px;height:22px;cursor:pointer;}
.tog input{opacity:0;width:0;height:0;}
.tog-tr{position:absolute;inset:0;background:#D0C8BC;border-radius:99px;transition:.2s;}
.tog input:checked+.tog-tr{background:var(--green);}
.tog-th{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.2);}
.tog input:checked~.tog-th{left:21px;}

.sel-btn{width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid var(--card-border);
  background:#fff;color:var(--text2);font-family:inherit;font-size:12px;
  cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;
  transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.sel-btn:hover{border-color:var(--purple);}
.sel-btn-arrow{font-size:10px;color:var(--muted);}

.srch{width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--card-border);
  background:#fff;color:var(--text);font-family:inherit;font-size:12px;margin-bottom:6px;outline:none;}
.srch:focus{border-color:var(--purple);}
.slist{display:flex;flex-direction:column;gap:2px;max-height:140px;overflow-y:auto;}
.slist::-webkit-scrollbar{width:3px;}
.slist::-webkit-scrollbar-thumb{background:#D0C8BC;border-radius:99px;}
.sit{padding:5px 8px;border-radius:6px;font-size:11px;cursor:pointer;color:var(--text2);transition:all .12s;}
.sit:hover{background:rgba(123,47,190,.08);color:var(--purple);}
.sit.on{background:rgba(123,47,190,.1);color:var(--purple);font-weight:600;}

.rst-btn{width:100%;padding:9px;border-radius:8px;border:1.5px dashed #E8A0C0;
  background:transparent;color:var(--pink);font-family:inherit;font-size:12px;cursor:pointer;
  transition:all .2s;margin-top:6px;font-weight:600;}
.rst-btn:hover{background:rgba(232,0,106,.06);}

/* Main */
.main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;}
.mhd{padding:20px 24px 14px;border-bottom:1.5px solid var(--card-border);background:var(--bg);position:sticky;top:0;z-index:50;}
.mhd-logo{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;margin-bottom:6px;}
.mhd-logo .lme{background:linear-gradient(135deg,var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.mhd-logo .lrep{color:var(--text);}
.mhd-logo .lq{color:var(--gold);}
.cnt-big{font-family:'Bebas Neue',sans-serif;font-size:36px;line-height:1;color:var(--text);}
.cnt-big span{background:linear-gradient(135deg,var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.cnt-sub{font-size:11px;color:var(--muted);margin-top:3px;}
.pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
.pill{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;font-size:11px;
  font-weight:600;background:rgba(232,0,106,.08);border:1px solid rgba(232,0,106,.2);
  color:var(--pink);cursor:pointer;transition:all .15s;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pill:hover{background:rgba(232,0,106,.15);}

.gw{padding:18px 24px 24px;flex:1;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}

/* Card */
.card{background:var(--bg3);border:1.5px solid var(--card-border);border-radius:16px;padding:16px;
  cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;position:relative;
  box-shadow:0 2px 8px rgba(0,0,0,.05);}
.card:hover{transform:translateY(-3px);border-color:#C0A8D8;box-shadow:0 8px 24px rgba(123,47,190,.15);}
.card-foto{width:58px;height:58px;border-radius:12px;overflow:hidden;flex-shrink:0;margin-bottom:10px;border:2px solid var(--card-border);}
.card-foto img{width:100%;height:100%;object-fit:cover;object-position:top;}
.card-foto-fb{width:58px;height:58px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:26px;color:#fff;margin-bottom:10px;}
.cn{font-weight:700;font-size:13px;line-height:1.3;margin-bottom:2px;color:var(--text);}
.cca{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:7px;}
.cpt{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;margin-bottom:9px;}
.ctags{display:flex;flex-wrap:wrap;gap:3px;}
.ctag{font-size:10px;padding:2px 7px;border-radius:99px;border:1px solid var(--card-border);color:var(--text2);background:var(--bg2);}
.ctag.m{border-color:var(--c);color:var(--c);background:rgba(123,47,190,.07);}
.edot{position:absolute;top:12px;right:12px;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 6px rgba(0,165,80,.4);}

/* Modal */
.ov{position:fixed;inset:0;background:rgba(28,28,46,.6);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fin .2s;}
@media(min-width:600px){.ov{align-items:center;}}
.modal{background:var(--bg3);border:1.5px solid var(--card-border);width:100%;max-width:460px;
  border-radius:20px 20px 0 0;padding:26px 22px;position:relative;
  animation:sup .26s cubic-bezier(.4,0,.2,1);max-height:90vh;overflow-y:auto;
  box-shadow:0 -8px 40px rgba(0,0,0,.1);}
@media(min-width:600px){.modal{border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.15);}}
@keyframes sup{from{transform:translateY(36px);opacity:0}to{transform:none;opacity:1}}
@keyframes fin{from{opacity:0}to{opacity:1}}
.mcl{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;
  border:1.5px solid var(--card-border);background:var(--bg2);cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:16px;}
.mcl:hover{background:#E8E0D4;color:var(--text);}
.modal-top{display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;}
.modal-foto{width:80px;height:80px;border-radius:14px;overflow:hidden;flex-shrink:0;border:2px solid var(--card-border);}
.modal-foto img{width:100%;height:100%;object-fit:cover;object-position:top;}
.modal-foto-fb{width:80px;height:80px;border-radius:14px;display:flex;align-items:center;
  justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:38px;color:#fff;flex-shrink:0;}
.modal-info{flex:1;min-width:0;}
.mnome{font-weight:700;font-size:17px;line-height:1.2;margin-bottom:2px;color:var(--text);}
.mcargo{font-size:11px;color:var(--muted);margin-bottom:3px;}
.mpt{display:inline-block;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:700;color:#fff;margin-top:6px;}
.elbadge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;
  background:rgba(0,165,80,.1);border:1px solid rgba(0,165,80,.25);color:var(--green);font-size:11px;font-weight:700;margin-top:6px;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0;}
.minfo{background:var(--bg2);border:1px solid var(--card-border);border-radius:10px;padding:10px;}
.ml{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.mv{font-size:12px;font-weight:600;line-height:1.3;color:var(--text);}
.tbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;
  border-radius:12px;font-family:inherit;font-size:14px;font-weight:800;
  background:linear-gradient(135deg,var(--pink),var(--purple));
  color:#fff;border:none;cursor:pointer;transition:all .2s;text-decoration:none;
  box-shadow:0 4px 16px rgba(123,47,190,.3);}
.tbtn:hover{opacity:.92;transform:scale(1.01);}
.maviso{background:#FFF8E6;border:1px solid #F0D080;border-radius:8px;
  padding:8px 10px;font-size:10px;color:#8A6800;line-height:1.5;margin-bottom:14px;}

/* Picker */
.picker-ov{position:fixed;inset:0;background:rgba(28,28,46,.6);z-index:300;
  display:flex;align-items:flex-end;justify-content:center;animation:fin .2s;}
.picker-box{background:var(--bg3);width:100%;max-width:480px;border-radius:20px 20px 0 0;
  display:flex;flex-direction:column;max-height:80vh;box-shadow:0 -8px 40px rgba(0,0,0,.1);}
.picker-hd{display:flex;justify-content:space-between;align-items:center;padding:16px 18px 12px;
  border-bottom:1.5px solid var(--card-border);}
.picker-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;
  background:linear-gradient(135deg,var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.picker-close{background:var(--bg2);border:1.5px solid var(--card-border);color:var(--text2);
  width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}
.picker-search-wrap{padding:12px 16px;flex-shrink:0;background:var(--bg3);}
.picker-search{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(123,47,190,.3);
  background:var(--bg2);color:var(--text);font-family:inherit;font-size:14px;outline:none;}
.picker-search:focus{border-color:var(--purple);}
.picker-list{flex:1;overflow-y:auto;padding:0 16px 24px;background:var(--bg3);}
.picker-list::-webkit-scrollbar{width:3px;}
.picker-list::-webkit-scrollbar-thumb{background:#D0C8BC;border-radius:99px;}
.picker-item{padding:13px 12px;border-bottom:1px solid var(--card-border);font-size:14px;
  cursor:pointer;color:var(--text);transition:all .12s;border-radius:8px;}
.picker-item:hover{background:rgba(123,47,190,.07);color:var(--purple);}
.picker-item.selected{color:var(--pink);font-weight:700;}
.picker-empty{text-align:center;padding:24px;color:var(--muted);font-size:13px;}

/* Mobile */
.mob-bar{display:none;}.fab{display:none;}.sb-pull{display:none;}.sb-ov{display:none;}.sb-close-btn{display:none;}
@media(max-width:767px){
  :root{--sw:100%;}
  .sb{position:fixed;top:auto;bottom:0;left:0;right:0;height:90vh;
    border-right:none;border-top:2px solid var(--card-border);
    border-radius:22px 22px 0 0;transform:translateY(100%);}
  .sb.open{transform:translateY(0);}
  .sb-pull{display:block;width:40px;height:4px;border-radius:99px;
    background:#D0C8BC;margin:12px auto 0;flex-shrink:0;}
  .sb-hd{padding-top:12px;position:relative;}
  .sb-close-btn{display:flex;position:absolute;top:12px;right:16px;
    width:32px;height:32px;border-radius:50%;border:1.5px solid var(--card-border);
    background:var(--bg2);align-items:center;justify-content:center;
    color:var(--text2);font-size:15px;cursor:pointer;}
  .sb-ov{position:fixed;inset:0;background:rgba(28,28,46,.5);z-index:99;animation:fin .2s;}
  .main{margin-left:0;}
  .mob-bar{display:flex;align-items:center;justify-content:space-between;
    padding:12px 16px;background:var(--bg2);border-bottom:1.5px solid var(--card-border);
    position:sticky;top:0;z-index:60;}
  .mob-logo{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;}
  .mhd{padding:12px 16px 10px;top:49px;}
  .mhd-logo{display:none;}
  .gw{padding:12px 14px 100px;}
  .grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;}
  .cnt-big{font-size:26px;}
  .fab{display:flex;position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:90;
    align-items:center;gap:7px;padding:12px 24px;border-radius:99px;
    background:linear-gradient(135deg,var(--pink),var(--purple));
    color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;
    box-shadow:0 6px 24px rgba(123,47,190,.4);white-space:nowrap;}
  .fc{background:rgba(0,0,0,.25);border-radius:99px;padding:1px 7px;font-size:10px;}
  .desktop-only{display:none !important;}
}
@media(min-width:768px){.mobile-only{display:none !important;}}

.empty{grid-column:1/-1;text-align:center;padding:60px 20px;}
.empty-i{font-size:44px;margin-bottom:14px;}
.empty-t{font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--muted);}
.empty-s{font-size:13px;color:var(--muted);margin-top:6px;}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.card{animation:fu .22s ease both;}
`;

export default function App() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pct, setPct]               = useState(0);
  const [msg, setMsg]               = useState("Carregando dados...");
  const [showWelcome, setShowWelcome] = useState(true);
  const [filtros, setFiltros]       = useState<Filtros>({ apenasEleitos: false });
  const [muSearch, setMuSearch]     = useState("");
  const [ocSearch, setOcSearch]     = useState("");
  const [sbOpen, setSbOpen]         = useState(false);
  const [sel, setSel]               = useState<Candidato | null>(null);
  const [pickerOc, setPickerOc]     = useState(false);
  const [pickerMu, setPickerMu]     = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPct(30), 300);
    const t2 = setTimeout(() => { setPct(65); setMsg("Processando candidatos..."); }, 800);
    fetch("/candidatos_pa.json")
      .then(r => r.json())
      .then((d: Candidato[]) => {
        clearTimeout(t1); clearTimeout(t2);
        setPct(100); setMsg(`${d.length.toLocaleString()} candidatos carregados`);
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

  const muFilt = useMemo(() => opts.mu.filter(m => m.toLowerCase().includes(muSearch.toLowerCase())), [opts.mu, muSearch]);
  const ocFilt = useMemo(() => opts.oc.filter(o => o.toLowerCase().includes(ocSearch.toLowerCase())), [opts.oc, ocSearch]);

  const tog = useCallback((cat: keyof Filtros, val: string) => {
    setFiltros(f => ({ ...f, [cat]: f[cat] === val ? undefined : val }));
    setShowWelcome(false);
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
  const closeSb = useCallback(() => setSbOpen(false), []);

  if (loading) return (
    <><style>{CSS}</style>
    <div className="loading">
      <div className="logo-load">
        <span style={{background:"linear-gradient(135deg,#E8006A,#7B2FBE)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ME</span>
        <span style={{color:"#1C1C2E"}}>REPRESENTA</span>
        <span style={{color:"#D4900A"}}>?</span>
      </div>
      <div className="pbar"><div className="pfill" style={{ width:`${pct}%` }}/></div>
      <div className="ptxt">{msg}</div>
    </div></>
  );

  if (showWelcome && !temFiltro) return (
    <><style>{CSS}</style>
    <WelcomeScreen onStart={() => setShowWelcome(false)} />
    </>
  );

  const SidebarContent = () => (
    <>
      <div className="sb-pull"/>
      <div className="sb-hd">
        <div className="sb-logo"><span className="lme">ME</span><span className="lrep">REPRESENTA</span><span className="lq">?</span></div>
        <div className="logo-sub">Eleições Municipais · Pará · 2024</div>
        <button className="sb-close-btn" onClick={closeSb}>✕</button>
      </div>
      <div className="sb-body">
        <div className="aviso">
          <strong>⚠️ Dados TSE:</strong> Sexo, etnia, profissão e faixa etária vêm do arquivo oficial de candidatos. <strong>Orientação sexual e identidade de gênero não são coletados pelo TSE.</strong>
        </div>

        <div className="fsec">
          <div className="tog-row">
            <span className="tog-lbl">🏆 Apenas eleitos</span>
            <label className="tog">
              <input type="checkbox" checked={filtros.apenasEleitos}
                onChange={e => setFiltros(f => ({...f, apenasEleitos: e.target.checked}))}/>
              <div className="tog-tr"/><div className="tog-th"/>
            </label>
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">⚥ Sexo</div>
          <div className="chips">
            {opts.ge.map(v => (
              <div key={v} className={`chip ${filtros.ge===v?"on":""}`}
                style={{"--c":v==="FEMININO"?"#E8006A":"#1A5FBE"} as React.CSSProperties}
                onClick={() => tog("ge", v)}>{v}</div>
            ))}
          </div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:6,lineHeight:1.4}}>Transgênero e não-binário não constam nos dados do TSE.</div>
        </div>

        <div className="fsec">
          <div className="ftit">🌿 Etnia / Cor</div>
          <div className="chips">
            {opts.co.map(v => (
              <div key={v} className={`chip ${filtros.co===v?"on":""}`}
                style={{"--c":COR_COR[v]??"#7B2FBE"} as React.CSSProperties}
                onClick={() => tog("co", v)}>{v}</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">🎂 Faixa Etária</div>
          <div className="chips">
            {FAIXAS.map(f => (
              <div key={f.label} className={`chip ${filtros.fx===f.label?"on":""}`}
                style={{"--c":"#7B2FBE"} as React.CSSProperties}
                onClick={() => tog("fx", f.label)}>{f.label} anos</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">🏛️ Cargo</div>
          <div className="chips">
            {opts.ca.map(v => (
              <div key={v} className={`chip ${filtros.ca===v?"on":""}`}
                style={{"--c":"#1A5FBE"} as React.CSSProperties}
                onClick={() => tog("ca", v)}>{v}</div>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">💼 Profissão <span style={{fontSize:9,color:"var(--muted)",fontWeight:400,letterSpacing:0}}>(190 opções)</span></div>
          <button className="sel-btn mobile-only"
            style={filtros.oc?{borderColor:"#E8006A",color:"#E8006A"} as React.CSSProperties:{}}
            onClick={() => setPickerOc(true)}>
            <span>{filtros.oc ?? "Selecionar profissão..."}</span>
            {filtros.oc
              ? <span onClick={e=>{e.stopPropagation();tog("oc",filtros.oc!);}} style={{color:"#E8006A"}}>✕</span>
              : <span className="sel-btn-arrow">▼</span>}
          </button>
          <div className="desktop-only">
            {filtros.oc && (
              <div style={{marginBottom:6}}>
                <div className="chip on" style={{"--c":"#E8006A"} as React.CSSProperties} onClick={()=>tog("oc",filtros.oc!)}>
                  {filtros.oc} ✕
                </div>
              </div>
            )}
            <input className="srch" placeholder="Buscar profissão..." value={ocSearch} onChange={e=>setOcSearch(e.target.value)}/>
            <div className="slist">
              {ocFilt.slice(0,80).map(v=>(
                <div key={v} className={`sit ${filtros.oc===v?"on":""}`} onClick={()=>{tog("oc",v);setOcSearch("");}}>{v}</div>
              ))}
              {ocFilt.length===0 && <div style={{fontSize:11,color:"var(--muted)",padding:"4px 8px"}}>Nenhuma encontrada</div>}
            </div>
          </div>
        </div>

        <div className="fsec">
          <div className="ftit">📍 Município</div>
          <button className="sel-btn mobile-only"
            style={filtros.mu?{borderColor:"#1A5FBE",color:"#1A5FBE"} as React.CSSProperties:{}}
            onClick={() => setPickerMu(true)}>
            <span>{filtros.mu ?? "Selecionar município..."}</span>
            {filtros.mu
              ? <span onClick={e=>{e.stopPropagation();tog("mu",filtros.mu!);}} style={{color:"#E8006A"}}>✕</span>
              : <span className="sel-btn-arrow">▼</span>}
          </button>
          <div className="desktop-only">
            <input className="srch" placeholder="Buscar cidade..." value={muSearch} onChange={e=>setMuSearch(e.target.value)}/>
            <div className="slist">
              {muFilt.slice(0,60).map(m=>(
                <div key={m} className={`sit ${filtros.mu===m?"on":""}`} onClick={()=>{tog("mu",m);setMuSearch("");}}>{m}</div>
              ))}
            </div>
          </div>
        </div>

        {temFiltro && (
          <button className="rst-btn" onClick={()=>setFiltros({apenasEleitos:false})}>✕ Limpar todos os filtros</button>
        )}
      </div>
    </>
  );

  return (
    <><style>{CSS}</style>

    <div className="mob-bar">
      <div className="mob-logo">
        <span style={{background:"linear-gradient(135deg,#E8006A,#7B2FBE)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ME</span>
        <span style={{color:"#1C1C2E"}}>REPRESENTA</span>
        <span style={{color:"#D4900A"}}>?</span>
      </div>
      <span style={{fontSize:10,color:"var(--muted)"}}>PA · 2024</span>
    </div>

    <div className="app">
      {sbOpen && <div className="sb-ov" onClick={closeSb}/>}
      <div className={`sb ${sbOpen?"open":""}`}><SidebarContent/></div>

      <div className="main">
        <div className="mhd">
          <div className="mhd-logo">
            <span className="lme">ME</span><span className="lrep">REPRESENTA</span><span className="lq">?</span>
          </div>
          <div className="cnt-big"><span>{total.toLocaleString()}</span> candidatos</div>
          <div className="cnt-sub">
            {temFiltro?`${total.toLocaleString()} candidatos correspondem ao seu perfil`:"Selecione características no painel para filtrar"}
          </div>
          {temFiltro && (
            <div className="pills">
              {[{k:"ge",v:filtros.ge},{k:"co",v:filtros.co},{k:"oc",v:filtros.oc},
                {k:"fx",v:filtros.fx},{k:"ca",v:filtros.ca},{k:"mu",v:filtros.mu}]
                .filter(x=>x.v).map(({k,v})=>(
                  <div key={k} className="pill" onClick={()=>setFiltros(f=>({...f,[k]:undefined}))}>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{v}</span> ✕
                  </div>
              ))}
            </div>
          )}
        </div>

        <div className="gw">
          <div className="grid">
            {resultado.length===0 && (
              <div className="empty">
                <div className="empty-i">🔍</div>
                <div className="empty-t">Nenhum candidato encontrado</div>
                <div className="empty-s">Tente remover alguns filtros</div>
              </div>
            )}
            {resultado.map((c,i)=>{
              const mge=filtros.ge===c.ge, mco=filtros.co===c.co, moc=filtros.oc===c.oc;
              return (
                <div className="card" key={c.rid}
                  style={{animationDelay:`${Math.min(i,30)*.025}s`} as React.CSSProperties}
                  onClick={()=>setSel(c)}>
                  {c.el && <div className="edot" title="Eleito(a)"/>}
                  <FotoCard c={c}/>
                  <div className="cn">{c.n}</div>
                  <div className="cca">{c.ca} · {c.mu}</div>
                  <div className="cpt" style={{background:getPtc(c.pt)}}>{c.pt}</div>
                  <div className="ctags">
                    <span className={`ctag ${mge?"m":""}`} style={mge?{"--c":c.ge==="FEMININO"?"#E8006A":"#1A5FBE"} as React.CSSProperties:{}}>{c.ge}</span>
                    <span className={`ctag ${mco?"m":""}`} style={mco?{"--c":COR_COR[c.co]??"#7B2FBE"} as React.CSSProperties:{}}>{c.co}</span>
                    <span className={`ctag ${moc?"m":""}`} style={moc?{"--c":"#E8006A"} as React.CSSProperties:{}}>{c.oc.length>20?c.oc.slice(0,20)+"…":c.oc}</span>
                    <span className="ctag">{c.idade}a</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    <button className="fab" onClick={()=>setSbOpen(o=>!o)}>
      {sbOpen?"✕ Fechar filtros":"⚙ Filtros"}
      {nAtivos>0 && <span className="fc">{nAtivos}</span>}
    </button>

    {pickerOc && <PickerModal title="Profissão" items={opts.oc} selected={filtros.oc}
      onSelect={v=>{tog("oc",v);setPickerOc(false);}} onClose={()=>setPickerOc(false)}/>}

    {pickerMu && <PickerModal title="Município" items={opts.mu} selected={filtros.mu}
      onSelect={v=>{tog("mu",v);setPickerMu(false);}} onClose={()=>setPickerMu(false)}/>}

    {sel && (
      <div className="ov" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
        <div className="modal">
          <button className="mcl" onClick={()=>setSel(null)}>×</button>
          <div className="modal-top">
            <FotoModal c={sel}/>
            <div className="modal-info">
              <div className="mnome">{sel.n}</div>
              <div className="mcargo">{sel.nc}</div>
              <div className="mcargo">{sel.ca} · {sel.mu} · {sel.uf}</div>
              <div className="mpt" style={{background:getPtc(sel.pt)}}>{sel.pt}</div>
              {sel.el && <div className="elbadge">✓ ELEITO(A)</div>}
            </div>
          </div>
          <div className="mgrid">
            {[{l:"Sexo",v:sel.ge},{l:"Etnia/Cor",v:sel.co},{l:"Idade",v:`${sel.idade} anos`},
              {l:"Escolaridade",v:sel.es.replace("ENSINO ","")},{l:"Profissão",v:sel.oc}]
              .map(({l,v})=>(
                <div className="minfo" key={l}><div className="ml">{l}</div><div className="mv">{v}</div></div>
              ))}
          </div>
          <div className="maviso">🏛️ No perfil do TSE você encontra redes sociais, propostas, bens declarados e financiamento de campanha.</div>
          <a className="tbtn" href={tseUrl(sel)} target="_blank" rel="noopener noreferrer">🗳️ Ver perfil completo no TSE</a>
        </div>
      </div>
    )}
    </>
  );
}
