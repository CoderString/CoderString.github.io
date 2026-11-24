// 部署 Node 后端后，将这里改成后端的 HTTPS 地址。
// 例如：window.MARKET_API_BASE = 'https://market-view-api.onrender.com';
// 本地开发保持空字符串，前端会请求同源的 /api/*。
window.MARKET_API_BASE = '';

// 访问密码（SHA-256 摘要，盐为 "mv-salt:"）。留空字符串则关闭密码页。
// 生成新摘要：在浏览器控制台运行 MarketAuth.hash('你的新密码')，把结果粘贴到这里。
window.MARKET_ACCESS_HASH = '';
// 登录有效期（天）
window.MARKET_ACCESS_DAYS = 7;
