var e={answerHtml:`<p>带内容哈希的静态脚本和样式通常可以设置较长的 <code>max-age</code>，配合 <code>immutable</code> 减少重复验证；入口 HTML 往往需要较短缓存，以便发现新版本。<code>no-store</code> 表示不应存储响应，适合敏感或不应落盘的数据，但会牺牲缓存收益。</p>
<p><code>stale-while-revalidate</code> 允许缓存先返回旧内容，同时后台发起更新，适合能容忍短暂旧数据的资源。它不是“永远可用”，浏览器和中间缓存对扩展指令的支持与策略仍需验证。</p>
<p>缓存头必须和发布策略配套。只改 CSS 而不改文件名、把 HTML 设置成永久缓存，或缓存带用户身份的响应，都可能造成旧页面、数据泄露或无法回滚。</p>`};export{e as default};