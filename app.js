// 资产元数据保留在前端，所有报价字段在首次成功请求后由 API 更新，避免使用静态模拟报价。
const assets = [
  {id:'spx',name:'标普 500',symbol:'SPX',market:'美股',category:'美股',price:5846.72,change:28.43,changePercent:0.49,currency:'USD',unit:'指数点',spark:[42,44,43,47,46,49,51,50,54,56,55,59],details:{open:'5818.29',prev:'5818.29',high:'5862.14',low:'5806.82',volume:'3.42B',marketCap:'—',pe:'—',w52h:'5864.67',w52l:'4982.22'}},
  {id:'nasdaq',name:'纳斯达克综合指数',symbol:'IXIC',market:'美股',category:'美股',price:18929.35,change:-42.31,changePercent:-0.22,currency:'USD',unit:'指数点',spark:[58,57,60,59,61,58,56,57,53,54,52,51],details:{open:'18971.66',prev:'18971.66',high:'19041.22',low:'18862.14',volume:'5.18B',marketCap:'—',pe:'—',w52h:'20261.31',w52l:'15966.35'}},
  {id:'dji',name:'道琼斯工业平均指数',symbol:'DJI',market:'美股',category:'美股',price:43840.91,change:286.15,changePercent:0.66,currency:'USD',unit:'指数点',spark:[38,40,39,43,42,45,47,46,49,48,52,54],details:{open:'43554.76',prev:'43554.76',high:'43912.40',low:'43482.11',volume:'312M',marketCap:'—',pe:'—',w52h:'45073.63',w52l:'36611.78'}},
  {id:'aapl',name:'苹果',symbol:'AAPL',market:'美股',category:'美股',price:233.28,change:2.16,changePercent:0.93,currency:'USD',unit:'每股美元',spark:[34,36,35,38,37,41,43,42,46,48,47,50],details:{open:'231.12',prev:'231.12',high:'234.01',low:'230.42',volume:'48.2M',marketCap:'3.52T',pe:'35.8',w52h:'237.49',w52l:'164.08'}},
  {id:'msft',name:'微软',symbol:'MSFT',market:'美股',category:'美股',price:421.50,change:-3.24,changePercent:-0.76,currency:'USD',unit:'每股美元',spark:[58,56,57,54,55,52,53,50,51,48,49,47],details:{open:'424.74',prev:'424.74',high:'426.18',low:'419.63',volume:'21.4M',marketCap:'3.13T',pe:'34.7',w52h:'468.35',w52l:'376.91'}},
  {id:'nvda',name:'英伟达',symbol:'NVDA',market:'美股',category:'美股',price:138.85,change:4.72,changePercent:3.52,currency:'USD',unit:'每股美元',spark:[30,34,33,39,41,38,44,48,47,52,56,60],details:{open:'134.13',prev:'134.13',high:'139.92',low:'133.58',volume:'252M',marketCap:'3.40T',pe:'56.2',w52h:'152.89',w52l:'45.01'}},
  {id:'sh',name:'上证指数',symbol:'000001',market:'A股',category:'A股',price:3317.85,change:18.62,changePercent:0.56,currency:'CNY',unit:'指数点',spark:[42,43,41,45,44,47,48,46,50,52,51,54],details:{open:'3299.23',prev:'3299.23',high:'3325.18',low:'3292.16',volume:'412.8B',marketCap:'—',pe:'—',w52h:'3674.84',w52l:'2689.70'}},
  {id:'sz',name:'深证成指',symbol:'399001',market:'A股',category:'A股',price:10628.45,change:-55.18,changePercent:-0.52,currency:'CNY',unit:'指数点',spark:[55,57,54,53,56,52,50,51,48,46,45,43],details:{open:'10683.63',prev:'10683.63',high:'10712.30',low:'10582.44',volume:'328.6B',marketCap:'—',pe:'—',w52h:'11810.25',w52l:'8462.18'}},
  {id:'csi300',name:'沪深 300',symbol:'000300',market:'A股',category:'A股',price:3912.36,change:14.28,changePercent:0.37,currency:'CNY',unit:'指数点',spark:[40,41,43,42,45,47,46,49,48,50,51,53],details:{open:'3898.08',prev:'3898.08',high:'3921.64',low:'3891.77',volume:'238.1B',marketCap:'—',pe:'—',w52h:'4184.90',w52l:'3078.33'}},
  {id:'gem',name:'创业板指',symbol:'399006',market:'A股',category:'A股',price:2194.72,change:-21.65,changePercent:-0.98,currency:'CNY',unit:'指数点',spark:[62,61,59,60,57,55,56,53,51,52,48,47],details:{open:'2216.37',prev:'2216.37',high:'2221.12',low:'2182.68',volume:'186.4B',marketCap:'—',pe:'—',w52h:'2442.18',w52l:'1681.29'}},
  {id:'kweichow',name:'贵州茅台',symbol:'600519',market:'A股',category:'A股',price:1488.20,change:12.40,changePercent:0.84,currency:'CNY',unit:'每股人民币',spark:[38,39,42,41,44,43,46,48,47,51,53,55],details:{open:'1475.80',prev:'1475.80',high:'1492.60',low:'1468.32',volume:'26.8M',marketCap:'1.87T',pe:'20.1',w52h:'1932.00',w52l:'1272.00'}},
  {id:'catl',name:'宁德时代',symbol:'300750',market:'A股',category:'A股',price:251.80,change:-2.75,changePercent:-1.08,currency:'CNY',unit:'每股人民币',spark:[58,56,57,54,55,51,52,49,50,47,46,43],details:{open:'254.55',prev:'254.55',high:'256.30',low:'249.12',volume:'31.2M',marketCap:'1.18T',pe:'24.6',w52h:'263.20',w52l:'157.42'}},
  {id:'hsi',name:'恒生指数',symbol:'HSI',market:'港股',category:'港股',price:20520.31,change:168.42,changePercent:0.83,currency:'HKD',unit:'指数点',spark:[41,43,42,45,47,46,49,51,50,53,55,58],details:{open:'20351.89',prev:'20351.89',high:'20612.44',low:'20286.18',volume:'143.2B',marketCap:'—',pe:'—',w52h:'23099.78',w52l:'16492.00'}},
  {id:'hstech',name:'恒生科技指数',symbol:'HSTECH',market:'港股',category:'港股',price:4538.76,change:-18.25,changePercent:-0.40,currency:'HKD',unit:'指数点',spark:[58,56,59,57,55,53,54,51,52,49,50,48],details:{open:'4557.01',prev:'4557.01',high:'4582.14',low:'4512.80',volume:'—',marketCap:'—',pe:'—',w52h:'5629.22',w52l:'3310.01'}},
  {id:'hscei',name:'恒生中国企业指数',symbol:'HSCEI',market:'港股',category:'港股',price:7421.18,change:42.63,changePercent:0.58,currency:'HKD',unit:'指数点',spark:[39,40,43,42,44,46,45,48,49,48,51,53],details:{open:'7378.55',prev:'7378.55',high:'7442.20',low:'7351.36',volume:'—',marketCap:'—',pe:'—',w52h:'8641.48',w52l:'5567.82'}},
  {id:'0700',name:'腾讯控股',symbol:'0700.HK',market:'港股',category:'港股',price:412.80,change:6.20,changePercent:1.52,currency:'HKD',unit:'每股港元',spark:[36,38,37,41,43,42,45,47,49,48,52,55],details:{open:'406.60',prev:'406.60',high:'414.20',low:'404.80',volume:'14.8M',marketCap:'3.78T',pe:'19.8',w52h:'544.00',w52l:'260.60'}},
  {id:'9988',name:'阿里巴巴',symbol:'9988.HK',market:'港股',category:'港股',price:112.10,change:-1.90,changePercent:-1.67,currency:'HKD',unit:'每股港元',spark:[58,57,54,55,52,53,49,51,48,46,45,43],details:{open:'114.00',prev:'114.00',high:'115.30',low:'111.40',volume:'22.6M',marketCap:'2.12T',pe:'16.2',w52h:'117.60',w52l:'65.75'}},
  {id:'btc',name:'Bitcoin',symbol:'BTC',market:'加密货币',category:'加密货币',price:97642.31,change:1248.72,changePercent:1.30,currency:'USD',unit:'美元 / 枚',spark:[41,43,42,46,45,49,48,52,54,53,57,60],details:{open:'96393.59',prev:'96393.59',high:'98210.44',low:'95748.30',volume:'38.2B',marketCap:'1.93T',pe:'流通量 19.79M'}},
  {id:'eth',name:'Ethereum',symbol:'ETH',market:'加密货币',category:'加密货币',price:3482.68,change:-28.44,changePercent:-0.81,currency:'USD',unit:'美元 / 枚',spark:[56,58,55,57,54,52,53,49,51,48,47,45],details:{open:'3511.12',prev:'3511.12',high:'3562.40',low:'3448.18',volume:'18.7B',marketCap:'419.4B',pe:'流通量 120.3M'}},
  {id:'sol',name:'Solana',symbol:'SOL',market:'加密货币',category:'加密货币',price:218.42,change:8.76,changePercent:4.18,currency:'USD',unit:'美元 / 枚',spark:[32,35,34,38,42,40,45,49,48,53,57,61],details:{open:'209.66',prev:'209.66',high:'221.20',low:'207.54',volume:'5.1B',marketCap:'103.6B',pe:'流通量 474.3M'}},
  {id:'xau',name:'黄金',symbol:'XAU/USD',market:'贵金属',category:'贵金属',price:2628.40,change:14.62,changePercent:0.56,currency:'USD',unit:'美元 / 盎司',spark:[42,44,43,46,45,48,50,49,53,52,55,57],details:{open:'2613.78',prev:'2613.78',high:'2634.20',low:'2608.45',volume:'167.8K',marketCap:'持仓量 42.4K'}},
  {id:'xag',name:'白银',symbol:'XAG/USD',market:'贵金属',category:'贵金属',price:31.28,change:-0.21,changePercent:-0.67,currency:'USD',unit:'美元 / 盎司',spark:[60,59,57,58,55,56,52,53,50,51,48,47],details:{open:'31.49',prev:'31.49',high:'31.62',low:'31.12',volume:'82.3K',marketCap:'持仓量 118.6K'}},
  {id:'wti',name:'WTI 原油',symbol:'WTI',market:'石油',category:'石油',price:0,change:0,changePercent:0,currency:'USD',unit:'美元 / 桶',spark:[],details:{open:'—',prev:'—',high:'—',low:'—',volume:'—',marketCap:'—',pe:'—',w52h:'—',w52l:'—'}},
  {id:'brent',name:'布伦特原油',symbol:'BRENT',market:'石油',category:'石油',price:0,change:0,changePercent:0,currency:'USD',unit:'美元 / 桶',spark:[],details:{open:'—',prev:'—',high:'—',low:'—',volume:'—',marketCap:'—',pe:'—',w52h:'—',w52l:'—'}}
];

