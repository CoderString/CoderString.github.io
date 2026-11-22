const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;

// 东方财富行情映射（secid 与计价货币）。同一套 secid 也用于 K 线接口。
const eastMoneyAssets = {
  spx:      { secid: '100.SPX',   currency: 'USD' },
  dji:      { secid: '100.DJIA',  currency: 'USD' },
  aapl:     { secid: '105.AAPL',  currency: 'USD' },
  msft:     { secid: '105.MSFT',  currency: 'USD' },
  nvda:     { secid: '105.NVDA',  currency: 'USD' },
  sh:       { secid: '1.000001',  currency: 'CNY' },
  sz:       { secid: '0.399001',  currency: 'CNY' },
  csi300:   { secid: '1.000300',  currency: 'CNY' },
  gem:      { secid: '0.399006',  currency: 'CNY' },
  kweichow: { secid: '1.600519',  currency: 'CNY' },
  catl:     { secid: '0.300750',  currency: 'CNY' },
  hsi:      { secid: '100.HSI',   currency: 'HKD' },
  hstech:   { secid: '124.HSTECH', currency: 'HKD' },
  hscei:    { secid: '100.HSCEI', currency: 'HKD' },
  '0700':   { secid: '116.00700', currency: 'HKD' },
  '9988':   { secid: '116.09988', currency: 'HKD' }
};

// 纳斯达克接口作为美股备用源。COMP 为纳斯达克综合指数。
const nasdaqAssets = {
  nasdaq: { symbol: 'COMP', assetClass: 'index' },
  aapl:   { symbol: 'AAPL', assetClass: 'stocks' },
  msft:   { symbol: 'MSFT', assetClass: 'stocks' },
  nvda:   { symbol: 'NVDA', assetClass: 'stocks' }
};

// CoinLore 提供加密货币报价；BTC / ETH 的走势图使用纳斯达克接口。
const cryptoAssets = {
  btc: { coinlore: '90',    nasdaq: 'BTC', symbol: 'BTC', geckoId: 'bitcoin' },
  eth: { coinlore: '80',    nasdaq: 'ETH', symbol: 'ETH', geckoId: 'ethereum' },
  sol: { coinlore: '48543', nasdaq: null,  symbol: 'SOL', geckoId: 'solana' }
};

const metalAssets = {
  xau: { metal: 'XAU', secid: '122.XAU', currency: 'USD' },
  xag: { metal: 'XAG', secid: '122.XAG', currency: 'USD' }
};

const oilAssets = {
  wti: { secid: '102.CL00Y', currency: 'USD' },
  brent: { secid: '112.B00Y', currency: 'USD' }
};

const tencentAssets = {
  spx: 'usINX', nasdaq: 'usIXIC', dji: 'usDJI',
  aapl: 'usAAPL', msft: 'usMSFT', nvda: 'usNVDA',
  sh: 'sh000001', sz: 'sz399001', csi300: 'sh000300', gem: 'sz399006',
  kweichow: 'sh600519', catl: 'sz300750',
  hsi: 'hkHSI', hstech: 'hkHSTECH', hscei: 'hkHSCEI',
  '0700': 'hk00700', '9988': 'hk09988',
  wti: 'hf_CL', brent: 'hf_OIL'
};

