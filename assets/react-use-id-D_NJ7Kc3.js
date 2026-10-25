var e={answerHtml:`<p>封装一个输入组件时，label 需要通过 htmlFor 指向 input，说明文字又可能通过 aria-describedby 与它关联。如果在组件里写死 id=&quot;email&quot;，页面放两份组件就会出现重复 ID，标签和说明可能关联到错误位置。</p>
<p>useId 主要解决这种组件内部关联，不是为数据库记录或用户会话生成新的业务身份。</p>
<h3>一份组件，多次使用仍有各自的关联</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useId, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">EmailField</span>(<span class="hljs-params">{ label, name }</span>) {
  <span class="hljs-keyword">const</span> id = <span class="hljs-title function_">useId</span>();
  <span class="hljs-keyword">const</span> inputId = <span class="hljs-string">\`<span class="hljs-subst">\${id}</span>-input\`</span>;
  <span class="hljs-keyword">const</span> hintId = <span class="hljs-string">\`<span class="hljs-subst">\${id}</span>-hint\`</span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">htmlFor</span>=<span class="hljs-string">{inputId}</span>&gt;</span>{label}<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">{inputId}</span> <span class="hljs-attr">name</span>=<span class="hljs-string">{name}</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">{hintId}</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">{hintId}</span>&gt;</span>请输入完整的邮箱地址。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ContactFields</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [revision, setRevision] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>显示版本：{revision}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">EmailField</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;联系邮箱&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;contactEmail&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">EmailField</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;备用邮箱&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;backupEmail&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setRevision(value =&gt; value + 1)}&gt;刷新显示<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>每个 EmailField 调用 useId，得到属于该组件实例的关联前缀，再派生 input 与提示文字的不同 ID。两份组件不会因为复用同一段代码就共享同一个硬编码 ID。</p>
<p>父级重新渲染时，同一组件实例的关联仍保持稳定。name 则继续表达表单提交字段名，与 DOM 的 id 是不同职责，不应拿生成的 ID 自动替代稳定的接口字段名。</p>
<h3>为什么不用随机数或模块级计数器</h3>
<p>渲染时使用随机数，会让同一组件不同渲染拿到不同 ID，也难以使服务端 HTML 与客户端首次输出一致。模块级自增计数器则容易受到执行顺序、多根应用和不同服务器请求的影响。</p>
<p>useId 根据 React 所管理的组件树关系生成适合这种关联的 ID。即使服务端生成与客户端 hydration 的执行顺序不完全一样，只要对应树结构符合要求，React 就能保持需要的匹配。</p>
<p>但它不能修复所有 hydration 问题。服务端和客户端渲染了不同组件、不同条件分支或不同文本，仍然可能不匹配；不能一加 useId 就忽略整个初始界面的一致性。</p>
<h3>多个相关元素可以共用一个前缀</h3>
<p>输入、说明、错误信息通常属于同一组件，用一次 useId 再拼接不同后缀即可。重点是每个实际 DOM 元素的完整 ID 唯一，关联属性指向真实存在的目标。</p>
<p>条件错误提示可以按状态显示，并相应调整 aria-describedby，而 useId 本身仍应按 Hook 规则在顶层调用。不能在“有错误时”才临时插入这个 Hook，改变调用结构。</p>
<p>这个 Hook 只是生成关联标识。标签文案是否清楚、错误是否可读、焦点是否合理，以及控件是否使用正确原生语义，仍需独立设计。</p>
<h3>它与列表 key 的职责不同</h3>
<p>key 帮助 React 判断同级数据项身份，应该来自那条记录的稳定业务标识。useId 是组件实例里的关联工具，不能在 map 中动态调用它给每项生成 key，也不能用它替代服务端 ID。</p>
<p>当列表重排时，React 先需要正确的 key 来保留对应组件实例；如果这个身份关系已经错误，组件内生成的 ID 不会倒过来替你修复列表映射。</p>
<p>同一个 ID 也不应该写进数据库、跨请求缓存键或长期分享协议。组件卸载重建、树结构改变或根配置变化后，不应再把旧值视为外部系统可依赖的永久标识。</p>
<h3>同页多个 React 根要协调 identifierPrefix</h3>
<p>页面上有多个独立 createRoot 或 hydrateRoot 时，可以给各自设置不同的 identifierPrefix，避免独立应用生成的关联 ID 相互冲突。</p>
<p>若某个根来自服务端渲染，服务端渲染 API 与客户端 hydrateRoot 需要使用对应一致的前缀。前缀属于根级协议，不是仅在客户端临时补一个随机字符串就足够。</p>
<p>不同框架可能封装了根与服务端入口，需要通过框架支持的方式配置，不应绕开框架再创建第二个重复根。</p>
<h3>不依赖 ID 的字符串格式</h3>
<p>生成值应被当作不透明标识。不要解析里面的字符来推导组件层级，也不要假定它一定只有字母数字。若手动拼 CSS 选择器，应按需使用 CSS.escape；通过 document.getElementById 查询则不需要把它先解释成选择器语法。</p>
<p>useId 在一般同步组件中可用于相应服务端渲染流程，但当前 API 对异步 Server Component 等场景仍有约束，应按所用 React 版本文档处理。它不是任意函数都能调用的全局 ID 工具。</p>
<p>验证时可以重复放置组件、触发无关重渲染，再检查 label、描述文字和 input 是否仍正确关联。需要 SSR 的页面还应真正执行 hydration，确认初始 ID 与前缀匹配，而不是只看客户端页面没有报重复 ID。</p>`};export{e as default};