const categories = ['总览','美股','A股','港股','加密货币','贵金属','石油','我的自选'];
let activeCategory = '总览';

function readStoredArray(key){
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}
let favorites = readStoredArray('marketViewFavorites').filter(item => typeof item === 'string');
let currentAsset = null;
let lastUpdate = new Date();

// 内置资产与东方财富 secid 的对应关系，用于判断搜索结果是否已经存在于默认列表中。
const builtInSecids = {
  '100.SPX':'spx','100.DJIA':'dji','100.NDX':'nasdaq',
  '105.AAPL':'aapl','105.MSFT':'msft','105.NVDA':'nvda',
  '1.000001':'sh','0.399001':'sz','1.000300':'csi300','0.399006':'gem','1.600519':'kweichow','0.300750':'catl',
  '100.HSI':'hsi','124.HSTECH':'hstech','100.HSCEI':'hscei','116.00700':'0700','116.09988':'9988'
};
const builtInCoinIds = { '90':'btc', '80':'eth', '48543':'sol' };
const builtInCoinIdByAssetId = { btc:'90', eth:'80', sol:'48543' };
const builtInCoinSymbols = { BTC:'btc', ETH:'eth', SOL:'sol' };
const CUSTOM_ASSETS_KEY = 'marketViewCustomAssets';
const customAssets = readStoredArray(CUSTOM_ASSETS_KEY).filter(item =>
  item && typeof item.id === 'string' &&
  (typeof item.secid === 'string' ||
    ((item.source === 'coinlore' || item.source === 'gate') && (item.coinId || item.symbol)))
);

const INDEX_ORDER_KEY = 'marketViewIndexOrder';
const indexOrder = (() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(INDEX_ORDER_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
})();

const OVERVIEW_INDICES_KEY = 'marketViewOverviewIndices';
const overviewIndices = (() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(OVERVIEW_INDICES_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
})();

function saveOverviewIndices(){
  localStorage.setItem(OVERVIEW_INDICES_KEY, JSON.stringify(overviewIndices));
}

function orderedIndexIds(key, ids){
  const saved = Array.isArray(indexOrder[key]) ? indexOrder[key] : [];
  const valid = saved.filter(id => ids.includes(id));
  return [...valid, ...ids.filter(id => !valid.includes(id))];
}

function saveIndexOrder(key, ids){
  indexOrder[key] = ids;
  localStorage.setItem(INDEX_ORDER_KEY, JSON.stringify(indexOrder));
}

function emptyDetails(){ return {open:'—',prev:'—',high:'—',low:'—',volume:'—',marketCap:'—',pe:'—',w52h:'—',w52l:'—'}; }
function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

const $ = (s,root=document) => root.querySelector(s);
const API_BASE = String(window.MARKET_API_BASE || '').replace(/\/$/, '');
const apiUrl = path => `${API_BASE}${path}`;
const isStaticPagesHost = /\.github\.io$/i.test(location.hostname);
const forceStaticApi = new URLSearchParams(location.search).has('static');
const useStaticApi = !API_BASE && (isStaticPagesHost || forceStaticApi);

async function apiFetch(path, options = {}) {
  if (useStaticApi && window.MarketStaticApi) return window.MarketStaticApi.fetch(path, options);
  return fetch(apiUrl(path), options);
}

const categoryTabs = $('#category-tabs');