const indexAssetIds = new Set(['spx', 'nasdaq', 'dji', 'sh', 'sz', 'csi300', 'gem', 'hsi', 'hstech', 'hscei']);

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const n = Number.parseFloat(value.replace(/[$,%\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function downsample(values, maxPoints = 60) {
  if (!Array.isArray(values) || values.length <= maxPoints) return values;
  const step = Math.ceil(values.length / maxPoints);
  const result = [];
  for (let index = 0; index < values.length; index += step) result.push(values[index]);
  const last = values[values.length - 1];
  if (result[result.length - 1] !== last) result.push(last);
  return result;
}

async function fetchJson(url, options = {}) {
  const { timeout = 12000, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url, timeout = 12000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/* ------------------------------ 东方财富 ------------------------------ */

async function eastMoneyQuote(secid, currency) {
  const fields = 'f43,f44,f45,f46,f47,f48,f57,f58,f59,f60,f116,f162,f169,f170,f173,f174,f175';
  const json = await fetchJson(`https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=${fields}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = json?.data;
  if (!data || !Number.isFinite(data.f43)) throw new Error('东方财富未返回有效报价');

  // f59 为该品种的小数位数，f43/f44/f45/f46/f60/f174/f175 都按 10^f59 缩放。
  const scale = Math.pow(10, Number.isFinite(data.f59) ? data.f59 : 2);
  const scaled = value => (Number.isFinite(value) ? value / scale : null);
  const price = scaled(data.f43);
  if (!Number.isFinite(price) || price <= 0) throw new Error('东方财富报价无效');

  return {
    price,
    previousClose: scaled(data.f60),
    open: scaled(data.f46),
    high: scaled(data.f44),
    low: scaled(data.f45),
    volume: Number.isFinite(data.f47) && data.f47 > 0 ? data.f47 : null,
    w52h: scaled(data.f174),
    w52l: scaled(data.f175),
    marketCap: Number.isFinite(data.f116) && data.f116 > 0 ? data.f116 : null,
    pe: Number.isFinite(data.f173) && data.f173 > 0 ? data.f173 : null,
    currency,
    spark: [],
    source: '东方财富'
  };
}

async function eastMoneyKlines(secid, { klt = 101, lmt = 40 } = {}) {
  const json = await fetchJson(
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${klt}&fqt=1&end=20500101&lmt=${lmt}` +
    '&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57',
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  return Array.isArray(json?.data?.klines) ? json.data.klines : [];
}

const eastMoneySeriesCache = new Map();
const EAST_MONEY_SERIES_TTL = 10 * 60 * 1000;

async function eastMoneySeries(secid) {
  const cached = eastMoneySeriesCache.get(secid);
  if (cached && Date.now() - cached.at < EAST_MONEY_SERIES_TTL) return cached.data;
  const rows = await eastMoneyKlines(secid, { klt: 101, lmt: 250 });
  const closes = [];
  const highs = [];
  const lows = [];
  rows.forEach(row => {
    const cells = row.split(',');
    const close = Number.parseFloat(cells[2]);
    const high = Number.parseFloat(cells[3]);
    const low = Number.parseFloat(cells[4]);
    if (Number.isFinite(close)) closes.push(close);
    if (Number.isFinite(high)) highs.push(high);
    if (Number.isFinite(low)) lows.push(low);
  });
  const result = {
    spark: closes.slice(-40),
    // 用近一年日 K 计算 52 周区间，避免指数接口 f174/f175 返回当日区间的问题。
    w52h: highs.length ? Math.max(...highs) : null,
    w52l: lows.length ? Math.min(...lows) : null
  };
  eastMoneySeriesCache.set(secid, { at: Date.now(), data: result });
  return result;
}

/* ------------------------------- 石油行情 ------------------------------ */

async function eastMoneyTrends(secid, ndays = 1) {
  const json = await fetchJson(
    `https://push2his.eastmoney.com/api/qt/stock/trends2/get?secid=${secid}` +
    '&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13' +
    `&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ndays=${ndays}&iscr=0`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
  );
  return Array.isArray(json?.data?.trends) ? json.data.trends : [];
}

const eastMoneyTrendSparkCache = new Map();
const EAST_MONEY_TREND_SPARK_TTL = 30 * 1000;

async function eastMoneyTrendSpark(secid) {
  const cached = eastMoneyTrendSparkCache.get(secid);
  if (cached && Date.now() - cached.at < EAST_MONEY_TREND_SPARK_TTL) return cached.data;
  const rows = await eastMoneyTrends(secid, 1);
  const closes = rows
    .map(row => Number.parseFloat(row.split(',')[2]))
    .filter(value => Number.isFinite(value) && value > 0);
  const spark = downsample(closes, 60);
  eastMoneyTrendSparkCache.set(secid, { at: Date.now(), data: spark });
  return spark;
}

async function eastMoneyCommodityQuote(secid, currency) {
  const [quote, spark] = await Promise.all([
    eastMoneyQuote(secid, currency),
    eastMoneyTrendSpark(secid).catch(() => [])
  ]);
  quote.spark = spark;
  quote.w52h = null;
  quote.w52l = null;
  return quote;
}

async function eastMoneyTrendChart(secid, range) {
  if (!['1D', '5D'].includes(range)) {
    return { points: [], timestamps: [], source: '该区间暂未配置公开数据源' };
  }
  const rows = await eastMoneyTrends(secid, range === '5D' ? 5 : 1);
  const points = [];
  const timestamps = [];
  const step = rows.length > 600 ? Math.ceil(rows.length / 600) : 1;
  const sampled = step > 1
    ? rows.filter((row, index) => index % step === 0 || index === rows.length - 1)
    : rows;
  sampled.forEach(row => {
    const cells = row.split(',');
    const close = Number.parseFloat(cells[2]);
    if (!Number.isFinite(close) || close <= 0) return;
    points.push(close);
    const stamp = Date.parse(cells[0].replace(' ', 'T'));
    timestamps.push(Number.isFinite(stamp) ? Math.floor(stamp / 1000) : null);
  });
  if (!points.length) throw new Error('东方财富未返回走势数据');
  return { points, timestamps, source: '东方财富 · 分时' };
}

function parseTencentQuote(raw, currency) {
  if (!raw) throw new Error('腾讯行情未返回数据');
  if (raw.includes('~')) {
    const parts = raw.split('~');
    const price = toNumber(parts[3]);
    const previous = toNumber(parts[4]);
    const percent = toNumber(parts[32]);
    if (!Number.isFinite(price)) throw new Error('腾讯行情报价无效');
    return {
      price,
      previousClose: Number.isFinite(previous)
        ? previous
        : (Number.isFinite(percent) && percent > -100 ? price / (1 + percent / 100) : null),
      open: toNumber(parts[5]),
      high: toNumber(parts[33]),
      low: toNumber(parts[34]),
      volume: toNumber(parts[6]),
      marketCap: null,
      pe: null,
      w52h: null,
      w52l: null,
      currency,
      spark: [],
      source: '腾讯财经'
    };
  }

  const cells = raw.split(',');
  const price = toNumber(cells[0]);
  const percent = toNumber(cells[1]);
  const previous = toNumber(cells[7]);
  if (!Number.isFinite(price)) throw new Error('腾讯行情报价无效');
  return {
    price,
    previousClose: Number.isFinite(previous)
      ? previous
      : (Number.isFinite(percent) && percent > -100 ? price / (1 + percent / 100) : null),
    open: toNumber(cells[8]),
    high: toNumber(cells[4]),
    low: toNumber(cells[5]),
    volume: null,
    marketCap: null,
    pe: null,
    w52h: null,
    w52l: null,
    currency,
    spark: [],
    source: '腾讯财经'
  };
}

async function tencentQuote(code, currency) {
  const text = await fetchText(`https://qt.gtimg.cn/q=${code}`, 10000);
  const match = text.match(/="([^"]*)"/);
  if (!match) throw new Error('腾讯行情未返回数据');
  return parseTencentQuote(match[1], currency);
}

const EASTMONEY_SEARCH_TOKEN = 'D43BF722C8E33BDC906FB84D85E326E8';

function classifySearchItem(item) {
  const secid = String(item?.QuoteID || '');
  if (!/^\d+\.[A-Za-z0-9._-]+$/.test(secid)) return null;

  const classify = item.Classify;
  const typeName = item.SecurityTypeName;
  const typeUS = String(item.TypeUS ?? '');
  const marketType = String(item.MarketType ?? '');
  const isIndex = typeName === '指数' || classify === 'Index' || classify === 'UniversalIndex';

  let category = null;
  if (classify === 'AStock' || classify === 'Index') category = 'A股';
  else if (classify === 'HK') category = '港股';
  else if (classify === 'UsStock') category = '美股';
  else if (classify === 'UniversalIndex') {
    if (marketType === '5') category = '港股';
    else if (marketType === '_UI') category = '美股';
  }
  if (!category) return null;

  // 只保留股票和指数，过滤基金、债券、期货、窝轮、牛熊证等。
  if (classify === 'UsStock' && !['1', '5'].includes(typeUS)) return null;
  if (classify === 'HK' && !['0', '3'].includes(typeUS)) return null;
  if (classify === 'Index' && typeUS !== '1') return null;
  if (classify === 'UniversalIndex') {
    if (!['0', '4'].includes(typeUS)) return null;
    // HSTECH 等正常指数也是 TypeUS=4，需要排除同类型的杠杆/反向/窝轮类指数。
    if (typeUS === '4' && /(杠杆|倍|短仓|做空|做多|反向|备兑|认购|认沽|期权)/.test(String(item.Name || ''))) return null;
  }

  const currency = category === 'A股' ? 'CNY' : category === '港股' ? 'HKD' : 'USD';
  const unit = isIndex
    ? '指数点'
    : category === 'A股' ? '每股人民币' : category === '港股' ? '每股港元' : '每股美元';

  return {
    id: `em:${secid}`,
    secid,
    source: 'eastmoney',
    name: item.Name || item.Code,
    symbol: item.Code,
    market: category,
    category,
    type: isIndex ? '指数' : '股票',
    currency,
    unit
  };
}

async function searchEastMoney(query) {
  const keyword = String(query || '').trim();
  if (!keyword) return [];
  const json = await fetchJson(
    `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=${EASTMONEY_SEARCH_TOKEN}&count=30`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const rows = json?.QuotationCodeTable?.Data || [];
  const seen = new Set();
  const results = [];
  for (const item of rows) {
    const normalized = classifySearchItem(item);
    if (!normalized || seen.has(normalized.secid)) continue;
    seen.add(normalized.secid);
    results.push(normalized);
    if (results.length >= 20) break;
  }
  return results;
}

async function searchAssets(query) {
  const keyword = String(query || '').trim();
  if (!keyword) return [];
  const [eastMoneyResult, cryptoResult] = await Promise.allSettled([
    searchEastMoney(keyword),
    searchCrypto(keyword)
  ]);
  if (eastMoneyResult.status === 'rejected' && cryptoResult.status === 'rejected') {
    throw new Error(eastMoneyResult.reason?.message || cryptoResult.reason?.message || '搜索服务暂不可用');
  }
  const eastMoney = eastMoneyResult.status === 'fulfilled' ? eastMoneyResult.value : [];
  const crypto = cryptoResult.status === 'fulfilled' ? cryptoResult.value : [];
  // 币种代码/名称/中文别名完全匹配时优先展示，避免被同名 ETF 挤到后面。
  const cryptoFirst = crypto.filter(item => item.priority === 0);
  const cryptoRest = crypto.filter(item => item.priority !== 0);
  return [...cryptoFirst, ...eastMoney, ...cryptoRest].slice(0, 30);
}

async function customEastMoneyQuote(secid, category, symbol, type) {
  if (!/^\d+\.[A-Za-z0-9._-]+$/.test(secid)) throw new Error('无效的行情代码');
  if (!['美股', 'A股', '港股'].includes(category)) throw new Error('不支持的市场');
  const currency = category === 'A股' ? 'CNY' : category === '港股' ? 'HKD' : 'USD';
  try {
    const [quote, series, trendSpark] = await Promise.all([
      eastMoneyQuote(secid, currency),
      eastMoneySeries(secid).catch(() => ({ spark: [], w52h: null, w52l: null })),
      eastMoneyTrendSpark(secid).catch(() => [])
    ]);
    quote.spark = trendSpark.length ? trendSpark : series.spark;
    if (type === '指数') {
      quote.w52h = null;
      quote.w52l = null;
    } else {
      if (Number.isFinite(series.w52h)) quote.w52h = series.w52h;
      if (Number.isFinite(series.w52l)) quote.w52l = series.w52l;
    }
    return quote;
  } catch (error) {
    let code = null;
    if (symbol) {
      if (category === '美股') code = `us${symbol}`;
      else if (category === '港股') code = `hk${symbol}`;
      else code = String(symbol).startsWith('6') ? `sh${symbol}` : `sz${symbol}`;
    }
    if (code) return tencentQuote(code, currency);
    throw error;
  }
}

/* ------------------------------- 纳斯达克 ------------------------------ */

function parseRange(value) {
  if (typeof value !== 'string') return null;
  const numbers = value.match(/-?\d[\d,.]*/g);
  if (!numbers || numbers.length < 2) return null;
  const low = toNumber(numbers[0]);
  const high = toNumber(numbers[1]);
  return Number.isFinite(low) && Number.isFinite(high) ? { low, high } : null;
}

async function nasdaqQuote(symbol, assetClass = 'stocks') {
  const json = await fetchJson(
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/info?assetclass=${assetClass}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        Origin: 'https://www.nasdaq.com',
        Referer: 'https://www.nasdaq.com/'
      }
    }
  );
  const data = json?.data;
  if (!data) throw new Error('纳斯达克未返回有效报价');

  const primary = data.primaryData || {};
  const price = toNumber(primary.lastSalePrice);
  if (!Number.isFinite(price)) throw new Error('纳斯达克报价无效');
  const netChange = toNumber(primary.netChange);
  const previousClose = Number.isFinite(netChange) ? price - netChange : null;
  const dayRange = parseRange(data.keyStats?.dayrange?.value);
  const yearRange = parseRange(data.keyStats?.fiftyTwoWeekHighLow?.value);

  return {
    price,
    previousClose,
    open: null,
    high: dayRange?.high ?? null,
    low: dayRange?.low ?? null,
    volume: toNumber(primary.volume),
    w52h: yearRange?.high ?? null,
    w52l: yearRange?.low ?? null,
    marketCap: null,
    pe: null,
    currency: 'USD',
    spark: [],
    source: 'Nasdaq'
  };
}

async function nasdaqChart(symbol, assetClass = 'stocks') {
  const json = await fetchJson(
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/chart?assetclass=${assetClass}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        Origin: 'https://www.nasdaq.com',
        Referer: 'https://www.nasdaq.com/'
      }
    }
  );
  const chart = Array.isArray(json?.data?.chart) ? json.data.chart : [];
  const points = [];
  const timestamps = [];
  chart.forEach(item => {
    const value = toNumber(item?.y);
    if (!Number.isFinite(value)) return;
    points.push(value);
    const parsed = item?.z?.dateTime ? Date.parse(item.z.dateTime) : NaN;
    timestamps.push(Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null);
  });
  if (!points.length) throw new Error('纳斯达克未返回走势数据');
  return { points, timestamps, source: 'Nasdaq' };
}

/* ------------------------------- 加密货币 ------------------------------ */

function normalizeCryptoQuote(item) {
  const price = toNumber(item?.price_usd);
  if (!Number.isFinite(price)) return null;
  const percent = toNumber(item.percent_change_24h);
  return {
    price,
    previousClose: Number.isFinite(percent) && percent > -100
      ? price / (1 + percent / 100)
      : null,
    open: null,
    high: null,
    low: null,
    volume: toNumber(item.volume24),
    marketCap: toNumber(item.market_cap_usd),
    supply: toNumber(item.csupply),
    pe: null,
    w52h: null,
    w52l: null,
    currency: 'USD',
    spark: [],
    source: 'CoinLore'
  };
}

class CryptoNoDataError extends Error {}

const cryptoProviderCooldown = new Map();
const CRYPTO_PROVIDER_COOLDOWN = 60 * 1000;
const cryptoQuoteCache = new Map();
const CRYPTO_QUOTE_TTL = 15 * 1000;

function providerAvailable(name) {
  return (cryptoProviderCooldown.get(name) || 0) < Date.now();
}

function markProviderDown(name) {
  cryptoProviderCooldown.set(name, Date.now() + CRYPTO_PROVIDER_COOLDOWN);
}

const SYMBOL_TO_GECKO = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', DOGE: 'dogecoin', XRP: 'ripple',
  ADA: 'cardano', BNB: 'binancecoin', LTC: 'litecoin', SHIB: 'shiba-inu',
  AVAX: 'avalanche-2', DOT: 'polkadot', LINK: 'chainlink', MATIC: 'matic-network',
  POL: 'polygon-ecosystem-token', TRX: 'tron', TON: 'the-open-network',
  USDT: 'tether', USDC: 'usd-coin', BCH: 'bitcoin-cash', XLM: 'stellar',
  ATOM: 'cosmos', ETC: 'ethereum-classic', FIL: 'filecoin', APT: 'aptos',
  ARB: 'arbitrum', OP: 'optimism', SUI: 'sui', NEAR: 'near',
  ICP: 'internet-computer', INJ: 'injective-protocol'
};

function symbolToGeckoId(symbol) {
  return SYMBOL_TO_GECKO[String(symbol || '').toUpperCase()] || null;
}

async function gateioCryptoQuote(symbol) {
  const pair = `${String(symbol || '').toUpperCase()}_USDT`;
  if (!/^[A-Z0-9]{2,20}_USDT$/.test(pair)) throw new CryptoNoDataError('无效的币种代码');
  if (!providerAvailable('gate')) throw new Error('Gate.io 暂不可用');
  let data;
  try {
    data = await fetchJson(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${encodeURIComponent(pair)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000
    });
  } catch (error) {
    markProviderDown('gate');
    throw error;
  }
  const item = Array.isArray(data) ? data[0] : null;
  const price = toNumber(item?.last);
  if (!Number.isFinite(price)) throw new CryptoNoDataError('Gate.io 未返回有效报价');
  const percent = toNumber(item.change_percentage);
  return {
    price,
    previousClose: Number.isFinite(percent) && percent > -100 ? price / (1 + percent / 100) : null,
    open: null,
    high: toNumber(item.high_24h),
    low: toNumber(item.low_24h),
    volume: toNumber(item.quote_volume),
    marketCap: null,
    supply: null,
    pe: null,
    w52h: null,
    w52l: null,
    currency: 'USD',
    spark: [],
    source: 'Gate.io'
  };
}

async function gateioCryptoCandles(symbol, interval = '15m', limit = 96) {
  const pair = `${String(symbol || '').toUpperCase()}_USDT`;
  if (!/^[A-Z0-9]{2,20}_USDT$/.test(pair)) throw new CryptoNoDataError('无效的币种代码');
  const data = await fetchJson(
    `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(pair)}&interval=${interval}&limit=${limit}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 }
  );
  if (!Array.isArray(data) || !data.length) throw new CryptoNoDataError('Gate.io 未返回走势数据');
  return data;
}

const cryptoSparkCache = new Map();
const CRYPTO_SPARK_TTL = 30 * 1000;

async function gateioCryptoSpark(symbol) {
  const key = String(symbol || '').toUpperCase();
  const cached = cryptoSparkCache.get(key);
  if (cached && Date.now() - cached.at < CRYPTO_SPARK_TTL) return cached.data;
  const rows = await gateioCryptoCandles(key, '15m', 96);
  const spark = downsample(
    rows.map(row => Number.parseFloat(row[2])).filter(Number.isFinite),
    48
  );
  cryptoSparkCache.set(key, { at: Date.now(), data: spark });
  return spark;
}

async function gateioCryptoChart(symbol, range) {
  const config = {
    '1D': { interval: '5m', limit: 288 },
    '5D': { interval: '1h', limit: 120 },
    '1M': { interval: '4h', limit: 180 },
    '3M': { interval: '1d', limit: 90 },
    '1Y': { interval: '1d', limit: 365 }
  }[range] || { interval: '4h', limit: 180 };
  const rows = await gateioCryptoCandles(symbol, config.interval, config.limit);
  const points = [];
  const timestamps = [];
  rows.forEach(row => {
    const close = Number.parseFloat(row[2]);
    const stamp = Number.parseInt(row[0], 10);
    if (!Number.isFinite(close)) return;
    points.push(close);
    timestamps.push(Number.isFinite(stamp) ? stamp : null);
  });
  if (!points.length) throw new Error('Gate.io 未返回走势数据');
  return { points, timestamps, source: 'Gate.io' };
}

async function cryptoChart(symbol, range) {
  try {
    return await gateioCryptoChart(symbol, range);
  } catch (error) {
    const ticker = String(symbol || '').toUpperCase();
    if (ticker === 'BTC' || ticker === 'ETH') return nasdaqChart(ticker, 'crypto');
    throw error;
  }
}

async function llamaCryptoQuote(geckoId) {
  const id = String(geckoId || '').trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(id)) throw new CryptoNoDataError('无效的币种标识');
  if (!providerAvailable('llama')) throw new Error('DefiLlama 暂不可用');
  let data;
  try {
    data = await fetchJson(`https://coins.llama.fi/prices/current/coingecko:${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000
    });
  } catch (error) {
    markProviderDown('llama');
    throw error;
  }
  const item = data?.coins?.[`coingecko:${id}`];
  const price = toNumber(item?.price);
  if (!Number.isFinite(price)) throw new CryptoNoDataError('DefiLlama 未返回有效价格');
  return {
    price,
    previousClose: null,
    open: null,
    high: null,
    low: null,
    volume: null,
    marketCap: null,
    supply: null,
    pe: null,
    w52h: null,
    w52l: null,
    currency: 'USD',
    spark: [],
    source: 'DefiLlama'
  };
}

