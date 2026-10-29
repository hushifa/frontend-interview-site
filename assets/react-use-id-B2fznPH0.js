var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写表单时，<code>&lt;label htmlFor&gt;</code>、<code>aria-describedby</code> 都要指向某个元素的 <code>id</code>。可组件会被复用，页面上放两个同样的输入框，写死的 ID 就重复了。<code>const id = useId()</code> 给当前组件实例返回一个专属的字符串，同一个组件渲染多份也各不相同。</p>
<p>它比自增计数器、<code>Math.random()</code> 强的地方在于服务端渲染。只要服务端和客户端的组件树结构一致，两边生成的 ID 就一样，hydration 时不会对不上。hydration 就是浏览器拿到服务端的 HTML 后，React 接管页面的过程。</p>
<p>它主要用来把元素关联起来，比如 <code>htmlFor</code>、<code>aria-describedby</code>、<code>aria-labelledby</code>、<code>aria-controls</code>，让屏幕阅读器读得对。一个组件要多个 ID 时，只调一次，再拼后缀。</p>
<p>要注意，它不能用来生成列表 key，key 应该来自数据本身。它生成的格式也会随版本变，别拿它写 CSS 选择器。</p>
</blockquote>
<h2>一个密码输入框</h2>
<p>下面的组件要把 label、提示文字和错误信息都跟输入框关联起来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useId } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">PasswordField</span>(<span class="hljs-params">{ error }</span>) {
  <span class="hljs-keyword">const</span> id = <span class="hljs-title function_">useId</span>();
  <span class="hljs-keyword">const</span> hintId = <span class="hljs-string">\`<span class="hljs-subst">\${id}</span>-hint\`</span>;
  <span class="hljs-keyword">const</span> errorId = <span class="hljs-string">\`<span class="hljs-subst">\${id}</span>-error\`</span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">htmlFor</span>=<span class="hljs-string">{id}</span>&gt;</span>密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
        <span class="hljs-attr">id</span>=<span class="hljs-string">{id}</span>
        <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span>
        <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">{error</span> ? \`\${<span class="hljs-attr">hintId</span>} \${<span class="hljs-attr">errorId</span>}\` <span class="hljs-attr">:</span> <span class="hljs-attr">hintId</span>}
        <span class="hljs-attr">aria-invalid</span>=<span class="hljs-string">{Boolean(error)}</span>
      /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">{hintId}</span>&gt;</span>至少 8 位，包含字母和数字<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      {error &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">{errorId}</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{error}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>只调用了一次 <code>useId</code>，另外两个 ID 是拼后缀得到的。页面上放两个 <code>PasswordField</code>，每个实例拿到的 <code>id</code> 不同，后缀拼出来的也不同，互不冲突。屏幕阅读器聚焦到输入框时，就能读出它自己那一份提示。</p>
<h2>为什么不用计数器</h2>
<p>用一个全局计数器 <code>let n = 0</code>，每次 <code>n++</code> 当 ID，看起来也唯一。问题出在服务端渲染上：服务端渲染时数到了几，浏览器重新执行时不一定数到同样的数，比如服务端处理过别的请求，计数器早就不是 0 了。两边 ID 不一样，hydration 就会不匹配。<code>Math.random()</code> 更是每次都不同。</p>
<p><code>useId</code> 不靠计数，它根据组件在树里的位置生成 ID。只要两边的树结构一样，结果就一样。</p>
<h2>ID 长什么样</h2>
<p>具体格式是 React 内部实现，会随版本变化。19.0 是 <code>:r:</code> 这种形式，19.1 改成了 <code>«r»</code>，19.2 又改成了 <code>_r_</code>，后者可以直接用于 <code>view-transition-name</code> 和 XML 名称。所以不要依赖格式，也不要拿它写 CSS 选择器。</p>
<h2>一个页面有多个 React 根</h2>
<p>同一个页面上有几个独立的 React 根时，它们各自生成的 ID 可能重复。可以用 <code>createRoot</code> 或 <code>hydrateRoot</code> 的 <code>identifierPrefix</code> 选项给每个根设置不同的前缀。服务端渲染时，两端要用相同的前缀。</p>
<h2>常见追问</h2>
<p><strong>为什么不能拿它做列表 key？</strong></p>
<blockquote>
<p><code>useId</code> 的值取决于组件在树里的位置，而 key 要在列表重排时跟着数据走。一个绑位置、一个绑数据，目的正好相反。</p>
</blockquote>
<p><strong>组件外面也要用这个 ID 怎么办？</strong></p>
<blockquote>
<p>在父组件里调用 <code>useId</code>，再通过 props 传给需要的子组件。</p>
</blockquote>`};export{e as default};