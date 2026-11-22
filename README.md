# Market View

一个使用原生 HTML、CSS 和 JavaScript 实现的响应式真实行情看板。

## 运行

必须通过 Node 本地代理运行，以便服务器端请求公开行情接口：

- 美股、A 股、港股报价：东方财富公开接口（美股失败时回退到 Nasdaq API）
- 石油报价：东方财富 NYMEX WTI 原油与 ICE 布伦特原油分时行情
- 加密货币报价：CoinLore 公开接口（不可用时回退到 Gate.io / DefiLlama）
- 贵金属：东方财富现货黄金/白银分时行情，Gold API 作为备用源
- 走势图：股票/指数使用东方财富 K 线，原油/贵金属使用东方财富分时，加密货币使用 Gate.io K 线（BTC/ETH 可回退 Nasdaq）
- 接口临时不可用时，对应资产会明确显示“数据暂不可用”，不会生成模拟数据。

```bash
npm start
```

然后访问 `http://localhost:4173`。

## GitHub Pages

GitHub Pages 地址：<https://coderstring.github.io/>

GitHub Pages 只能托管静态文件，无法运行 `server.js` 行情代理。因此：

- 直接发布到 GitHub Pages 时，页面可以打开，但行情接口不可用，会提示需要 Node 后端。
- 如需在 GitHub Pages 上显示实时行情，请先把 `server.js` 部署到支持 Node 的服务（如 Render、Railway、Fly.io），得到一个 HTTPS 地址。
- 然后修改 `config.js`：

```js
window.MARKET_API_BASE = 'https://你的后端地址';
```

再发布到 GitHub Pages，前端就会请求远程后端。`server.js` 已开启 `Access-Control-Allow-Origin: *`，支持跨域访问。

也可以直接把整个项目部署到 Render 等 Node 平台，前后端一起运行，无需 GitHub Pages。

## 总览页

- 美股、A 股、港股板块只展示核心指数，点击对应分类标签可查看该市场的热门个股。
- 各板块资产卡片展示分时迷你走势；详情页支持多区间走势（原油/贵金属为 1D / 5D）。
- 每个指数分组右上角有「＋ 添加指数」，可按当前市场搜索并添加任意指数；添加后会出现在总览中，并同样支持拖拽排序。
- 加密货币板块右上角有「＋ 添加自选」，可搜索币种并添加到总览的加密货币区域，同时加入「我的自选」；自定义币种可在同一弹窗中移除。
- 指数卡片左侧带有拖动手柄，按住拖动即可调整排序；顺序保存在浏览器 `localStorage` 中，刷新后仍然生效。
- 自定义指数可以同时加入「我的自选」；从总览移除不会影响自选，反之亦然。

## 添加自选

点击右上角「添加自选」按钮，可搜索美股、A 股、港股、指数及加密货币（支持代码或中文名称，例如 `TSLA`、`600519`、`腾讯`、`标普500`、`BTC`、`狗狗币`）。股票与指数搜索由东方财富公开接口驱动，加密货币搜索与报价由 CoinLore 提供，CoinLore 不可用时自动回退到 Gate.io / DefiLlama。添加后：

- 新增资产会持久化到浏览器 `localStorage`，并实时拉取行情和 K 线。
- 自选页按市场分类展示，取消收藏会自动清理对应资产。
- 已在默认列表中的资产不会重复创建，而是直接加入自选。

## 数据源与限制

- 美股、A 股与港股：东方财富公开行情接口，可提供开盘价、昨收价、最高/最低价、成交量、市值、市盈率和 52 周区间。
- 美股备用源：Nasdaq 公开报价接口，仅在东方财富请求失败时使用。
- 加密货币：CoinLore 为主报价源，Gate.io 与 DefiLlama 作为备用源；分时走势与 K 线来自 Gate.io，BTC/ETH 在 Gate.io 不可用时回退 Nasdaq。
- 贵金属：东方财富提供现货黄金/白银分时行情，包含开盘价、昨收价、最高/最低价；Gold API 作为备用源。
- 石油：东方财富提供 NYMEX WTI 原油与 ICE 布伦特原油分时行情，支持 1D / 5D 走势图。
- 市盈率、市值等字段可能因接口未提供而显示为“—”。
- 行情可能存在交易所延时或闭市状态。

资产名称和接口映射集中在 `server.js` 的 `eastMoneyAssets`、`nasdaqAssets`、`cryptoAssets` 和 `metalAssets` 对象中；自选数据保存在浏览器的 `localStorage` 中。不要在前端代码中存放任何真实 API 密钥。