async function cryptoQuote({ coinId, symbol, geckoId, nasdaqSymbol } = {}) {
  const cacheKey = `${coinId || ''}|${String(symbol || '').toUpperCase()}|${geckoId || ''}`;
  const cached = cryptoQuoteCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CRYPTO_QUOTE_TTL) return cached.quote;

  let quote = null;

  if (coinId && providerAvailable('coinlore')) {
    try {
      quote = await coinloreQuote(coinId);
    } catch (error) {
      if (!(error instanceof CryptoNoDataError)) markProviderDown('coinlore');
    }
  }

  if (!quote && symbol && providerAvailable('gate')) {
    try {
      quote = await gateioCryptoQuote(symbol);
    } catch (error) {
      if (!(error instanceof CryptoNoDataError)) markProviderDown('gate');
    }
  }

  if (!quote && providerAvailable('llama')) {
    const slug = geckoId || symbolToGeckoId(symbol);
    if (slug) {
      try {
        quote = await llamaCryptoQuote(slug);
      } catch (error) {
        if (!(error instanceof CryptoNoDataError)) markProviderDown('llama');
      }
    }
  }

  if (!quote) {
    const ticker = nasdaqSymbol || (symbol && /^[A-Z0-9]{2,10}$/.test(String(symbol).toUpperCase())
      ? String(symbol).toUpperCase()
      : null);
    if (ticker) {
      try {
        quote = await nasdaqQuote(ticker, 'crypto');
      } catch (error) {
        quote = null;
      }
    }
  }

  if (!quote) throw new Error('加密货币行情源暂不可用');
  if (symbol) {
    try {
      quote.spark = await gateioCryptoSpark(symbol);
    } catch (error) {
      quote.spark = [];
    }
  }
  cryptoQuoteCache.set(cacheKey, { at: Date.now(), quote });
  return quote;
}

