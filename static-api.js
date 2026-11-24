// GitHub Pages / 纯静态模式的数据层。
// 东方财富接口通过 JSONP 访问，CoinLore / Gate.io / Gold API / DefiLlama 通过 CORS 直接访问。
(function () {
  'use strict';

  const EAST_MONEY_ASSETS = {
    spx: { secid: '100.SPX', currency: 'USD', index: true },
    nasdaq: { secid: '100.NDX', currency: 'USD', index: true },
    dji: { secid: '100.DJIA', currency: 'USD', index: true },
    aapl: { secid: '105.AAPL', currency: 'USD' },
    msft: { secid: '105.MSFT', currency: 'USD' },
    nvda: { secid: '105.NVDA', currency: 'USD' },
    sh: { secid: '1.000001', currency: 'CNY', index: true },
    sz: { secid: '0.399001', currency: 'CNY', index: true },
    csi300: { secid: '1.000300', currency: 'CNY', index: true },
    gem: { secid: '0.399006', currency: 'CNY', index: true },
    kweichow: { secid: '1.600519', currency: 'CNY' },
    catl: { secid: '0.300750', currency: 'CNY' },
    hsi: { secid: '100.HSI', currency: 'HKD', index: true },
    hstech: { secid: '124.HSTECH', currency: 'HKD', index: true },
    hscei: { secid: '100.HSCEI', currency: 'HKD', index: true },
    '0700': { secid: '116.00700', currency: 'HKD' },
    '9988': { secid: '116.09988', currency: 'HKD' }
  };

  const CRYPTO_ASSETS = {
    btc: { symbol: 'BTC', coinlore: '90', geckoId: 'bitcoin' },
    eth: { symbol: 'ETH', coinlore: '80', geckoId: 'ethereum' },
    sol: { symbol: 'SOL', coinlore: '48543', geckoId: 'solana' }
  };

  const METAL_ASSETS = {
    xau: { secid: '122.XAU', metal: 'XAU', currency: 'USD' },
    xag: { secid: '122.XAG', metal: 'XAG', currency: 'USD' }
  };

  const OIL_ASSETS = {
    wti: { secid: '102.CL00Y', currency: 'USD' },
    brent: { secid: '112.B00Y', currency: 'USD' }
  };

  const TENCENT_ASSETS = {
    spx: 'usINX', nasdaq: 'usIXIC', dji: 'usDJI',
    aapl: 'usAAPL', msft: 'usMSFT', nvda: 'usNVDA',
    sh: 'sh000001', sz: 'sz399001', csi300: 'sh000300', gem: 'sz399006',
    kweichow: 'sh600519', catl: 'sz300750',
    hsi: 'hkHSI', hstech: 'hkHSTECH', hscei: 'hkHSCEI',
    '0700': 'hk00700', '9988': 'hk09988',
    wti: 'hf_CL', brent: 'hf_OIL'
  };

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

  const CRYPTO_ALIASES = {
    bitcoin: ['比特币'], ethereum: ['以太坊', '以太币'], solana: ['索拉纳'],
    dogecoin: ['狗狗币'], ripple: ['瑞波', '瑞波币'], cardano: ['艾达币'],
    binancecoin: ['币安币'], tether: ['泰达币'], tron: ['波场'],
    litecoin: ['莱特币'], polkadot: ['波卡']
  };

  const searchCache = new Map();
  const sparkCache = new Map();
  const cryptoCatalogCache = { at: 0, items: [] };
  const cryptoQuoteCache = new Map();
  const providerCooldown = new Map();
  const COOLDOWN = 60 * 1000;

  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const n = Number.parseFloat(value.replace(/[$,%\s,]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function downsample(values, maxPoints) {
    if (!Array.isArray(values) || values.length <= maxPoints) return values;
    const step = Math.ceil(values.length / maxPoints);
    const result = [];
    for (let index = 0; index < values.length; index += step) result.push(values[index]);
    const last = values[values.length - 1];
    if (result[result.length - 1] !== last) result.push(last);
    return result;
  }

  let jsonpCounter = 0;

  function jsonp(url, timeout = 12000) {
    return new Promise((resolve, reject) => {
      const callback = `__mv_jsonp_${Date.now()}_${jsonpCounter++}`;
      const script = document.createElement('script');
      let timer;

      function cleanup(error) {
        clearTimeout(timer);
        script.remove();
        try { delete window[callback]; } catch (e) { window[callback] = undefined; }
        if (error) reject(error);
      }

      window[callback] = data => {
        cleanup();
        resolve(data);
      };
      timer = setTimeout(() => cleanup(new Error('请求超时')), timeout);
      script.onerror = () => cleanup(new Error('网络请求失败'));
      script.async = true;
      script.src = `${url}${url.includes('?') ? '&' : '?'}cb=${callback}`;
      document.head.appendChild(script);
    });
  }

  async function fetchJson(url, timeout = 12000) {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function fetchText(url, timeout = 12000) {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }

  function providerAvailable(name) {
    return (providerCooldown.get(name) || 0) < Date.now();
  }

  function markProviderDown(name) {
    providerCooldown.set(name, Date.now() + COOLDOWN);
  }

  function symbolToGeckoId(symbol) {
    return SYMBOL_TO_GECKO[String(symbol || '').toUpperCase()] || null;
  }

  /* ------------------------------ 东方财富 ------------------------------ */

  async function eastMoneyQuote(secid, currency) {
    const fields = 'f43,f44,f45,f46,f47,f48,f57,f58,f59,f60,f116,f162,f169,f170,f173,f174,f175';
    const json = await jsonp(`https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=${fields}`);
    const data = json?.data;
    if (!data || !Number.isFinite(data.f43)) throw new Error('东方财富未返回有效报价');
    const scale = 10 ** (Number.isFinite(data.f59) ? data.f59 : 2);
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

  async function eastMoneyTrends(secid, ndays = 1) {
    const fields1 = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13';
    const fields2 = 'f51,f52,f53,f54,f55,f56,f57,f58';
    const json = await jsonp(
      `https://push2his.eastmoney.com/api/qt/stock/trends2/get?secid=${secid}&fields1=${fields1}&fields2=${fields2}&ndays=${ndays}&iscr=0`
    );
    return Array.isArray(json?.data?.trends) ? json.data.trends : [];
  }

  async function eastMoneyTrendSpark(secid) {
    const cached = sparkCache.get(secid);
    if (cached && Date.now() - cached.at < 30 * 1000) return cached.data;
    const rows = await eastMoneyTrends(secid, 1);
    const closes = rows
      .map(row => Number.parseFloat(row.split(',')[2]))
      .filter(value => Number.isFinite(value) && value > 0);
    const spark = downsample(closes, 60);
    sparkCache.set(secid, { at: Date.now(), data: spark });
    return spark;
  }

  async function eastMoneyTrendChart(secid, range) {
    if (range !== '1D' && range !== '5D') {
      return { points: [], timestamps: [], source: '静态模式暂不支持该区间' };
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

  async function eastMoneyCommodityQuote(secid, currency) {
    const quote = await eastMoneyQuote(secid, currency);
    try {
      quote.spark = await eastMoneyTrendSpark(secid);
    } catch (error) {
      quote.spark = [];
    }
    quote.w52h = null;
    quote.w52l = null;
    return quote;
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

  /* ------------------------------ 加密货币 ------------------------------ */

  function normalizeCryptoQuote(item) {
    const price = toNumber(item?.price_usd);
    if (!Number.isFinite(price)) return null;
    const percent = toNumber(item.percent_change_24h);
    return {
      price,
      previousClose: Number.isFinite(percent) && percent > -100 ? price / (1 + percent / 100) : null,
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

  async function coinloreQuote(coinId) {
    if (!/^\d+$/.test(String(coinId || ''))) throw new Error('无效的币种代码');
    if (!providerAvailable('coinlore')) throw new Error('CoinLore 暂不可用');
    let list;
    try {
      list = await fetchJson(`https://api.coinlore.net/api/ticker/?id=${encodeURIComponent(coinId)}`, 6000);
    } catch (error) {
      markProviderDown('coinlore');
      throw error;
    }
    const quote = normalizeCryptoQuote(Array.isArray(list) ? list[0] : null);
    if (!quote) throw new Error('CoinLore 未返回有效报价');
    return quote;
  }

  async function gateioCryptoQuote(symbol) {
    const pair = `${String(symbol || '').toUpperCase()}_USDT`;
    if (!/^[A-Z0-9]{2,20}_USDT$/.test(pair)) throw new Error('无效的币种代码');
    if (!providerAvailable('gate')) throw new Error('Gate.io 暂不可用');
    let data;
    try {
      data = await fetchJson(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${encodeURIComponent(pair)}`, 6000);
    } catch (error) {
      markProviderDown('gate');
      throw error;
    }
    const item = Array.isArray(data) ? data[0] : null;
    const price = toNumber(item?.last);
    if (!Number.isFinite(price)) throw new Error('Gate.io 未返回有效报价');
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

  async function llamaCryptoQuote(geckoId) {
    const id = String(geckoId || '').trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error('无效的币种标识');
    if (!providerAvailable('llama')) throw new Error('DefiLlama 暂不可用');
    let data;
    try {
      data = await fetchJson(`https://coins.llama.fi/prices/current/coingecko:${encodeURIComponent(id)}`, 6000);
    } catch (error) {
      markProviderDown('llama');
      throw error;
    }
    const price = toNumber(data?.coins?.[`coingecko:${id}`]?.price);
    if (!Number.isFinite(price)) throw new Error('DefiLlama 未返回有效价格');
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

  async function gateioCryptoCandles(symbol, interval = '15m', limit = 96) {
    const pair = `${String(symbol || '').toUpperCase()}_USDT`;
    if (!/^[A-Z0-9]{2,20}_USDT$/.test(pair)) throw new Error('无效的币种代码');
    const data = await fetchJson(
      `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(pair)}&interval=${interval}&limit=${limit}`,
      6000
    );
    if (!Array.isArray(data) || !data.length) throw new Error('Gate.io 未返回走势数据');
    return data;
  }

  async function gateioCryptoSpark(symbol) {
    const key = String(symbol || '').toUpperCase();
    const rows = await gateioCryptoCandles(key, '15m', 96);
    return downsample(
      rows.map(row => Number.parseFloat(row[2])).filter(Number.isFinite),
      48
    );
  }

  async function gateioCryptoChart(symbol, range) {
    const config = {
      'TS': { interval: '5m', limit: 288 },
      '1D': { interval: '15m', limit: 96 },
      '5D': { interval: '1h', limit: 120 },
      '1M': { interval: '4h', limit: 180 },
      '3M': { interval: '1d', limit: 90 },
      '1Y': { interval: '1d', limit: 365 }
    }[range] || { interval: '4h', limit: 180 };
    const rows = await gateioCryptoCandles(symbol, config.interval, config.limit);
    // Gate.io 蜡烛字段：[时间, 计价成交额, 收, 高, 低, 开, 基础成交量, 是否收盘]
    const points = [], opens = [], highs = [], lows = [], volumes = [], timestamps = [];
    rows.forEach(row => {
      const close = Number.parseFloat(row[2]), high = Number.parseFloat(row[3]);
      const low = Number.parseFloat(row[4]), open = Number.parseFloat(row[5]);
      const stamp = Number.parseInt(row[0], 10);
      if (![open, close, high, low].every(Number.isFinite)) return;
      points.push(close); opens.push(open); highs.push(high); lows.push(low);
      const vol = Number.parseFloat(row[6]); volumes.push(Number.isFinite(vol) ? vol : 0);
      timestamps.push(Number.isFinite(stamp) ? stamp : null);
    });
    if (!points.length) throw new Error('Gate.io 未返回走势数据');
    return { mode: 'kline', points, opens, highs, lows, volumes, timestamps, source: 'Gate.io · K 线' };
  }

  async function cryptoQuote({ coinId, symbol, geckoId } = {}) {
    const cacheKey = `${coinId || ''}|${String(symbol || '').toUpperCase()}|${geckoId || ''}`;
    const cached = cryptoQuoteCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 15 * 1000) return cached.quote;

    let quote = null;

    if (coinId && providerAvailable('coinlore')) {
      try { quote = await coinloreQuote(coinId); }
      catch (error) { if (!/未返回有效报价/.test(error.message)) markProviderDown('coinlore'); }
    }
    if (!quote && symbol && providerAvailable('gate')) {
      try { quote = await gateioCryptoQuote(symbol); }
      catch (error) { if (!/未返回有效报价/.test(error.message)) markProviderDown('gate'); }
    }
    if (!quote && providerAvailable('llama')) {
      const slug = geckoId || symbolToGeckoId(symbol);
      if (slug) {
        try { quote = await llamaCryptoQuote(slug); }
        catch (error) { if (!/未返回有效/.test(error.message)) markProviderDown('llama'); }
      }
    }
    if (!quote) throw new Error('加密货币行情源暂不可用');

    if (symbol) {
      try { quote.spark = await gateioCryptoSpark(symbol); }
      catch (error) { quote.spark = []; }
    }
    cryptoQuoteCache.set(cacheKey, { at: Date.now(), quote });
    return quote;
  }

  async function cryptoCatalog() {
    if (cryptoCatalogCache.items.length && Date.now() - cryptoCatalogCache.at < 5 * 60 * 1000) {
      return cryptoCatalogCache.items;
    }

    let items = null;

    if (providerAvailable('coinlore')) {
      try {
        const payload = await fetchJson('https://api.coinlore.net/api/tickers/?start=0&limit=100', 4000);
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
        const pairs = await fetchJson('https://api.gateio.ws/api/v4/spot/currency_pairs', 8000);
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
    cryptoCatalogCache.at = Date.now();
    cryptoCatalogCache.items = items;
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
        return symbol === keyword || name.includes(keyword) || gecko.includes(keyword)
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

  /* ------------------------------- 资产搜索 ------------------------------ */

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

    if (classify === 'UsStock' && !['1', '5'].includes(typeUS)) return null;
    if (classify === 'HK' && !['0', '3'].includes(typeUS)) return null;
    if (classify === 'Index' && typeUS !== '1') return null;
    if (classify === 'UniversalIndex') {
      if (!['0', '4'].includes(typeUS)) return null;
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
    const cacheKey = `em:${keyword.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 60 * 1000) return cached.data;
    const json = await jsonp(
      `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=${EASTMONEY_SEARCH_TOKEN}&count=30`
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
    searchCache.set(cacheKey, { at: Date.now(), data: results });
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
    const cryptoFirst = crypto.filter(item => item.priority === 0);
    const cryptoRest = crypto.filter(item => item.priority !== 0);
    return [...cryptoFirst, ...eastMoney, ...cryptoRest].slice(0, 30);
  }

  /* ------------------------------- 汇总报价 ------------------------------ */

  async function customEastMoneyQuote(secid, category, type, symbol) {
    if (!/^\d+\.[A-Za-z0-9._-]+$/.test(String(secid || ''))) throw new Error('无效的行情代码');
    if (!['美股', 'A股', '港股'].includes(category)) throw new Error('不支持的市场');
    const currency = category === 'A股' ? 'CNY' : category === '港股' ? 'HKD' : 'USD';
    try {
      const [quote, spark] = await Promise.all([
        eastMoneyQuote(secid, currency),
        eastMoneyTrendSpark(secid).catch(() => [])
      ]);
      quote.spark = spark;
      if (type === '指数') {
        quote.w52h = null;
        quote.w52l = null;
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

  async function goldQuote(metal) {
    const data = await fetchJson(`https://api.gold-api.com/price/${metal}`, 8000);
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

  async function quoteFor(id) {
    const eastMoney = EAST_MONEY_ASSETS[id];
    if (eastMoney) {
      try {
        const quote = await eastMoneyQuote(eastMoney.secid, eastMoney.currency);
        try {
          quote.spark = await eastMoneyTrendSpark(eastMoney.secid);
        } catch (sparkError) {
          quote.spark = [];
        }
        if (eastMoney.index) {
          quote.w52h = null;
          quote.w52l = null;
        }
        return quote;
      } catch (error) {
        if (TENCENT_ASSETS[id]) return tencentQuote(TENCENT_ASSETS[id], eastMoney.currency);
        throw error;
      }
    }

    const crypto = CRYPTO_ASSETS[id];
    if (crypto) {
      return cryptoQuote({
        coinId: crypto.coinlore,
        symbol: crypto.symbol,
        geckoId: crypto.geckoId
      });
    }

    const metal = METAL_ASSETS[id];
    if (metal) return metalQuote(metal);

    const oil = OIL_ASSETS[id];
    if (oil) {
      try {
        return await eastMoneyCommodityQuote(oil.secid, oil.currency);
      } catch (error) {
        if (TENCENT_ASSETS[id]) return tencentQuote(TENCENT_ASSETS[id], oil.currency);
        throw error;
      }
    }

    throw new Error('此资产暂未配置公开实时行情源');
  }

  async function marketData() {
    const ids = [
      ...Object.keys(EAST_MONEY_ASSETS),
      ...Object.keys(CRYPTO_ASSETS),
      ...Object.keys(METAL_ASSETS),
      ...Object.keys(OIL_ASSETS)
    ];
    const entries = await Promise.all(ids.map(async id => {
      try {
        return [id, await quoteFor(id)];
      } catch (error) {
        return [id, { error: error.message }];
      }
    }));
    return Object.fromEntries(entries);
  }


function parseIntradayRows(rows, preClose, source){
  const points = [], avg = [], volumes = [], timestamps = [];
  rows.forEach(row => {
    const c = String(row).split(',');
    const close = Number.parseFloat(c[2]);
    if (!Number.isFinite(close) || close <= 0) return;
    points.push(close);
    const a = Number.parseFloat(c[7]);
    avg.push(Number.isFinite(a) && a > 0 ? a : null);
    const v = Number.parseFloat(c[5]);
    volumes.push(Number.isFinite(v) ? v : 0);
    const stamp = Date.parse(String(c[0]).replace(' ', 'T') + '+08:00');
    timestamps.push(Number.isFinite(stamp) ? Math.floor(stamp / 1000) : null);
  });
  if (!points.length) throw new Error('暂无分时数据（可能尚未开盘）');
  return { mode: 'intraday', points, avg, volumes, timestamps, preClose: Number.isFinite(preClose) ? preClose : null, source };
}
async function eastMoneyIntraday(secid){
  const json = await jsonp(`https://push2his.eastmoney.com/api/qt/stock/trends2/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ndays=1&iscr=0`);
  const data = json?.data || {};
  const pre = Number(data.preClose ?? data.prePrice);
  return parseIntradayRows(Array.isArray(data.trends) ? data.trends : [], pre, '东方财富 · 分时');
}
async function cryptoIntraday(symbol){
  const rows = await gateioCryptoCandles(symbol, '5m', 288);
  const points = [], volumes = [], timestamps = [], avg = [];
  let sumPV = 0, sumV = 0;
  rows.forEach(row => {
    const close = Number.parseFloat(row[2]);
    if (!Number.isFinite(close)) return;
    const base = Number.parseFloat(row[6] ?? row[1]);
    const vol = Number.isFinite(base) ? base : 0;
    sumPV += close * vol; sumV += vol;
    points.push(close); volumes.push(vol);
    avg.push(sumV ? sumPV / sumV : close);
    timestamps.push(Number.parseInt(row[0], 10) || null);
  });
  if (!points.length) throw new Error('Gate.io 未返回分时数据');
  const open = Number.parseFloat(rows[0]?.[5]);
  return { mode: 'intraday', points, avg, volumes, timestamps, preClose: Number.isFinite(open) ? open : points[0], source: 'Gate.io · 24 小时分时' };
}


  const KLINE_RANGES = { 'TS': { klt: 1, lmt: 400 }, '1D': { klt: 5, lmt: 240 }, '5D': { klt: 15, lmt: 240 }, '1M': { klt: 101, lmt: 22 }, '3M': { klt: 101, lmt: 66 }, '1Y': { klt: 101, lmt: 250 } };
  async function eastMoneyKlineChart(secid, range) {
    if (!/^\d+\.[A-Za-z0-9._-]+$/.test(String(secid))) throw new Error('无效的行情代码');
    const o = KLINE_RANGES[range] || KLINE_RANGES['1M'];
    const json = await jsonp(`https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${o.klt}&fqt=1&end=20500101&lmt=${o.lmt}&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57`);
    const rows = Array.isArray(json?.data?.klines) ? json.data.klines : [];
    const points = [], opens = [], highs = [], lows = [], volumes = [], timestamps = [];
    rows.forEach(row => {
      const c = String(row).split(',');
      const open = Number.parseFloat(c[1]), close = Number.parseFloat(c[2]);
      const high = Number.parseFloat(c[3]), low = Number.parseFloat(c[4]);
      if (![open, close, high, low].every(Number.isFinite)) return;
      opens.push(open); points.push(close); highs.push(high); lows.push(low);
      const v = Number.parseFloat(c[5]); volumes.push(Number.isFinite(v) ? v : 0);
      const raw = String(c[0]);
      const stamp = Date.parse((raw.includes(' ') ? raw.replace(' ', 'T') : raw + 'T15:00') + '+08:00');
      timestamps.push(Number.isFinite(stamp) ? Math.floor(stamp / 1000) : null);
    });
    if (!points.length) throw new Error('东方财富未返回 K 线数据');
    return { mode: 'kline', points, opens, highs, lows, volumes, timestamps, source: '东方财富 · K 线' };
  }

  async function chartData(id, range) {
    const eastMoney = EAST_MONEY_ASSETS[id];
    if (eastMoney) return eastMoneyKlineChart(eastMoney.secid, range).catch(() => eastMoneyTrendChart(eastMoney.secid, range));

    const oil = OIL_ASSETS[id];
    if (oil) return eastMoneyKlineChart(oil.secid, range).catch(() => eastMoneyTrendChart(oil.secid, range));

    const metal = METAL_ASSETS[id];
    if (metal) return eastMoneyKlineChart(metal.secid, range).catch(() => eastMoneyTrendChart(metal.secid, range));

    const crypto = CRYPTO_ASSETS[id];
    if (crypto) return gateioCryptoChart(crypto.symbol, range);

    return { points: [], timestamps: [], source: '该资产暂未配置公开图表源' };
  }

  async function staticApiFetch(path) {
    const url = new URL(path, location.origin);
    try {
      let data;
      if (url.pathname === '/api/market') {
        data = await marketData();
      } else if (url.pathname === '/api/search') {
        data = { results: await searchAssets(url.searchParams.get('q')) };
      } else if (url.pathname === '/api/quote') {
        const source = url.searchParams.get('source');
        if (source === 'crypto' || source === 'coinlore') {
          data = await cryptoQuote({
            coinId: url.searchParams.get('coinId'),
            symbol: url.searchParams.get('symbol'),
            geckoId: url.searchParams.get('geckoId')
          });
        } else {
          data = await customEastMoneyQuote(
            url.searchParams.get('secid'),
            url.searchParams.get('category'),
            url.searchParams.get('type'),
            url.searchParams.get('symbol')
          );
        }
      } else if (url.pathname === '/api/chart') {
        const id = url.searchParams.get('id');
        const secid = url.searchParams.get('secid');
        const crypto = url.searchParams.get('crypto');
        const range = url.searchParams.get('range') || '1D';
        try {
          if (range === 'TS') {
            const mapped = secid || EAST_MONEY_ASSETS[id]?.secid || OIL_ASSETS[id]?.secid || METAL_ASSETS[id]?.secid;
            if (mapped) data = await eastMoneyKlineChart(mapped, 'TS').catch(() => eastMoneyIntraday(mapped));
            else if (crypto || CRYPTO_ASSETS[id]) { const sym = crypto || CRYPTO_ASSETS[id].symbol; data = await gateioCryptoChart(sym, 'TS').catch(() => cryptoIntraday(sym)); }
            else data = { points: [], timestamps: [], source: '该资产暂无分时数据' };
          } else if (secid) data = await eastMoneyKlineChart(secid, range).catch(() => eastMoneyTrendChart(secid, range));
          else if (crypto) data = await gateioCryptoChart(crypto, range);
          else data = await chartData(id, range);
        } catch (chartError) {
          data = { points: [], timestamps: [], source: '当前区间暂无可用数据', error: chartError.message };
        }
      } else {
        throw new Error('未知接口');
      }
      return {
        ok: true,
        status: 200,
        json: async () => data
      };
    } catch (error) {
      return {
        ok: false,
        status: 502,
        json: async () => ({ error: error.message, points: [], timestamps: [] })
      };
    }
  }

  window.MarketStaticApi = { fetch: staticApiFetch };
})();
