var e={answerHtml:`<p>一个输入框里可以同时涉及两份信息：浏览器 DOM 当前保存的值，以及 React 状态里的值。受控模式让 React 提供每次渲染时应显示的当前值；非受控模式则允许 DOM 自己保存用户编辑结果，在需要时读取。</p>
<p>关键不是“有没有用 ref”或“有没有 onChange”，而是谁负责决定输入框当前应该显示什么。</p>
<h3>受控输入用状态驱动显示</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">LiveName</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [name, setName] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        姓名
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
          <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span>
          <span class="hljs-attr">value</span>=<span class="hljs-string">{name}</span>
          <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setName(event.target.value)}
        /&gt;
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>当前内容：{name}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>用户输入时，onChange 读取新值并及时更新状态；下一次渲染再把状态作为 value 提供给输入框。这里页面其他区域需要立即显示相同内容，所以状态成为明确的数据来源。</p>
<p>只提供 value 却没有相应更新或 readOnly 声明，通常会让输入无法按预期编辑，并出现相关提示。不能把 value 当成只设置一次的初始值使用。</p>
<p>复选框和单选框通常通过 checked 控制选中状态，读取变化时使用 event.target.checked。它们的 value 是提交字段值等另一层信息，不能因为都叫输入框就统一拿 value 当是否选中。</p>
<h3>非受控表单可以在提交时统一读取</h3>
<p>下面的组件沿用前面的 useState 导入，输入值由 DOM 管理，React 只保存已提交的展示结果：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ContactForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [submitted, setSubmitted] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleSubmit</span>(<span class="hljs-params">event</span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>(event.<span class="hljs-property">currentTarget</span>);
    <span class="hljs-keyword">const</span> name = data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;name&#x27;</span>);
    <span class="hljs-keyword">const</span> subscribe = data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;subscribe&#x27;</span>) === <span class="hljs-string">&#x27;yes&#x27;</span>;
    <span class="hljs-title function_">setSubmitted</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-keyword">typeof</span> name === <span class="hljs-string">&#x27;string&#x27;</span> ? name : <span class="hljs-string">&#x27;&#x27;</span>}</span> / <span class="hljs-subst">\${subscribe ? <span class="hljs-string">&#x27;订阅&#x27;</span> : <span class="hljs-string">&#x27;不订阅&#x27;</span>}</span>\`</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">onSubmit</span>=<span class="hljs-string">{handleSubmit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        姓名
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;Lin&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;subscribe&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;yes&quot;</span> <span class="hljs-attr">defaultChecked</span> /&gt;</span>
        接收更新
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;reset&quot;</span>&gt;</span>重置输入<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;提交内容&quot;</span>&gt;</span>{submitted}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>defaultValue、defaultChecked 提供默认或初始状态，之后用户可以在 DOM 中编辑。提交时 FormData 按具名控件的规则收集当前值，不需要为每个字段都维护一份 React state。</p>
<p>即使提交后更新了 submitted，组件重新渲染，也不会因为 defaultValue 仍写着 Lin 就把用户输入强制覆盖回 Lin。若需要在记录切换时重置整个表单，应明确采用相应的重置、身份切换或状态设计，不能把改 defaultValue 当成受控 value 更新的替代。</p>
<p>name、disabled、复选框是否选中等规则仍然决定原生表单会收集什么，React 不会替你绕过这些 HTML 语义。</p>
<h3>reset 也要区分 DOM 值和 React 状态</h3>
<p>示例中的原生重置按钮把非受控输入恢复到相应默认状态，但不会自动清空 submitted 这份 React 状态，因为它不是浏览器原生表单控件的当前值。</p>
<p>受控表单若要回到初始状态，应同步重置对应的状态来源，不能只调用 DOM form.reset 后就假定 React 不会再按旧 value 渲染。</p>
<p>改变 key 可以通过重建组件重置状态与 DOM，但也会影响焦点、Effect 和其他局部状态。需要的只是清空几个字段时，不一定有必要重建整棵组件树。</p>
<h3>同一个输入的控制模式不要来回变化</h3>
<p>文本框一开始 value 为 undefined，后来异步数据到达变成字符串，可能从非受控切换为受控，引发警告或难以预测的状态关系。若确定受控，可以从空字符串初始化，并按数据契约把缺失值规范化为字符串；checked 则从明确布尔值开始。</p>
<p>不要同时把 value 和 defaultValue 当作两个需要自动协调的来源。编辑草稿、服务端数据与默认值也应区分：数据刷新时是否覆盖用户尚未提交的编辑，需要产品逻辑决定，不应由一个不加区分的 Effect 不断同步造成输入被覆盖。</p>
<h3>输入体验要求及时保留用户当前编辑</h3>
<p>受控输入应在 onChange 中及时更新它的当前值。把每次输入先等服务器确认再更新 value，或者把受控文本的更新放进不合适的延后流程，可能让用户看到回退、闪烁或无法继续输入。</p>
<p>异步校验、搜索请求和昂贵的结果渲染可以单独防抖、缓存或延后处理，输入框自己的编辑反馈则应保持及时。也不要每敲一个字符就强制转大写、删字符或格式化整段内容，而忽略光标和输入法组合状态。</p>
<p>number 输入的 value 通常仍以字符串提供。空值、负号和小数输入到一半都可能是合理编辑过程，直接每次 Number 转换再写回可能丢掉中间状态。可以保留草稿字符串，在提交或适当时机解析与验证。</p>
<h3>文件输入与复杂表单有额外边界</h3>
<p>文件输入不能像文本框一样随意写入一个非空路径作为 value，文件由用户选择，通过 files 或 FormData 读取。清空也应使用允许的重置或置空方式，而不是把某个本机路径绑定进去。</p>
<p>大型表单可以选择成熟库组织字段、错误与订阅，但使用库并不免除 label、错误关联、键盘提交和清理规则。库采用受控、非受控或混合策略，也应看实际接口，不应只凭库名判断性能。</p>
<p>需要实时联动、动态限制和统一状态推导时，受控方式通常更直接；主要在提交时读取、希望减少逐字段状态管理时，非受控方式可能更简洁。最终验证应覆盖输入、重置、记录切换、异步数据到达、输入法和焦点，确认用户编辑始终归属正确的数据来源。</p>`};export{e as default};