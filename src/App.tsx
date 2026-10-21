import { useEffect, useMemo, useState } from 'react';
import { all, create, format, type MathJsInstance } from 'mathjs';
import Plot from 'react-plotly.js';

type Mode = 'cw' | 'ti' | 'es';
type Tab = 'calc' | 'graphs' | 'history' | 'tools' | 'settings';
type Entry = { id: number; expr: string; result: string; mode: Mode; at: string };
const math: MathJsInstance = create(all, { number: 'BigNumber', precision: 32 });
const modeInfo: Record<Mode, { title: string; subtitle: string; brand: string }> = {
  cw: { title: 'ClassWiz', subtitle: 'fx-991CW style', brand: 'CASIO · CLASSWIZ' },
  ti: { title: 'Graphing', subtitle: 'TI-84 Plus style', brand: 'TEXAS INSTRUMENTS · TI-84 PLUS' },
  es: { title: 'Classic ES', subtitle: 'fx-991ES Plus style', brand: 'CASIO · NATURAL-V.P.A.M.' }
};
const keys: Record<Mode, string[][]> = {
  // Key groups follow the physical order of each model; alternate labels are kept visible.
  cw: [
    ['ON','HOME','SETTINGS','BACK','FORMAT'],
    ['VARIABLE','FUNCTION','CATALOG','TOOLS','EXE'],
    ['x','□/□','x²','x^□','√'],
    ['sin⁻¹','cos⁻¹','tan⁻¹','log','ln'],
    ['sin','cos','tan','π','÷'],
    ['(-)','x!','%','EXP','×'],
    ['7','8','9','DEL','×'],
    ['4','5','6','AC','−'],
    ['1','2','3','Ans','+'],
    ['0','.','×10ˣ','(',')'],
    ['←','↑','↓','→','OK']
  ],
  ti: [
    ['Y=','WINDOW','ZOOM','TRACE','GRAPH'],
    ['2nd','MODE','DEL','ALPHA','X,T,θ,n'],
    ['STAT','MATH','APPS','PRGM','VARS'],
    ['CLEAR','↑','↓','QUIT','ENTER'],
    ['x⁻¹','SIN','COS','TAN','^'],
    ['(',' )','÷','×','LOG'],
    ['7','8','9','−','LN'],
    ['4','5','6','+','EE'],
    ['1','2','3','(-)','ANS'],
    ['0','.','EXP','STO→','ENTER']
  ],
  es: [
    ['SHIFT','ALPHA','MODE','SETUP','ON'],
    ['CALC','∫','d/dx','x⁻¹','nCr'],
    ['√','∛','x²','x^□','x√'],
    ['log','ln','10^x','e^x','π'],
    ['sin⁻¹','cos⁻¹','tan⁻¹','sin','cos'],
    ['tan','RCL','ENG','x!','%'],
    ['7','8','9','DEL','÷'],
    ['4','5','6','AC','×'],
    ['1','2','3','Ans','−'],
    ['0','.','×10ˣ','+','=']
  ]
};
function toExpression(raw: string, degrees: boolean) {
  let s = raw.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/√\(/g,'sqrt(').replace(/√/g,'sqrt')
    .replace(/π/g,'pi').replace(/\bAns\b/g,'ans').replace(/(\d)\s*%/g,'($1/100)')
    .replace(/\bln\(/g,'__NATURAL_LOG__(').replace(/\blog\(/g,'log10(').replace(/__NATURAL_LOG__\(/g,'log(');
  if (degrees) {
    for (const fn of ['sin','cos','tan']) s = s.replace(new RegExp('\\b'+fn+'\\(([^()]*)\\)','g'), '('+fn+'((($1)*pi/180)))');
    for (const fn of ['asin','acos','atan']) s = s.replace(new RegExp('\\b'+fn+'\\(([^()]*)\\)','g'), '(('+fn+'($1))*180/pi)');
  }
  return s;
}
function nice(v: unknown) {
  try { return format(v as never, { precision: 12, lowerExp: -9, upperExp: 12 }); }
  catch { return String(v); }
}
export default function App() {
  const [mode,setMode] = useState<Mode>('cw');
  const [tab,setTab] = useState<Tab>('calc');
  const [expr,setExpr] = useState('');
  const [result,setResult] = useState('0');
  const [ans,setAns] = useState('0');
  const [degrees,setDegrees] = useState(true);
  const [shiftActive,setShiftActive] = useState(false);
  const [alphaActive,setAlphaActive] = useState(false);
  const [dark,setDark] = useState(true);
  const [history,setHistory] = useState<Entry[]>(() => { try{return JSON.parse(localStorage.getItem('tricalc-history')||'[]')}catch{return []} });
  const [graphFns,setGraphFns] = useState(['sin(x)','x^2/4','']);
  const [graphRange,setGraphRange] = useState(10);
  const [tool,setTool] = useState('equation');
  const [toolInput,setToolInput] = useState('2, -5, 2');
  const [toolResult,setToolResult] = useState('');
  const [notice,setNotice] = useState('');
  useEffect(()=>{localStorage.setItem('tricalc-history',JSON.stringify(history.slice(0,250)))},[history]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
  const calc = (source=expr) => {
    if (!source.trim()) return;
    try {
      const value = math.evaluate(toExpression(source,degrees), { ans: Number(ans), Ans: Number(ans) });
      const out = nice(value);
      setResult(out); setAns(out);
      setHistory(old=>[{id:Date.now(),expr:source,result:out,mode,at:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})},...old].slice(0,250));
      setNotice('');
    } catch (e) { setResult('Math ERROR'); setNotice(e instanceof Error ? e.message : 'Check expression'); }
  };
  const press = (pressedKey:string) => {
    setNotice('');
    if (pressedKey==='SHIFT' || pressedKey==='2nd') {setShiftActive(v=>!v);setAlphaActive(false);return}
    if (pressedKey==='ALPHA') {setAlphaActive(v=>!v);setShiftActive(false);return}
    const shifted:Record<string,string> = {'sin':'sin⁻¹','SIN':'sin⁻¹','cos':'cos⁻¹','COS':'cos⁻¹','tan':'tan⁻¹','TAN':'tan⁻¹','x²':'√','LOG':'10^x','log':'10^x','LN':'e^x','ln':'e^x','x⁻¹':'x!','STAT':'statistics','MATH':'equation'};
    const key=shiftActive?(shifted[pressedKey]??pressedKey):pressedKey;
    if (shiftActive) setShiftActive(false);
    if (alphaActive) setAlphaActive(false);
    if (key==='AC' || key==='CLEAR') {setExpr('');setResult('0');return}
    if (key==='DEL' || key==='BACKSPACE') {setExpr(v=>v.slice(0,-1));return}
    if (key==='=' || key==='ENTER' || key==='EXE' || key==='OK') {calc();return}
    if (key==='ON') {setExpr('');setResult('0');return}
    if (key==='Ans' || key==='ANS') {setExpr(v=>v+'Ans');return}
    if (key==='(-)' || key==='(-') {setExpr(v=>v+'(-');return}
    if (key==='√' || key==='√(') {setExpr(v=>v+'sqrt(');return}
    if (key==='x²') {setExpr(v=>v+'^2');return}
    if (key==='x⁻¹') {setExpr(v=>v+'^(-1)');return}
    if (key==='x^□') {setExpr(v=>v+'^(');return}
    if (key==='x!') {setExpr(v=>v+'!');return}
    if (key==='%') {setExpr(v=>v+'%');return}
    if (key==='10^x') {setExpr(v=>v+'10^(');return}
    if (key==='e^x') {setExpr(v=>v+'e^(');return}
    if (key==='∛') {setExpr(v=>v+'cbrt(');return}
    if (key==='x√') {setExpr(v=>v+'nthRoot(');return}
    if (key==='□/□') {setExpr(v=>v+'(1/2)');return}
    if (key==='π') {setExpr(v=>v+'π');return}
    if (key==='×10ˣ') {setExpr(v=>v+'*10^(');return}
    if (key==='EE' || key==='EXP') {setExpr(v=>v+'e');return}
    if (key==='X,T,θ,n' || key==='x') {setExpr(v=>v+'x');return}
    if (['sin','cos','tan','SIN','COS','TAN','sin⁻¹','cos⁻¹','tan⁻¹','log','LOG','ln','LN'].includes(key)) {
      const fn=key.toLowerCase().replace('⁻¹',''); setExpr(v=>v+(key.includes('⁻¹')?'a'+fn:fn)+'(');return;
    }
    if (key==='GRAPH' || key==='Y=' || key==='TRACE' || key==='ZOOM' || key==='WINDOW' || key==='TABLE') {setTab('graphs');return}
    if (key==='SETUP' || key==='MODE' || key==='SETTINGS') {setTab('settings');return}
    if (key==='HOME') {setTab('calc');return}
    if (key==='BACK' || key==='QUIT') {setTab('calc');return}
    if (key==='FORMAT') {setResult(v=>v);setNotice('Format options: use Tools for angle conversion and scientific results.');return}
    if (key==='statistics') {setTool('statistics');setTab('tools');return}
    if (key==='equation') {setTool('equation');setTab('tools');return}
    if (key==='VARIABLE' || key==='FUNCTION' || key==='CATALOG' || key==='TOOLS' || key==='CALC' || key==='∫' || key==='d/dx' || key==='STO→' || key==='RCL' || key==='STAT' || key==='APPS' || key==='PRGM' || key==='VARS' || key==='MATH' || key==='hyp' || key==='ENG' || key==='°′″' || key==='nCr' || key==='nPr') {
      if (key==='TOOLS' || key==='STAT' || key==='MATH' || key==='APPS') setTab('tools');
      else setNotice(key+': secondary/menu action is model-inspired; use Tools for the supported calculator utility.');
      return;
    }
    if (['←','↑','↓','→'].includes(key)) {setNotice('Cursor key: use the expression field controls to continue editing.');return}
    setExpr(v=>v+({'÷':'/','×':'*','−':'-','+':'+',' )':')'}[key]??key));
  };
  const keyButton = (key:string,i:number) => <button key={key+'-'+i} className={'key '+(/^[0-9.]$/.test(key)?'number ':'')+(['=','ENTER','EXE','OK'].includes(key)?'equals ':'')+(['AC','DEL','CLEAR'].includes(key)?'function-key ':'')+(['÷','×','−','+','^','x²','x^□','√','√(','∛','x√','sin','cos','tan','sin⁻¹','cos⁻¹','tan⁻¹','log','ln','10^x','e^x'].includes(key)?'operator ':'')+(['SHIFT','2nd','ALPHA','SETUP','MENU','OPTN','MATH','MODE','ON','Y=','WINDOW','ZOOM','TRACE','GRAPH','HOME','BACK','FORMAT','VARIABLE','FUNCTION','CATALOG','TOOLS','EXE','SETTINGS','PRGM','VARS','STAT','CLEAR','QUIT'].includes(key)?'tiny ':'')} onClick={()=>press(key)}>{key}</button>;
  const quick = (s:string) => {setExpr(s);setTab('calc');};
  const solveTool = () => {
    try {
      const a=toolInput.split(',').map(Number);
      if(tool==='equation') {
        if(a.length!==3||a.some(Number.isNaN)) throw Error('Enter a,b,c for ax² + bx + c = 0');
        const [A,B,C]=a;if(A===0) throw Error('a cannot be zero');
        const d=B*B-4*A*C;
        setToolResult(d>=0?'x₁ = '+nice((-B+Math.sqrt(d))/(2*A))+'\nx₂ = '+nice((-B-Math.sqrt(d))/(2*A)):'x₁ = '+nice(-B/(2*A))+' + '+nice(Math.sqrt(-d)/(2*A))+'i\nx₂ = '+nice(-B/(2*A))+' − '+nice(Math.sqrt(-d)/(2*A))+'i');
      } else if(tool==='statistics') {
        if(!a.length||a.some(Number.isNaN))throw Error('Enter comma-separated numbers');
        const sorted=[...a].sort((x,y)=>x-y), mean=a.reduce((x,y)=>x+y,0)/a.length, median=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
        setToolResult('n = '+a.length+'\nMean = '+nice(mean)+'\nMedian = '+nice(median)+'\nMin = '+Math.min(...a)+'\nMax = '+Math.max(...a)+'\nPopulation σ = '+nice(Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/a.length)));
      } else if(tool==='convert') {
        if(a.length!==1||Number.isNaN(a[0]))throw Error('Enter one angle in degrees');
        setToolResult(a[0]+'° = '+nice(a[0]*Math.PI/180)+' rad');
      } else {
        const [re,im]=a;if(a.length!==2||a.some(Number.isNaN))throw Error('Enter real,imaginary parts');
        setToolResult('z = '+re+' '+(im<0?'−':'+')+' '+Math.abs(im)+'i\n|z| = '+nice(Math.hypot(re,im))+'\narg(z) = '+nice(Math.atan2(im,re)*(degrees?180/Math.PI:1))+(degrees?'°':' rad'));
      }
    } catch(e) {setToolResult(e instanceof Error?e.message:'Invalid input')}
  };
  const plotData = useMemo(()=>{
    const x:number[]=[]; for(let i=-graphRange;i<=graphRange;i+=graphRange/100)x.push(i);
    return graphFns.filter(s=>s.trim()).map((fn,idx)=>({x,y:x.map(v=>{try{return Number(math.evaluate(fn,{x:v,pi:Math.PI,e:Math.E}))}catch{return NaN}}),type:'scatter' as const,mode:'lines' as const,name:fn,line:{width:2+idx*.3}}));
  },[graphFns,graphRange]);
  const modes:Mode[]=['cw','ti','es'];
  return <div className={'app '+mode+' '+(dark?'dark':'light')}>
    <header className="topbar"><div className="brand-mark">T<span>∑</span></div><div className="brand-copy"><strong>TriCalc</strong><small>THREE MODES. ONE TOOLKIT.</small></div><div className="top-actions"><button className="icon-button" onClick={()=>setDark(v=>!v)} aria-label="Toggle theme">{dark?'☼':'☾'}</button><button className="icon-button" onClick={()=>setTab('settings')} aria-label="Settings">⚙</button></div></header>
    <div className="mode-strip" role="tablist" aria-label="Calculator mode">{modes.map(m=><button key={m} className={'mode-tab '+(mode===m?'selected':'')} onClick={()=>{setMode(m);setNotice('')}}><span className="mode-dot">{m==='ti'?'ƒ':m==='cw'?'C':'∑'}</span><span><b>{modeInfo[m].title}</b><small>{modeInfo[m].subtitle}</small></span></button>)}</div>
    <main className="main">
      {tab==='calc'&&<section className={'calculator-shell shell-'+mode}><div className="calculator-label"><span>{modeInfo[mode].brand}</span><span className="battery">▰ ▰ ▱</span></div><div className="display"><div className="display-status"><span>{shiftActive?'SHIFT · ':''}{alphaActive?'ALPHA · ':''}{degrees?'DEG':'RAD'} · MATH</span><span>{mode==='ti'?'NORMAL · REAL':'MathI/MathO'}</span></div><div className="expression" aria-label="Expression">{expr||'0'}<span className="cursor">▏</span></div><div className="answer">{result}</div>{notice&&<div className="notice">{notice}</div>}</div><div className="display-controls"><button onClick={()=>setDegrees(v=>!v)}>{degrees?'DEG':'RAD'}</button><button onClick={()=>setTab('history')}>↶ History</button><button onClick={()=>setExpr(v=>v+'π')}>π</button><button onClick={()=>setExpr(v=>v+'e')}>e</button></div><div className={'keypad keypad-'+mode}>{keys[mode].map((row,rowIndex)=><div className="key-row" key={mode+'-row-'+rowIndex}>{mode==='ti'&&rowIndex===3?<>{keyButton('CLEAR',0)}<div className="ti-dpad" aria-label="Directional pad"><span/><button onClick={()=>press('↑')} aria-label="Up">↑</button><span/><button onClick={()=>press('←')} aria-label="Left">←</button><button onClick={()=>press('OK')} aria-label="Select">●</button><button onClick={()=>press('→')} aria-label="Right">→</button><span/><button onClick={()=>press('↓')} aria-label="Down">↓</button><span/></div>{keyButton('QUIT',3)}{keyButton('ENTER',4)}</>:row.filter(key=>!(mode==='ti'&&['↑','↓'].includes(key))).map((key,i)=>keyButton(key,i))}</div>)}</div><div className="shell-footer"><span>Natural display · scientific functions</span><span>TRICALC / {mode.toUpperCase()}</span></div></section>}
      {tab==='graphs'&&<section className="panel graph-panel"><div className="panel-heading"><div><p className="eyebrow">TI-84 PLUS STYLE</p><h1>Function graphing</h1><p className="muted">Plot multiple real-valued functions and explore their shape.</p></div><span className="panel-icon">ƒ(x)</span></div><div className="function-inputs">{graphFns.map((f,i)=><label key={i}><span>Y{i+1}=</span><input value={f} placeholder={i===0?'sin(x)':i===1?'x^2':''} onChange={e=>setGraphFns(old=>old.map((v,j)=>i===j?e.target.value:v))}/></label>)}</div><div className="range-row"><label>Window ±{graphRange}</label><input type="range" min="2" max="30" value={graphRange} onChange={e=>setGraphRange(Number(e.target.value))}/><button onClick={()=>setGraphRange(10)}>Reset</button></div><div className="plot-wrap"><Plot data={plotData as never} layout={{autosize:true,paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:dark?'#1c2024':'#fff',font:{color:dark?'#dce1dc':'#303631'},margin:{l:42,r:12,t:20,b:40},xaxis:{gridcolor:dark?'#363d40':'#e2e5e0',zerolinecolor:'#7f8e85',range:[-graphRange,graphRange],title:{text:'x'}},yaxis:{gridcolor:dark?'#363d40':'#e2e5e0',zerolinecolor:'#7f8e85',title:{text:'y'}},showlegend:true,legend:{orientation:'h',y:-.2}}} config={{responsive:true,displaylogo:false}} style={{width:'100%',height:'370px'}}/></div><p className="hint">Use math syntax: <code>sin(x)</code>, <code>x^2</code>, <code>sqrt(x)</code>, <code>log(x)</code>. Angles in graph functions are radians.</p></section>}
      {tab==='history'&&<section className="panel"><div className="panel-heading"><div><p className="eyebrow">LOCAL ON THIS DEVICE</p><h1>Calculation history</h1><p className="muted">Tap a result to reuse its expression.</p></div><button className="outline-button" onClick={()=>setHistory([])}>Clear all</button></div>{history.length===0?<div className="empty-state"><span>↶</span><h3>No calculations yet</h3><p>Your completed calculations will appear here.</p></div>:<div className="history-list">{history.map(item=><button className="history-item" key={item.id} onClick={()=>{setMode(item.mode);setExpr(item.expr);setResult(item.result);setTab('calc')}}><div><span className="history-mode">{modeInfo[item.mode].title} · {item.at}</span><div className="history-expr">{item.expr}</div></div><div className="history-result">{item.result}<small>↗ reuse</small></div></button>)}</div>}</section>}
      {tab==='tools'&&<section className="panel"><div className="panel-heading"><div><p className="eyebrow">QUICK MATH UTILITIES</p><h1>Tools</h1><p className="muted">Handy helpers for common scientific tasks.</p></div><span className="panel-icon">∑</span></div><div className="tool-grid">{[{id:'equation',icon:'x²',name:'Quadratic solver',desc:'Solve ax² + bx + c = 0'},{id:'statistics',icon:'σ',name:'Statistics',desc:'Mean, median, range and σ'},{id:'complex',icon:'ℂ',name:'Complex number',desc:'Modulus and argument'},{id:'convert',icon:'°',name:'Angle converter',desc:'Degrees to radians'}].map(t=><button key={t.id} className={'tool-card '+(tool===t.id?'active':'')} onClick={()=>{setTool(t.id);setToolResult('');setToolInput(t.id==='equation'?'2, -5, 2':t.id==='statistics'?'2, 4, 4, 7, 9':t.id==='complex'?'3, 4':'180')}}><span>{t.icon}</span><b>{t.name}</b><small>{t.desc}</small></button>)}</div><div className="tool-workspace"><label className="field-label">{tool==='equation'?'Coefficients a, b, c':tool==='statistics'?'Comma-separated data':tool==='complex'?'Real, imaginary parts':'Angle in degrees'}</label><input className="tool-input" value={toolInput} onChange={e=>setToolInput(e.target.value)} placeholder="Enter values"/><button className="primary-button" onClick={solveTool}>Calculate <span>→</span></button>{toolResult&&<pre className="tool-result">{toolResult}</pre>}</div><div className="quick-functions"><h3>Start a calculation</h3>{[['sin(30)','sin 30°'],['sqrt(2)','Square root'],['log(100)','Common log'],['(1+2)^3','Powers'],['5!','Factorial'],['pi*2','Constants']].map(([s,l])=><button key={s} onClick={()=>quick(s)}><span>{l}</span><code>{s}</code></button>)}</div></section>}
      {tab==='settings'&&<section className="panel"><div className="panel-heading"><div><p className="eyebrow">PERSONALISE</p><h1>Settings</h1><p className="muted">Tune the calculator for your workflow.</p></div><span className="panel-icon">⚙</span></div><div className="settings-list"><div className="setting-row"><div><b>Angle unit</b><small>Used for trigonometric calculations</small></div><div className="segmented"><button className={degrees?'active':''} onClick={()=>setDegrees(true)}>Degrees</button><button className={!degrees?'active':''} onClick={()=>setDegrees(false)}>Radians</button></div></div><div className="setting-row"><div><b>Appearance</b><small>Choose the app theme</small></div><div className="segmented"><button className={dark?'active':''} onClick={()=>setDark(true)}>Dark</button><button className={!dark?'active':''} onClick={()=>setDark(false)}>Light</button></div></div><div className="setting-row"><div><b>Active calculator</b><small>Switch model-inspired key layout</small></div><select value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="cw">ClassWiz fx-991CW</option><option value="ti">TI-84 Plus</option><option value="es">fx-991ES Plus</option></select></div><div className="setting-row"><div><b>Calculation history</b><small>{history.length} saved calculations · stored on this device</small></div><button className="outline-button" onClick={()=>setHistory([])}>Clear</button></div></div><div className="about-card"><div className="brand-mark">T<span>∑</span></div><div><b>TriCalc 1.0</b><p>Three familiar calculator workflows in one mobile-first app.</p><small>Independent project; not affiliated with Casio or Texas Instruments. Model names describe interface inspiration.</small></div></div></section>}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{([{id:'calc',icon:'▦',label:'Calculator'},{id:'graphs',icon:'⌁',label:'Graphs'},{id:'history',icon:'↶',label:'History'},{id:'tools',icon:'∑',label:'Tools'},{id:'settings',icon:'⚙',label:'Settings'}] as {id:Tab;icon:string;label:string}[]).map(n=><button key={n.id} className={tab===n.id?'active':''} onClick={()=>setTab(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>)}</nav>
  </div>;
}