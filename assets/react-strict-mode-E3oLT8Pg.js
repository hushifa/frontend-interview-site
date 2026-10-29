var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在组件里写一句 <code>console.log</code>，开发环境下看到它打印了两次；写一个 <code>useEffect</code> 连接聊天室，控制台先显示连接、断开，再连接一次。这都是 <code>&lt;StrictMode&gt;</code> 故意做的，它只在开发环境这样运行。</p>
<p>渲染两次，是为了检查组件是不是纯函数。纯函数用同样的输入调用几次，结果都一样，多调用一次看不出区别。如果组件在渲染时改了传进来的数组，调用两次就会多出一项，问题马上就能看见。</p>
<p>Effect 多跑一轮，是为了检查清理函数有没有写对。React 在组件挂载后立刻执行一次 cleanup，再执行一次 setup。清理写对了，最后只剩一个连接；漏写了，连接数就会一直往上涨。</p>
<p>要注意，这些检查只在开发环境运行，不影响生产构建。所以解决方法不是想办法阻止它跑两次，而是把渲染写成纯的、把 Effect 的清理补完整。</p>
</blockquote>
<h2>哪些代码会被调用两次</h2>
<p>react.dev 列出了严格模式在开发环境下会多调用一次的函数，它们都应该是纯函数：</p>
<ul>
<li>组件函数体，只包括顶层逻辑，不包括事件处理函数里的代码；</li>
<li>传给 <code>useState</code>、<code>set</code> 函数、<code>useMemo</code>、<code>useReducer</code> 的函数；</li>
<li>类组件的部分方法，比如 <code>constructor</code>、<code>render</code>、<code>shouldComponentUpdate</code>。</li>
</ul>
<p>事件处理函数不在里面，所以点一次按钮，<code>onClick</code> 还是只执行一次。装了 React DevTools 的话，第二次渲染里的 <code>console.log</code> 会显示成浅灰色，DevTools 还有一个默认关闭的设置能把它们完全隐藏。</p>
<h2>渲染两次怎样暴露问题</h2>
<p>官方用一个故事列表举例：组件拿到 <code>stories</code> 数组，在末尾加一项“新建”再渲染。下面用普通函数模拟同样的错误，要看调用两次之后结果有什么不同：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> stories = [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;早安&#x27;</span> }];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">impureItems</span>(<span class="hljs-params">list</span>) {
  list.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;create&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;新建&#x27;</span> });
  <span class="hljs-keyword">return</span> list.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">label</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">pureItems</span>(<span class="hljs-params">list</span>) {
  <span class="hljs-keyword">return</span> [...list, { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;create&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;新建&#x27;</span> }].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">label</span>);
}

<span class="hljs-comment">// 模拟严格模式：同样的输入调用两次</span>
<span class="hljs-title function_">impureItems</span>(stories);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">impureItems</span>(stories).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 早安,新建,新建</span>

<span class="hljs-keyword">const</span> fresh = [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;早安&#x27;</span> }];
<span class="hljs-title function_">pureItems</span>(fresh);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pureItems</span>(fresh).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 早安,新建</span>
</code></pre></div>
<p>为什么 <code>impureItems</code> 多出了一个“新建”？因为 <code>push</code> 改的是传进来的那个数组，第一次调用已经往里加了一项，第二次又加一项。没有严格模式时这个 bug 也存在，只是要等组件因为别的原因重新渲染才会出现，很难复现。严格模式让它在第一次渲染就露出来。</p>
<p><code>pureItems</code> 先复制一份再加，不碰原数组，调用几次结果都一样。改法就是这样：渲染时不修改 props、state 和外部变量，需要新数据就创建新的。</p>
<h2>Effect 多跑一轮怎样暴露问题</h2>
<p>正常情况下，组件挂载时 React 执行 Effect 的 setup，卸载时执行 cleanup。严格模式下，挂载后会马上多跑一轮 cleanup 加 setup。下面用计数器模拟一个聊天室连接，要看最后剩几个连接：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> connections = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params"></span>) {
  connections += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    connections -= <span class="hljs-number">1</span>;
  };
}

<span class="hljs-comment">// 模拟严格模式下挂载：setup → cleanup → setup</span>
<span class="hljs-keyword">const</span> cleanup = <span class="hljs-title function_">connect</span>();
<span class="hljs-title function_">cleanup</span>();
<span class="hljs-title function_">connect</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(connections); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>清理函数正确地断开了连接，所以跑了两次 setup，最后还是只有 1 个连接，和生产环境里只跑一次的结果一样。如果 Effect 没有返回清理函数，这里就会是 2，用户每进出一次页面连接数就多一个。react.dev 的说法是，严格模式让这类 bug 在推上线之前就出现。</p>
<p>放到组件里，写法是这样的：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> connection = <span class="hljs-title function_">createConnection</span>(serverUrl, roomId);
  connection.<span class="hljs-title function_">connect</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> connection.<span class="hljs-title function_">disconnect</span>();
}, [roomId]);
</code></pre></div>
<p>依赖数组和清理函数的其他写法见<a href="/questions/react-effect/">《useEffect 的依赖数组和清理函数应该怎么写？》</a>。回调 ref 也一样，严格模式会给每个回调 ref 多跑一轮 setup 加 cleanup，React 19 起回调 ref 可以返回清理函数。</p>
<h2>严格模式还会检查什么</h2>
<p>除了上面两类，严格模式还会检查组件有没有用已经废弃的 API，比如类组件里的 <code>UNSAFE_componentWillMount</code>。它可以只包住应用的一部分，只有包在里面的组件才会被检查。文档还提到，如果严格模式没有包在根节点，React 不会在首次挂载时多跑 Effect，因为那样会出现子组件的 Effect 跑了两次、父组件没跑的情况，这在生产环境里不可能发生。</p>
<h2>常见追问</h2>
<p><strong>严格模式下请求发了两次，要不要用 ref 标记防止重复？</strong></p>
<blockquote>
<p>不建议。请求跑两次说明 Effect 没处理好清理，用户快速切换页面时生产环境一样会出问题。更好的做法是在清理函数里忽略过期结果，或者用 <code>AbortController</code> 取消请求；数据请求也可以交给有缓存的库或框架。</p>
</blockquote>
<p><strong>事件处理函数里的代码会执行两次吗？</strong></p>
<blockquote>
<p>不会。严格模式只对应该是纯函数的代码重复调用，比如组件函数体和 <code>useState</code>、<code>useMemo</code> 的函数。事件处理函数本来就是用来做副作用的，点一次只执行一次。</p>
</blockquote>
<p><strong>生产环境会渲染两次吗？</strong></p>
<blockquote>
<p>不会。react.dev 明确说这些检查只在开发环境运行，不影响生产构建。所以不需要为了生产环境的性能去关掉严格模式。</p>
</blockquote>`};export{e as default};