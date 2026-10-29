var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端渲染出 HTML 以后，客户端不会重建 DOM，而是把组件逻辑和事件“接到”已有的 DOM 上，这一步叫 hydration。它的前提是客户端第一次渲染的结果和服务端 HTML 一样，对不上就叫 hydration mismatch。</p>
<p>常见原因有这些：渲染时调了 <code>Date.now()</code>、<code>Math.random()</code>；读了 <code>window</code>、<code>localStorage</code>；服务端和浏览器的时区、语言不同；两端拿到的数据不同；HTML 嵌套不合法；浏览器扩展往页面里插了节点。</p>
<p>React 18 起，不一致不再只是一个警告，文本不同也算。React 会丢掉这部分服务端 HTML，从最近的 Suspense 边界开始改成客户端渲染，没有边界就从根开始，并通过 <code>onRecoverableError</code> 上报。</p>
<p>修复原则是：首次渲染只用两端都一样的输入，浏览器才有的内容等 <code>useEffect</code> 之后再更新，Vue 里是 <code>onMounted</code>。<code>suppressHydrationWarning</code> 只能用在没法避免的单个文本差异上，比如时间戳，不能拿来掩盖结构问题。</p>
</blockquote>
<h2>先看一个显示本地时间的组件</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：服务端和浏览器的时间、时区都可能不同</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Clock</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">time</span>&gt;</span>{new Date().toLocaleTimeString()}<span class="hljs-tag">&lt;/<span class="hljs-name">time</span>&gt;</span></span>;
}
</code></pre></div>
<p>这段代码在纯客户端渲染时没问题，一上 SSR 就会报 mismatch。原因是它被执行了两次：服务端算一次，生成 HTML；客户端 hydration 时又算一次。两次之间隔了时间，服务器和用户的时区也可能不同，结果自然对不上。</p>
<p>改法是让第一次渲染用两端相同的输入，也就是服务端传过来的时间，等挂载后再换成本地时间：</p>
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
<p><code>useEffect</code> 只在浏览器里、hydration 完成之后执行，所以放在里面的本地时间不会参与比对。</p>
<h2>常见原因和改法</h2>
<table><thead><tr><th>原因</th><th>例子</th><th>修复</th></tr></thead><tbody><tr><td>不确定的值</td><td>时间、随机数</td><td>由服务端生成并作为数据传给客户端；ID 用 <code>useId</code></td></tr><tr><td>浏览器专属 API</td><td><code>window.innerWidth</code>、<code>localStorage</code></td><td>首次渲染使用默认值，挂载后读取</td></tr><tr><td>两端数据不同</td><td>客户端重新请求得到更新的数据</td><td>把服务端使用的数据序列化到页面里，客户端直接复用</td></tr><tr><td>不合法的嵌套</td><td><code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>，<code>&lt;a&gt;</code> 里放 <code>&lt;a&gt;</code></td><td>修正 HTML 结构，浏览器解析时会自动改写这类结构</td></tr><tr><td>浏览器扩展</td><td>翻译、广告拦截插件改写 DOM</td><td>用无痕模式复现，确认是否是扩展造成</td></tr></tbody></table>
<p>不合法嵌套这一条容易让人困惑：代码里明明写的是 <code>&lt;p&gt;&lt;div&gt;</code>，为什么会不一致？因为浏览器解析 HTML 时会自动修正这种结构，实际 DOM 变成了别的样子，React 拿自己的结果去比，就对不上了。</p>
<h2>确实没法在服务端渲染的组件</h2>
<p>有些组件就是只能在浏览器里跑，可以包一层：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ClientOnly</span>(<span class="hljs-params">{ children, fallback = <span class="hljs-literal">null</span> }</span>) {
  <span class="hljs-keyword">const</span> [mounted, setMounted] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setMounted</span>(<span class="hljs-literal">true</span>), []);
  <span class="hljs-keyword">return</span> mounted ? children : fallback;
}
</code></pre></div>
<p>服务端和客户端第一次渲染都输出 <code>fallback</code>，两边一致；挂载后 <code>mounted</code> 变成 <code>true</code>，才渲染真正的内容。代价是多一次渲染，而且首屏看不到这部分内容，所以只用于确实没法服务端渲染的组件。</p>
<h2>怎样排查</h2>
<p>先看控制台报错，里面有组件栈和差异内容，React 19 会直接显示服务端和客户端哪里不同。然后打开页面源代码，那是服务端返回的 HTML，拿它和 hydration 后的 DOM 对比。</p>
<p>如果在自己电脑上复现不了，试试固定时区和语言。服务端、测试环境和用户浏览器的这些设置经常不一样。</p>
<h2>常见追问</h2>
<p><strong>不一致会造成什么后果？</strong></p>
<blockquote>
<p>一是性能浪费，因为要重新渲染；二是页面会闪烁；严重时事件会绑到错误的节点上。</p>
</blockquote>
<p><strong>Vue 里怎么处理？</strong></p>
<blockquote>
<p>原理一样。Vue 3.5 起可以给元素加 <code>data-allow-mismatch</code>，抑制预期之内的不一致警告，还可以限定类型，比如只允许 <code>text</code> 或 <code>class</code> 不一致。</p>
</blockquote>`};export{e as default};