async function cryptoQuotes() {
  if (!providerAvailable('coinlore')) throw new Error('CoinLore 暂不可用');
  const ids = Object.values(cryptoAssets).map(item => item.coinlore).join(',');
  let list;
  try {
    list = await fetchJson(`https://api.coinlore.net/api/ticker/?id=${ids}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 4000
    });
  } catch (error) {
    markProviderDown('coinlore');
    throw error;
  }
  if (!Array.isArray(list)) {
    markProviderDown('coinlore');
    throw new Error('CoinLore 未返回有效报价');
  }

  const byId = new Map(list.map(item => [String(item.id), item]));
  const quotes = {};

  await Promise.all(Object.entries(cryptoAssets).map(async ([id, config]) => {
    const quote = normalizeCryptoQuote(byId.get(config.coinlore));
    if (!quote) return;

    let spark = [];
    try {
      spark = await gateioCryptoSpark(config.symbol);
    } catch (error) {
      spark = [];
    }
    if (!spark.length && config.nasdaq) {
      try {
        const chart = await nasdaqChart(config.nasdaq, 'crypto');
        spark = chart.points.slice(-40);
      } catch (error) {
        spark = [];
      }
    }
    quote.spark = spark;

    quotes[id] = quote;
  }));

  return quotes;
}

async function coinloreQuote(coinId) {
  if (!/^\d+$/.test(String(coinId || ''))) throw new CryptoNoDataError('无效的币种代码');
  if (!providerAvailable('coinlore')) throw new Error('CoinLore 暂不可用');
  let list;
  try {
    list = await fetchJson(`https://api.coinlore.net/api/ticker/?id=${encodeURIComponent(coinId)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 4000
    });
  } catch (error) {
    markProviderDown('coinlore');
    throw error;
  }
  const quote = normalizeCryptoQuote(Array.isArray(list) ? list[0] : null);
  if (!quote) throw new CryptoNoDataError('CoinLore 未返回有效报价');
  return quote;
}

