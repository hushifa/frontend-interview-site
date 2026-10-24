var e={answerHtml:`<p><code>Cache-Status</code> 可以让缓存层描述是否命中、未命中的原因和处理方式，帮助诊断浏览器、CDN、反向代理之间的缓存行为。多个缓存层可以通过多个值表达各自结果。</p>
<p>它是诊断信息，不会自动让响应可缓存，也不能替代 <code>Cache-Control</code>、<code>Vary</code>、ETag 和失效策略。公开响应头前要评估是否泄露内部代理结构或请求信息。</p>
<p>缓存问题仍要结合请求 URL、方法、响应头、资源版本和实际部署链路分析；不能只看到 hit/miss 就下结论。</p>`};export{e as default};