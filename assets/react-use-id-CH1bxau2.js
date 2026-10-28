var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>const id = useId()</code> 返回当前组件实例专属的字符串，同一组件渲染多次时各不相同。</li>
<li>只要服务端和客户端的组件树结构一致，生成的 ID 就一致，因此不会造成 hydration 不匹配；用自增计数器或 <code>Math.random()</code> 都做不到这点。</li>
<li>主要用于把元素关联起来：<code>htmlFor</code>、<code>aria-describedby</code>、<code>aria-labelledby</code>、<code>aria-controls</code>。</li>
<li>不要用它生成列表 key，key 应来自数据本身。</li>
<li>一个组件需要多个 ID 时，只调用一次，再拼接后缀：<code>\${id}-hint</code>、<code>\${id}-error</code>。</li>
</ul>
<h2>表单字段</h2>
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
<p>页面上放两个 <code>PasswordField</code>，它们的 ID 互不冲突，屏幕阅读器能正确读出各自的提示。</p>
<h2>生成格式</h2>
<p>ID 的具体格式是 React 内部实现，会随版本变化：19.0 使用 <code>:r:</code> 形式，19.1 改为 <code>«r»</code>，19.2 改为 <code>_r_</code>，后者可以直接用于 <code>view-transition-name</code> 和 XML 名称。不要依赖格式，也不要拿它写 CSS 选择器。</p>
<h2>多个 React 根</h2>
<p>同一页面有多个独立的 React 根时，ID 可能重复。用 <code>createRoot</code> 或 <code>hydrateRoot</code> 的 <code>identifierPrefix</code> 选项为每个根设置不同前缀；服务端渲染时两端要使用相同的前缀。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不能做 key？<code>useId</code> 的值取决于组件在树中的位置，而 key 需要在列表重排时跟随数据，二者的目的相反。</li>
<li>组件外部需要这个 ID 怎么办？由父组件调用 <code>useId</code> 再通过 props 传下去。</li>
</ul>`};export{e as default};