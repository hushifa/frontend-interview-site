var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>运行时 CSS-in-JS 库（在组件渲染时才生成样式的那类）要把 <code>&lt;style&gt;</code> 标签插进页面。<code>useInsertionEffect</code> 就是专门给它们插样式用的 Hook，它保证在任何 <code>useLayoutEffect</code> 之前执行。</p>
<p>为什么不能在别处插？在渲染过程中插最糟，过渡更新时浏览器可能每一帧都要重新计算样式。放到 <code>useLayoutEffect</code> 或 <code>useEffect</code> 又太晚，别的组件的 layout Effect 可能已经在测量布局了，量到的是没有样式时的尺寸。<code>useInsertionEffect</code> 正好排在这两者前面。</p>
<p>三种 Effect 的顺序是：<code>useInsertionEffect</code> 最先，然后 <code>useLayoutEffect</code>，它在浏览器绘制前执行；<code>useEffect</code> 最后，通常在绘制后。</p>
<p>它的限制很多：不能在里面更新 state，执行时 ref 还没绑定，DOM 可能更新了也可能没更新，服务端渲染时不运行。所以 React 文档明确说，它是给 CSS-in-JS 库作者用的，写业务代码时应该用 <code>useEffect</code> 或 <code>useLayoutEffect</code>。</p>
</blockquote>
<h2>CSS-in-JS 库怎样用它</h2>
<p>React 文档给的示意写法是这样的：一个 <code>useCSS</code> Hook 收到一条样式规则，在 <code>useInsertionEffect</code> 里检查是否已经插过，没插过就往 <code>&lt;head&gt;</code> 里加一个 <code>&lt;style&gt;</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> isInserted = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useCSS</span>(<span class="hljs-params">rule</span>) {
  <span class="hljs-title function_">useInsertionEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!isInserted.<span class="hljs-title function_">has</span>(rule)) {
      isInserted.<span class="hljs-title function_">add</span>(rule);
      <span class="hljs-variable language_">document</span>.<span class="hljs-property">head</span>.<span class="hljs-title function_">appendChild</span>(<span class="hljs-title function_">getStyleForRule</span>(rule));
    }
  });
  <span class="hljs-keyword">return</span> rule;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> className = <span class="hljs-title function_">useCSS</span>(<span class="hljs-string">&#x27;...&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{className}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>为什么用一个模块级的 <code>Set</code> 去重？因为同一条规则可能被很多组件、很多次渲染用到，<code>&lt;style&gt;</code> 只需要插一次。<code>getStyleForRule</code> 是示意函数，代表“把规则变成 style 元素”这一步。</p>
<h2>为什么放在 useLayoutEffect 里不行</h2>
<p>设想页面上有一个提示框组件，它在 <code>useLayoutEffect</code> 里量自己的高度，再决定显示在上方还是下方，这正是<a href="/questions/react-ref-layout-effect/">《useEffect 和 useLayoutEffect 在什么时候执行？测量 DOM 为什么要用 useLayoutEffect？》</a>里讲的场景。</p>
<p>如果某个 CSS-in-JS 库也在 <code>useLayoutEffect</code> 里插样式，两者的先后就说不准了。提示框可能先量，那时它的 padding、字号还没生效，量出来的高度是错的，位置也就算错了。</p>
<p><code>useInsertionEffect</code> 的唯一保证就是在所有 layout Effect 之前执行。所以样式插在这里，任何组件的 layout Effect 开始测量时，<code>&lt;style&gt;</code> 已经在页面上了。</p>
<h2>时机上还有哪些和其他 Effect 不同</h2>
<p>文档只承诺“在 layout Effect 之前”，没有承诺和 DOM 更新的先后，原话是它可能在 DOM 更新之前或之后运行，不应依赖某个时间点的 DOM 状态。这也是为什么它不能读 ref，ref 这时还没绑定。</p>
<p>清理和重新执行的顺序也不一样。其他 Effect 是先把所有要清理的清理完，再统一执行新的 setup。<code>useInsertionEffect</code> 是一个组件一个组件地处理，同一个组件的清理和 setup 紧挨着执行，所以不同组件之间会交错。</p>
<p>另外它在服务端不运行。CSS-in-JS 库要支持服务端渲染，得在渲染时自己收集用到的规则，然后输出到 HTML 里。文档的示意写法是在 <code>useCSS</code> 里判断 <code>typeof window === &#x27;undefined&#x27;</code>，把规则加进一个收集用的 <code>Set</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么在 useInsertionEffect 里不能 setState？</strong></p>
<blockquote>
<p>文档把这条列为明确限制：它不能用来调度更新。它的用途只有一个，就是在布局测量之前把样式插进页面，状态更新应该放在其他 Effect 或事件处理函数里。</p>
</blockquote>
<p><strong>有了它，运行时 CSS-in-JS 就没有性能问题了吗？</strong></p>
<blockquote>
<p>没有。React 文档说运行时注入样式有两个问题：浏览器要更频繁地重新计算样式，以及在错误时机注入会很慢。<code>useInsertionEffect</code> 只解决第二个。所以 React 更推荐静态样式写在 CSS 文件里，动态样式用内联 style。</p>
</blockquote>
<p><strong>业务代码里想在绘制前改 DOM，能用它吗？</strong></p>
<blockquote>
<p>不该用。它执行时 DOM 不一定已更新、ref 也没绑定，拿不到可靠的元素。绘制前读写 DOM 应该用 <code>useLayoutEffect</code>，其余情况用 <code>useEffect</code>，依赖和清理写法见<a href="/questions/react-effect/">《useEffect 的依赖数组和清理函数应该怎么写？》</a>。</p>
</blockquote>`};export{e as default};