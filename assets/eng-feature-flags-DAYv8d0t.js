var e={answerHtml:`<h2>简答</h2>
<ul>
<li>功能开关把&quot;代码已部署&quot;和&quot;功能已上线&quot;分开，用于灰度、紧急关闭和实验。</li>
<li>开关不是权限：前端隐藏按钮只影响展示，服务端必须独立校验用户能否调用接口。</li>
<li>灰度分流要用稳定的用户标识做哈希，让同一用户每次看到同一版本，前后端用同一份判断结果。</li>
<li>开关值要有默认值和刷新策略，配置服务不可用时也能按安全的默认行为运行。</li>
<li>每个开关都要有负责人和删除时间，发布完成后清掉分支代码。</li>
</ul>
<h2>开关的几种用途</h2>
<table><thead><tr><th>类型</th><th>目的</th><th>生命周期</th></tr></thead><tbody><tr><td>发布开关</td><td>未完成功能先合入主干，按比例放量</td><td>短，全量后删除</td></tr><tr><td>运维开关</td><td>故障时关闭高成本功能（如推荐、实时预览）</td><td>长期保留</td></tr><tr><td>实验开关</td><td>A/B 测试，比较指标</td><td>实验结束删除</td></tr><tr><td>权限/套餐</td><td>决定谁有资格使用</td><td>属于业务规则，不应混入开关系统</td></tr></tbody></table>
<p>把这几类混在一个配置里，最常见的后果是&quot;临时开关&quot;活了好几年，或用开关代替权限校验。</p>
<h2>分流要稳定且一致</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">bucket</span>(<span class="hljs-params">userId, flagKey</span>) {
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">\`<span class="hljs-subst">\${flagKey}</span>:<span class="hljs-subst">\${userId}</span>\`</span>);
  <span class="hljs-keyword">const</span> hash = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-keyword">await</span> crypto.<span class="hljs-property">subtle</span>.<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;SHA-256&#x27;</span>, data));
  <span class="hljs-keyword">return</span> ((hash[<span class="hljs-number">0</span>] &lt;&lt; <span class="hljs-number">8</span>) | hash[<span class="hljs-number">1</span>]) % <span class="hljs-number">100</span>; <span class="hljs-comment">// 0–99</span>
}

<span class="hljs-keyword">const</span> enabled = (<span class="hljs-keyword">await</span> <span class="hljs-title function_">bucket</span>(user.<span class="hljs-property">id</span>, <span class="hljs-string">&#x27;new-checkout&#x27;</span>)) &lt; rolloutPercent;
</code></pre></div>
<ul>
<li>用 flagKey 参与哈希，不同开关的放量用户互不相关。</li>
<li>不要用 <code>Math.random()</code>，否则刷新页面就换版本。</li>
<li>放量比例只增不减时，已进入的用户保持在新版本。</li>
<li>更稳妥的方式是由服务端计算结果，随页面数据或接口返回，前端只读取结果。这样前后端判断一致，接口也能按同一结果决定行为。</li>
</ul>
<h2>获取、缓存和失效</h2>
<ul>
<li>首屏需要的开关随 HTML 或首个接口下发，避免页面先渲染旧版本再闪到新版本。</li>
<li>配置服务超时或失败时使用代码里的默认值，默认值应选择保守行为（通常是旧功能）。</li>
<li>长时间打开的页面可以定期刷新开关；紧急关闭需要服务端同时生效，不能依赖前端刷新。</li>
<li>把用户所在分组记录到埋点和错误日志里，否则无法区分问题来自哪个版本。</li>
</ul>
<h2>安全边界</h2>
<p>前端开关值可以被用户修改。新功能对应的接口要在服务端检查同一个开关和用户权限；未开放的功能代码如果包含敏感信息（如未公布的价格、内部接口），不应提前打进公开产物。</p>
<h2>清理</h2>
<p>每个开关登记负责人、用途和计划删除时间。全量后删除开关判断和旧分支代码，并在 CI 中统计长期存在的发布开关。开关组合越多，需要测试的路径越多。</p>
<h2>常见追问</h2>
<ul>
<li>灰度期间出问题怎样回滚？把比例调回 0 或打开运维开关，不需要重新部署；前提是新旧版本的数据格式兼容。</li>
<li>开关能代替发布分支吗？可以减少长期分支，但需要配合测试两条路径。</li>
</ul>`};export{e as default};