function priceDigits(price){
  if (!Number.isFinite(price)) return 2;
  if (price >= 1) return 2;
  if (price >= 0.1) return 4;
  if (price >= 0.001) return 6;
  return 8;
}
function formatPrice(asset){
  if (!Number.isFinite(asset.price)) return realDataFailureIds.has(asset.id) ? '数据暂不可用' : '加载中…';
  const digits = priceDigits(asset.price);
  return asset.price.toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits});
}
function signed(n,digits=2){ if(!Number.isFinite(n)) return '—'; const v=Number(n); return `${v>=0?'＋':'−'}${Math.abs(v).toFixed(digits)}`; }
function changeClass(n){ return Number.isFinite(n)&&n<0?'down':'up'; }
function formatTime(date){ return date.toLocaleTimeString('zh-CN',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}); }

function sparkSvg(values, positive=true){
  if(!values?.length) return '<svg viewBox="0 0 180 42" preserveAspectRatio="none" aria-hidden="true"><path d="M0 21H180" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4"/></svg>';
  const w=180,h=42,p=3; const min=Math.min(...values),max=Math.max(...values); const range=max-min||1;
  const pts=values.map((v,i)=>`${p+i*(w-p*2)/(values.length-1)},${h-p-(v-min)/range*(h-p*2)}`).join(' ');
  const color=positive?'var(--up)':'var(--down)';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="g${Math.random().toString(36).slice(2)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".18"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1" opacity=".12" vector-effect="non-scaling-stroke"/></svg>`;
}

function assetCard(asset, options = {}){
  const cls=changeClass(asset.changePercent);
  const favorite=favorites.includes(asset.id);
  const draggable=Boolean(options.draggable);
  const grip=draggable?`<span class="drag-grip" title="拖动排序" aria-hidden="true"><svg viewBox="0 0 12 20"><circle cx="4" cy="4" r="1.3"/><circle cx="8" cy="4" r="1.3"/><circle cx="4" cy="10" r="1.3"/><circle cx="8" cy="10" r="1.3"/><circle cx="4" cy="16" r="1.3"/><circle cx="8" cy="16" r="1.3"/></svg></span>`:'';
  return `<article class="asset-card ${draggable?'draggable-card':''}"${draggable?` data-drag-id="${asset.id}"`:''}>
    <button class="card-open" data-id="${asset.id}" aria-label="查看 ${asset.name} 详情">
      <div class="asset-card-head"><div class="asset-title-group">${grip}<div><div class="asset-name">${asset.name}</div><div class="asset-symbol">${asset.symbol}</div></div></div><span class="asset-market">${asset.market}</span></div>
      <div class="asset-price-row"><div class="asset-price">${formatPrice(asset)}</div><div class="asset-change ${cls}"><div>${signed(asset.changePercent)}%</div><div>${signed(asset.change,priceDigits(asset.price))}</div></div></div>
      <div class="mini-chart" title="分时走势">${sparkSvg(asset.spark,asset.changePercent>=0)}</div>
      <div class="asset-meta"><span>${asset.currency} · ${asset.unit}</span><span>${formatTime(lastUpdate)}</span></div>
    </button>
    <button class="favorite-star ${favorite?'active':''}" data-favorite="${asset.id}" title="${favorite?'从自选移除':'添加到自选'}" aria-label="${favorite?'从自选移除':'添加到自选'}" aria-pressed="${favorite}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>
    </button>
  </article>`;
}

function section(title, items, subtitle='', className=''){
  return `<section class="section"><div class="section-head"><h2>${title}</h2><span>${subtitle}</span></div><div class="asset-grid ${className}">${items.map(asset => assetCard(asset)).join('')}</div></section>`;
}

// 总览与分类页共用同一套市场分区配置，保证不同市场的资产不会混排。
const marketLayout = {
  '美股': { key:'us', title:'美股市场', subtitle:'US MARKET', badge:'US', groups:[
    { label:'核心指数', ids:['spx','nasdaq','dji'], columns:'three', kind:'index', reorder:true },
    { label:'热门个股', ids:['aapl','msft','nvda'], columns:'three', kind:'stock' }
  ]},
  'A股': { key:'cn', title:'A 股市场', subtitle:'CHINA A-SHARE', badge:'CN', groups:[
    { label:'主要指数', ids:['sh','sz','csi300','gem'], columns:'', kind:'index', reorder:true },
    { label:'热门个股', ids:['kweichow','catl'], columns:'two', kind:'stock' }
  ]},
  '港股': { key:'hk', title:'港股市场', subtitle:'HONG KONG MARKET', badge:'HK', groups:[
    { label:'主要指数', ids:['hsi','hstech','hscei'], columns:'three', kind:'index', reorder:true },
    { label:'热门个股', ids:['0700','9988'], columns:'two', kind:'stock' }
  ]},
  '加密货币': { key:'crypto', title:'加密货币', subtitle:'CRYPTOCURRENCY', badge:'CR', groups:[
    { label:'主流币种', ids:['btc','eth','sol'], columns:'three', kind:'crypto' }
  ]},
  '贵金属': { key:'metal', title:'贵金属', subtitle:'PRECIOUS METALS', badge:'MT', groups:[
    { label:'现货参考价', ids:['xau','xag'], columns:'two' }
  ]},
  '石油': { key:'oil', title:'石油', subtitle:'CRUDE OIL', badge:'OIL', groups:[
    { label:'原油基准价', ids:['wti','brent'], columns:'two' }
  ]}
};
const marketOrder = ['美股','A股','港股','加密货币','贵金属','石油'];
const marketKeyToCategory = { us:'美股', cn:'A股', hk:'港股', crypto:'加密货币', oil:'石油' };

function baseIndexIdsFor(key){
  const category = marketKeyToCategory[key];
  const layout = category ? marketLayout[category] : null;
  const group = layout?.groups.find(item => item.kind === 'index' || item.kind === 'crypto');
  return group ? group.ids : [];
}

function customOverviewIdsFor(key){
  return Array.isArray(overviewIndices[key]) ? overviewIndices[key] : [];
}

function marketBoard(layout){
  let count = 0;
  const groups = layout.groups.map(group => {
    const supportsExtras = group.kind === 'index' || group.kind === 'crypto';
    const extraIds = supportsExtras ? customOverviewIdsFor(layout.key) : [];
    const mergedIds = supportsExtras ? [...new Set([...group.ids, ...extraIds])] : group.ids;
    const ids = group.reorder ? orderedIndexIds(layout.key, mergedIds) : mergedIds;
    const items = ids.map(id => assets.find(asset => asset.id === id)).filter(Boolean);
    if (!items.length) return '';
    count += items.length;
    const hint = group.reorder ? '<span class="group-hint">拖动排序</span>' : '';
    const addButton = group.kind === 'index'
      ? `<button class="group-add-btn" data-add-index-market="${layout.key}" title="添加指数">＋ 添加指数</button>`
      : group.kind === 'crypto'
        ? '<button class="group-add-btn" data-add-crypto="1" title="添加自选">＋ 添加自选</button>'
        : '';
    const columns = group.columns === 'two' ? 'two' : (items.length === 4 ? '' : (group.columns || ''));
    const orderAttr = group.reorder ? ` data-order-key="${layout.key}"` : '';
    return `<div class="board-group">
      <div class="group-head"><span>${group.label}</span><i></i>${hint}${addButton}<em>${items.length}</em></div>
      <div class="asset-grid ${columns}"${orderAttr}>${items.map(asset => assetCard(asset, { draggable: group.reorder })).join('')}</div>
    </div>`;
  }).join('');
  return `<section class="market-board board-${layout.key}">
    <header class="board-head">
      <div class="board-title">
        <span class="board-badge">${layout.badge}</span>
        <div><h2>${layout.title}</h2><p>${layout.subtitle}</p></div>
      </div>
      <span class="board-count">${count} 个资产</span>
    </header>
    ${groups}
  </section>`;
}

function overviewLayout(layout){
  return { ...layout, groups: layout.groups.filter(group => group.kind !== 'stock') };
}

function groupedBoards(items, { titleSuffix = '', subtitle = '公开行情源', label = '资产' } = {}){
  return marketOrder.map(category => {
    const ids = items.filter(asset => asset.category === category).map(asset => asset.id);
    if (!ids.length) return '';
    const layout = marketLayout[category];
    const columns = ids.length >= 4 ? '' : ids.length === 3 ? 'three' : 'two';
    return marketBoard({
      ...layout,
      title: `${layout.title}${titleSuffix}`,
      subtitle,
      groups: [{ label: `${label} · ${ids.length}`, ids, columns }]
    });
  }).join('');
}

function favoritesView(){
  const items = assets.filter(asset => favorites.includes(asset.id));
  if (!items.length) return `<div class="empty-state"><div class="empty-icon">☆</div><h2>暂无自选资产</h2><p>打开资产详情并点击“添加到自选”</p></div>`;
  return `<div class="board-note">已按市场分类展示 ${items.length} 个自选资产</div>` + groupedBoards(items, { titleSuffix: ' · 自选', subtitle: 'MY WATCHLIST', label: '已关注' });
}

function renderCategories(){
  categoryTabs.innerHTML=categories.map(c=>`<button class="category-tab ${c===activeCategory?'active':''}" data-category="${c}">${c}${c==='我的自选'&&favorites.length?`<span class="tab-badge">${favorites.length}</span>`:''}</button>`).join('');
}

function renderMarketContent(){
  const content=$('#market-content');
  const query=$('#global-search').value.trim().toLowerCase();
  if(query){
    const results=assets.filter(a=>`${a.name} ${a.symbol} ${a.market}`.toLowerCase().includes(query));
    if(!results.length){ content.innerHTML=`<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></div><h2>未找到匹配资产</h2><p>试试搜索名称、代码或市场名称</p></div>`; return; }
    content.innerHTML=`<div class="board-note">搜索结果 ${results.length} 个，已按市场分类</div>` + groupedBoards(results, { titleSuffix: ' · 搜索', subtitle: 'SEARCH RESULTS', label: '匹配' });
    return;
  }
  if(activeCategory==='总览'){
    content.innerHTML=marketOrder.map(category=>marketBoard(overviewLayout(marketLayout[category]))).join('');
  } else if(activeCategory==='我的自选'){
    content.innerHTML=favoritesView();
  } else {
    const layout=marketLayout[activeCategory];
    content.innerHTML=layout?marketBoard(layout):section(activeCategory,assets.filter(a=>a.category===activeCategory),'公开行情源');
  }
}

function setCategory(category){ activeCategory=category; $('#global-search').value=''; renderCategories(); $('#page-title').textContent=category==='总览'?'市场总览':category; $('#page-eyebrow').textContent=category==='总览'?'MARKET OVERVIEW':`${category.toUpperCase()} MARKET`; renderMarketContent(); }

function openDrawer(asset){
  currentAsset=asset; const cls=changeClass(asset.changePercent); const isFav=favorites.includes(asset.id);
  const crypto=asset.category==='加密货币', metal=asset.category==='贵金属', oil=asset.category==='石油';
  const commodity=metal||oil;
  const metricKeys=crypto?[
    ['24小时最高价',asset.details.high],['24小时最低价',asset.details.low],['24小时成交量',asset.details.volume],['市值',asset.details.marketCap],['流通量',asset.details.pe],['计价货币',asset.currency],['交易单位',asset.unit]
  ]:commodity?[
    ['开盘价',asset.details.open],['昨收价',asset.details.prev],['今日最高价',asset.details.high],['今日最低价',asset.details.low],['成交量',asset.details.volume],['计价货币',asset.currency],['交易单位',asset.unit]
  ]:[['开盘价',asset.details.open],['昨收价',asset.details.prev],['今日最高价',asset.details.high],['今日最低价',asset.details.low],['成交量',asset.details.volume],['市值',asset.details.marketCap],['市盈率',asset.details.pe],['52周最高价',asset.details.w52h],['52周最低价',asset.details.w52l]];
  $('#detail-content').innerHTML=`<div class="detail-inner">
    <div class="detail-head"><div class="detail-title"><h2>${asset.name} <span class="asset-market">${asset.market}</span></h2><div class="symbol">${asset.symbol}</div></div><button class="close-btn" id="close-drawer" aria-label="关闭详情">×</button></div>
    <div class="detail-price-row"><div><div class="detail-price">${formatPrice(asset)}</div><div style="color:var(--muted);font-size:10px;margin-top:5px">${asset.currency} · ${asset.unit}</div></div><div class="detail-change ${cls}"><div>${signed(asset.change,priceDigits(asset.price))} ${asset.currency}</div><div>${signed(asset.changePercent)}%</div></div></div>
    <div class="range-tabs">${['1D','5D','1M','3M','1Y'].map((r,i)=>`<button class="range-tab ${i===0?'active':''}" data-range="${r}">${r}</button>`).join('')}</div>
    <div class="main-chart" id="main-chart"><div class="chart-tooltip" id="chart-tooltip"></div></div>
    <button class="favorite-btn ${isFav?'active':''}" id="favorite-detail-btn">${isFav?'★ 已在自选':'☆ 添加到自选'}</button>
    <div class="metrics-grid">${metricKeys.map(([k,v])=>`<div class="metric"><span>${k}</span><strong>${v||'—'}</strong></div>`).join('')}</div>
    <div class="detail-footer"><span>更新时间 ${formatTime(lastUpdate)}</span><span>公开行情源 · 实时或交易所延时数据</span></div>
  </div>`;
  $('#drawer-overlay').hidden=false; $('#detail-drawer').classList.add('open'); $('#detail-drawer').setAttribute('aria-hidden','false');
  renderMainChart(asset,'1D');
  $('#close-drawer').onclick=closeDrawer;
  $('#favorite-detail-btn').onclick=()=>toggleFavorite(asset.id,true);
  document.querySelectorAll('.range-tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.range-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderMainChart(asset,btn.dataset.range)});
}

function renderMainChart(asset,range){
  const box=$('#main-chart'); if(!box)return;
  const tooltip=$('#chart-tooltip');
  box.insertAdjacentHTML('afterbegin','<div class="chart-loading" style="padding:16px;color:var(--muted);font-size:12px">正在获取真实走势…</div>');

  const chartQuery = asset.secid
    ? `secid=${encodeURIComponent(asset.secid)}&range=${encodeURIComponent(range)}`
    : asset.category === '加密货币' && asset.symbol
      ? `crypto=${encodeURIComponent(asset.symbol)}&range=${encodeURIComponent(range)}`
      : `id=${encodeURIComponent(asset.id)}&range=${encodeURIComponent(range)}`;
  apiFetch(`/api/chart?${chartQuery}`,{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error(`图表数据错误 ${response.status}`);return response.json()})
    .then(data=>{
      const vals=(data.points||[]).filter(Number.isFinite);
      box.querySelectorAll('svg,.chart-loading,.chart-tooltip').forEach(el=>{if(el!==tooltip)el.remove()});
      if(vals.length<2){tooltip.style.display='block';tooltip.textContent='当前区间暂无可用数据';return;}
      const w=900,h=260,p=18,min=Math.min(...vals),max=Math.max(...vals),rangeV=max-min||1;
      const pts=vals.map((v,i)=>[p+i*(w-p*2)/(vals.length-1),h-p-(v-min)/rangeV*(h-p*2)]);
      const positive=asset.changePercent>=0;
      const color=positive?'var(--up)':'var(--down)';
      const line=pts.map(point=>point.join(',')).join(' ');
      const area=`${pts[0][0]},${h-p} ${line} ${pts.at(-1)[0]},${h-p}`;
      box.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><g stroke="var(--border)" stroke-width="1"><path d="M${p} ${h/4}H${w-p}"/><path d="M${p} ${h/2}H${w-p}"/><path d="M${p} ${h*.75}H${w-p}"/></g><polygon points="${area}" fill="${color}" opacity=".08"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`);
      box.onmousemove=e=>{
        const rect=box.getBoundingClientRect();const x=Math.max(0,Math.min(e.clientX-rect.left,rect.width));const i=Math.round(x/rect.width*(vals.length-1));const timestamp=data.timestamps?.[i];
        const time=timestamp?new Date(timestamp*1000).toLocaleString('zh-CN',{hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'}):range;
        tooltip.style.display='block';tooltip.innerHTML=`<span>${time}</span>${asset.currency} ${vals[i].toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
        tooltip.style.left=`${Math.min(x+10,rect.width-130)}px`;tooltip.style.top=`${Math.max(8,pts[i][1]/h*rect.height-45)}px`;
      };
      box.onmouseleave=()=>tooltip.style.display='none';
    })
    .catch(error=>{box.querySelectorAll('svg,.chart-loading').forEach(el=>el.remove());tooltip.style.display='block';tooltip.textContent=error.message});
}

// 所有报价字段在真实接口成功返回后更新；未成功时绝不保留或显示模拟价格。
assets.forEach(asset => {
  asset.price = null;
  asset.change = null;
  asset.changePercent = null;
  asset.spark = [];
  asset.details = emptyDetails();
});

// 将用户添加的自定义资产合并进资产列表（价格等信息由接口动态填充）。
{
  const existingIds = new Set(assets.map(asset => asset.id));
  const referencedIds = new Set([
    ...favorites,
    ...Object.values(overviewIndices).flatMap(list => Array.isArray(list) ? list : [])
  ]);
  customAssets.forEach(item => {
    if (existingIds.has(item.id) || !referencedIds.has(item.id)) return;
    assets.push({ ...item, price: null, change: null, changePercent: null, spark: [], details: emptyDetails() });
    existingIds.add(item.id);
  });
}

const realDataFailureIds = new Set();

function formatMarketVolume(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

async function fetchRealData(options = {}) {
  const btn = $('#refresh-btn');
  btn.classList.add('spinning');
  try {
    const response = await apiFetch('/api/market', {cache:'no-store'});
    if (!response.ok) throw new Error(`行情服务错误 ${response.status}`);
    const data = await response.json();

    // 拉取用户添加的自定义资产行情，并合并进统一的数据结构。
    const overviewReferencedIds = new Set(
      Object.values(overviewIndices).flatMap(list => Array.isArray(list) ? list : [])
    );
    const activeCustomAssets = customAssets.filter(asset =>
      assets.some(item => item.id === asset.id) &&
      (favorites.includes(asset.id) || overviewReferencedIds.has(asset.id))
    );
    if (activeCustomAssets.length) {
      const customQuotes = await Promise.all(activeCustomAssets.map(async asset => {
        try {
          const params = asset.category === '加密货币'
            ? new URLSearchParams({
                source: 'crypto',
                coinId: asset.coinId || '',
                symbol: asset.symbol || '',
                geckoId: asset.geckoId || ''
              })
            : new URLSearchParams({ secid: asset.secid, category: asset.category, symbol: asset.symbol || '', type: asset.type || '' });
          const quoteResponse = await apiFetch(`/api/quote?${params.toString()}`, {cache:'no-store'});
          if (!quoteResponse.ok) throw new Error(`行情服务错误 ${quoteResponse.status}`);
          return [asset.id, await quoteResponse.json()];
        } catch (error) {
          return [asset.id, { error: error.message }];
        }
      }));
      Object.assign(data, Object.fromEntries(customQuotes));
    }

    realDataFailureIds.clear();
    let successCount = 0;

    assets.forEach(asset => {
      const quote = data[asset.id];
      if (!quote || quote.error || !Number.isFinite(quote.price)) {
        realDataFailureIds.add(asset.id);
        asset.price = null;
        asset.change = null;
        asset.changePercent = null;
        asset.spark = [];
        asset.details = {open:'—',prev:'—',high:'—',low:'—',volume:'—',marketCap:'—',pe:'—',w52h:'—',w52l:'—'};
        return;
      }

      successCount++;
      const previous = Number.isFinite(quote.previousClose) ? quote.previousClose : null;
      asset.price = quote.price;
      asset.change = previous === null ? null : quote.price - previous;
      asset.changePercent = previous ? ((quote.price - previous) / previous * 100) : null;
      asset.spark = Array.isArray(quote.spark) ? quote.spark.filter(Number.isFinite) : [];
      const digits = priceDigits(asset.price);
      asset.details = {
        open: Number.isFinite(quote.open) ? quote.open.toFixed(digits) : '—',
        prev: previous === null ? '—' : previous.toFixed(digits),
        high: Number.isFinite(quote.high) ? quote.high.toFixed(digits) : '—',
        low: Number.isFinite(quote.low) ? quote.low.toFixed(digits) : '—',
        volume: formatMarketVolume(quote.volume),
        marketCap: formatMarketVolume(quote.marketCap),
        pe: asset.category === '加密货币'
          ? formatMarketVolume(quote.supply)
          : (Number.isFinite(quote.pe) ? quote.pe.toFixed(2) : '—'),
        w52h: Number.isFinite(quote.w52h) ? quote.w52h.toFixed(digits) : '—',
        w52l: Number.isFinite(quote.w52l) ? quote.w52l.toFixed(digits) : '—'
      };
      if (quote.currency) asset.currency = quote.currency;
    });

    lastUpdate = new Date();
    $('#last-update').textContent = formatTime(lastUpdate);
    if (realDataFailureIds.size) {
      $('#alert-text').textContent = `${successCount} 个资产已更新，${realDataFailureIds.size} 个资产暂时无法获取真实数据。`;
      $('#alert-bar').hidden = false;
    } else {
      $('#alert-bar').hidden = true;
      if (!options.silent) showToast('已获取最新真实行情');
    }
  } catch (error) {
    assets.forEach(asset => {
      realDataFailureIds.add(asset.id);
      asset.price = null;
      asset.change = null;
      asset.changePercent = null;
      asset.spark = [];
    });
    $('#alert-text').textContent = useStaticApi
      ? `静态模式行情获取失败：${error.message}`
      : `真实行情获取失败：${error.message}`;
    $('#alert-bar').hidden = false;
  } finally {
    btn.classList.remove('spinning');
    renderMarketContent();
  }
}

function refreshData(){ fetchRealData(); }
$('#refresh-btn').onclick=refreshData;
$('#retry-btn').onclick=()=>{$('#alert-bar').hidden=true;fetchRealData();};
$('#error-demo-btn').onclick=()=>{fetchRealData();showToast('正在检查真实行情数据')};

let toastTimer = null;
function showToast(message){
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function closeDrawer(){
  $('#detail-drawer').classList.remove('open');
  $('#detail-drawer').setAttribute('aria-hidden', 'true');
  $('#drawer-overlay').hidden = true;
  currentAsset = null;
}

function persistCustomAssets(){
  const clean = customAssets.map(({id,name,symbol,market,category,currency,unit,secid,coinId,geckoId,source,type}) => ({id,name,symbol,market,category,currency,unit,secid,coinId,geckoId,source,type}));
  localStorage.setItem(CUSTOM_ASSETS_KEY, JSON.stringify(clean));
}

function cleanupCustomAsset(id){
  if (favorites.includes(id)) return;
  const stillInOverview = Object.values(overviewIndices).some(list => Array.isArray(list) && list.includes(id));
  if (stillInOverview) return;
  const customIndex = customAssets.findIndex(asset => asset.id === id);
  if (customIndex >= 0) {
    customAssets.splice(customIndex, 1);
    persistCustomAssets();
  }
  const assetIndex = assets.findIndex(asset => asset.id === id && asset.secid);
  if (assetIndex >= 0) assets.splice(assetIndex, 1);
}

function toggleFavorite(id, fromDrawer = false){
  const index = favorites.indexOf(id);
  if (index >= 0) favorites.splice(index, 1);
  else favorites.push(id);
  localStorage.setItem('marketViewFavorites', JSON.stringify(favorites));
  // 取消收藏后，仅当资产也不再出现在总览时才清理。
  if (index >= 0) {
    cleanupCustomAsset(id);
    if (currentAsset && currentAsset.id === id) closeDrawer();
  }
  showToast(index >= 0 ? '已从自选移除' : '已添加到自选');
  renderCategories();
  renderMarketContent();
  if (fromDrawer && currentAsset && currentAsset.id === id) {
    const button = $('#favorite-detail-btn');
    if (button) {
      const active = favorites.includes(id);
      button.classList.toggle('active', active);
      button.textContent = active ? '★ 已在自选' : '☆ 添加到自选';
    }
  }
}

function updateMarketStatus(){
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const minutes = eastern.getHours() * 60 + eastern.getMinutes();
  const weekday = eastern.getDay();
  const open = weekday >= 1 && weekday <= 5 && minutes >= 570 && minutes < 960;
  const label = $('#market-status-text');
  if (label) label.textContent = open ? '美股开盘中' : '美股已收盘';
  const dot = $('.market-status .status-dot');
  if (dot) {
    dot.style.background = open ? 'var(--up)' : 'var(--muted)';
    dot.style.boxShadow = open ? '0 0 0 3px rgba(34,197,94,.12)' : 'none';
  }
}

let dragState = null;
let dragCandidate = null;
let suppressCardClick = false;

function startCardDrag(card, grid, event, moved = false){
  dragState = { card, grid, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved };
  card.classList.add('dragging');
  try { card.setPointerCapture(event.pointerId); } catch (error) {}
}

$('#market-content').addEventListener('click', event => {
  if (suppressCardClick) return;
  if (event.target.closest('.drag-grip')) return;
  const addIndexButton = event.target.closest('[data-add-index-market]');
  if (addIndexButton) {
    openAddModal({ mode:'index', marketKey: addIndexButton.dataset.addIndexMarket });
    return;
  }
  const addCryptoButton = event.target.closest('[data-add-crypto]');
  if (addCryptoButton) {
    openAddModal({ mode:'crypto' });
    return;
  }
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) { toggleFavorite(favoriteButton.dataset.favorite); return; }
  const card = event.target.closest('.card-open');
  if (!card) return;
  const asset = assets.find(item => item.id === card.dataset.id);
  if (asset) openDrawer(asset);
});

$('#market-content').addEventListener('pointerdown', event => {
  if (event.button !== undefined && event.button !== 0) return;
  const card = event.target.closest('.draggable-card');
  if (!card) return;
  if (event.target.closest('[data-favorite]')) return;
  const grid = card.closest('[data-order-key]');
  if (!grid) return;
  const grip = event.target.closest('.drag-grip');
  // 触摸设备只允许从手柄拖动，避免影响页面滚动；鼠标/触控笔可拖动整张卡片。
  if (event.pointerType === 'touch' && !grip) return;
  if (grip) {
    event.preventDefault();
    startCardDrag(card, grid, event, false);
    return;
  }
  dragCandidate = { card, grid, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
});

document.addEventListener('pointermove', event => {
  if (dragCandidate && event.pointerId === dragCandidate.pointerId && !dragState) {
    const dx = event.clientX - dragCandidate.startX;
    const dy = event.clientY - dragCandidate.startY;
    if (Math.hypot(dx, dy) < 6) return;
    const { card, grid } = dragCandidate;
    dragCandidate = null;
    startCardDrag(card, grid, event, true);
  }
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const { card, grid } = dragState;
  if (!card.isConnected || !grid.isConnected) { dragState = null; return; }
  if (!dragState.moved) {
    if (Math.abs(event.clientX - dragState.startX) < 4 && Math.abs(event.clientY - dragState.startY) < 4) return;
    dragState.moved = true;
  }
  event.preventDefault();
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.draggable-card');
  if (!target || target === card || target.parentElement !== grid) return;
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  const rect = target.getBoundingClientRect();
  const before = columns <= 1
    ? event.clientY < rect.top + rect.height / 2
    : event.clientX < rect.left + rect.width / 2;
  if (before ? card.nextElementSibling === target : card.previousElementSibling === target) return;
  grid.insertBefore(card, before ? target : target.nextElementSibling);
}, { passive: false });

function finishDrag(event){
  if (dragCandidate && (!event || event.pointerId === undefined || event.pointerId === dragCandidate.pointerId)) {
    dragCandidate = null;
  }
  if (!dragState) return;
  if (event && event.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;
  const { card, grid, moved } = dragState;
  card.classList.remove('dragging');
  dragState = null;
  if (!moved) return;
  suppressCardClick = true;
  setTimeout(() => { suppressCardClick = false; }, 260);
  const ids = [...grid.querySelectorAll('.draggable-card')].map(item => item.dataset.dragId);
  saveIndexOrder(grid.dataset.orderKey, ids);
  renderMarketContent();
}
document.addEventListener('pointerup', finishDrag);
document.addEventListener('pointercancel', finishDrag);

categoryTabs.addEventListener('click', event => {
  const tab = event.target.closest('.category-tab');
  if (tab) setCategory(tab.dataset.category);
});

const searchInput = $('#global-search');
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderMarketContent, 120);
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
  if (event.key === 'Escape') {
    if (!$('#add-modal').hidden) { closeAddModal(); return; }
    if ($('#detail-drawer').classList.contains('open')) { closeDrawer(); return; }
    if (searchInput.value) { searchInput.value = ''; renderMarketContent(); }
  }
});

function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('marketViewTheme', theme);
}
const savedTheme = localStorage.getItem('marketViewTheme');
if (savedTheme === 'light' || savedTheme === 'dark') applyTheme(savedTheme);
$('#theme-btn').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

$('#drawer-overlay').addEventListener('click', closeDrawer);
$('.brand').addEventListener('click', event => {
  event.preventDefault();
  setCategory('总览');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ----------------------- 添加自选 / 添加指数 ----------------------- */

let addSearchResults = [];
let addSearchTimer = null;
let addSearchRequest = 0;
let addModalMode = 'favorite';
let addModalMarketKey = null;

function assetForSearchResult(result){
  const isCrypto = result.category === '加密货币' || result.source === 'coinlore' || result.source === 'gate' || result.coinId;
  if (isCrypto) {
    const builtInId = builtInCoinIds[String(result.coinId || '')] || builtInCoinSymbols[String(result.symbol || '').toUpperCase()];
    if (builtInId) return assets.find(asset => asset.id === builtInId);
    const symbol = String(result.symbol || '').toUpperCase();
    return assets.find(asset => {
      if (asset.category !== '加密货币') return false;
      if (result.coinId && asset.coinId) return String(asset.coinId) === String(result.coinId);
      return String(asset.symbol || '').toUpperCase() === symbol;
    });
  }
  const builtInId = builtInSecids[result.secid];
  if (builtInId) return assets.find(asset => asset.id === builtInId);
  return assets.find(asset => asset.secid === result.secid);
}

function isSearchResultAdded(result){
  const asset = assetForSearchResult(result);
  return Boolean(asset && favorites.includes(asset.id));
}

function currentOverviewResults(){
  return customOverviewIdsFor(addModalMarketKey)
    .map(id => assets.find(asset => asset.id === id))
    .filter(Boolean)
    .map(asset => ({
      id: asset.id, secid: asset.secid, source: asset.source, name: asset.name,
      symbol: asset.symbol, market: asset.market, category: asset.category,
      type: asset.type || '指数', currency: asset.currency, unit: asset.unit
    }));
}

function resetAddModalResults(){
  const box = $('#add-search-results');
  if (addModalMode === 'index') {
    addSearchResults = currentOverviewResults();
    if (addSearchResults.length) renderAddResults();
    else box.innerHTML = '<div class="add-hint">输入代码或名称搜索该市场的指数</div>';
    return;
  }
  if (addModalMode === 'crypto') {
    const relevantIds = new Set([
      ...favorites,
      ...baseIndexIdsFor('crypto'),
      ...customOverviewIdsFor('crypto')
    ]);
    addSearchResults = assets
      .filter(asset => asset.category === '加密货币' && relevantIds.has(asset.id))
      .map(asset => ({
        id: asset.id, coinId: asset.coinId || builtInCoinIdByAssetId[asset.id] || '',
        geckoId: asset.geckoId || '',
        source: asset.source || 'coinlore', name: asset.name, symbol: asset.symbol,
        market: asset.market, category: asset.category, type: asset.type || '币种',
        currency: asset.currency, unit: asset.unit
      }));
    if (addSearchResults.length) renderAddResults();
    else box.innerHTML = '<div class="add-hint">输入币种名称或代码搜索</div>';
    return;
  }
  addSearchResults = [];
  box.innerHTML = '<div class="add-hint">输入代码或名称开始搜索</div>';
}

function renderAddResults(){
  const box = $('#add-search-results');
  if (!box) return;
  if (!addSearchResults.length) {
    box.innerHTML = addModalMode === 'index'
      ? '<div class="add-hint">未找到该市场的指数，试试完整代码或名称</div>'
      : addModalMode === 'crypto'
        ? '<div class="add-hint">未找到匹配币种，试试完整代码或名称</div>'
        : '<div class="add-hint">未找到匹配资产，试试完整代码或名称</div>';
    return;
  }
  box.innerHTML = addSearchResults.map(result => {
    const meta = `<div class="add-result-meta"><span>${escapeHtml(result.symbol)}</span><span>${escapeHtml(result.market)}</span><span>${escapeHtml(result.type)}</span></div>`;
    if (addModalMode === 'index') {
      const asset = assetForSearchResult(result);
      const id = asset ? asset.id : result.id;
      const isBase = baseIndexIdsFor(addModalMarketKey).includes(id);
      const isCustom = customOverviewIdsFor(addModalMarketKey).includes(id);
      let action;
      if (isBase) action = '<button class="add-result-btn added" disabled>已在总览</button>';
      else if (isCustom) action = `<button class="add-result-btn remove" data-remove-overview-result-id="${escapeHtml(result.id)}">移除</button>`;
      else action = `<button class="add-result-btn" data-add-index-result-id="${escapeHtml(result.id)}">＋ 添加</button>`;
      return `<div class="add-result">
        <div class="add-result-info"><div class="add-result-name">${escapeHtml(result.name)}</div>${meta}</div>
        ${action}
      </div>`;
    }
    if (addModalMode === 'crypto') {
      const asset = assetForSearchResult(result);
      const id = asset ? asset.id : result.id;
      const isBase = baseIndexIdsFor('crypto').includes(id);
      const isCustom = customOverviewIdsFor('crypto').includes(id);
      let action;
      if (isBase) action = '<button class="add-result-btn added" disabled>已在总览</button>';
      else if (isCustom) action = `<button class="add-result-btn remove" data-remove-crypto-result-id="${escapeHtml(result.id)}">移除</button>`;
      else action = `<button class="add-result-btn" data-add-result-id="${escapeHtml(result.id)}">＋ 添加</button>`;
      return `<div class="add-result">
        <div class="add-result-info"><div class="add-result-name">${escapeHtml(result.name)}</div>${meta}</div>
        ${action}
      </div>`;
    }
    const added = isSearchResultAdded(result);
    return `<div class="add-result">
      <div class="add-result-info"><div class="add-result-name">${escapeHtml(result.name)}</div>${meta}</div>
      <button class="add-result-btn ${added ? 'added' : ''}" data-add-result-id="${escapeHtml(result.id)}" ${added ? 'disabled' : ''}>${added ? '已添加' : '＋ 添加'}</button>
    </div>`;
  }).join('');
}

async function searchAddAssets(query){
  const box = $('#add-search-results');
  const keyword = String(query || '').trim();
  if (!keyword) {
    resetAddModalResults();
    return;
  }
  const requestId = ++addSearchRequest;
  box.innerHTML = '<div class="add-hint">正在搜索…</div>';
  try {
    const response = await apiFetch(`/api/search?q=${encodeURIComponent(keyword)}`, {cache:'no-store'});
    if (!response.ok) throw new Error(`搜索服务错误 ${response.status}`);
    const data = await response.json();
    if (requestId !== addSearchRequest) return;
    let results = Array.isArray(data.results) ? data.results : [];
    if (addModalMode === 'index') {
      const category = marketKeyToCategory[addModalMarketKey];
      results = results.filter(item => item.type === '指数' && item.category === category);
    } else if (addModalMode === 'crypto') {
      results = results.filter(item => item.category === '加密货币');
    }
    addSearchResults = results;
    renderAddResults();
  } catch (error) {
    if (requestId !== addSearchRequest) return;
    addSearchResults = [];
    box.innerHTML = `<div class="add-hint add-error">${escapeHtml(error.message)}</div>`;
  }
}

function addExtraToOverview(key, asset){
  if (!key || !asset) return;
  if (baseIndexIdsFor(key).includes(asset.id)) return;
  const list = Array.isArray(overviewIndices[key]) ? overviewIndices[key] : (overviewIndices[key] = []);
  if (!list.includes(asset.id)) {
    list.push(asset.id);
    saveOverviewIndices();
  }
}

function addSearchResult(result){
  let asset = assetForSearchResult(result);
  if (!asset) {
    asset = { ...result, price: null, change: null, changePercent: null, spark: [], details: emptyDetails() };
    assets.push(asset);
    customAssets.push({
      id: asset.id, name: asset.name, symbol: asset.symbol, market: asset.market,
      category: asset.category, currency: asset.currency, unit: asset.unit,
      secid: asset.secid, coinId: asset.coinId, geckoId: asset.geckoId, source: asset.source, type: asset.type
    });
    persistCustomAssets();
  }
  if (addModalMode === 'crypto') addExtraToOverview('crypto', asset);
  if (!favorites.includes(asset.id)) {
    favorites.push(asset.id);
    localStorage.setItem('marketViewFavorites', JSON.stringify(favorites));
  }
  renderCategories();
  renderMarketContent();
  renderAddResults();
  fetchRealData({ silent: true }).then(() => {
    showToast(addModalMode === 'crypto' ? `${asset.name} 已添加到总览和自选` : `${asset.name} 已加入自选`);
  });
}

function addIndexToOverview(result){
  const key = addModalMarketKey;
  const category = marketKeyToCategory[key];
  if (!key || result.type !== '指数' || result.category !== category) return;

  let asset = assetForSearchResult(result);
  if (!asset) {
    asset = { ...result, price: null, change: null, changePercent: null, spark: [], details: emptyDetails() };
    assets.push(asset);
    customAssets.push({
      id: asset.id, name: asset.name, symbol: asset.symbol, market: asset.market,
      category: asset.category, currency: asset.currency, unit: asset.unit,
      secid: asset.secid, coinId: asset.coinId, geckoId: asset.geckoId, source: asset.source, type: asset.type
    });
    persistCustomAssets();
  }
  addExtraToOverview(key, asset);
  renderMarketContent();
  renderAddResults();
  fetchRealData({ silent: true }).then(() => {
    showToast(`${asset.name} 已添加到总览`);
  });
}

function removeExtraFromOverview(key, result){
  if (!key) return;
  const asset = assetForSearchResult(result);
  const id = asset ? asset.id : result.id;
  const list = Array.isArray(overviewIndices[key]) ? overviewIndices[key] : [];
  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
    saveOverviewIndices();
  }
  if (Array.isArray(indexOrder[key])) {
    indexOrder[key] = indexOrder[key].filter(item => item !== id);
    localStorage.setItem(INDEX_ORDER_KEY, JSON.stringify(indexOrder));
  }
  cleanupCustomAsset(id);
  renderMarketContent();
  renderAddResults();
  showToast('已从总览移除');
}

function removeIndexFromOverview(result){
  removeExtraFromOverview(addModalMarketKey, result);
}

function removeCryptoFromOverview(result){
  removeExtraFromOverview('crypto', result);
}

function openAddModal(options = {}){
  addModalMode = options.mode === 'index' ? 'index' : options.mode === 'crypto' ? 'crypto' : 'favorite';
  addModalMarketKey = addModalMode === 'index' ? options.marketKey : null;
  const category = marketKeyToCategory[addModalMarketKey];
  const title = $('#add-modal-title');
  const subtitle = $('#add-modal-subtitle');
  const input = $('#add-search-input');
  if (addModalMode === 'index') {
    title.textContent = `添加指数${category ? ' · ' + category : ''}`;
    subtitle.textContent = '搜索该市场的指数，添加后可在总览中拖动排序';
    input.placeholder = category === '美股' ? '例如 SPX / NDX / RUT' : category === 'A股' ? '例如 沪深300 / 上证50' : '例如 恒生指数 / HSTECH';
  } else if (addModalMode === 'crypto') {
    title.textContent = '添加自选 · 加密货币';
    subtitle.textContent = '搜索币种名称或代码，添加到总览和我的自选';
    input.placeholder = '例如 BTC / ETH / DOGE / 狗狗币';
  } else {
    title.textContent = '添加自选';
    subtitle.textContent = '支持美股、A 股、港股、指数及加密货币，输入代码或名称即可搜索';
    input.placeholder = '例如 TSLA / 600519 / 腾讯 / BTC';
  }
  $('#add-modal').hidden = false;
  document.body.classList.add('modal-open');
  input.value = '';
  resetAddModalResults();
  setTimeout(() => input.focus(), 30);
}

function closeAddModal(){
  $('#add-modal').hidden = true;
  document.body.classList.remove('modal-open');
  clearTimeout(addSearchTimer);
}

$('#add-favorite-btn').addEventListener('click', () => openAddModal());
$('#close-add-modal').addEventListener('click', closeAddModal);
$('#add-modal').addEventListener('click', event => {
  if (event.target === event.currentTarget) closeAddModal();
});
$('#add-search-input').addEventListener('input', event => {
  clearTimeout(addSearchTimer);
  const value = event.target.value;
  addSearchTimer = setTimeout(() => searchAddAssets(value), 280);
});
$('#add-search-results').addEventListener('click', event => {
  const addIndexButton = event.target.closest('[data-add-index-result-id]');
  if (addIndexButton) {
    const result = addSearchResults.find(item => item.id === addIndexButton.dataset.addIndexResultId);
    if (result) addIndexToOverview(result);
    return;
  }
  const removeButton = event.target.closest('[data-remove-overview-result-id]');
  if (removeButton) {
    const result = addSearchResults.find(item => item.id === removeButton.dataset.removeOverviewResultId);
    if (result) removeIndexFromOverview(result);
    return;
  }
  const removeCryptoButton = event.target.closest('[data-remove-crypto-result-id]');
  if (removeCryptoButton) {
    const result = addSearchResults.find(item => item.id === removeCryptoButton.dataset.removeCryptoResultId);
    if (result) removeCryptoFromOverview(result);
    return;
  }
  const button = event.target.closest('[data-add-result-id]');
  if (!button || button.disabled) return;
  const result = addSearchResults.find(item => item.id === button.dataset.addResultId);
  if (result) addSearchResult(result);
});

async function init(){
  renderCategories();
  updateMarketStatus();
  setInterval(updateMarketStatus, 60000);
  setTimeout(()=>{$('#loading-state').hidden=true;$('#app-content').hidden=false;renderMarketContent()},780);
  await fetchRealData();
}
init();