let cryptoCatalogCache = { at: 0, items: [] };

const CRYPTO_ALIASES = {
  bitcoin: ['比特币'],
  ethereum: ['以太坊', '以太币'],
  solana: ['索拉纳'],
  dogecoin: ['狗狗币'],
  ripple: ['瑞波', '瑞波币'],
  cardano: ['艾达币'],
  binancecoin: ['币安币'],
  tether: ['泰达币'],
  tron: ['波场'],
  litecoin: ['莱特币'],
  polkadot: ['波卡']
};

async function cryptoCatalog() {
  if (cryptoCatalogCache.items.length && Date.now() - cryptoCatalogCache.at < 5 * 60 * 1000) {
    return cryptoCatalogCache.items;
  }

  let items = null;

  if (providerAvailable('coinlore')) {
    try {
      const payload = await fetchJson('https://api.coinlore.net/api/tickers/?start=0&limit=100', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 4000
      });
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : null);
      if (list) {
        items = list.map(item => ({
          coinId: String(item.id),
          symbol: item.symbol,
          name: item.name,
          geckoId: item.nameid || null,
          source: 'coinlore'
        }));
      } else {
        markProviderDown('coinlore');
      }
    } catch (error) {
      markProviderDown('coinlore');
    }
  }

  if (!items && providerAvailable('gate')) {
    try {
      const pairs = await fetchJson('https://api.gateio.ws/api/v4/spot/currency_pairs', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 6000
      });
      if (Array.isArray(pairs)) {
        const seen = new Set();
        items = pairs
          .filter(pair => pair && pair.quote === 'USDT' && pair.trade_status === 'tradable' && pair.base && pair.base_name)
          .filter(pair => !/(3L|3S|5L|5S)$/.test(pair.base))
          .filter(pair => !/(\d+x\s*(Long|Short))/i.test(pair.base_name))
          .filter(pair => {
            if (seen.has(pair.base)) return false;
            seen.add(pair.base);
            return true;
          })
          .map(pair => ({
            coinId: '',
            symbol: pair.base,
            name: pair.base_name,
            geckoId: symbolToGeckoId(pair.base),
            source: 'gate'
          }));
      } else {
        markProviderDown('gate');
      }
    } catch (error) {
      markProviderDown('gate');
    }
  }

  if (!items || !items.length) throw new Error('加密货币搜索源暂不可用');
  cryptoCatalogCache = { at: Date.now(), items };
  return items;
}

