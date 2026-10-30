var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件更新时，React 先算出要改什么，再把改动写进 DOM，最后浏览器把画面画出来。<code>useEffect</code> 和 <code>useLayoutEffect</code> 都在 DOM 写好之后执行，区别在于跟浏览器绘制的先后。</p>
<p><code>useLayoutEffect</code> 在浏览器绘制之前执行，而且里面调用 <code>setState</code> 引起的更新也会在绘制前处理完。所以可以先量出元素的真实尺寸，再把位置改对，用户只看到最终结果。<code>useEffect</code> 通常等浏览器画完才执行，不挡着画面。</p>
<p>所以“先测量、再定位”的场景用 <code>useLayoutEffect</code>，比如提示框、弹出菜单。其他情况默认用 <code>useEffect</code>，因为 <code>useLayoutEffect</code> 里的代码会推迟绘制，用多了页面会变慢。</p>
<p>有两个细节要注意。第一，由点击这类交互触发的更新，<code>useEffect</code> 也可能在绘制前执行，不能把“一定在绘制后”当成保证。第二，Effect 只在客户端运行，服务端渲染时没有布局信息，依赖测量的组件要另做处理。</p>
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
<p>过程是这样的：第一次渲染时 <code>height</code> 还是 0，按这个值算出位置并提交到 DOM。接着 <code>useLayoutEffect</code> 执行，量到真实高度，调用 <code>setHeight</code>。react.dev 保证，<code>useLayoutEffect</code> 里的代码和它安排的状态更新都会在浏览器重新绘制前处理完，所以 React 再渲染一次，用户只看到最终的正确位置。</p>
<p>如果换成 <code>useEffect</code>，React 会先让浏览器把高度为 0 时的错误位置画出来，再处理 <code>setHeight</code>，提示框就会闪一下。</p>
<p>代码里的 <code>ref</code> 只是用来拿到 DOM 节点。<code>useRef</code> 本身的用法，以及它和 <code>useState</code> 的区别，见<a href="/questions/react-use-ref/">《useRef 有哪些用途？它和 useState 有什么区别？》</a>。</p>
<h2>提交之后几件事按什么顺序发生</h2>
<p>一次更新提交时，大致顺序是：</p>
<ol>
<li>React 把改动写进 DOM。</li>
<li>设置 ref，执行 <code>useLayoutEffect</code>。它安排的状态更新在这里同步处理，必要时再渲染一次。</li>
<li>浏览器绘制画面。</li>
<li>执行 <code>useEffect</code>。</li>
</ol>
<p>第 4 步有例外。react.dev 说明，Effect 由点击这类交互引起时，React 可能在浏览器绘制前就执行它，这样事件系统能观察到 Effect 的结果。所以如果确实要等画面出来再做，比如弹 <code>alert()</code>，要放进 <code>setTimeout</code>。另外，在 <code>useLayoutEffect</code> 里触发状态更新时，React 会立刻执行剩下的所有 Effect，包括 <code>useEffect</code>。</p>
<p>清理函数的时机两者一样：依赖变化后，先用旧值执行上一次的清理，再执行新的 setup；组件卸载前也会执行清理。开发环境的严格模式会在第一次真正执行前，多跑一轮 setup 加清理，用来检查清理写得对不对。</p>
<h2>为什么不能都用 useLayoutEffect</h2>
<p><code>useLayoutEffect</code> 里的代码和它触发的更新会挡住浏览器绘制。里面做的事越多，用户看到画面就越晚。像请求数据、订阅事件、打日志这些和画面位置无关的工作，放在 <code>useLayoutEffect</code> 里只会让首屏变慢。</p>
<p>react.dev 的建议是绝大多数 Effect 都用 <code>useEffect</code>，只有在看到闪烁、而且必须在绘制前完成测量和修正时，才换成 <code>useLayoutEffect</code>。</p>
<h2>服务端渲染时怎么办</h2>
<p>Effect 只在客户端运行，服务端渲染时既不执行 <code>useEffect</code> 也不执行 <code>useLayoutEffect</code>，也没有布局信息可测。所以依赖测量的组件，服务端输出的 HTML 只能是测量之前的样子。</p>
<p>react.dev 给了几种处理方式：改用 <code>useEffect</code>，接受首屏先显示未测量的样子；把这个组件标成只在客户端渲染，服务端显示 <code>&lt;Suspense&gt;</code> 的后备内容；或者在 <code>useEffect</code> 里设置一个 <code>isMounted</code> 标记，水合完成后才渲染需要测量的部分。</p>
<h2>常见追问</h2>
<p><strong>依赖数组写法两者一样吗？</strong></p>
<blockquote>
<p>一样。不写依赖每次提交后都执行，写空数组只在挂载后执行一次，写了依赖就在依赖变化后执行。依赖里有在组件内创建的对象或函数，每次渲染都是新的，Effect 会比预期执行得更频繁。</p>
</blockquote>
<p><strong>渲染阶段和提交阶段有什么区别？</strong></p>
<blockquote>
<p>渲染阶段是调用组件函数、算出要改什么，提交阶段才真正改 DOM、执行 Effect，详见<a href="/questions/react-render-commit/">《React 的渲染阶段与提交阶段有什么区别？》</a>。</p>
</blockquote>`};export{e as default};