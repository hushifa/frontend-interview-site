var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Hydration 是客户端把组件逻辑和事件&quot;接到&quot;服务端已经生成的 DOM 上，前提是客户端首次渲染与服务端 HTML 一致。</li>
<li>常见原因：渲染时调用 <code>Date.now()</code>、<code>Math.random()</code>；读取 <code>window</code>、<code>localStorage</code>；服务端与浏览器时区、语言不同；服务端和客户端拿到的数据不同；不合法的 HTML 嵌套；浏览器扩展插入了节点。</li>
<li>React 18 起，任何不一致（包括文本）都不只是警告：React 会丢弃这部分服务端 HTML，从最近的 Suspense 边界（没有则从根）改为客户端渲染，并通过 <code>onRecoverableError</code> 上报。</li>
<li>修复原则：首次渲染只使用两端都相同的输入；浏览器专属的内容在 <code>useEffect</code>（Vue 中是 <code>onMounted</code>）之后再更新。</li>
<li><code>suppressHydrationWarning</code> 只能用于无法避免的单个文本差异（如时间戳），不能用来掩盖结构问题。</li>
</ul>
<h2>例子：显示本地时间</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：服务端和浏览器的时间、时区都可能不同</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Clock</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">time</span>&gt;</span>{new Date().toLocaleTimeString()}<span class="hljs-tag">&lt;/<span class="hljs-name">time</span>&gt;</span></span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 正确：首次渲染使用服务端传来的时间，挂载后再切换到本地时间</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Clock</span>(<span class="hljs-params">{ serverTime }</span>) {
  <span class="hljs-keyword">const</span> [text, setText] = <span class="hljs-title function_">useState</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(serverTime).<span class="hljs-title function_">toISOString</span>());
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">setText</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>().<span class="hljs-title function_">toLocaleTimeString</span>());
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setText</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>().<span class="hljs-title function_">toLocaleTimeString</span>()), <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
  }, []);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">time</span> <span class="hljs-attr">dateTime</span>=<span class="hljs-string">{serverTime}</span>&gt;</span>{text}<span class="hljs-tag">&lt;/<span class="hljs-name">time</span>&gt;</span></span>;
}
</code></pre></div>
<h2>常见原因与修复</h2>
<table><thead><tr><th>原因</th><th>例子</th><th>修复</th></tr></thead><tbody><tr><td>不确定的值</td><td>时间、随机数</td><td>由服务端生成并作为数据传给客户端；ID 用 <code>useId</code></td></tr><tr><td>浏览器专属 API</td><td><code>window.innerWidth</code>、<code>localStorage</code></td><td>首次渲染使用默认值，挂载后读取</td></tr><tr><td>两端数据不同</td><td>客户端重新请求得到更新的数据</td><td>把服务端使用的数据序列化到页面里，客户端直接复用</td></tr><tr><td>不合法的嵌套</td><td><code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>，<code>&lt;a&gt;</code> 里放 <code>&lt;a&gt;</code></td><td>修正 HTML 结构，浏览器解析时会自动改写这类结构</td></tr><tr><td>浏览器扩展</td><td>翻译、广告拦截插件改写 DOM</td><td>用无痕模式复现，确认是否是扩展造成</td></tr></tbody></table>
<h2>只在客户端渲染的组件</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ClientOnly</span>(<span class="hljs-params">{ children, fallback = <span class="hljs-literal">null</span> }</span>) {
  <span class="hljs-keyword">const</span> [mounted, setMounted] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setMounted</span>(<span class="hljs-literal">true</span>), []);
  <span class="hljs-keyword">return</span> mounted ? children : fallback;
}
</code></pre></div>
<p>服务端和首次客户端渲染都输出 <code>fallback</code>，挂载后才渲染真实内容。会多一次渲染，首屏也看不到这部分内容，只用于确实无法在服务端渲染的组件。</p>
<h2>排查方法</h2>
<ul>
<li>看控制台报错中给出的组件栈和差异内容，React 19 会显示服务端和客户端的不同之处。</li>
<li>查看页面源代码（服务端 HTML），与 hydration 后的 DOM 对比。</li>
<li>固定时区和语言复现：服务端、测试环境和用户浏览器的设置常常不同。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>不一致会造成什么后果？性能浪费（重新渲染）、闪烁，严重时事件绑定到错误的节点上。</li>
<li>Vue 中怎么处理？原理相同，Vue 3.5 起可以给元素加 <code>data-allow-mismatch</code> 来抑制预期之内的不一致警告，并可以限定类型（如 <code>text</code>、<code>class</code>）。</li>
</ul>`};export{e as default};