async function searchCrypto(query) {
  const keyword = String(query || '').trim().toLowerCase();
  if (!keyword) return [];
  const list = await cryptoCatalog();
  return list
    .filter(item => {
      const symbol = String(item.symbol || '').toLowerCase();
      const name = String(item.name || '').toLowerCase();
      const gecko = String(item.geckoId || '').toLowerCase();
      const aliases = CRYPTO_ALIASES[gecko] || [];
      return symbol === keyword
        || name.includes(keyword)
        || gecko.includes(keyword)
        || aliases.some(alias => alias.includes(keyword) || keyword.includes(alias));
    })
    .slice(0, 10)
    .map(item => {
      const symbol = String(item.symbol || '').toLowerCase();
      const name = String(item.name || '').toLowerCase();
      const gecko = String(item.geckoId || '').toLowerCase();
      const aliases = CRYPTO_ALIASES[gecko] || [];
      const exact = symbol === keyword || name === keyword || gecko === keyword || aliases.some(alias => alias === keyword);
      return {
        id: item.source === 'coinlore' ? `coin:${item.coinId}` : `gate:${item.symbol}`,
        coinId: item.coinId || '',
        geckoId: item.geckoId || '',
        source: item.source,
        name: item.name,
        symbol: item.symbol,
        market: '加密货币',
        category: '加密货币',
        type: '币种',
        currency: 'USD',
        unit: '美元 / 枚',
        priority: exact ? 0 : 1
      };
    });
}

