var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>useRef</code> 返回一个在组件整个生命周期内不变的 <code>{ current }</code> 对象，常用来引用 DOM 节点或保存计时器 ID；修改 <code>current</code> 不会触发重新渲染。</li>
<li><code>useEffect</code> 在 React 提交 DOM 之后执行，通常在浏览器绘制之后，不阻塞画面显示。</li>
<li><code>useLayoutEffect</code> 在 DOM 更新后、浏览器绘制前同步执行，可以读取布局并在用户看到之前修正。</li>
<li><code>useLayoutEffect</code> 会推迟绘制，默认用 <code>useEffect</code>，只有出现闪烁时才换成 <code>useLayoutEffect</code>。</li>
<li>渲染期间不要读写 <code>ref.current</code>（初始化除外），否则渲染结果不再只由 props 和 state 决定。</li>
</ul>
<h2>用 useLayoutEffect 定位提示框</h2>
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
<p>流程是：第一次渲染用 <code>height = 0</code> 计算位置并提交；<code>useLayoutEffect</code> 读到真实高度并 <code>setHeight</code>；React 在绘制前同步重新渲染。用户只看到最终位置。换成 <code>useEffect</code> 的话，浏览器可能先画出错误位置，下一帧再跳过去。</p>
<h2>在 ref 里保存不需要显示的值</h2>
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
<p>计时器 ID 不参与显示，放在 ref 里，改动它不会引起额外渲染。要显示的 <code>seconds</code> 放在 state 里。</p>
<h2>服务端渲染</h2>
<p>服务端不执行任何 Effect。<code>useLayoutEffect</code> 依赖的布局信息在服务端不存在，所以服务端渲染的 HTML 只能是测量前的样子。常见做法是让这类组件只在客户端渲染，或者首屏先显示不依赖测量的占位。</p>
<h2>React 19 的 ref 变化</h2>
<ul>
<li>函数组件可以直接接收 <code>ref</code> 作为 prop，新代码不再需要 <code>forwardRef</code>。</li>
<li>ref 回调可以返回清理函数，节点卸载时调用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不用普通变量代替 ref？普通变量每次渲染都会重新初始化，ref 能在多次渲染之间保留同一个值。</li>
<li><code>useLayoutEffect</code> 和 <code>useEffect</code> 的清理时机一样吗？都在下一次执行前和卸载时清理，只是执行阶段不同。</li>
</ul>`};export{e as default};