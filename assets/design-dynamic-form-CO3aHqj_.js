var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个报销后台，几十种单据，每种的字段都不一样。如果每种单据写一个页面，改一次规则就要发一次版。动态表单的做法是用一份 schema，也就是一段 JSON，描述有哪些字段、每个字段用什么组件、什么时候显示、怎样校验，前端写一个渲染器，按 schema 把表单画出来。</p>
<p>字段联动是说一个字段的值会影响另一个字段，比如类型选了“企业”才显示“企业名称”，选了“个人”就隐藏。我会把联动写成声明式条件，像 <code>{ field: &#x27;type&#x27;, equals: &#x27;company&#x27; }</code>，而不是一段代码。引擎每次拿当前表单值把所有条件算一遍，得到每个字段是否显示、是否必填。这样配置能存进数据库，也不用执行配置里的字符串。</p>
<p>联动校验是一个字段的校验规则依赖别的字段，比如结束日期不能早于开始日期。所以校验函数要拿到整个表单的值，而且依赖的字段变了，要把依赖它的字段重新校验一遍，否则错误提示会停在旧状态。</p>
<p>要注意两点。第一，隐藏的字段不参与校验，提交时也要把它的值去掉，否则用户看不见的字段会挡住提交，或者把过期的值发给后端。第二，前端校验只是为了体验，后端必须用同一套规则再校验一次。</p>
</blockquote>
<h2>schema 长什么样</h2>
<p>下面这份 schema 描述一个简化的开票表单。看三处：<code>visibleWhen</code> 决定显示，<code>requiredWhen</code> 决定必填，<code>rules</code> 里的 <code>afterField</code> 是依赖另一个字段的校验。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> schema = {
  <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>,
  <span class="hljs-attr">fields</span>: [
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">component</span>: <span class="hljs-string">&#x27;Select&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;抬头类型&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>,
      <span class="hljs-attr">options</span>: [{ <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;person&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;个人&#x27;</span> }, { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;company&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;企业&#x27;</span> }] },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;companyName&#x27;</span>, <span class="hljs-attr">component</span>: <span class="hljs-string">&#x27;Input&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;企业名称&#x27;</span>,
      <span class="hljs-attr">visibleWhen</span>: { <span class="hljs-attr">field</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">equals</span>: <span class="hljs-string">&#x27;company&#x27;</span> }, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span> },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;taxId&#x27;</span>, <span class="hljs-attr">component</span>: <span class="hljs-string">&#x27;Input&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;税号&#x27;</span>,
      <span class="hljs-attr">visibleWhen</span>: { <span class="hljs-attr">field</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">equals</span>: <span class="hljs-string">&#x27;company&#x27;</span> },
      <span class="hljs-attr">rules</span>: [{ <span class="hljs-attr">pattern</span>: <span class="hljs-string">&#x27;^[0-9A-Z]{18}$&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;税号为 18 位数字或大写字母&#x27;</span> }] },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;start&#x27;</span>, <span class="hljs-attr">component</span>: <span class="hljs-string">&#x27;DatePicker&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;开始日期&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span> },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;end&#x27;</span>, <span class="hljs-attr">component</span>: <span class="hljs-string">&#x27;DatePicker&#x27;</span>, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;结束日期&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>,
      <span class="hljs-attr">rules</span>: [{ <span class="hljs-attr">afterField</span>: <span class="hljs-string">&#x27;start&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;结束日期不能早于开始日期&#x27;</span> }] },
  ],
};
</code></pre></div>
<p>每个字段只有数据，没有函数。为什么要这样？因为 schema 通常由后台配置、存在数据库里，函数没法存成 JSON。条件写成对象，渲染器还能在不运行的情况下分析出字段之间谁依赖谁，下面的重新校验就要用到这一点。</p>
<p>组件名只能从注册过的组件里选，配置里也不能写可执行代码，这部分安全上的约束见<a href="/questions/architecture-low-code-schema/">《低代码和 Schema 驱动 UI 怎样保持可维护与安全？》</a>。</p>
<h2>联动怎样算出来</h2>
<p>联动的核心是一个纯函数：输入 schema 和当前表单值，输出每个字段的状态。下面的 <code>resolveFields</code> 算出每个字段是否显示，<code>validate</code> 只校验显示的字段，<code>collectSubmit</code> 只提交显示的字段。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> schema = {
  <span class="hljs-attr">fields</span>: [
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span> },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;companyName&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">visibleWhen</span>: { <span class="hljs-attr">field</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">equals</span>: <span class="hljs-string">&#x27;company&#x27;</span> } },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;start&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span> },
    { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;end&#x27;</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">rules</span>: [{ <span class="hljs-attr">afterField</span>: <span class="hljs-string">&#x27;start&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;结束日期不能早于开始日期&#x27;</span> }] },
  ],
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">matches</span>(<span class="hljs-params">cond, values</span>) {
  <span class="hljs-keyword">if</span> (!cond) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">return</span> values[cond.<span class="hljs-property">field</span>] === cond.<span class="hljs-property">equals</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">resolveFields</span>(<span class="hljs-params">schema, values</span>) {
  <span class="hljs-keyword">return</span> schema.<span class="hljs-property">fields</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">f</span>) =&gt;</span> ({ ...f, <span class="hljs-attr">visible</span>: <span class="hljs-title function_">matches</span>(f.<span class="hljs-property">visibleWhen</span>, values) }));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">validate</span>(<span class="hljs-params">schema, values</span>) {
  <span class="hljs-keyword">const</span> errors = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> f <span class="hljs-keyword">of</span> <span class="hljs-title function_">resolveFields</span>(schema, values)) {
    <span class="hljs-keyword">if</span> (!f.<span class="hljs-property">visible</span>) <span class="hljs-keyword">continue</span>; <span class="hljs-comment">// 隐藏的字段不校验</span>
    <span class="hljs-keyword">const</span> v = values[f.<span class="hljs-property">name</span>];
    <span class="hljs-keyword">if</span> (f.<span class="hljs-property">required</span> &amp;&amp; (v === <span class="hljs-literal">undefined</span> || v === <span class="hljs-string">&#x27;&#x27;</span>)) {
      errors[f.<span class="hljs-property">name</span>] = <span class="hljs-string">&#x27;必填&#x27;</span>;
      <span class="hljs-keyword">continue</span>;
    }
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> rule <span class="hljs-keyword">of</span> f.<span class="hljs-property">rules</span> ?? []) {
      <span class="hljs-comment">// 联动校验：规则要读另一个字段的值</span>
      <span class="hljs-keyword">if</span> (rule.<span class="hljs-property">afterField</span> &amp;&amp; values[rule.<span class="hljs-property">afterField</span>] &amp;&amp; v &lt; values[rule.<span class="hljs-property">afterField</span>]) {
        errors[f.<span class="hljs-property">name</span>] = rule.<span class="hljs-property">message</span>;
      }
    }
  }
  <span class="hljs-keyword">return</span> errors;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">collectSubmit</span>(<span class="hljs-params">schema, values</span>) {
  <span class="hljs-keyword">const</span> data = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> f <span class="hljs-keyword">of</span> <span class="hljs-title function_">resolveFields</span>(schema, values)) {
    <span class="hljs-keyword">if</span> (f.<span class="hljs-property">visible</span> &amp;&amp; values[f.<span class="hljs-property">name</span>] !== <span class="hljs-literal">undefined</span>) data[f.<span class="hljs-property">name</span>] = values[f.<span class="hljs-property">name</span>];
  }
  <span class="hljs-keyword">return</span> data;
}

<span class="hljs-keyword">const</span> values = { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;company&#x27;</span>, <span class="hljs-attr">start</span>: <span class="hljs-string">&#x27;2026-05-10&#x27;</span>, <span class="hljs-attr">end</span>: <span class="hljs-string">&#x27;2026-05-01&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">validate</span>(schema, values)));
<span class="hljs-comment">// {&quot;companyName&quot;:&quot;必填&quot;,&quot;end&quot;:&quot;结束日期不能早于开始日期&quot;}</span>

values.<span class="hljs-property">type</span> = <span class="hljs-string">&#x27;person&#x27;</span>;
values.<span class="hljs-property">companyName</span> = <span class="hljs-string">&#x27;旧的企业名&#x27;</span>;
values.<span class="hljs-property">end</span> = <span class="hljs-string">&#x27;2026-05-20&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">validate</span>(schema, values))); <span class="hljs-comment">// {}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">collectSubmit</span>(schema, values)));
<span class="hljs-comment">// {&quot;type&quot;:&quot;person&quot;,&quot;start&quot;:&quot;2026-05-10&quot;,&quot;end&quot;:&quot;2026-05-20&quot;}</span>
</code></pre></div>
<p>第一次校验，类型是企业，“企业名称”显示了但没填，所以报必填；结束日期比开始日期早，所以报联动校验的错。</p>
<p>切成个人以后，“企业名称”隐藏了。它虽然还留着“旧的企业名”这个值，但校验跳过了它，提交的数据里也没有它。为什么不直接在切换时把值清掉？因为用户可能只是误点，切回企业时还希望看到刚才填的内容。保留值、提交时按可见性过滤，两种需求都能满足。</p>
<p>日期用 <code>YYYY-MM-DD</code> 格式的字符串，按字符串比较大小正好和日期先后一致，所以示例直接用 <code>&lt;</code> 比较。真实项目里日期格式不固定时，应该先转成时间戳再比。</p>
<h2>依赖的字段变了，怎样重新校验</h2>
<p>上面的 <code>validate</code> 每次都校验整张表单，字段少时没问题。字段多了以后，一般只校验刚改动的字段。可是联动校验会出问题：用户先填了结束日期 5 月 20 日，没有报错；再把开始日期改成 5 月 25 日，如果只校验“开始日期”，结束日期上就不会出现错误提示。</p>
<p>所以要根据 schema 建一张反向依赖表，记下“哪个字段被谁依赖”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fields = [
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;type&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;companyName&#x27;</span>, <span class="hljs-attr">visibleWhen</span>: { <span class="hljs-attr">field</span>: <span class="hljs-string">&#x27;type&#x27;</span>, <span class="hljs-attr">equals</span>: <span class="hljs-string">&#x27;company&#x27;</span> } },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;start&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;end&#x27;</span>, <span class="hljs-attr">rules</span>: [{ <span class="hljs-attr">afterField</span>: <span class="hljs-string">&#x27;start&#x27;</span> }] },
];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildDependents</span>(<span class="hljs-params">fields</span>) {
  <span class="hljs-keyword">const</span> map = {};
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">link</span> = (<span class="hljs-params"><span class="hljs-keyword">from</span>, to</span>) =&gt; {
    <span class="hljs-keyword">if</span> (!map[<span class="hljs-keyword">from</span>]) map[<span class="hljs-keyword">from</span>] = [];
    <span class="hljs-keyword">if</span> (!map[<span class="hljs-keyword">from</span>].<span class="hljs-title function_">includes</span>(to)) map[<span class="hljs-keyword">from</span>].<span class="hljs-title function_">push</span>(to);
  };
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> f <span class="hljs-keyword">of</span> fields) {
    <span class="hljs-keyword">if</span> (f.<span class="hljs-property">visibleWhen</span>) <span class="hljs-title function_">link</span>(f.<span class="hljs-property">visibleWhen</span>.<span class="hljs-property">field</span>, f.<span class="hljs-property">name</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> rule <span class="hljs-keyword">of</span> f.<span class="hljs-property">rules</span> ?? []) {
      <span class="hljs-keyword">if</span> (rule.<span class="hljs-property">afterField</span>) <span class="hljs-title function_">link</span>(rule.<span class="hljs-property">afterField</span>, f.<span class="hljs-property">name</span>);
    }
  }
  <span class="hljs-keyword">return</span> map;
}

<span class="hljs-keyword">const</span> dependents = <span class="hljs-title function_">buildDependents</span>(fields);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(dependents)); <span class="hljs-comment">// {&quot;type&quot;:[&quot;companyName&quot;],&quot;start&quot;:[&quot;end&quot;]}</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">fieldsToRevalidate</span>(<span class="hljs-params">changed</span>) {
  <span class="hljs-keyword">return</span> [changed, ...(dependents[changed] ?? [])];
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">fieldsToRevalidate</span>(<span class="hljs-string">&#x27;start&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// start,end</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">fieldsToRevalidate</span>(<span class="hljs-string">&#x27;end&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// end</span>
</code></pre></div>
<p>改了 <code>start</code>，要重新校验的是 <code>start</code> 和 <code>end</code>；改了 <code>end</code>，只校验它自己。这张表就是从 schema 里的条件对象读出来的，条件写成代码的话就分析不出来。</p>
<p>依赖还可能连成链，比如 A 决定 B 是否显示，B 又被 C 的规则引用。这时要沿着依赖表一直往下找，直到没有新的字段为止；如果配置里出现了 A 依赖 B、B 又依赖 A 的环，渲染器应该在加载 schema 时就报错，而不是运行时无限循环。</p>
<h2>和 JSON Schema 怎样配合</h2>
<p>上面的 <code>visibleWhen</code> 管的是界面怎么显示，提交的数据长什么样，可以再用 JSON Schema 描述，前后端共用。JSON Schema 有对应的条件关键字：<code>dependentRequired</code> 表示某个属性出现时，另外几个属性也必须出现；<code>if</code>、<code>then</code>、<code>else</code> 在 draft 7 引入，<code>if</code> 里的子 schema 通过时数据要满足 <code>then</code>，不通过时要满足 <code>else</code>。</p>
<p>比如“类型是企业时企业名称必填”，可以写成 <code>if</code> 判断 <code>type</code> 等于 <code>company</code>，<code>then</code> 里要求 <code>companyName</code> 必填。后端用同一份 JSON Schema 校验提交的数据，前端的规则写漏了，后端也能拦住。“结束日期不能早于开始日期”这类比较两个字段值的规则，可以在前后端各注册一个同名的校验函数，schema 里只写函数名。</p>
<h2>状态放在哪里</h2>
<p>表单值、每个字段的错误、是否被用户碰过（touched）这几样状态，和普通复杂表单是一样的管理方式，见<a href="/questions/vue-complex-form/">《Vue 复杂表单怎样组织状态、校验和提交？》</a>。动态表单多出来的只是“字段列表不再写死，而是从 schema 算出来”：显示状态、必填状态都是从“schema + 当前值”推导出的，不单独存一份，就不会出现两份状态对不上。</p>
<h2>常见追问</h2>
<p><strong>异步联动怎么办，比如选了省份再去请求城市列表？</strong></p>
<blockquote>
<p>在 schema 里写数据源的名字和依赖字段，比如 <code>options: { source: &#x27;cities&#x27;, dependsOn: &#x27;province&#x27; }</code>，由前端注册好的函数去请求。省份变了就重新请求，并且只采用最后一次请求的结果，否则先发的慢请求晚回来会把新列表覆盖掉。原来选的城市不在新列表里时，要把它清空。</p>
</blockquote>
<p><strong>字段很多时性能怎么保证？</strong></p>
<blockquote>
<p>主要是减少重新计算和重新渲染的范围。用上面的依赖表，只重新计算受影响的字段；每个字段组件只订阅自己的值和状态，别的字段变了它不重新渲染。几百个字段的表单通常还要分组、分步骤，或者对长列表做虚拟滚动。</p>
</blockquote>
<p><strong>schema 升级了，旧数据还能打开吗？</strong></p>
<blockquote>
<p>schema 要带版本号，渲染器为每次结构变化写一个迁移函数，把旧版本一级一级升到新版本，迁移函数要有测试。已经提交的数据也要记下是按哪个版本的 schema 填的，回显时用对应的版本。</p>
</blockquote>`};export{e as default};