/* -------------------------------- 贵金属 ------------------------------- */

async function goldQuote(metal) {
  const data = await fetchJson(`https://api.gold-api.com/price/${metal}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const price = toNumber(data?.price);
  if (!Number.isFinite(price)) throw new Error('Gold API 未返回有效价格');

  return {
    price,
    previousClose: null,
    open: null,
    high: null,
    low: null,
    volume: null,
    marketCap: null,
    pe: null,
    w52h: null,
    w52l: null,
    currency: 'USD',
    spark: [],
    source: 'Gold API'
  };
}

async function metalQuote(config) {
  try {
    const quote = await eastMoneyCommodityQuote(config.secid, config.currency);
    quote.source = '东方财富 · 现货';
    return quote;
  } catch (error) {
    return goldQuote(config.metal);
  }
}

/* ------------------------------- 汇总报价 ------------------------------ */

async function quoteFor(id, cryptoPromise) {
  if (cryptoAssets[id]) {
    const quotes = await cryptoPromise;
    if (quotes[id]) return quotes[id];
    const config = cryptoAssets[id];
    const quote = await cryptoQuote({
      coinId: config.coinlore,
      symbol: config.symbol,
      geckoId: config.geckoId,
      nasdaqSymbol: config.nasdaq
    });
    if (config.nasdaq && (!quote.spark || !quote.spark.length)) {
      try {
        const chart = await nasdaqChart(config.nasdaq, 'crypto');
        quote.spark = chart.points.slice(-40);
      } catch (error) {
        quote.spark = [];
      }
    }
    return quote;
  }

  if (metalAssets[id]) return metalQuote(metalAssets[id]);

  if (oilAssets[id]) {
    const config = oilAssets[id];
    try {
      return await eastMoneyCommodityQuote(config.secid, config.currency);
    } catch (error) {
      if (tencentAssets[id]) return tencentQuote(tencentAssets[id], config.currency);
      throw error;
    }
  }

  if (id === 'nasdaq') {
    try {
      const quote = await nasdaqQuote('COMP', 'index');
      try {
        const chart = await nasdaqChart('COMP', 'index');
        quote.spark = chart.points.slice(-40);
      } catch (error) {
        quote.spark = [];
      }
      return quote;
    } catch (error) {
      return tencentQuote(tencentAssets.nasdaq, 'USD');
    }
  }

  const mapping = eastMoneyAssets[id];
  if (mapping) {
    try {
      const [quote, series, trendSpark] = await Promise.all([
        eastMoneyQuote(mapping.secid, mapping.currency),
        eastMoneySeries(mapping.secid).catch(() => ({ spark: [], w52h: null, w52l: null })),
        eastMoneyTrendSpark(mapping.secid).catch(() => [])
      ]);
      quote.spark = trendSpark.length ? trendSpark : series.spark;
      if (Number.isFinite(series.w52h)) quote.w52h = series.w52h;
      if (Number.isFinite(series.w52l)) quote.w52l = series.w52l;
      return quote;
    } catch (error) {
      const fallback = nasdaqAssets[id];
      if (fallback) {
        try {
          const quote = await nasdaqQuote(fallback.symbol, fallback.assetClass);
          try {
            const chart = await nasdaqChart(fallback.symbol, fallback.assetClass);
            quote.spark = chart.points.slice(-40);
          } catch (chartError) {
            quote.spark = [];
          }
          return quote;
        } catch (nasdaqError) {
          // 继续尝试腾讯行情。
        }
      }
      if (tencentAssets[id]) {
        return tencentQuote(tencentAssets[id], mapping.currency);
      }
      throw error;
    }
  }

  throw new Error('此资产暂未配置公开实时行情源');
}

async function marketData() {
  const ids = [
    ...Object.keys(eastMoneyAssets),
    'nasdaq',
    ...Object.keys(cryptoAssets),
    ...Object.keys(metalAssets),
    ...Object.keys(oilAssets)
  ];

  // 加密货币一次请求即可拿到全部币种，失败时不影响其他资产。
  const cryptoPromise = cryptoQuotes().catch(() => ({}));

  const entries = await Promise.all(ids.map(async id => {
    try {
      return [id, await quoteFor(id, cryptoPromise)];
    } catch (error) {
      return [id, { error: error.message }];
    }
  }));

  return Object.fromEntries(entries);
}

/* ------------------------------- 走势图表 ------------------------------ */

const rangeOptions = {
  '1D': { klt: 5, lmt: 240 },
  '5D': { klt: 15, lmt: 240 },
  '1M': { klt: 101, lmt: 22 },
  '3M': { klt: 101, lmt: 66 },
  '1Y': { klt: 101, lmt: 250 }
};

async function eastMoneyChart(secid, range) {
  if (!/^\d+\.[A-Za-z0-9._-]+$/.test(secid)) throw new Error('无效的行情代码');
  const options = rangeOptions[range] || rangeOptions['1M'];
  const rows = await eastMoneyKlines(secid, options);
  const points = [];
  const timestamps = [];
  rows.forEach(row => {
    const cells = row.split(',');
    const close = Number.parseFloat(cells[2]);
    if (!Number.isFinite(close)) return;
    points.push(close);
    const stamp = Date.parse(cells[0].includes(' ') ? cells[0].replace(' ', 'T') : cells[0]);
    timestamps.push(Number.isFinite(stamp) ? Math.floor(stamp / 1000) : null);
  });
  if (!points.length) throw new Error('东方财富未返回走势数据');
  return { points, timestamps, source: '东方财富' };
}

async function chartData(id, range) {
  const mapping = eastMoneyAssets[id];
  if (mapping) return eastMoneyChart(mapping.secid, range);

  const oil = oilAssets[id];
  if (oil) return eastMoneyTrendChart(oil.secid, range);

  const metal = metalAssets[id];
  if (metal) return eastMoneyTrendChart(metal.secid, range);

  if (id === 'nasdaq') return nasdaqChart('COMP', 'index');

  const crypto = cryptoAssets[id];
  if (crypto?.nasdaq) return nasdaqChart(crypto.nasdaq, 'crypto');

  return { points: [], timestamps: [], source: '该资产暂未配置公开图表源' };
}

/* -------------------------------- 静态服务 ----------------------------- */

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/market') {
    try {
      send(res, 200, JSON.stringify(await marketData()));
    } catch (error) {
      send(res, 502, JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (url.pathname === '/api/search') {
    try {
      send(res, 200, JSON.stringify({ results: await searchAssets(url.searchParams.get('q')) }));
    } catch (error) {
      send(res, 502, JSON.stringify({ error: error.message, results: [] }));
    }
    return;
  }

  if (url.pathname === '/api/quote') {
    try {
      const source = url.searchParams.get('source');
      const quote = (source === 'coinlore' || source === 'crypto')
        ? await cryptoQuote({
            coinId: url.searchParams.get('coinId'),
            symbol: url.searchParams.get('symbol'),
            geckoId: url.searchParams.get('geckoId')
          })
        : await customEastMoneyQuote(
            url.searchParams.get('secid'),
            url.searchParams.get('category'),
            url.searchParams.get('symbol'),
            url.searchParams.get('type')
          );
      send(res, 200, JSON.stringify(quote));
    } catch (error) {
      send(res, 502, JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (url.pathname === '/api/chart') {
    const id = url.searchParams.get('id');
    const secid = url.searchParams.get('secid');
    const crypto = url.searchParams.get('crypto');
    const range = url.searchParams.get('range') || '1D';
    try {
      let result;
      if (secid) {
        result = await eastMoneyChart(secid, range);
      } else if (crypto) {
        try {
          result = await cryptoChart(crypto, range);
        } catch (error) {
          result = { points: [], timestamps: [], source: '该币种暂未配置公开图表源' };
        }
      } else {
        result = await chartData(id, range);
      }
      send(res, 200, JSON.stringify(result));
    } catch (error) {
      send(res, 502, JSON.stringify({ error: error.message, points: [], timestamps: [] }));
    }
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(filePath, (error, data) => {
    if (error) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, mime[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(PORT, () => console.log(`Market View is running at http://localhost:${PORT}`));
