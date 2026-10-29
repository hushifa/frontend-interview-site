var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>useRef</code> 返回一个 <code>{ current }</code> 对象，组件存在多久，它就是同一个对象。常用来拿 DOM 节点，或者存定时器 ID 这种不用显示的值。改 <code>current</code> 不会让组件重新渲染。</p>
<p><code>useEffect</code> 和 <code>useLayoutEffect</code> 都在 React 把改动写进 DOM 之后执行，区别在于跟浏览器绘制的先后。<code>useEffect</code> 通常在浏览器把画面画出来以后才执行，不挡着画面。<code>useLayoutEffect</code> 在绘制之前同步执行，你可以读到元素的真实尺寸，在用户看到之前把位置改对。</p>
<p>所以 <code>useLayoutEffect</code> 适合“先测量、再定位”的场景，比如提示框、弹出菜单。可是它会推迟绘制，所以默认用 <code>useEffect</code>，只有画面出现闪烁时才换。</p>
<p>还要注意，渲染期间不要读写 <code>ref.current</code>（初始化除外），否则渲染结果就不只由 props 和 state 决定了。</p>
</blockquote>
<h2>用 useLayoutEffect 给提示框定位</h2>
<p>提示框要显示在按钮上方，可是放不下时得改放到下方。放不放得下，要先知道提示框有多高，而高度只有渲染出来才量得到。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useLayoutEffect, useRef, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Tooltip</span>(<span class="hljs-params">{ anchorRect, children }</span>) {
  <span class="hljs-keyword">const</span> ref = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> [height, setHeight] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useLayoutEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">setHeight</span>(ref.<span class="hljs-property">current</span>.<span class="hljs-title function_">getBoundingClientRect</span>().<span class="hljs-property">height</span>);
  }, [children]);

  <span class="hljs-keyword">const</span> spaceAbove = anchorRect.<span class="hljs-property">top</span>;
  <span class="hljs-keyword">const</span> top = spaceAbove &gt; height ? anchorRect.<span class="hljs-property">top</span> - height : anchorRect.<span class="hljs-property">bottom</span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">position:</span> &#x27;<span class="hljs-attr">fixed</span>&#x27;, <span class="hljs-attr">left:</span> <span class="hljs-attr">anchorRect.left</span>, <span class="hljs-attr">top</span> }}&gt;</span>
      {children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>过程是这样的：第一次渲染时 <code>height</code> 还是 0，按这个值算出位置并提交到 DOM。接着 <code>useLayoutEffect</code> 执行，量到真实高度，调用 <code>setHeight</code>。因为这一切都发生在浏览器绘制之前，React 会同步再渲染一次，用户只看到最终的正确位置。</p>
<p>如果换成 <code>useEffect</code>，浏览器可能已经把高度为 0 时的错误位置画了出来，下一帧才跳到正确位置，用户就会看到提示框闪一下。</p>
<h2>用 ref 存不需要显示的值</h2>
<p>下面是一个秒表。定时器 ID 只在开始和停止时用，不显示在页面上，所以放在 ref 里。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Stopwatch</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> intervalRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> [seconds, setSeconds] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">start</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearInterval</span>(intervalRef.<span class="hljs-property">current</span>);
    intervalRef.<span class="hljs-property">current</span> = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setSeconds</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s + <span class="hljs-number">1</span>), <span class="hljs-number">1000</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearInterval</span>(intervalRef.<span class="hljs-property">current</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{seconds}s<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{start}</span>&gt;</span>开始<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{stop}</span>&gt;</span>停止<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>为什么不用 state 存 ID？因为改 state 会触发重新渲染，而 ID 变了页面上什么都不用变，白白多渲染一次。要显示的 <code>seconds</code> 才放进 state。</p>
<p>那为什么不用普通变量？组件每次渲染都会重新执行一遍，普通变量每次都会被重新初始化，上一次存的 ID 就丢了。ref 能在多次渲染之间保持同一个值。</p>
<h2>服务端渲染时怎么办</h2>
<p>服务端不执行任何 Effect，也没有布局信息可测。所以依赖 <code>useLayoutEffect</code> 测量的组件，服务端渲染出的 HTML 只能是测量之前的样子。常见做法是让这类组件只在客户端渲染，或者首屏先显示一个不依赖测量的占位。</p>
<h2>React 19 里 ref 有什么变化</h2>
<p>函数组件现在可以直接把 <code>ref</code> 当 prop 接收，新代码不再需要 <code>forwardRef</code>。另外，ref 回调可以返回一个清理函数，节点卸载时 React 会调用它。</p>
<h2>常见追问</h2>
<p><strong><code>useLayoutEffect</code> 和 <code>useEffect</code> 的清理时机一样吗？</strong></p>
<blockquote>
<p>一样，都是在下一次执行之前和组件卸载时清理。区别只在执行的阶段，一个在绘制前，一个通常在绘制后。</p>
</blockquote>
<p><strong>提交阶段这几件事的先后顺序是什么？</strong></p>
<blockquote>
<p>先改 DOM，然后设置 ref、执行 <code>useLayoutEffect</code>，接着浏览器绘制，最后执行 <code>useEffect</code>（点击这类交互触发的更新，<code>useEffect</code> 也可能在绘制前执行）。详见<a href="/questions/react-render-commit/">《React 的渲染阶段与提交阶段有什么区别？》</a>。</p>
</blockquote>`};export{e as default};